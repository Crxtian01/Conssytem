import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { sendEmail, buildBrandedEmailHtml } from '@/lib/email'
import {
  ASSISTANT_EDITABLE_STAGES,
  readBiddingStore,
  createBid,
  addBidEstimateItem,
  deleteBidEstimateItem,
  toggleBidChecklistItem,
  addBidDocument,
  updateBidStageOrDetails,
  convertAwardedBidToProject,
  updateBiddingRules,
  type BidStage,
} from '@/lib/bidding-store'

function isAllowedBiddingRole(role: string): boolean {
  return role === 'admin_engineer' || role === 'assistant'
}

export async function GET() {
  const user = await requireAuth()

  if (!isAllowedBiddingRole(user.role)) {
    return NextResponse.json(
      { error: 'Access denied: Contractor and Client roles cannot read Bidding data.' },
      { status: 403 }
    )
  }

  const store = readBiddingStore()
  return NextResponse.json({ store, role: user.role })
}

export async function POST(request: Request) {
  const user = await requireAuth()

  if (!isAllowedBiddingRole(user.role)) {
    return NextResponse.json(
      { error: 'Access denied: Contractor and Client roles cannot modify Bidding data.' },
      { status: 403 }
    )
  }

  const isAdminEngineer = user.role === 'admin_engineer'
  const body = await request.json()
  const { action, payload } = body as {
    action: string
    payload: Record<string, unknown>
  }

  const store = readBiddingStore()

  // Helper to verify a bid is still in draft, estimating, or checklist when Assistant edits
  function verifyAssistantStageAllowed(bidId: string): { ok: boolean; error?: string } {
    const bid = store.bids.find((b) => b.id === bidId)
    if (!bid) return { ok: false, error: 'Bid not found.' }
    if (!isAdminEngineer && !ASSISTANT_EDITABLE_STAGES.includes(bid.status)) {
      return {
        ok: false,
        error: `Assistant can only edit bids in Draft, Estimating, or Checklist stage (current stage: ${bid.status}).`,
      }
    }
    return { ok: true }
  }

  switch (action) {
    case 'create_bid': {
      const record = await createBid(
        {
          reference_no: String(payload.reference_no || 'ITB-2026-NEW'),
          title: String(payload.title || 'Untitled Bid'),
          procuring_entity: String(payload.procuring_entity || 'DPWH / LGU'),
          location: String(payload.location || 'Metro Manila'),
          procurement_mode: String(payload.procurement_mode || 'Competitive Bidding (RA 12009)'),
          pcab_category: String(payload.pcab_category || 'Category B - Medium A'),
          abc_amount: Number(payload.abc_amount) || 0,
          current_assets: Number(payload.current_assets) || 9500000,
          current_liabilities: Number(payload.current_liabilities) || 2200000,
          ongoing_contracts_value: Number(payload.ongoing_contracts_value) || 20000000,
          bid_security_type: String(payload.bid_security_type || 'Bid Securing Declaration (BSD)'),
          bid_security_amount: Number(payload.bid_security_amount) || 0,
          pre_bid_date: String(payload.pre_bid_date || payload.submission_deadline),
          submission_deadline: String(payload.submission_deadline),
          opening_date: String(payload.opening_date || payload.submission_deadline),
          contract_duration_days: Number(payload.contract_duration_days) || 180,
          notes: String(payload.notes || ''),
        },
        user.email
      )
      return NextResponse.json({ ok: true, record, store: readBiddingStore() })
    }

    case 'update_bid_details': {
      const bidId = String(payload.bid_id)
      const check = verifyAssistantStageAllowed(bidId)
      if (!check.ok) {
        return NextResponse.json({ error: check.error }, { status: 403 })
      }

      const nextStage = payload.status as BidStage | undefined
      if (nextStage && !isAdminEngineer && !ASSISTANT_EDITABLE_STAGES.includes(nextStage)) {
        return NextResponse.json(
          { error: 'Only Admin / Engineer can move a bid past the Checklist stage.' },
          { status: 403 }
        )
      }

      const updated = await updateBidStageOrDetails(bidId, {
        ...(payload.title !== undefined ? { title: String(payload.title) } : {}),
        ...(payload.procuring_entity !== undefined
          ? { procuring_entity: String(payload.procuring_entity) }
          : {}),
        ...(payload.location !== undefined ? { location: String(payload.location) } : {}),
        ...(payload.abc_amount !== undefined ? { abc_amount: Number(payload.abc_amount) } : {}),
        ...(payload.current_assets !== undefined
          ? { current_assets: Number(payload.current_assets) }
          : {}),
        ...(payload.current_liabilities !== undefined
          ? { current_liabilities: Number(payload.current_liabilities) }
          : {}),
        ...(payload.ongoing_contracts_value !== undefined
          ? { ongoing_contracts_value: Number(payload.ongoing_contracts_value) }
          : {}),
        ...(payload.bid_security_type !== undefined
          ? { bid_security_type: String(payload.bid_security_type) }
          : {}),
        ...(payload.bid_security_amount !== undefined
          ? { bid_security_amount: Number(payload.bid_security_amount) }
          : {}),
        ...(payload.submission_deadline !== undefined
          ? { submission_deadline: String(payload.submission_deadline) }
          : {}),
        ...(payload.notes !== undefined ? { notes: String(payload.notes) } : {}),
        ...(nextStage ? { status: nextStage } : {}),
      })
      return NextResponse.json({ ok: true, record: updated, store: readBiddingStore() })
    }

    case 'add_estimate': {
      const bidId = String(payload.bid_id)
      const check = verifyAssistantStageAllowed(bidId)
      if (!check.ok) {
        return NextResponse.json({ error: check.error }, { status: 403 })
      }
      const record = await addBidEstimateItem({
        bid_id: bidId,
        item_no: String(payload.item_no || 'ITEM-01'),
        category:
          (payload.category as
            | 'Materials'
            | 'Labor'
            | 'Equipment'
            | 'Mobilization & Overhead') || 'Materials',
        description: String(payload.description || ''),
        unit: String(payload.unit || 'lot'),
        quantity: Number(payload.quantity) || 1,
        unit_cost: Number(payload.unit_cost) || 0,
        ocm_pct: payload.ocm_pct !== undefined ? Number(payload.ocm_pct) : undefined,
        profit_pct: payload.profit_pct !== undefined ? Number(payload.profit_pct) : undefined,
        vat_pct: payload.vat_pct !== undefined ? Number(payload.vat_pct) : undefined,
      })
      return NextResponse.json({ ok: true, record, store: readBiddingStore() })
    }

    case 'delete_estimate': {
      const bidId = String(payload.bid_id)
      const check = verifyAssistantStageAllowed(bidId)
      if (!check.ok) {
        return NextResponse.json({ error: check.error }, { status: 403 })
      }
      await deleteBidEstimateItem(String(payload.estimate_id), bidId)
      return NextResponse.json({ ok: true, store: readBiddingStore() })
    }

    case 'toggle_checklist': {
      const itemId = String(payload.item_id)
      const chk = store.checklist_items.find((c) => c.id === itemId)
      if (!chk) {
        return NextResponse.json({ error: 'Checklist item not found.' }, { status: 404 })
      }
      const check = verifyAssistantStageAllowed(chk.bid_id)
      if (!check.ok) {
        return NextResponse.json({ error: check.error }, { status: 403 })
      }
      const updated = await toggleBidChecklistItem(itemId, user.email)
      return NextResponse.json({ ok: true, record: updated, store: readBiddingStore() })
    }

    case 'upload_document': {
      const bidId = String(payload.bid_id)
      const check = verifyAssistantStageAllowed(bidId)
      if (!check.ok) {
        return NextResponse.json({ error: check.error }, { status: 403 })
      }
      const record = await addBidDocument(
        {
          bid_id: bidId,
          envelope: (payload.envelope as 'technical' | 'financial') || 'technical',
          title: String(payload.title || 'Bid Requirement Document'),
          file_url: String(
            payload.file_url ||
              'https://vpzorfwfbgyttsuwjshx.supabase.co/storage/v1/object/public/bidding/bid-attachment.pdf'
          ),
          file_type: String(payload.file_type || 'PDF'),
        },
        user.email
      )
      return NextResponse.json({ ok: true, record, store: readBiddingStore() })
    }

    // =========================================================================
    // ADMIN / ENGINEER ONLY ACTIONS (Assistant strictly blocked on server)
    // =========================================================================
    case 'approve_bid': {
      if (!isAdminEngineer) {
        return NextResponse.json(
          { error: 'Forbidden: Only Admin / Engineer can approve bids.' },
          { status: 403 }
        )
      }
      const bidId = String(payload.bid_id)
      const updated = await updateBidStageOrDetails(bidId, {
        status: 'approved',
        approved_by_email: user.email,
        approved_at: new Date().toISOString(),
      })
      return NextResponse.json({ ok: true, record: updated, store: readBiddingStore() })
    }

    case 'submit_bid': {
      if (!isAdminEngineer) {
        return NextResponse.json(
          { error: 'Forbidden: Only Admin / Engineer can mark a bid as submitted.' },
          { status: 403 }
        )
      }
      const bidId = String(payload.bid_id)
      const updated = await updateBidStageOrDetails(bidId, {
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      return NextResponse.json({ ok: true, record: updated, store: readBiddingStore() })
    }

    case 'record_award': {
      if (!isAdminEngineer) {
        return NextResponse.json(
          { error: 'Forbidden: Only Admin / Engineer can record award results.' },
          { status: 403 }
        )
      }
      const bidId = String(payload.bid_id)
      const outcome = payload.outcome === 'lost' ? 'lost' : 'awarded'
      const updated = await updateBidStageOrDetails(bidId, {
        status: outcome,
        award_notice_no: String(payload.award_notice_no || `NOA-2026-${bidId.toUpperCase()}`),
        award_date: String(payload.award_date || new Date().toISOString().slice(0, 10)),
        award_remarks: String(
          payload.award_remarks ||
            (outcome === 'awarded'
              ? 'Lowest Calculated and Responsive Bid (LCRB) under RA 12009.'
              : 'Post-disqualified / Higher bid rank.')
        ),
      })
      return NextResponse.json({ ok: true, record: updated, store: readBiddingStore() })
    }

    case 'convert_to_project': {
      if (!isAdminEngineer) {
        return NextResponse.json(
          { error: 'Forbidden: Only Admin / Engineer can convert an awarded bid into a project.' },
          { status: 403 }
        )
      }
      const bidId = String(payload.bid_id)
      const result = await convertAwardedBidToProject(bidId, user.email)
      if (!result) {
        return NextResponse.json({ error: 'Bid not found' }, { status: 404 })
      }
      return NextResponse.json({
        ok: true,
        bid: result.bid,
        projectId: result.projectId,
        store: readBiddingStore(),
      })
    }

    case 'update_rules': {
      if (!isAdminEngineer) {
        return NextResponse.json(
          { error: 'Forbidden: Only Admin / Engineer can edit bidding rules.' },
          { status: 403 }
        )
      }
      const updatedRules = await updateBiddingRules(
        {
          default_ocm_pct: Number(payload.default_ocm_pct),
          default_profit_pct: Number(payload.default_profit_pct),
          default_vat_pct: Number(payload.default_vat_pct),
          nfcc_multiplier: Number(payload.nfcc_multiplier),
          max_bid_abc_pct: Number(payload.max_bid_abc_pct),
          reminder_days_before: Number(payload.reminder_days_before),
        },
        user.email
      )
      return NextResponse.json({ ok: true, rules: updatedRules, store: readBiddingStore() })
    }

    case 'send_deadline_reminder': {
      const bidId = String(payload.bid_id)
      const bid = store.bids.find((b) => b.id === bidId)
      if (!bid) {
        return NextResponse.json({ error: 'Bid not found' }, { status: 404 })
      }
      await sendEmail({
        to: user.email,
        category: 'task_assignment',
        subject: `[ConstructMS Bidding Reminder] ${bid.reference_no} — Submission Deadline ${bid.submission_deadline}`,
        html: buildBrandedEmailHtml({
          heading: `Bidding Deadline Reminder: ${bid.reference_no}`,
          bodyHtml: `<p>Your RA 12009 bid <strong>${bid.title}</strong> (${bid.procuring_entity}) is currently in stage <strong>${bid.status.toUpperCase()}</strong> with submission &amp; opening deadline on <strong>${bid.submission_deadline}</strong>.</p>`,
          ctaLabel: 'Open Bidding Module',
          ctaUrl: 'http://localhost:3000/bidding',
        }),
      })
      return NextResponse.json({
        ok: true,
        message: `Bid deadline reminder sent to ${user.email} for ${bid.reference_no}`,
      })
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  }
}
