import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { ROLES } from '@/lib/roles'
import { readStore, writeStore, newId } from '@/lib/module-store'
import { sendEmail, buildBrandedEmailHtml } from '@/lib/email'

// GET /api/modules/[module]
// Enforces role permissions on the backend
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ module: string }> }
) {
  const user = await requireAuth()
  const { module } = await context.params
  const store = readStore()
  const perms = ROLES[user.role].permissions

  if (module === 'projects') {
    const projects = store.projects
      .filter((p) => {
        if (user.role === 'contractor') return p.assigned_contractor !== false
        if (user.role === 'assistant') return p.assigned_assistant !== false
        return true
      })
      .map((p) => ({
        ...p,
        budget: perms.viewBudgets ? p.budget : 0,
      }))
    return NextResponse.json({ data: projects })
  }

  if (module === 'expenses') {
    if (!perms.createPendingExpenses && !perms.approveExpenses) {
      return NextResponse.json(
        { error: 'Your role does not have permission to access expenses.' },
        { status: 403 }
      )
    }
    return NextResponse.json({ data: store.expenses })
  }

  if (module === 'daily_logs') {
    if (user.role === 'client') {
      return NextResponse.json({
        data: store.daily_logs.filter((l) => l.approval_status === 'approved'),
      })
    }
    if (user.role === 'contractor') {
      return NextResponse.json({
        data: store.daily_logs.filter(
          (l) => l.author_email.toLowerCase() === user.email.toLowerCase()
        ),
      })
    }
    return NextResponse.json({ data: store.daily_logs })
  }

  if (module in store) {
    return NextResponse.json({ data: store[module as keyof typeof store] })
  }

  return NextResponse.json({ error: 'Unknown module' }, { status: 404 })
}

// POST /api/modules/[module]
// Handles Create, Update, Delete, Stock In/Out, Material Requests, and Expense/Log Approvals
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ module: string }> }
) {
  const user = await requireAuth()
  const { module } = await context.params
  const body = await request.json()
  const action = (body.action as string) || 'create'
  const perms = ROLES[user.role].permissions

  if (perms.readOnly) {
    return NextResponse.json(
      { error: 'Client role is read-only and cannot modify records.' },
      { status: 403 }
    )
  }

  // Global rule: ONLY Admin/Engineer can delete records across any module
  if (action === 'delete' && !perms.deleteRecords) {
    return NextResponse.json(
      { error: 'Only Admin / Engineer can delete records.' },
      { status: 403 }
    )
  }

  const store = readStore()

  // -------------------------------------------------------------------
  // 1. PROJECTS & SITES
  // -------------------------------------------------------------------
  if (module === 'projects') {
    if (action === 'create') {
      if (!perms.manageProjects) {
        return NextResponse.json(
          { error: 'Only Admin / Engineer can create new projects.' },
          { status: 403 }
        )
      }
      const name = (body.name ?? '').trim()
      const location = (body.location ?? '').trim()
      const budget = Number(body.budget ?? 0)
      if (!name || !location) {
        return NextResponse.json(
          { error: 'Project name and site location are required.' },
          { status: 400 }
        )
      }
      if (isNaN(budget) || budget < 0) {
        return NextResponse.json(
          { error: 'Budget cannot be negative.' },
          { status: 400 }
        )
      }

      const newProj = {
        id: newId('proj'),
        name,
        location,
        description: (body.description ?? '').trim(),
        budget,
        start_date: body.start_date || new Date().toISOString().slice(0, 10),
        end_date: body.end_date || '',
        status: (body.status || 'active') as
          | 'planning'
          | 'active'
          | 'on_hold'
          | 'completed'
          | 'cancelled',
        progress: Math.min(100, Math.max(0, Number(body.progress ?? 0))),
        assigned_assistant: true,
        assigned_contractor: true,
        created_at: new Date().toISOString(),
      }
      store.projects.unshift(newProj)
      writeStore(store)
      return NextResponse.json({ ok: true, item: newProj })
    }

    if (action === 'update_progress') {
      if (!perms.updateProjectProgress) {
        return NextResponse.json(
          { error: 'Only Admin / Engineer and Assistant can update project progress.' },
          { status: 403 }
        )
      }
      const proj = store.projects.find((p) => p.id === body.id)
      if (!proj) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      const progress = Number(body.progress)
      if (isNaN(progress) || progress < 0 || progress > 100) {
        return NextResponse.json({ error: 'Progress must be between 0 and 100.' }, { status: 400 })
      }
      proj.progress = progress
      if (body.status) proj.status = body.status
      writeStore(store)
      return NextResponse.json({ ok: true, item: proj })
    }

    if (action === 'delete') {
      store.projects = store.projects.filter((p) => p.id !== body.id)
      writeStore(store)
      return NextResponse.json({ ok: true })
    }
  }

  // -------------------------------------------------------------------
  // 2. TASKS & PROGRESS TRACKING
  // -------------------------------------------------------------------
  if (module === 'tasks') {
    if (action === 'create') {
      if (!perms.manageTasks) {
        return NextResponse.json(
          { error: 'Your role cannot create new tasks.' },
          { status: 403 }
        )
      }
      const title = (body.title ?? '').trim()
      if (!title || !body.project_id) {
        return NextResponse.json(
          { error: 'Task title and project are required.' },
          { status: 400 }
        )
      }
      const newTask = {
        id: newId('task'),
        project_id: body.project_id,
        title,
        description: (body.description ?? '').trim(),
        status: (body.status || 'todo') as 'todo' | 'in_progress' | 'review' | 'completed',
        percent_complete: Math.min(100, Math.max(0, Number(body.percent_complete ?? 0))),
        assigned_user_name: (body.assigned_user_name ?? 'Unassigned').trim(),
        due_date: body.due_date || new Date().toISOString().slice(0, 10),
        created_at: new Date().toISOString(),
      }
      store.tasks.unshift(newTask)
      writeStore(store)

      await sendEmail({
        to: user.email,
        subject: `New Task Assigned: ${newTask.title}`,
        category: 'task_assignment',
        html: buildBrandedEmailHtml({
          heading: 'New Construction Task Assigned',
          bodyHtml: `<p>Task <strong>${newTask.title}</strong> has been assigned to <strong>${newTask.assigned_user_name}</strong> (Due: ${newTask.due_date}).</p>`,
        }),
      })

      return NextResponse.json({ ok: true, item: newTask })
    }

    if (action === 'update') {
      if (!perms.updateTaskProgress) {
        return NextResponse.json(
          { error: 'Your role cannot update task progress.' },
          { status: 403 }
        )
      }
      const task = store.tasks.find((t) => t.id === body.id)
      if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      const pct = Number(body.percent_complete ?? task.percent_complete)
      if (isNaN(pct) || pct < 0 || pct > 100) {
        return NextResponse.json({ error: 'Percent complete must be 0–100.' }, { status: 400 })
      }
      task.percent_complete = pct
      if (body.status) task.status = body.status
      if (pct === 100) task.status = 'completed'
      writeStore(store)
      return NextResponse.json({ ok: true, item: task })
    }

    if (action === 'delete') {
      store.tasks = store.tasks.filter((t) => t.id !== body.id)
      writeStore(store)
      return NextResponse.json({ ok: true })
    }
  }

  // -------------------------------------------------------------------
  // 3. MATERIALS & INVENTORY (STOCK IN/OUT + MATERIAL REQUESTS)
  // -------------------------------------------------------------------
  if (module === 'materials') {
    if (!perms.manageMaterials) {
      return NextResponse.json(
        { error: 'Your role cannot modify materials or inventory.' },
        { status: 403 }
      )
    }

    if (action === 'create') {
      const name = (body.name ?? '').trim()
      const current_stock = Number(body.current_stock ?? 0)
      const reorder_level = Number(body.reorder_level ?? 10)
      const unit_cost = Number(body.unit_cost ?? 0)

      if (!name) {
        return NextResponse.json({ error: 'Material name is required.' }, { status: 400 })
      }
      if (current_stock < 0 || reorder_level < 0 || unit_cost < 0) {
        return NextResponse.json(
          { error: 'Stock, reorder level, and unit cost cannot be negative.' },
          { status: 400 }
        )
      }

      const newMat = {
        id: newId('mat'),
        name,
        unit: (body.unit ?? 'pcs').trim(),
        current_stock,
        reorder_level,
        unit_cost,
        created_at: new Date().toISOString(),
      }
      store.materials.push(newMat)
      writeStore(store)
      return NextResponse.json({ ok: true, item: newMat })
    }

    if (action === 'transaction') {
      const mat = store.materials.find((m) => m.id === body.material_id)
      if (!mat) return NextResponse.json({ error: 'Material not found' }, { status: 404 })
      const qty = Number(body.quantity)
      const txType = body.transaction_type as 'in' | 'out'

      if (isNaN(qty) || qty <= 0) {
        return NextResponse.json(
          { error: 'Transaction quantity must be greater than zero.' },
          { status: 400 }
        )
      }
      if (txType === 'out' && mat.current_stock < qty) {
        return NextResponse.json(
          { error: `Insufficient stock. Only ${mat.current_stock} ${mat.unit} available.` },
          { status: 400 }
        )
      }

      mat.current_stock = txType === 'in' ? mat.current_stock + qty : mat.current_stock - qty

      const tx = {
        id: newId('mtx'),
        material_id: mat.id,
        material_name: mat.name,
        project_id: body.project_id || (store.projects[0]?.id ?? 'proj-1'),
        transaction_type: txType,
        quantity: qty,
        transaction_date: new Date().toISOString().slice(0, 10),
        notes: (body.notes ?? '').trim(),
        created_at: new Date().toISOString(),
      }
      store.material_transactions.unshift(tx)
      writeStore(store)

      const lowStockTriggered = mat.current_stock <= mat.reorder_level
      if (lowStockTriggered) {
        await sendEmail({
          to: user.email,
          subject: `⚠️ Low-Stock Alert: ${mat.name}`,
          category: 'low_stock_alert',
          html: buildBrandedEmailHtml({
            heading: `Low-Stock Warning: ${mat.name}`,
            bodyHtml: `<p>Current stock for <strong>${mat.name}</strong> has dropped to <strong>${mat.current_stock} ${mat.unit}</strong> (Reorder level: ${mat.reorder_level} ${mat.unit}). Please reorder soon.</p>`,
          }),
        })
      }

      return NextResponse.json({ ok: true, item: mat, transaction: tx, lowStockTriggered })
    }

    if (action === 'create_request') {
      const mat = store.materials.find((m) => m.id === body.material_id)
      if (!mat) return NextResponse.json({ error: 'Material not found' }, { status: 404 })
      const qty = Number(body.quantity)
      if (isNaN(qty) || qty <= 0) {
        return NextResponse.json(
          { error: 'Requested quantity must be greater than zero.' },
          { status: 400 }
        )
      }
      const newReq = {
        id: newId('mreq'),
        material_id: mat.id,
        material_name: mat.name,
        project_id: body.project_id || (store.projects[0]?.id ?? 'proj-1'),
        quantity: qty,
        unit: mat.unit,
        urgency: (body.urgency || 'Normal') as 'Normal' | 'High' | 'Critical',
        notes: (body.notes ?? '').trim(),
        approval_status: 'pending' as const,
        requested_by_email: user.email,
        created_at: new Date().toISOString(),
      }
      store.material_requests.unshift(newReq)
      writeStore(store)
      return NextResponse.json({ ok: true, item: newReq })
    }

    if (action === 'approve_request' || action === 'reject_request') {
      if (!perms.approveMaterialRequests) {
        return NextResponse.json(
          { error: 'Only Admin / Engineer can approve or reject material requests.' },
          { status: 403 }
        )
      }
      const reqItem = store.material_requests.find((r) => r.id === body.id)
      if (!reqItem) {
        return NextResponse.json({ error: 'Material request not found.' }, { status: 404 })
      }
      reqItem.approval_status = action === 'approve_request' ? 'approved' : 'rejected'
      reqItem.approved_by_email = user.email

      // If approved, also restock inventory automatically
      let updatedMat = null
      if (action === 'approve_request') {
        const mat = store.materials.find((m) => m.id === reqItem.material_id)
        if (mat) {
          mat.current_stock += reqItem.quantity
          updatedMat = mat
          store.material_transactions.unshift({
            id: newId('mtx'),
            material_id: mat.id,
            material_name: mat.name,
            project_id: reqItem.project_id,
            transaction_type: 'in',
            quantity: reqItem.quantity,
            transaction_date: new Date().toISOString().slice(0, 10),
            notes: `Approved Material Request (${reqItem.id}) by ${user.email}`,
            created_at: new Date().toISOString(),
          })
        }
      }

      writeStore(store)
      return NextResponse.json({ ok: true, item: reqItem, updatedMaterial: updatedMat })
    }

    if (action === 'delete') {
      store.materials = store.materials.filter((m) => m.id !== body.id)
      writeStore(store)
      return NextResponse.json({ ok: true })
    }
  }

  // -------------------------------------------------------------------
  // 4. WORKERS & ATTENDANCE
  // -------------------------------------------------------------------
  if (module === 'attendance') {
    if (!perms.recordAttendance) {
      return NextResponse.json({ error: 'Not allowed to record attendance.' }, { status: 403 })
    }

    if (action === 'create_worker') {
      const full_name = (body.full_name ?? '').trim()
      const daily_rate = Number(body.daily_rate ?? 0)
      if (!full_name || daily_rate < 0) {
        return NextResponse.json(
          { error: 'Worker name and non-negative daily rate are required.' },
          { status: 400 }
        )
      }
      const newWorker = {
        id: newId('wrk'),
        full_name,
        trade: (body.trade ?? 'General Labor').trim(),
        phone: (body.phone ?? '').trim(),
        daily_rate,
        active: true,
        created_at: new Date().toISOString(),
      }
      store.workers.push(newWorker)
      writeStore(store)
      return NextResponse.json({ ok: true, item: newWorker })
    }

    if (action === 'log_attendance') {
      const hours = Number(body.hours_worked ?? 8)
      if (isNaN(hours) || hours < 0 || hours > 24) {
        return NextResponse.json(
          { error: 'Hours worked must be between 0 and 24.' },
          { status: 400 }
        )
      }
      const worker = store.workers.find((w) => w.id === body.worker_id)
      const newAtt = {
        id: newId('att'),
        worker_id: body.worker_id,
        worker_name: worker?.full_name || body.worker_name || user.fullName || user.email,
        project_id: body.project_id || (store.projects[0]?.id ?? 'proj-1'),
        attendance_date: body.attendance_date || new Date().toISOString().slice(0, 10),
        hours_worked: hours,
        status: (body.status || 'present') as 'present' | 'half_day' | 'absent',
        created_at: new Date().toISOString(),
      }
      store.attendance.unshift(newAtt)
      writeStore(store)
      return NextResponse.json({ ok: true, item: newAtt })
    }

    if (action === 'delete') {
      store.attendance = store.attendance.filter((a) => a.id !== body.id)
      writeStore(store)
      return NextResponse.json({ ok: true })
    }
  }

  // -------------------------------------------------------------------
  // 5. EQUIPMENT (Admin/Engineer only)
  // -------------------------------------------------------------------
  if (module === 'equipment') {
    if (!perms.manageEquipment) {
      return NextResponse.json({ error: 'Not allowed to manage equipment.' }, { status: 403 })
    }

    if (action === 'create') {
      const name = (body.name ?? '').trim()
      if (!name) {
        return NextResponse.json({ error: 'Equipment name is required.' }, { status: 400 })
      }
      const newEq = {
        id: newId('eq'),
        name,
        serial_code: (body.serial_code ?? '').trim(),
        status: (body.status || 'available') as
          | 'available'
          | 'in_use'
          | 'maintenance'
          | 'retired',
        project_id: body.project_id || (store.projects[0]?.id ?? 'proj-1'),
        notes: (body.notes ?? '').trim(),
        created_at: new Date().toISOString(),
      }
      store.equipment.push(newEq)
      writeStore(store)
      return NextResponse.json({ ok: true, item: newEq })
    }

    if (action === 'update_status') {
      const eq = store.equipment.find((e) => e.id === body.id)
      if (!eq) return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
      eq.status = body.status
      if (body.project_id) eq.project_id = body.project_id
      writeStore(store)
      return NextResponse.json({ ok: true, item: eq })
    }

    if (action === 'delete') {
      store.equipment = store.equipment.filter((e) => e.id !== body.id)
      writeStore(store)
      return NextResponse.json({ ok: true })
    }
  }

  // -------------------------------------------------------------------
  // 6. EXPENSES & BUDGET (Assistant creates as Pending only; Admin/Engineer approves/deletes)
  // -------------------------------------------------------------------
  if (module === 'expenses') {
    if (action === 'create') {
      if (!perms.createPendingExpenses) {
        return NextResponse.json(
          { error: 'Your role cannot create expenses.' },
          { status: 403 }
        )
      }
      const amount = Number(body.amount)
      const description = (body.description ?? '').trim()
      if (!description || isNaN(amount) || amount <= 0) {
        return NextResponse.json(
          { error: 'Description and a positive expense amount are required.' },
          { status: 400 }
        )
      }
      const newExp = {
        id: newId('exp'),
        project_id: body.project_id || (store.projects[0]?.id ?? 'proj-1'),
        category: body.category || 'Materials',
        description,
        amount,
        expense_date: body.expense_date || new Date().toISOString().slice(0, 10),
        approval_status: 'pending' as const,
        submitted_by_email: user.email,
        created_at: new Date().toISOString(),
      }
      store.expenses.unshift(newExp)
      writeStore(store)
      return NextResponse.json({ ok: true, item: newExp })
    }

    if (action === 'approve' || action === 'reject') {
      if (!perms.approveExpenses) {
        return NextResponse.json(
          { error: 'Only Admin / Engineer can approve or reject expenses.' },
          { status: 403 }
        )
      }
      const exp = store.expenses.find((e) => e.id === body.id)
      if (!exp) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
      exp.approval_status = action === 'approve' ? 'approved' : 'rejected'
      exp.approved_by_email = user.email
      writeStore(store)

      await sendEmail({
        to: exp.submitted_by_email,
        subject: `Expense ${exp.approval_status.toUpperCase()}: ${exp.description}`,
        category: 'approval_notice',
        html: buildBrandedEmailHtml({
          heading: `Expense ${exp.approval_status.toUpperCase()}`,
          bodyHtml: `<p>Your expense <strong>${exp.description}</strong> (₱${exp.amount.toLocaleString()}) was <strong>${exp.approval_status}</strong> by ${user.email}.</p>`,
        }),
      })

      return NextResponse.json({ ok: true, item: exp })
    }

    if (action === 'delete') {
      store.expenses = store.expenses.filter((e) => e.id !== body.id)
      writeStore(store)
      return NextResponse.json({ ok: true })
    }
  }

  // -------------------------------------------------------------------
  // 7. DAILY LOGS (Assistant/Contractor create/submit; Admin approves/deletes; Client views approved)
  // -------------------------------------------------------------------
  if (module === 'daily_logs') {
    if (action === 'create') {
      if (!perms.logDailyProgress) {
        return NextResponse.json(
          { error: 'Your role cannot submit site daily logs.' },
          { status: 403 }
        )
      }
      const notes = (body.notes ?? '').trim()
      if (!notes) {
        return NextResponse.json(
          { error: 'Daily progress notes are required.' },
          { status: 400 }
        )
      }
      const photos: string[] = Array.isArray(body.photos)
        ? body.photos.filter((u: string) => u && u.trim())
        : []

      const newLog = {
        id: newId('log'),
        project_id: body.project_id || (store.projects[0]?.id ?? 'proj-1'),
        log_date: body.log_date || new Date().toISOString().slice(0, 10),
        weather: (body.weather || 'Sunny') as 'Sunny' | 'Cloudy' | 'Rainy' | 'Stormy',
        notes,
        photos,
        author_email: user.email,
        approval_status: (user.role === 'admin_engineer' ? 'approved' : 'pending') as
          | 'pending'
          | 'approved',
        created_at: new Date().toISOString(),
      }
      store.daily_logs.unshift(newLog)
      writeStore(store)
      return NextResponse.json({ ok: true, item: newLog })
    }

    if (action === 'approve') {
      if (!perms.approveDailyLogs) {
        return NextResponse.json(
          { error: 'Only Admin / Engineer can approve daily logs.' },
          { status: 403 }
        )
      }
      const log = store.daily_logs.find((l) => l.id === body.id)
      if (!log) return NextResponse.json({ error: 'Daily log not found' }, { status: 404 })
      log.approval_status = 'approved'
      writeStore(store)
      return NextResponse.json({ ok: true, item: log })
    }

    if (action === 'delete') {
      store.daily_logs = store.daily_logs.filter((l) => l.id !== body.id)
      writeStore(store)
      return NextResponse.json({ ok: true })
    }
  }

  // -------------------------------------------------------------------
  // 8. DOCUMENTS
  // -------------------------------------------------------------------
  if (module === 'documents') {
    if (action === 'create') {
      if (!perms.uploadDocuments) {
        return NextResponse.json(
          { error: 'Your role cannot upload documents.' },
          { status: 403 }
        )
      }
      const title = (body.title ?? '').trim()
      const file_url = (body.file_url ?? '').trim()
      if (!title || !file_url) {
        return NextResponse.json(
          { error: 'Document title and file URL are required.' },
          { status: 400 }
        )
      }
      const newDoc = {
        id: newId('doc'),
        project_id: body.project_id || (store.projects[0]?.id ?? 'proj-1'),
        title,
        file_url,
        file_type: (body.file_type ?? 'Blueprint / PDF').trim(),
        uploaded_by_email: user.email,
        shared_with_client: true,
        created_at: new Date().toISOString(),
      }
      store.documents.unshift(newDoc)
      writeStore(store)
      return NextResponse.json({ ok: true, item: newDoc })
    }

    if (action === 'delete') {
      store.documents = store.documents.filter((d) => d.id !== body.id)
      writeStore(store)
      return NextResponse.json({ ok: true })
    }
  }

  return NextResponse.json({ error: 'Invalid module or action' }, { status: 400 })
}
