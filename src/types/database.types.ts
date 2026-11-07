import type { UserRole } from '@/lib/roles'
import type {
  ExpenseRecord,
  MaterialRequestRecord,
  RoleRequestRecord,
} from '@/lib/module-store'

export type DateRangePreset = 'this_week' | 'this_month' | 'this_quarter' | 'custom'

export interface DashboardFilterParams {
  projectId: string // 'all' or specific project id
  dateRange: DateRangePreset
  startDate?: string
  endDate?: string
}

export type KpiPolarity = 'positive_is_good' | 'negative_is_good' | 'neutral'
export type KpiFormatType = 'integer' | 'percent' | 'currency'

export interface SparklinePoint {
  label: string
  value: number
}

export interface AdminKpiMetric {
  id:
    | 'active_projects'
    | 'overall_progress'
    | 'spent_vs_budget'
    | 'low_stock_materials'
    | 'pending_approvals'
    | 'open_bids'
  title: string
  value: number
  secondaryLabel: string
  format: KpiFormatType
  changePct: number
  direction: 'up' | 'down' | 'flat'
  polarity: KpiPolarity
  comparisonPeriodLabel: string
  sparkline: SparklinePoint[]
  href: string
}

export interface SCurvePoint {
  period: string
  planned: number
  actual: number
  variance: number
}

export interface MonthlyExpenseVsBudgetPoint {
  month: string
  monthlySpent: number
  cumulativeSpent: number
  cumulativeBudget: number
  monthlyTarget: number
}

export interface ExpenseCategoryPoint {
  category: string
  amount: number
  percentage: number
  count: number
}

export interface MaterialStockChartPoint {
  id: string
  name: string
  unit: string
  currentStock: number
  reorderLevel: number
  isBelowReorder: boolean
}

export interface AttendanceTrendPoint {
  period: string
  present: number
  late: number
  absent: number
  attendanceRate: number
}

export interface TaskStatusPoint {
  status: 'Done' | 'Ongoing' | 'Delayed'
  count: number
  percentage: number
  fill: string
}

export interface BidStagePoint {
  stage: 'Draft' | 'Open' | 'Evaluation' | 'Awarded'
  count: number
  totalAbc: number
  fill: string
}

export interface ProjectProgressItem {
  id: string
  name: string
  location: string
  status: string
  actualProgress: number
  plannedProgress: number
  budget: number
  spent: number
  budgetUtilizationPct: number
  isAheadOrOnTrack: boolean
}

export interface AdminDashboardPayload {
  generatedAt: string
  filters: {
    projectId: string
    projectName: string
    dateRange: DateRangePreset
    startDate: string
    endDate: string
  }
  projectsList: {
    id: string
    name: string
    location: string
    status: string
  }[]
  kpis: AdminKpiMetric[]
  charts: {
    plannedVsActual: SCurvePoint[]
    monthlyExpensesVsBudget: MonthlyExpenseVsBudgetPoint[]
    expensesByCategory: ExpenseCategoryPoint[]
    materialStockLevels: MaterialStockChartPoint[]
    attendanceTrend: AttendanceTrendPoint[]
    tasksByStatus: TaskStatusPoint[]
    bidsByStage: BidStagePoint[]
    progressPerProject: ProjectProgressItem[]
  }
  approvalsQueue: {
    pendingExpenses: ExpenseRecord[]
    pendingMaterialRequests: MaterialRequestRecord[]
    pendingRoleRequests: RoleRequestRecord[]
  }
}

/**
 * Strongly typed Supabase Database schema definition (Tables, Views, RPCs)
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: UserRole
          email_verified: boolean
          created_at: string
          updated_at: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          location: string
          description: string | null
          budget: number
          start_date: string | null
          end_date: string | null
          status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
          progress: number
          created_at: string
          updated_at: string
        }
      }
      expenses: {
        Row: {
          id: string
          project_id: string
          category: string
          description: string
          amount: number
          expense_date: string
          approval_status: 'pending' | 'approved' | 'rejected'
          created_at: string
        }
      }
      materials: {
        Row: {
          id: string
          name: string
          unit: string
          current_stock: number
          reorder_level: number
          unit_cost: number
          created_at: string
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          title: string
          status: 'todo' | 'in_progress' | 'review' | 'completed'
          percent_complete: number
          due_date: string | null
          created_at: string
        }
      }
      attendance: {
        Row: {
          id: string
          worker_id: string
          project_id: string
          attendance_date: string
          hours_worked: number
          status: 'present' | 'half_day' | 'absent'
          created_at: string
        }
      }
    }
    Views: {
      v_admin_monthly_expenses: {
        Row: {
          project_id: string
          project_name: string
          month_start: string
          month_label: string
          approved_spent: number
          pending_spent: number
          expense_count: number
        }
      }
      v_admin_expenses_by_category: {
        Row: {
          project_id: string
          category: string
          total_amount: number
          item_count: number
        }
      }
      v_admin_material_stock_levels: {
        Row: {
          material_id: string
          material_name: string
          unit: string
          current_stock: number
          reorder_level: number
          unit_cost: number
          is_low_stock: boolean
          stock_to_reorder_pct: number
        }
      }
      v_admin_tasks_by_status: {
        Row: {
          project_id: string
          status: string
          task_count: number
          delayed_count: number
        }
      }
      v_admin_attendance_trend: {
        Row: {
          project_id: string
          attendance_date: string
          present_count: number
          late_or_half_day_count: number
          absent_count: number
          total_hours: number
        }
      }
    }
    Functions: {
      get_admin_dashboard_kpi_comparison: {
        Args: {
          p_project_id?: string | null
          p_start_date?: string
          p_end_date?: string
        }
        Returns: {
          active_projects_count: number
          overall_progress_pct: number
          total_budget: number
          current_period_spent: number
          previous_period_spent: number
          spent_change_pct: number
          low_stock_count: number
          pending_expenses_count: number
          current_attendance_rate: number
          previous_attendance_rate: number
        }[]
      }
    }
  }
}

