'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { X, UploadCloud, Loader2, AlertCircle } from 'lucide-react'
import { bulkInsertDocumentsAction } from '@/app/actions/document'
import { useRouter } from 'next/navigation'

interface ImportExcelModalProps {
  isOpen: boolean
  onClose: () => void
  baTypes: any[]
  positions: any[]
  existingDocuments: any[] // <-- TAMBAHAN UNTUK CEK DATA DUPLIKAT
}

export default function ImportExcelModal({
  isOpen,
  onClose,
  baTypes = [],
  positions = [],
  existingDocuments = [],
}: ImportExcelModalProps) {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<'dispatch' | 'teknisi'>('dispatch')
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  // Helper: Konversi Tanggal Excel
  const parseExcelDate = (val: any) => {
    if (!val) return ''
    if (typeof val === 'number') {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000))
      return date.toISOString().split('T')[0]
    }
    return String(val).trim()
  }

  // Helper: Tentukan Status SLA dari Odner
  const parseOdnerStatus = (val: any) => {
    if (typeof val === 'boolean') return val ? 'selesai' : 'proses'
    const str = String(val).toUpperCase().trim()
    return (str === 'TRUE' || str === '1') ? 'selesai' : 'proses'
  }

  const findBaTypeId = (name: string) => {
    if (!name) return null
    const cleanName = String(name).toLowerCase().trim()
    const match = baTypes.find((t) => t.name.toLowerCase().trim() === cleanName)
    return match ? match.id : (baTypes[0]?.id || null)
  }

  const getBelumDiPrintId = () => {
    const match = positions.find((p) => p.name.toLowerCase().includes('belum di print'))
    return match ? match.id : (positions[0]?.id || null)
  }

  const handleProcessImport = async () => {
    if (!file) return alert('Silakan pilih file Excel terlebih dahulu!')
    setIsLoading(true)

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet)
        const defaultPositionId = getBelumDiPrintId()

        // BUAT DAFTAR NO BA YANG SUDAH ADA DI DATABASE (Mencegah Duplikat)
        const existingBaSet = new Set(
          existingDocuments.map(doc => String(doc.ba_number || '').trim().toLowerCase())
        )
        let duplicateCount = 0

        // Proses Mapping
        const formattedData = jsonData
          .map((row) => {
            const baNumber = String(row['BA/SPB Number'] || '').trim()
            if (!baNumber) return null // Lewati baris kosong

            // CEK APAKAH NO BA SUDAH ADA DI SISTEM
            if (existingBaSet.has(baNumber.toLowerCase())) {
              duplicateCount++
              return null // Lewati & jangan di-import
            }

            return {
              creation_date: parseExcelDate(row['BA/SPB Date']),
              ba_type_id: findBaTypeId(row['BA Type']),
              title: String(row['BA/SPB Title'] || '').trim(),
              description: String(row['Description'] || '').trim(),
              ba_number: baNumber,
              status: parseOdnerStatus(row['Odner']),
              position_id: defaultPositionId,
              notes: '',
              category: selectedCategory,
            }
          })
          .filter((doc) => doc !== null) // Hapus yang null (baris kosong & duplikat)

        if (formattedData.length === 0) {
          setIsLoading(false)
          return alert(`Gagal Import: Tidak ada data baru yang ditambahkan. Sebanyak ${duplicateCount} data duplikat terdeteksi dan diabaikan.`)
        }

        // Eksekusi Bulk Insert Backend
        const res = await bulkInsertDocumentsAction(formattedData)
        setIsLoading(false)

        if (res.error) {
          alert(`Gagal Import: ${res.error}`)
        } else {
          // TAMPILKAN NOTIFIKASI BERAPA YG BERHASIL DAN BERAPA YG DIABAIKAN
          alert(`Berhasil! ${res.count} dokumen BARU ditambahkan.\n\n${duplicateCount > 0 ? `(Info: ${duplicateCount} data duplikat diabaikan agar tidak ganda)` : ''}`)
          setFile(null)
          onClose()
          router.refresh()
        }
      }
      reader.readAsArrayBuffer(file)
    } catch (error) {
      setIsLoading(false)
      alert('Terjadi kesalahan saat memproses file Excel.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={() => !isLoading && onClose()} />
      <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-2xl space-y-5">
        
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold">Import Data Excel</h3>
          </div>
          <button onClick={() => !isLoading && onClose()} className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-3 bg-blue-950/40 border border-blue-900/50 rounded-xl flex gap-2 text-xs text-blue-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-blue-400" />
            <p className="leading-relaxed">
              Pastikan format Excel Anda memiliki header kolom persis seperti berikut: 
              <strong> BA/SPB Date, BA Type, BA/SPB Title, BA/SPB Number, Odner, Description</strong>.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
              Kategori Dokumen Import
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as 'dispatch' | 'teknisi')}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#0e7a46] cursor-pointer"
            >
              <option value="dispatch">📦 Dispatch</option>
              <option value="teknisi">🔧 Teknisi</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
              File Excel (.xlsx / .xls)
            </label>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-extrabold file:bg-[#0e7a46] file:text-white hover:file:bg-[#095530] file:cursor-pointer file:transition-colors bg-slate-950 border border-slate-700 rounded-xl p-1"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleProcessImport}
            disabled={isLoading || !file}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0e7a46] hover:bg-[#095530] text-white rounded-xl text-xs font-extrabold shadow-md transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
            <span>{isLoading ? 'Memproses Import...' : 'Mulai Import'}</span>
          </button>
        </div>

      </div>
    </div>
  )
}