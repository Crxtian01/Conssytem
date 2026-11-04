import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { ROLES } from '@/lib/roles'
import { readStore, writeStore, newId } from '@/lib/module-store'
import { sendEmail, buildBrandedEmailHtml } from '@/lib/email'

// GET /api/modules/[module]
// Enforces role permissions on the backend (e.g., strips project budgets for workers)
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ module: string }> }
) {
  const user = await requireAuth()
  const { module } = await context.params
  const store = readStore()
  const perms = ROLES[user.role].permissions

  if (module === 'projects') {
    const projects = store.projects.map((p) => ({
      ...p,
      // Section 11: Workers should NOT see budgets on the backend
      budget: perms.viewBudgets ? p.budget : 0,
    }))
    return NextResponse.json({ data: projects })
  }

  if (module === 'expenses') {
    if (!perms.viewBudgets) {
      return NextResponse.json(
        { error: 'Your role does not have permission to view budgets or expenses.' },
        { status: 403 }
      )
    }
    return NextResponse.json({ data: store.expenses })
  }

  if (module in store) {
    return NextResponse.json({ data: store[module as keyof typeof store] })
  }

  return NextResponse.json({ error: 'Unknown module' }, { status: 404 })
}

// POST /api/modules/[module]
// Handles Create, Update, Delete, Stock In/Out, and Expense Approvals with strict server validation & role checks
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

  const store = readStore()

  // -------------------------------------------------------------------
  // 1. PROJECTS & SITES
  // -------------------------------------------------------------------
  if (module === 'projects') {
    if (!perms.manageProjects) {
      return NextResponse.json(
        { error: 'Only Admins and Project Managers can create or modify projects.' },
        { status: 403 }
      )
    }

    if (action === 'create') {
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
        status: body.status || 'planning',
        progress: Math.min(100, Math.max(0, Number(body.progress ?? 0))),
        created_at: new Date().toISOString(),
      }
      store.projects.unshift(newProj)
      writeStore(store)
      return NextResponse.json({ ok: true, item: newProj })
    }

    if (action === 'update_progress') {
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

      // Section 12: Send task assignment notice email
      await sendEmail({
        to: user.email,
        subject: `New Task Assigned: ${newTask.title}`,
        html: buildBrandedEmailHtml({
          heading: 'New Construction Task Assigned',
          bodyHtml: `<p>Task <strong>${newTask.title}</strong> has been assigned to <strong>${newTask.assigned_user_name}</strong> (Due: ${newTask.due_date}).</p>`,
        }),
      })

      return NextResponse.json({ ok: true, item: newTask })
    }

    if (action === 'update') {
      // Workers CAN update progress on assigned tasks; managers/engineers/foremen can update any task
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
      if (!perms.manageTasks) {
        return NextResponse.json({ error: 'Not allowed to delete tasks.' }, { status: 403 })
      }
      store.tasks = store.tasks.filter((t) => t.id !== body.id)
      writeStore(store)
      return NextResponse.json({ ok: true })
    }
  }

  // -------------------------------------------------------------------
  // 3. MATERIALS & INVENTORY (WITH STOCK IN/OUT & LOW-STOCK WARNING)
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

      // Section 12: Send low-stock alert email if stock <= reorder_level
      const lowStockTriggered = mat.current_stock <= mat.reorder_level
      if (lowStockTriggered) {
        await sendEmail({
          to: user.email,
          subject: `⚠️ Low-Stock Alert: ${mat.name}`,
          html: buildBrandedEmailHtml({
            heading: `Low-Stock Warning: ${mat.name}`,
            bodyHtml: `<p>Current stock for <strong>${mat.name}</strong> has dropped to <strong>${mat.current_stock} ${mat.unit}</strong> (Reorder level: ${mat.reorder_level} ${mat.unit}). Please reorder soon.</p>`,
          }),
        })
      }

      return NextResponse.json({ ok: true, item: mat, transaction: tx, lowStockTriggered })
    }
  }

  // -------------------------------------------------------------------
  // 4. WORKERS & ATTENDANCE
  // -------------------------------------------------------------------
  if (module === 'attendance') {
    if (action === 'create_worker') {
      if (!perms.recordAttendance) {
        return NextResponse.json({ error: 'Not allowed to add workers.' }, { status: 403 })
      }
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
  }

  // -------------------------------------------------------------------
  // 5. EQUIPMENT
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
  }

  // -------------------------------------------------------------------
  // 6. EXPENSES & BUDGET (WITH MANAGER-ONLY APPROVAL ENFORCEMENT)
  // -------------------------------------------------------------------
  if (module === 'expenses') {
    if (action === 'create') {
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
      // Section 11: "only managers can approve expenses" (Admin & Project Manager)
      if (!perms.approveExpenses) {
        return NextResponse.json(
          { error: 'Only Project Managers and Admins can approve or reject expenses.' },
          { status: 403 }
        )
      }
      const exp = store.expenses.find((e) => e.id === body.id)
      if (!exp) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
      exp.approval_status = action === 'approve' ? 'approved' : 'rejected'
      exp.approved_by_email = user.email
      writeStore(store)

      // Section 12: Expense approval notice email
      await sendEmail({
        to: exp.submitted_by_email,
        subject: `Expense ${exp.approval_status.toUpperCase()}: ${exp.description}`,
        html: buildBrandedEmailHtml({
          heading: `Expense ${exp.approval_status.toUpperCase()}`,
          bodyHtml: `<p>Your expense <strong>${exp.description}</strong> (₱${exp.amount.toLocaleString()}) was <strong>${exp.approval_status}</strong> by ${user.email}.</p>`,
        }),
      })

      return NextResponse.json({ ok: true, item: exp })
    }
  }

  // -------------------------------------------------------------------
  // 7. DAILY LOGS WITH PHOTO UPLOAD
  // -------------------------------------------------------------------
  if (module === 'daily_logs') {
    if (!perms.logDailyProgress) {
      return NextResponse.json(
        { error: 'Your role cannot submit site daily logs.' },
        { status: 403 }
      )
    }

    if (action === 'create') {
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
        created_at: new Date().toISOString(),
      }
      store.daily_logs.unshift(newLog)
      writeStore(store)
      return NextResponse.json({ ok: true, item: newLog })
    }
  }

  // -------------------------------------------------------------------
  // 8. DOCUMENTS
  // -------------------------------------------------------------------
  if (module === 'documents') {
    if (action === 'create') {
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
        created_at: new Date().toISOString(),
      }
      store.documents.unshift(newDoc)
      writeStore(store)
      return NextResponse.json({ ok: true, item: newDoc })
    }
  }

  return NextResponse.json({ error: 'Invalid module or action' }, { status: 400 })
}
