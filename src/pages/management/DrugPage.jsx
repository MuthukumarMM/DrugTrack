import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { createDrug, deleteDrug, subscribeDrugs, updateDrug } from '../../services/drugService'
import { subscribeCategories } from '../../services/categoryService'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/feedback/EmptyState'
import LoadingSpinner from '../../components/feedback/LoadingSpinner'
import { uploadDrugImage } from '../../services/storageService'

const initialForm = {
  name: '',
  genericName: '',
  brandName: '',
  categoryId: '',
  dosageForm: '',
  strength: '',
  composition: '',
  description: '',
  prescriptionRequired: false,
  storageCondition: '',
  basePrice: '',
  imageUrl: '',
  status: 'ACTIVE',
}

export default function DrugPage({ admin = false }) {
  const { currentUser } = useAuth()
  const [items, setItems] = useState(null)
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [imageFile, setImageFile] = useState(null)

  useEffect(() => {
    const owner = admin ? undefined : currentUser?.uid
    return subscribeDrugs(setItems, owner)
  }, [admin, currentUser])

  useEffect(() => {
    return subscribeCategories(setCategories)
  }, [])

  const handleSave = async e => {
    e.preventDefault()
    if (!form.name.trim() || !form.categoryId || !form.dosageForm.trim() || !form.strength.trim() || form.basePrice === '') {
      toast.error('Please complete all required fields.')
      return
    }

    setBusy(true)
    try {
      let imageUrl = form.imageUrl
      if (imageFile) {
        const uploaded = await uploadDrugImage(editing?.id || currentUser?.uid, imageFile)
        imageUrl = uploaded.url
      }
      const data = {
        ...form,
        imageUrl,
        name: form.name.trim(),
        genericName: form.genericName.trim(),
        brandName: form.brandName.trim(),
        dosageForm: form.dosageForm.trim(),
        strength: form.strength.trim(),
        composition: form.composition.trim(),
        storageCondition: form.storageCondition.trim(),
        basePrice: Number(form.basePrice),
        manufacturerId: admin ? form.manufacturerId || currentUser?.uid : currentUser?.uid,
      }

      if (editing?.id) {
        await updateDrug(editing.id, data)
        toast.success('Medicine record updated.')
      } else {
        await createDrug(data)
        toast.success('Medicine record created.')
      }

      setIsModalOpen(false)
      setEditing(null)
      setForm(initialForm)
      setImageFile(null)
    } catch (err) {
      toast.error(err.message || 'Failed to save drug.')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this medicine record? This action cannot be undone.')) {
      return
    }
    try {
      await deleteDrug(id)
      toast.success('Medicine record removed.')
    } catch (err) {
      toast.error(err.message || 'Could not delete drug.')
    }
  }

  const handleOpenCreate = () => {
    setEditing(null)
    setForm(initialForm)
    setImageFile(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = item => {
    setEditing(item)
    setForm({
      ...item,
      basePrice: String(item.basePrice ?? ''),
    })
    setImageFile(null)
    setIsModalOpen(true)
  }

  const filteredRows = useMemo(() => {
    if (!items) return []
    if (!search.trim()) return items
    const query = search.toLowerCase()
    return items.filter(i =>
      `${i.name} ${i.genericName} ${i.brandName} ${i.dosageForm} ${i.strength}`
        .toLowerCase()
        .includes(query)
    )
  }, [items, search])

  if (!items) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <PageHeader
        title={admin ? 'Global Drug Master Catalogue' : 'My Pharmaceutical Products'}
        description="Master formulary and drug records verified for supply chain tracking and batch linkage."
      />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            className="field w-full pl-9 text-sm"
            placeholder="Search by drug name, brand, or generic..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <Button onClick={handleOpenCreate} className="flex items-center justify-center gap-2">
          <Plus size={16} />
          Add Medicine
        </Button>
      </div>

      {filteredRows.length === 0 ? (
        <EmptyState
          title="No medicines found"
          description={search ? 'No results matched your search term.' : 'Register your first pharmaceutical formulary product.'}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Medicine</th>
                  <th className="px-4 py-3">Generic Name</th>
                  <th className="px-4 py-3">Strength & Form</th>
                  <th className="px-4 py-3">Base Price (Rs.)</th>
                  <th className="px-4 py-3">Rx Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div>{d.name}</div>
                      {d.brandName && <span className="text-xs text-slate-400">{d.brandName}</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{d.genericName || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {d.strength} • {d.dosageForm}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      Rs. {Number(d.basePrice || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          d.prescriptionRequired
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-teal-50 text-teal-700'
                        }`}
                      >
                        {d.prescriptionRequired ? 'Prescription' : 'OTC'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        {d.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(d)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-teal-700 transition"
                        title="Edit medicine"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className="ml-2 rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                        onClick={() => handleDelete(d.id)}
                        title="Delete medicine"
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

      <Modal open={isModalOpen}>
        <form onSubmit={handleSave} className="p-1">
          <h2 className="text-lg font-bold text-slate-900">
            {editing ? 'Edit Medicine' : 'Register New Medicine'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Enter the clinical details and master catalog pricing.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 max-h-[65vh] overflow-y-auto pr-1">
            <Input
              label="Medicine Name *"
              required
              placeholder="e.g. Paracetamol 500mg"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Generic Name"
              placeholder="e.g. Acetaminophen"
              value={form.genericName}
              onChange={e => setForm({ ...form, genericName: e.target.value })}
            />
            <Input
              label="Brand Name"
              placeholder="e.g. Crocin / Calpol"
              value={form.brandName}
              onChange={e => setForm({ ...form, brandName: e.target.value })}
            />
            <Select
              label="Therapeutic Category *"
              required
              value={form.categoryId}
              onChange={e => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">Select therapeutic category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Input
              label="Dosage Form *"
              required
              placeholder="Tablet, Capsule, Syrup, Injection..."
              value={form.dosageForm}
              onChange={e => setForm({ ...form, dosageForm: e.target.value })}
            />
            <Input
              label="Strength *"
              required
              placeholder="e.g. 500 mg, 10 ml"
              value={form.strength}
              onChange={e => setForm({ ...form, strength: e.target.value })}
            />
            <Input
              label="Storage Condition"
              placeholder="e.g. Store below 25°C in dry place"
              value={form.storageCondition}
              onChange={e => setForm({ ...form, storageCondition: e.target.value })}
            />
            <Input
              label="Base Price (Rs.) *"
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="0.00"
              value={form.basePrice}
              onChange={e => setForm({ ...form, basePrice: e.target.value })}
            />
            <div className="sm:col-span-2">
              <Input
                label="Product Image URL (Optional)"
                placeholder="https://..."
                value={form.imageUrl}
                onChange={e => setForm({ ...form, imageUrl: e.target.value })}
              />
              <label className="mt-3 block text-sm font-medium text-slate-700">
                Upload medicine image (JPG, PNG, or WEBP)
                <input
                  className="field mt-1 w-full bg-white text-sm"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={event => setImageFile(event.target.files?.[0] || null)}
                />
              </label>
              {imageFile && <p className="mt-1 text-xs text-teal-700">Ready to upload: {imageFile.name}</p>}
            </div>
            <div className="sm:col-span-2 flex items-center gap-2 pt-1">
              <input
                id="prescriptionRequiredCheck"
                type="checkbox"
                className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500"
                checked={form.prescriptionRequired}
                onChange={e => setForm({ ...form, prescriptionRequired: e.target.checked })}
              />
              <label htmlFor="prescriptionRequiredCheck" className="text-sm font-medium text-slate-700">
                Prescription Required (Schedule H / Rx medicine)
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setIsModalOpen(false)
                setEditing(null)
                setForm(initialForm)
              }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving...' : 'Save Medicine'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
