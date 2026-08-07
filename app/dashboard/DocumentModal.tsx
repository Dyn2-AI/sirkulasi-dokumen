'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createDocumentAction, updateDocumentAction } from '@/app/actions/document'
import { X, FileText, Wrench, Package, Loader2 } from 'lucide-react'

interface DocumentModalProps {
  isOpen: boolean
  onClose: () => void
  baTypes: any[]
  baTitles?: any[]
  positions: any[]
  editingDoc?: any | null
}

export default function DocumentModal({
  isOpen,
  onClose,
  baTypes = [],
  baTitles = [],
  positions = [],
  editingDoc = null,
}: DocumentModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // --- FORM STATES ---
  const [category, setCategory] = useState<'teknisi' | 'dispatch'>('teknisi')
  const [creationDate, setCreationDate] = useState('')
  const [baNumber, setBaNumber] = useState('')
  const [baTypeId, setBaTypeId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [positionId, setPositionId] = useState('')
  const [status, setStatus] = useState<'proses' | 'selesai' | 'terlambat'>('proses')
  const [notes, setNotes] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (editingDoc) {
      setCategory(editingDoc.category || 'teknisi')
      setCreationDate(editingDoc.creation_date || '')
      setBaNumber(editingDoc.ba_number || '')
      setBaTypeId(editingDoc.ba_type_id || (baTypes[0]?.id ?? ''))
      setTitle(editingDoc.title || (baTitles[0]?.name ?? ''))
      setDescription(editingDoc.description || '')
      setPositionId(editingDoc.position_id || (positions[0]?.id ?? ''))
      setStatus(editingDoc.status || 'proses')
      setNotes(editingDoc.notes || '')
    } else {
      const today = new Date().toISOString().slice(0, 10)
      setCategory('teknisi')
      setCreationDate(today)
      setBaNumber('')
      setBaTypeId(baTypes[0]?.id || '')
      setTitle(baTitles[0]?.name || 'Berita Acara Operasional')
      setDescription('')
      setPositionId(positions[0]?.id || '')
      setStatus('proses')
      setNotes('')
    }
    setErrorMessage(null)
  }, [editingDoc, isOpen, baTypes, baTitles, positions])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!baNumber.trim()) {
      setErrorMessage('Nomor BA wajib diisi!')
      return
    }

    const formData = new FormData()
    formData.append('category', category)
    formData.append('creation_date', creationDate)
    formData.append('ba_number', baNumber)
    formData.append('ba_type_id', baTypeId)
    formData.append('title', title)
    formData.append('description', description)
    formData.append('position_id', positionId)
    formData.append('status', status)
    formData.append('notes', notes)

    startTransition(async () => {
      let res: any
      if (editingDoc) {
        formData.append('id', editingDoc.id)
        res = await updateDocumentAction(formData)
      } else {
        res = await createDocumentAction(formData)
      }

      if (res?.error) {
        setErrorMessage(res.error)
      } else {
        router.refresh()
        onClose()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        
        {/* HEADER MODAL */}
        <div className="flex justify-between items-center px-5 py-4 bg-[#0e7a46] text-white">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-emerald-200" />
            <h3 className="text-base font-extrabold tracking-tight">
              {editingDoc ? 'Edit Dokumen Sirkulasi' : 'Input Dokumen Baru'}
            </h3>
          </div>
          <button onClick={onClose} type="button" className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-black/20">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM BODY */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar">
          {errorMessage && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs font-bold">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* 1. KATEGORI BA */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1.5">
              Kategori BA
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setCategory('teknisi')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${
                  category === 'teknisi' ? 'bg-[#0e7a46] text-white shadow-md' : 'text-slate-400 hover:bg-slate-900'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>BA Teknisi</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('dispatch')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${
                  category === 'dispatch' ? 'bg-[#0e7a46] text-white shadow-md' : 'text-slate-400 hover:bg-slate-900'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>BA Dispatch</span>
              </button>
            </div>
          </div>

          {/* 2. TANGGAL & NOMOR BA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1">
                Tanggal Dokumen
              </label>
              <input
                type="date"
                required
                value={creationDate}
                onChange={(e) => setCreationDate(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker?.()}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#0e7a46] [color-scheme:dark] cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1">
                Nomor BA <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: BA/2026/08/001"
                value={baNumber}
                onChange={(e) => setBaNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#0e7a46]"
              />
            </div>
          </div>

          {/* 3. JENIS BA (DIPINDAH KE SINI - SEBELUM JUDUL & DESKRIPSI) */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1">
              Jenis BA
            </label>
            <select
              value={baTypeId}
              onChange={(e) => setBaTypeId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#0e7a46] cursor-pointer"
            >
              {baTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* 4. JUDUL BA & DESKRIPSI BA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1">
                Judul BA
              </label>
              <select
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#0e7a46] cursor-pointer"
              >
                {baTitles.length === 0 ? (
                  <option value="Berita Acara Operasional">Berita Acara Operasional</option>
                ) : (
                  baTitles.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1">
                Deskripsi BA (Description)
              </label>
              <input
                type="text"
                placeholder="Contoh: BA ERROR UPLOADING 06082026"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#0e7a46]"
              />
            </div>
          </div>

          {/* 5. POSISI DOKUMEN & STATUS SLA (POSISI DOKUMEN TETAP DI SINI) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1">
                Posisi Dokumen
              </label>
              <select
                value={positionId}
                onChange={(e) => setPositionId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#0e7a46] cursor-pointer"
              >
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1">
                Status SLA
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-amber-900/50 text-amber-400 rounded-xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-[#0e7a46] cursor-pointer"
              >
                <option value="proses">Dalam Proses (≤ 2 Hari)</option>
                <option value="selesai">Selesai (Sudah Diproses)</option>
                <option value="terlambat">Terlambat (&gt; 2 Hari)</option>
              </select>
            </div>
          </div>

          {/* 6. KETERANGAN / CATATAN TAMBAHAN */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1">
              Keterangan / Catatan Tambahan
            </label>
            <textarea
              rows={2}
              placeholder="Catatan lokasi atau kendala dokumen..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#0e7a46] resize-none"
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-800 mt-4">
            <button type="button" onClick={onClose} disabled={isPending} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors">
              Batal
            </button>
            <button type="submit" disabled={isPending} className="flex items-center gap-1.5 px-5 py-2 bg-[#0e7a46] hover:bg-[#095530] text-white rounded-xl text-xs font-extrabold shadow-md transition-colors">
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{editingDoc ? 'Update Dokumen' : 'Simpan Dokumen'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}