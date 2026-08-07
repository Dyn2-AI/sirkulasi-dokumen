'use client'

import { useState, useEffect, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { deleteDocumentAction, deleteDocumentsByMonthAction } from '@/app/actions/document'

// Sub-components / Modals
import DocumentModal from './DocumentModal'
import MasterModal from './MasterModal'
import UserManagementModal from './UserManagementModal'
import ActivityLogModal from './ActivityLogModal'
import ExportExcelModal from './ExportExcelModal'

// Icons
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  History,
  FileSpreadsheet,
  Settings,
  UserPlus,
  Plus,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Wrench,
  Package,
  Eye,
  X,
  Loader2,
  ShieldCheck,
  User,
  Sun,
  Moon,
  FilterX,
  AlertOctagon
} from 'lucide-react'

interface DashboardClientProps {
  user?: any
  profile?: any
  initialDocuments: any[]
  baTypes: any[]
  baTitles?: any[]
  positions: any[]
  profiles?: any[]
}

export default function DashboardClient({
  user,
  profile,
  initialDocuments = [],
  baTypes = [],
  baTitles = [],
  positions = [],
  profiles = [],
}: DashboardClientProps) {
  const router = useRouter()
  const supabase = createClient()

  // --- STATES ---
  const [documents, setDocuments] = useState<any[]>(initialDocuments)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'teknisi' | 'dispatch'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'proses' | 'selesai' | 'terlambat'>('all')
  const [isDarkMode, setIsDarkMode] = useState(true)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 5

  // Modals
  const [isDocModalOpen, setIsDocModalOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<any | null>(null)
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  // State Hapus Massal 1 Bulan
  const [bulkDeleteMonth, setBulkDeleteMonth] = useState(new Date().toISOString().slice(0, 7))
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)
  const [isBulkDeleting, startBulkDeleteTransition] = useTransition()

  // Details & Loaders
  const [selectedNotes, setSelectedNotes] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // --- SINKRONISASI DATA SERVER & DARK MODE ---
  useEffect(() => {
    setDocuments(initialDocuments)
  }, [initialDocuments])

  const toggleTheme = () => setIsDarkMode((prev) => !prev)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  // --- HANDLERS ---
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleOpenCreateModal = () => {
    setEditingDoc(null)
    setIsDocModalOpen(true)
  }

  const handleOpenEditModal = (doc: any) => {
    setEditingDoc(doc)
    setIsDocModalOpen(true)
  }

  const handleDeleteDoc = async (id: string, baNumber: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus dokumen No BA: ${baNumber}?`)) return

    setDeletingId(id)
    const res = await deleteDocumentAction(id)
    setDeletingId(null)

    if (res?.error) {
      alert(`Gagal menghapus: ${res.error}`)
    } else {
      router.refresh()
    }
  }

  // Handler Hapus Massal Per Bulan
  const handleBulkDelete = () => {
    if (!confirm(`⚠️ PERINGATAN: Apakah Anda YAKIN ingin menghapus SELURUH data dokumen periode bulan ${bulkDeleteMonth}? Data tidak bisa dikembalikan!`)) return

    startBulkDeleteTransition(async () => {
      const res = await deleteDocumentsByMonthAction(bulkDeleteMonth)
      if (res?.error) {
        alert(`Gagal: ${res.error}`)
      } else {
        alert(`Berhasil menghapus ${res.count || 0} data dokumen!`)
        setIsBulkDeleteModalOpen(false)
        router.refresh()
      }
    })
  }

  // --- FILTERING DATA PIPELINE ---

  // 1. Filter Kategori BA
  const categoryFilteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      if (activeCategoryTab === 'all') return true
      return (doc.category || 'teknisi') === activeCategoryTab
    })
  }, [documents, activeCategoryTab])

  // 2. Hitung Statistik Ringkasan
  const stats = useMemo(() => {
    const total = categoryFilteredDocs.length
    const inProgress = categoryFilteredDocs.filter((d) => d.status === 'proses').length
    const completed = categoryFilteredDocs.filter((d) => d.status === 'selesai').length
    const overdue = categoryFilteredDocs.filter((d) => d.status === 'terlambat').length

    const pctProgress = total > 0 ? Math.round((inProgress / total) * 100) : 0
    const pctCompleted = total > 0 ? Math.round((completed / total) * 100) : 0
    const pctOverdue = total > 0 ? Math.round((overdue / total) * 100) : 0

    return { total, inProgress, completed, overdue, pctProgress, pctCompleted, pctOverdue }
  }, [categoryFilteredDocs])

  // 3. Filter Status SLA
  const statusFilteredDocs = useMemo(() => {
    if (statusFilter === 'all') return categoryFilteredDocs
    return categoryFilteredDocs.filter((doc) => doc.status === statusFilter)
  }, [categoryFilteredDocs, statusFilter])

  // 4. Filter Search Bar (Termasuk Judul & Deskripsi BA)
  const searchedDocs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return statusFilteredDocs

    return statusFilteredDocs.filter((doc) => {
      const baNum = (doc.ba_number || '').toLowerCase()
      const baTitle = (doc.title || '').toLowerCase()
      const baDesc = (doc.description || '').toLowerCase()
      const docNum = `#${doc.doc_number || ''}`
      const baTypeName = (doc.master_ba_types?.name || '').toLowerCase()
      const posName = (doc.master_positions?.name || '').toLowerCase()
      const notesText = (doc.notes || '').toLowerCase()
      const updaterName = (doc.updater?.full_name || '').toLowerCase()

      return (
        baNum.includes(q) ||
        baTitle.includes(q) ||
        baDesc.includes(q) ||
        docNum.includes(q) ||
        baTypeName.includes(q) ||
        posName.includes(q) ||
        notesText.includes(q) ||
        updaterName.includes(q)
      )
    })
  }, [statusFilteredDocs, searchQuery])

  // 5. Pagination
  const totalPages = Math.ceil(searchedDocs.length / ITEMS_PER_PAGE) || 1
  const paginatedDocs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return searchedDocs.slice(start, start + ITEMS_PER_PAGE)
  }, [searchedDocs, currentPage])

  return (
    <div className={`min-h-screen transition-colors duration-200 pb-16 ${
      isDarkMode ? 'bg-[#0a0e17] text-slate-100' : 'bg-slate-100 text-slate-900'
    } p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-6`}>
      
      {/* ================= HEADER ADAPTIF ================= */}
      <header className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b ${
        isDarkMode ? 'border-slate-800' : 'border-slate-300'
      }`}>
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 sm:p-2.5 bg-gradient-to-br from-[#0e7a46] to-emerald-700 rounded-xl sm:rounded-2xl shadow-md shrink-0">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className={`text-base sm:text-xl md:text-2xl font-black tracking-tight leading-tight ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Sirkulasi Dokumen
            </h1>
            <p className={`text-[10px] sm:text-xs font-bold leading-tight ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Pemantauan Status & SLA Berita Acara
            </p>
          </div>
        </div>

        {/* CONTROLS (THEME, USER, LOGOUT) */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <button
            onClick={toggleTheme}
            type="button"
            title={isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
            className={`p-2 sm:p-2.5 rounded-xl border transition-all ${
              isDarkMode
                ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs'
            }`}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className={`flex items-center gap-2 px-2.5 py-1.5 border rounded-xl ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300 shadow-xs'
          }`}>
            <div className={`p-1 rounded-lg ${isDarkMode ? 'bg-slate-800 text-emerald-400' : 'bg-slate-100 text-emerald-700'}`}>
              {profile?.role === 'admin' ? <ShieldCheck className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
            </div>
            <div className="text-left">
              <span className={`block text-xs font-black leading-none max-w-[100px] sm:max-w-[120px] truncate ${
                isDarkMode ? 'text-slate-200' : 'text-slate-800'
              }`}>
                {profile?.full_name || 'User'}
              </span>
              <span className="inline-block mt-0.5 px-1 py-0.2 text-[8px] sm:text-[9px] font-black uppercase rounded bg-amber-500/20 text-amber-500 border border-amber-500/30">
                {profile?.role || 'User'}
              </span>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            title="Keluar / Sign Out"
            className={`p-2 sm:p-2.5 border rounded-xl transition-colors ${
              isDarkMode
                ? 'bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border-slate-800'
                : 'bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border-slate-300 shadow-xs'
            }`}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ================= TAB CONTROL ================= */}
      <div className="w-full overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <div className={`flex items-center gap-1.5 p-1 border rounded-2xl w-full sm:w-fit min-w-max ${
          isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-300 shadow-xs'
        }`}>
          <button
            type="button"
            onClick={() => { setActiveCategoryTab('all'); setCurrentPage(1) }}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
              activeCategoryTab === 'all'
                ? 'bg-[#0e7a46] text-white shadow-md'
                : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🌐 Semua BA ({documents.length})
          </button>

          <button
            type="button"
            onClick={() => { setActiveCategoryTab('teknisi'); setCurrentPage(1) }}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeCategoryTab === 'teknisi'
                ? 'bg-[#0e7a46] text-white shadow-md'
                : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>BA Teknisi</span>
            <span className="px-1.5 py-0.5 text-[9px] bg-black/20 rounded-md">
              {documents.filter((d) => (d.category || 'teknisi') === 'teknisi').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveCategoryTab('dispatch'); setCurrentPage(1) }}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeCategoryTab === 'dispatch'
                ? 'bg-[#0e7a46] text-white shadow-md'
                : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>BA Dispatch</span>
            <span className="px-1.5 py-0.5 text-[9px] bg-black/20 rounded-md">
              {documents.filter((d) => d.category === 'dispatch').length}
            </span>
          </button>
        </div>
      </div>

      {/* ================= STATISTIK CARDS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-5">
        <div className="lg:col-span-2 grid grid-cols-2 gap-2.5 sm:gap-4">
          
          <button
            type="button"
            onClick={() => { setStatusFilter('all'); setCurrentPage(1) }}
            className={`p-3.5 sm:p-5 rounded-2xl border text-left transition-all relative overflow-hidden ${
              isDarkMode ? 'bg-slate-900/80' : 'bg-white shadow-xs'
            } ${
              statusFilter === 'all'
                ? 'border-blue-500 ring-2 ring-blue-500/30'
                : isDarkMode ? 'border-slate-800' : 'border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <div>
                <span className={`block text-[9px] sm:text-[11px] font-black uppercase tracking-wider ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Total
                </span>
                <span className={`text-2xl sm:text-3xl font-black mt-0.5 sm:mt-1 block ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  {stats.total}
                </span>
              </div>
              <div className="p-2 sm:p-3 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-xl sm:rounded-2xl shrink-0">
                <FileText className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
            </div>
            {statusFilter === 'all' && (
              <span className="block mt-2 text-[8px] sm:text-[9px] font-black uppercase text-blue-500 truncate">
                ● Active Filter
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => { setStatusFilter('proses'); setCurrentPage(1) }}
            className={`p-3.5 sm:p-5 rounded-2xl border text-left transition-all relative overflow-hidden ${
              isDarkMode ? 'bg-slate-900/80' : 'bg-white shadow-xs'
            } ${
              statusFilter === 'proses'
                ? 'border-amber-500 ring-2 ring-amber-500/30'
                : isDarkMode ? 'border-slate-800' : 'border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <div>
                <span className="block text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-amber-500">
                  Proses
                </span>
                <span className="text-2xl sm:text-3xl font-black text-amber-500 mt-0.5 sm:mt-1 block">
                  {stats.inProgress}
                </span>
              </div>
              <div className="p-2 sm:p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl sm:rounded-2xl shrink-0">
                <Clock className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
            </div>
            {statusFilter === 'proses' && (
              <span className="block mt-2 text-[8px] sm:text-[9px] font-black uppercase text-amber-500 truncate">
                ● Active Filter
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => { setStatusFilter('selesai'); setCurrentPage(1) }}
            className={`p-3.5 sm:p-5 rounded-2xl border text-left transition-all relative overflow-hidden ${
              isDarkMode ? 'bg-slate-900/80' : 'bg-white shadow-xs'
            } ${
              statusFilter === 'selesai'
                ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                : isDarkMode ? 'border-slate-800' : 'border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <div>
                <span className="block text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-500">
                  Selesai
                </span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-500 mt-0.5 sm:mt-1 block">
                  {stats.completed}
                </span>
              </div>
              <div className="p-2 sm:p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl sm:rounded-2xl shrink-0">
                <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
            </div>
            {statusFilter === 'selesai' && (
              <span className="block mt-2 text-[8px] sm:text-[9px] font-black uppercase text-emerald-500 truncate">
                ● Active Filter
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => { setStatusFilter('terlambat'); setCurrentPage(1) }}
            className={`p-3.5 sm:p-5 rounded-2xl border text-left transition-all relative overflow-hidden ${
              isDarkMode ? 'bg-slate-900/80' : 'bg-white shadow-xs'
            } ${
              statusFilter === 'terlambat'
                ? 'border-rose-500 ring-2 ring-rose-500/30'
                : isDarkMode ? 'border-slate-800' : 'border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <div>
                <span className="block text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-rose-500">
                  Terlambat
                </span>
                <span className="text-2xl sm:text-3xl font-black text-rose-500 mt-0.5 sm:mt-1 block">
                  {stats.overdue}
                </span>
              </div>
              <div className="p-2 sm:p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl sm:rounded-2xl shrink-0">
                <AlertTriangle className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
            </div>
            {statusFilter === 'terlambat' && (
              <span className="block mt-2 text-[8px] sm:text-[9px] font-black uppercase text-rose-500 truncate">
                ● Active Filter
              </span>
            )}
          </button>

        </div>

        {/* DONUT CHART MULTI-WARNA (ORANYE, HIJAU, MERAH) */}
        <div className="p-4 sm:p-5 bg-white text-slate-900 rounded-2xl shadow-md flex flex-col justify-between border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900">Persentase Status</h3>
              <p className="text-[10px] font-bold text-slate-500">Distribusi real-time</p>
            </div>
          </div>

          <div className="my-2 sm:my-4 flex items-center justify-center relative">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                {/* Track Latar Belakang */}
                <path
                  className="text-slate-100"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />

                {/* Segmen 1: PROSES (Oranye/Amber) */}
                <path
                  className="text-amber-500 transition-all duration-500"
                  strokeWidth="4"
                  strokeDasharray={`${stats.pctProgress} 100`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />

                {/* Segmen 2: SELESAI (Hijau/Emerald) */}
                <path
                  className="text-emerald-500 transition-all duration-500"
                  strokeWidth="4"
                  strokeDasharray={`${stats.pctCompleted} 100`}
                  strokeDashoffset={`-${stats.pctProgress}`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />

                {/* Segmen 3: TERLAMBAT (Merah/Rose) */}
                <path
                  className="text-rose-500 transition-all duration-500"
                  strokeWidth="4"
                  strokeDasharray={`${stats.pctOverdue} 100`}
                  strokeDashoffset={`-${stats.pctProgress + stats.pctCompleted}`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>

              <div className="absolute text-center">
                <span className="block text-base sm:text-xl font-black text-slate-900">{stats.total}</span>
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                  DOKUMEN
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1 text-center border-t border-slate-100 pt-2.5">
            <div>
              <span className="block text-[9px] sm:text-[10px] font-black text-amber-500">● PROSES</span>
              <span className="text-xs font-black text-slate-800">{stats.pctProgress}%</span>
            </div>
            <div>
              <span className="block text-[9px] sm:text-[10px] font-black text-emerald-600">● SELESAI</span>
              <span className="text-xs font-black text-slate-800">{stats.pctCompleted}%</span>
            </div>
            <div>
              <span className="block text-[9px] sm:text-[10px] font-black text-rose-500">● TERLAMBAT</span>
              <span className="text-xs font-black text-slate-800">{stats.pctOverdue}%</span>
            </div>
          </div>
        </div>

      </div>

      {/* ================= TOOLBAR AKSI ================= */}
      <div className={`p-3 sm:p-4 border rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 ${
        isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-300 shadow-xs'
      }`}>
        
        <div className="flex items-center justify-between w-full md:w-auto gap-2">
          <h2 className={`text-sm sm:text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Daftar Sirkulasi Dokumen
          </h2>

          {statusFilter !== 'all' && (
            <button
              onClick={() => setStatusFilter('all')}
              className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-lg text-[10px] sm:text-xs font-bold hover:bg-amber-500/20 transition-colors"
            >
              <FilterX className="w-3 h-3" />
              <span>{statusFilter.toUpperCase()}</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* INPUT SEARCH & ACTION BUTTONS BAR */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`} />
            <input
              type="text"
              placeholder="Cari No BA, Judul, Deskripsi..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
              className={`w-full pl-8 pr-3 py-1.5 sm:py-2 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0e7a46] ${
                isDarkMode 
                  ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
              }`}
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
            {profile?.role === 'admin' && (
              <button
                onClick={() => setIsLogModalOpen(true)}
                className={`flex items-center gap-1 px-2.5 py-1.5 border rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                  isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                <History className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden xs:inline">Log History</span>
              </button>
            )}

            {/* TOMBOL EXPORT DIBUKA UNTUK SEMUA ROLE */}
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-600 rounded-xl text-xs font-bold transition-colors shrink-0 whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            {/* TOMBOL HAPUS MASSAL 1 BULAN (KHUSUS ADMIN) */}
            {profile?.role === 'admin' && (
              <button
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-900/80 hover:bg-rose-800 text-rose-100 border border-rose-700 rounded-xl text-xs font-bold transition-colors shrink-0 whitespace-nowrap"
                title="Hapus Seluruh Data Dokumen 1 Bulan"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                <span className="hidden xs:inline">Hapus 1 Bulan</span>
              </button>
            )}

            {profile?.role === 'admin' && (
              <button
                onClick={() => setIsMasterModalOpen(true)}
                className={`flex items-center gap-1 px-2.5 py-1.5 border rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                  isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden xs:inline">Master</span>
              </button>
            )}

            {profile?.role === 'admin' && (
              <button
                onClick={() => setIsUserModalOpen(true)}
                className={`flex items-center gap-1 px-2.5 py-1.5 border rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                  isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">User</span>
              </button>
            )}

            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#0e7a46] hover:bg-[#095530] text-white rounded-xl text-xs font-bold shadow-md transition-colors shrink-0 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Input</span>
            </button>
          </div>
        </div>

      </div>

      {/* ================= TABEL SIRKULASI DOKUMEN (URUTAN BARU & TANPA DESKRIPSI BA) ================= */}
      <div className={`border rounded-2xl overflow-hidden shadow-xl ${
        isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-300'
      }`}>
        <div className="overflow-x-auto max-w-full touch-pan-x">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className={`border-b text-[10px] font-black uppercase tracking-wider ${
                isDarkMode 
                  ? 'border-slate-800 bg-slate-950/60 text-slate-400' 
                  : 'border-slate-200 bg-slate-100 text-slate-600'
              }`}>
                <th className="py-3 px-3 text-center">Aksi</th>
                <th className="py-3 px-3">No Urut</th>
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3">No BA</th>
                <th className="py-3 px-3">Jenis BA</th>
                <th className="py-3 px-3">Judul BA</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3">Posisi Dokumen</th>
                <th className="py-3 px-3">Status SLA</th>
                <th className="py-3 px-3">Keterangan</th>
                <th className="py-3 px-3">Diupdate Oleh</th>
              </tr>
            </thead>
            <tbody className={`divide-y text-xs font-bold ${
              isDarkMode ? 'divide-slate-800/60' : 'divide-slate-200'
            }`}>
              {paginatedDocs.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500 font-bold">
                    Tidak ada data dokumen ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedDocs.map((doc) => {
                  const isTeknisi = (doc.category || 'teknisi') === 'teknisi'

                  return (
                    <tr key={doc.id} className={`transition-colors ${
                      isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                    }`}>
                      {/* 1. AKSI */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(doc)}
                            title="Edit Dokumen"
                            className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          
                          {profile?.role === 'admin' && (
                            <button
                              onClick={() => handleDeleteDoc(doc.id, doc.ba_number)}
                              disabled={deletingId === doc.id}
                              title="Hapus Dokumen"
                              className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {deletingId === doc.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 2. NO URUT */}
                      <td className={`py-2.5 px-3 font-extrabold whitespace-nowrap ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        #{doc.doc_number}
                      </td>

                      {/* 3. TANGGAL */}
                      <td className={`py-2.5 px-3 whitespace-nowrap ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {doc.creation_date}
                      </td>

                      {/* 4. NO BA */}
                      <td className="py-2.5 px-3 text-emerald-500 font-extrabold whitespace-nowrap">
                        {doc.ba_number}
                      </td>

                      {/* 5. JENIS BA (URUTAN BARU SEBELUM JUDUL BA) */}
                      <td className={`py-2.5 px-3 whitespace-nowrap ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                        {doc.master_ba_types?.name || '-'}
                      </td>

                      {/* 6. JUDUL BA */}
                      <td 
                        title={doc.title || '-'} 
                        className={`py-2.5 px-3 max-w-[160px] truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}
                      >
                        {doc.title || '-'}
                      </td>

                      {/* 7. KATEGORI */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          isTeknisi 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                        }`}>
                          {isTeknisi ? <Wrench className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                          <span>{isTeknisi ? 'Teknisi' : 'Dispatch'}</span>
                        </span>
                      </td>

                      {/* 8. POSISI DOKUMEN */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 border rounded-lg text-[11px] font-bold ${
                          isDarkMode 
                            ? 'bg-slate-800 border-slate-700 text-blue-300' 
                            : 'bg-slate-100 border-slate-300 text-blue-700'
                        }`}>
                          {doc.master_positions?.name || '-'}
                        </span>
                      </td>

                      {/* 9. STATUS SLA */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {doc.status === 'proses' && (
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-full text-[10px] uppercase font-black">
                            proses
                          </span>
                        )}
                        {doc.status === 'selesai' && (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-full text-[10px] uppercase font-black">
                            selesai
                          </span>
                        )}
                        {doc.status === 'terlambat' && (
                          <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/30 rounded-full text-[10px] uppercase font-black">
                            terlambat
                          </span>
                        )}
                      </td>

                      {/* 10. KETERANGAN */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {doc.notes ? (
                          <button
                            onClick={() => setSelectedNotes(doc.notes)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded-lg text-[10px] font-bold transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Lihat</span>
                          </button>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* 11. DIUPDATE OLEH */}
                      <td className={`py-2.5 px-3 whitespace-nowrap ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {doc.updater?.full_name || 'Admin'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER PAGINATION */}
        <div className={`px-3 sm:px-4 py-2.5 border-t flex flex-col xs:flex-row items-center justify-between gap-2 text-xs ${
          isDarkMode 
            ? 'border-slate-800 bg-slate-950/40 text-slate-400' 
            : 'border-slate-200 bg-slate-50 text-slate-600'
        }`}>
          <span className="text-[11px]">
            Tampil <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>
              {searchedDocs.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
            </strong>-
            <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>
              {Math.min(currentPage * ITEMS_PER_PAGE, searchedDocs.length)}
            </strong> dari{' '}
            <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>
              {searchedDocs.length}
            </strong>
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`p-1.5 rounded-xl border disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 ${
                isDarkMode 
                  ? 'border-slate-800 bg-slate-900 text-white' 
                  : 'border-slate-300 bg-white text-slate-800'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className={`px-2.5 py-1 font-extrabold text-xs rounded-lg ${
              isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-900'
            }`}>
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className={`p-1.5 rounded-xl border disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 ${
                isDarkMode 
                  ? 'border-slate-800 bg-slate-900 text-white' 
                  : 'border-slate-300 bg-white text-slate-800'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= MODAL DETAIL KETERANGAN ================= */}
      {selectedNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setSelectedNotes(null)} />
          <div className={`relative z-10 w-full max-w-md border rounded-2xl p-4 sm:p-5 shadow-2xl ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-800 mb-3">
              <h3 className="text-xs sm:text-sm font-bold">Catatan / Keterangan Dokumen</h3>
              <button onClick={() => setSelectedNotes(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className={`text-xs font-semibold leading-relaxed whitespace-pre-wrap p-3 rounded-xl border ${
              isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              {selectedNotes}
            </p>
          </div>
        </div>
      )}

      {/* ================= MODAL HAPUS MASSAL PER BULAN ================= */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setIsBulkDeleteModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-slate-900 border border-rose-900/60 rounded-2xl p-5 text-white shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertOctagon className="w-5 h-5" />
                <h3 className="text-sm font-bold">Hapus Massal Dokumen Per Bulan</h3>
              </div>
              <button onClick={() => setIsBulkDeleteModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Pilih periode bulan & tahun. Seluruh data sirkulasi dokumen pada bulan tersebut akan **dihapus secara permanen**.
              </p>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                  Pilih Bulan & Tahun
                </label>
                <input
                  type="month"
                  value={bulkDeleteMonth}
                  onChange={(e) => setBulkDeleteMonth(e.target.value)}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-rose-600 [color-scheme:dark] cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                disabled={isBulkDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-extrabold shadow-md disabled:opacity-50"
              >
                {isBulkDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Proses Hapus Massal</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODALS LAINNYA ================= */}
      <DocumentModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        baTypes={baTypes}
        baTitles={baTitles}
        positions={positions}
        editingDoc={editingDoc}
      />

      <MasterModal
        isOpen={isMasterModalOpen}
        onClose={() => setIsMasterModalOpen(false)}
        baTypes={baTypes}
        baTitles={baTitles}
        positions={positions}
      />

      <UserManagementModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        profiles={profiles}
        currentUserId={user?.id}
      />

      <ActivityLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
      />

      <ExportExcelModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        documents={initialDocuments}
        baTypes={baTypes}
        baTitles={baTitles}
      />

    </div>
  )
}