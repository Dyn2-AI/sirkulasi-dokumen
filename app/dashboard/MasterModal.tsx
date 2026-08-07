'use client'

import { useState } from 'react'
import { 
  createBaTypeAction, 
  deleteBaTypeAction, 
  createBaTitleAction, 
  deleteBaTitleAction,
  createPositionAction, 
  deletePositionAction 
} from '@/app/actions/master'
import { X, Settings, Plus, Loader2, Tag, FileText, MapPin, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MasterModalProps {
  isOpen: boolean
  onClose: () => void
  baTypes: any[]
  baTitles?: any[]
  positions: any[]
}

export default function MasterModal({
  isOpen,
  onClose,
  baTypes = [],
  baTitles = [],
  positions = [],
}: MasterModalProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'ba' | 'title' | 'position'>('ba')
  
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  // Handler Tambah Item
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setErrorMsg('')

    let res
    if (activeTab === 'ba') {
      res = await createBaTypeAction(name)
    } else if (activeTab === 'title') {
      res = await createBaTitleAction(name)
    } else {
      res = await createPositionAction(name)
    }

    setLoading(false)

    if (res?.error) {
      setErrorMsg(res.error)
    } else {
      setName('')
      router.refresh()
    }
  }

  // Handler Hapus Item
  const handleDelete = async (id: string) => {
    setDeletingId(id)
    setErrorMsg('')

    let res
    if (activeTab === 'ba') {
      res = await deleteBaTypeAction(id)
    } else if (activeTab === 'title') {
      res = await deleteBaTitleAction(id)
    } else {
      res = await deletePositionAction(id)
    }

    setDeletingId(null)

    if (res?.error) {
      setErrorMsg(res.error)
    } else {
      router.refresh()
    }
  }

  // Helper List Data Terpilih
  const getActiveList = () => {
    if (activeTab === 'ba') return baTypes
    if (activeTab === 'title') return baTitles
    return positions
  }

  // Helper Label
  const getTabLabel = () => {
    if (activeTab === 'ba') return 'Jenis BA'
    if (activeTab === 'title') return 'Judul BA'
    return 'Posisi Dokumen'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-slate-900 px-5 py-3.5 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold">Kelola Master Data</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB NAVIGATION (3 TABS) */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-1">
          <button
            type="button"
            onClick={() => { setActiveTab('ba'); setErrorMsg('') }}
            className={`flex-1 py-2 px-1 text-[11px] xs:text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeTab === 'ba'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-[#0e7a46] shrink-0" />
            <span>Jenis BA ({baTypes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('title'); setErrorMsg('') }}
            className={`flex-1 py-2 px-1 text-[11px] xs:text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeTab === 'title'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Judul BA ({baTitles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('position'); setErrorMsg('') }}
            className={`flex-1 py-2 px-1 text-[11px] xs:text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeTab === 'position'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Posisi ({positions.length})</span>
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-900 text-xs rounded-xl font-bold leading-relaxed">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* FORM TAMBAH */}
          <form onSubmit={handleSubmit} className="space-y-2">
            <label className="block text-[11px] font-black uppercase tracking-wider text-black">
              Tambah {getTabLabel()} Baru
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder={
                  activeTab === 'ba' 
                    ? 'Contoh: BA Serah Terima' 
                    : activeTab === 'title'
                    ? 'Contoh: Berita Acara Operasional'
                    : 'Contoh: Di Lemari Archiving'
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-400 rounded-xl text-sm font-bold text-black focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0e7a46]"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#0e7a46] hover:bg-[#095530] text-white font-bold text-sm rounded-xl shrink-0 flex items-center gap-1 shadow-md disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Simpan</span>
              </button>
            </div>
          </form>

          {/* DAFTAR MASTER EXISTING */}
          <div className="pt-2 border-t border-slate-200">
            <span className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
              Daftar {getTabLabel()} Terdaftar
            </span>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {getActiveList().map((item) => (
                <div
                  key={item.id}
                  className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 flex justify-between items-center group"
                >
                  <span>{item.name}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    title="Hapus opsi ini"
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}