import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth'
import { getAdminDb } from '@/lib/db'
import AppShell from '@/components/layout/AppShell'
import { USER_STORIES, DATABASE_TABLES } from '@/types/database'

export const metadata = {
  title: 'Requirements & Database Design | Construction Management System',
}

export default function ArchitecturePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-gray-500">
          Loading Requirements &amp; Database Design…
        </div>
      }
    >
      <ArchitectureContent />
    </Suspense>
  )
}

async function ArchitectureContent() {
  const user = await requireAuth()
  const adminDb = getAdminDb()

  // Live check which of the 13 tables exist in Supabase right now
  const tableStatuses = await Promise.all(
    DATABASE_TABLES.map(async (t) => {
      const { error } = await adminDb.from(t.table).select('*').limit(1)
      return {
        table: t.table,
        exists: !error,
      }
    })
  )

  const statusMap = Object.fromEntries(tableStatuses.map((s) => [s.table, s.exists]))
  const createdCount = tableStatuses.filter((s) => s.exists).length

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Section 3 &amp; 4: Requirements &amp; Database Design (ERD)
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              User stories per role and the 13 relational tables with primary keys, foreign keys,
              and live Supabase status.
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900">
            Live DB Tables: {createdCount} / {DATABASE_TABLES.length} Ready
          </div>
        </div>

        {createdCount < DATABASE_TABLES.length && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
            <p className="font-bold">
              ⚡ Action Needed: Run <code>supabase/002_full_database_schema.sql</code> in Supabase SQL
              Editor
            </p>
            <p className="mt-1 text-xs text-amber-800">
              {DATABASE_TABLES.length - createdCount} of the 13 tables are not created in Supabase
              yet. Copy the SQL from <code>supabase/002_full_database_schema.sql</code> into your
              Supabase SQL Editor and click <strong>Run</strong>, then refresh this page to see all
              13 turn green!
            </p>
          </div>
        )}

        {/* Section 3: Requirements (User Stories) */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">
            Section 3: System Requirements (User Stories)
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Every requirement written as a user story mapped to its module and database tables.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {USER_STORIES.map((us) => (
              <div
                key={us.id}
                className="flex flex-col justify-between rounded-xl border border-gray-200 bg-gray-50/60 p-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
                      {us.id} • {us.roleLabel}
                    </span>
                    <span className="text-xs font-medium text-gray-500">{us.module}</span>
                  </div>
                  <p className="mt-2.5 text-sm font-semibold text-gray-900">
                    &ldquo;{us.story}&rdquo;
                  </p>
                  <p className="mt-1 text-xs text-gray-600">{us.acceptanceCriteria}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-gray-200/70">
                  {us.tableNames.map((tbl) => (
                    <span
                      key={tbl}
                      className="rounded bg-white border border-gray-200 px-2 py-0.5 font-mono text-[11px] text-gray-700"
                    >
                      {tbl}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Database Design (13 Tables & Relationships) */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">
            Section 4: Database Design (13 Core Tables &amp; ERD Relationships)
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            One project has many project_members, tasks, material_transactions, expenses,
            attendance records, daily_logs, and documents.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                  <th className="py-3 pr-4">Table</th>
                  <th className="py-3 px-4">Live Status</th>
                  <th className="py-3 px-4">Purpose (from Guide)</th>
                  <th className="py-3 px-4">Foreign Keys &amp; Indexes</th>
                  <th className="py-3 pl-4">Columns</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {DATABASE_TABLES.map((t) => {
                  const isLive = statusMap[t.table]
                  return (
                    <tr key={t.table} className="align-top">
                      <td className="py-3 pr-4 font-mono text-xs font-bold text-gray-900 whitespace-nowrap">
                        {t.table}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isLive ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                            Live ✅
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                            Pending SQL
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-700">{t.purpose}</td>
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {t.foreignKeys.length > 0 ? (
                          <div className="space-y-0.5">
                            {t.foreignKeys.map((fk) => (
                              <div key={fk} className="font-mono text-[11px] text-gray-600">
                                FK: {fk}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">Root table</span>
                        )}
                      </td>
                      <td className="py-3 pl-4 font-mono text-[11px] text-gray-600">
                        {t.keyColumns.join(', ')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
