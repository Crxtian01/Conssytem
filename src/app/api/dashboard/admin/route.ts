import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { fetchAdminDashboardAnalytics } from '@/lib/admin-dashboard-service'
import type { DateRangePreset } from '@/types/database.types'

export async function GET(request: Request) {
  const user = await requireAuth()

  if (user.role !== 'admin_engineer') {
    return NextResponse.json(
      {
        error:
          'Access Denied: Only Admin / Engineer role can view or query the Executive Admin Dashboard.',
      },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId') || 'all'
  const rawRange = (searchParams.get('dateRange') || 'this_quarter') as DateRangePreset
  const startDate = searchParams.get('startDate') || undefined
  const endDate = searchParams.get('endDate') || undefined

  const payload = await fetchAdminDashboardAnalytics({
    projectId,
    dateRange: rawRange,
    startDate,
    endDate,
  })

  return NextResponse.json({ payload })
}
