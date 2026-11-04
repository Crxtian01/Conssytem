'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { DocumentRecord, ProjectRecord } from '@/lib/module-store'
import { ROLES, type UserRole } from '@/lib/roles'

export default function DocumentsClient({
  initialDocuments,
  projects,
  role,
}: {
  initialDocuments: DocumentRecord[]
  projects: ProjectRecord[]
  role: UserRole
}) {
  const router = useRouter()
  const perms = ROLES[role].permissions
  const [docs, setDocs] = useState(initialDocuments)
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileType, setFileType] = useState('Blueprint / PDF')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/modules/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        project_id: projectId,
        title,
        file_url: fileUrl,
        file_type: fileType,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setDocs([data.item, ...docs])
      setTitle('')
      setFileUrl('')
      router.refresh()
    }
  }

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]))

  return (
    <div className="space-y-6">
      {!perms.readOnly && (
        <form
          onSubmit={handleAdd}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
        >
          <h2 className="text-base font-bold text-gray-900">+ Link Project Document / Blueprint</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              required
              placeholder="Document Title (e.g. MEP Plan v2.pdf)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900"
            />
            <input
              type="text"
              placeholder="Type (Blueprint, Permit, Contract)"
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900"
            />
            <input
              type="url"
              required
              placeholder="File URL (https://...)"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Save Document
          </button>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {docs.map((d) => (
          <div
            key={d.id}
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div>
              <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                {d.file_type}
              </span>
              <h3 className="mt-1.5 font-bold text-gray-900">{d.title}</h3>
              <p className="text-xs text-gray-500">
                {projectMap[d.project_id]} • Uploaded by {d.uploaded_by_email}
              </p>
            </div>
            <a
              href={d.file_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Open File ↗
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
