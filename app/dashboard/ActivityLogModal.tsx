'use client'

import { useState, useEffect } from 'react'
import { getActivityLogsAction } from '@/app/actions/document'
import { 
  X, 
  History, 
  Loader2, 
  PlusCircle, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Search
} from 'lucide-react'

interface ActivityLogModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ActivityLogModal({ isOpen, onClose }: ActivityLogModalProps) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // State Search & Pagination
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 5

  useEffect(() => {
    if (isOpen) {
      fetchLogs()
      setSearchQuery('')
      setCurrentPage(1)
    }
  }, [isOpen])

  // Reset ke Halaman 1 setiap kali input pencarian berubah
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const fetchLogs = async () => {
    setLoading(true)
    setErrorMsg('')
    const res = await getActivityLogsAction()
    setLoading(false)

    if (res.error) {
      setErrorMsg(res.error)
    } else {
      setLogs(res.data || [])
    }
  }

  if (!isOpen) return null

  // 1. FILTER LOGS BERDASARKAN QUERY PENCARIAN
  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase()
    const userName = (log.user_name || '').toLowerCase()
    const details = (log.details || '').toLowerCase()
    const action = (log.action || '').toLowerCase()
    
    return userName.includes(q) || details.includes(q) || action.includes(q)
  })

  // 2. PAGINATE HASIL FILTER
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE) || 1
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-300 dark:border-slate-800 overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-slate-900 px-5 py-3.5 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold">Log History Aktivitas User</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-4 sm:p-5 space-y-3.5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 text-xs rounded-xl font-bold">
              {errorMsg}
            </div>
          )}

          {/* INPUT SEARCH LOG */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama user, No BA, atau deskripsi aktivitas..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e7a46] transition-all"
            />
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-[#0e7a46]" />
              <span className="text-xs font-semibold">Memuat riwayat aktivitas...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-bold">
              {searchQuery ? `Tidak ada log yang cocok dengan "${searchQuery}"` : 'Belum ada catatan aktivitas tercatat.'}
            </div>
          ) : (
            <div className="space-y-3.5">
              
              {/* DAFTAR LOG ITEM */}
              <div className="space-y-2.5 min-h-[280px]">
                {paginatedLogs.map((log) => {
                  const dateFormatted = new Date(log.created_at).toLocaleString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })

                  return (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl flex items-start gap-3"
                    >
                      {/* ICON PER AKSI */}
                      <div className="mt-0.5 shrink-0">
                        {log.action === 'CREATE' && (
                          <div className="p-1.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-lg">
                            <PlusCircle className="w-4 h-4" />
                          </div>
                        )}
                        {log.action === 'UPDATE' && (
                          <div className="p-1.5 bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded-lg">
                            <Edit className="w-4 h-4" />
                          </div>
                        )}
                        {log.action === 'DELETE' && (
                          <div className="p-1.5 bg-rose-500/15 text-rose-600 dark:text-rose-400 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      {/* DETAIL TEXT */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                            {log.user_name || 'System'}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {dateFormatted} WIB
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                          {log.details}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* FOOTER PAGINATION */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Halaman <strong className="text-slate-800 dark:text-slate-200">{currentPage}</strong> dari{' '}
                  <strong className="text-slate-800 dark:text-slate-200">{totalPages}</strong> (Total {filteredLogs.length} log)
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  )
}