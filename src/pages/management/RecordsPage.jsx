import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/feedback/EmptyState'
import LoadingSpinner from '../../components/feedback/LoadingSpinner'

export default function RecordsPage({
  title,
  description,
  fields,
  subscribe,
  create,
  update,
  remove,
  defaults = {},
  transform = x => x,
  renderActions = null,
  children = null,
}) {
  const [rows, setRows] = useState(null)
  const [editing, setEditing] = useState(null)
  const [data, setData] = useState(defaults)
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    return subscribe(setRows)
  }, [subscribe])

  const handleSave = async e => {
    e.preventDefault()
    setBusy(true)
    try {
      const clean = transform(data)
      if (editing?.id) {
        await update(editing.id, clean)
      } else {
        await create(clean)
      }
      toast.success(`${title} saved successfully.`)
      setEditing(null)
      setData(defaults)
    } catch (err) {
      toast.error(err.message || 'Operation failed.')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      return
    }
    try {
      await remove(id)
      toast.success('Record deleted successfully.')
    } catch (err) {
      toast.error(err.message || 'Could not delete record.')
    }
  }

  const filtered = useMemo(() => {
    if (!rows) return []
    if (!search.trim()) return rows
    const query = search.toLowerCase()
    return rows.filter(r =>
      Object.values(r)
        .filter(v => typeof v === 'string' || typeof v === 'number')
        .join(' ')
        .toLowerCase()
        .includes(query)
    )
  }, [rows, search])

  if (!rows) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            className="field w-full pl-9 text-sm"
            placeholder="Search records..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <Button
          className="flex items-center justify-center gap-2"
          onClick={() => {
            setData(defaults)
            setEditing({})
          }}
        >
          <Plus size={16} />
          Add Record
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={`No ${title.toLowerCase()} found`}
          description={search ? 'No records match your search criteria.' : 'Create your first record to begin.'}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  {fields.slice(0, 6).map(f => (
                    <th className="px-4 py-3" key={f.name}>
                      {f.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    {fields.slice(0, 6).map(f => (
                      <td className="px-4 py-3 text-slate-700 font-normal" key={f.name}>
                        {r[f.name] !== undefined && r[f.name] !== null ? String(r[f.name]) : '—'}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          setData(r)
                          setEditing(r)
                        }}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-teal-700 transition"
                        title="Edit record"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className="ml-2 rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                        onClick={() => handleDelete(r.id)}
                        title="Delete record"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={editing !== null}>
        <form onSubmit={handleSave} className="p-1">
          <h2 className="text-lg font-bold text-slate-900">
            {editing?.id ? 'Edit' : 'Create New'} {title}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Provide the required pharmaceutical metadata below.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 max-h-[65vh] overflow-y-auto pr-1">
            {fields.map(f => (
              <Input
                key={f.name}
                label={`${f.label}${f.required ? ' *' : ''}`}
                type={f.type || 'text'}
                required={f.required}
                min={f.min}
                value={data[f.name] ?? ''}
                onChange={e =>
                  setData({
                    ...data,
                    [f.name]: f.type === 'number' ? e.target.value : e.target.value,
                  })
                }
              />
            ))}
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={busy}
              onClick={() => setEditing(null)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving...' : 'Save Record'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
