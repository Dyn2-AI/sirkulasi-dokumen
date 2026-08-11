'use client'

import { useState, useMemo, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { X, FileSpreadsheet, Download, Table, Printer, Filter, PenTool } from 'lucide-react'

interface ExportExcelModalProps {
  isOpen: boolean
  onClose: () => void
  documents: any[]
  baTypes?: any[]
  baTitles?: any[]
  profile?: any // Tambahan untuk mengambil data user login
}

export default function ExportExcelModal({
  isOpen,
  onClose,
  documents = [],
  baTypes = [],
  baTitles = [],
  profile,
}: ExportExcelModalProps) {
  // Filter States
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [selectedBaType, setSelectedBaType] = useState('all')
  const [selectedTitle, setSelectedTitle] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  // Print Setup States (Dinamis)
  const [signeeName, setSigneeName] = useState('')
  const [signeeRole, setSigneeRole] = useState('Pjs. Spv Dispatcher')
  const [smName, setSmName] = useState('Chairil Anwar')

  // Set default nama otomatis ke nama user yang login saat modal dibuka
  useEffect(() => {
    if (isOpen && profile?.full_name) {
      setSigneeName(profile.full_name)
    }
  }, [isOpen, profile])

 const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      // 1. Filter Bulan
      if (selectedMonth && doc.creation_date && !doc.creation_date.startsWith(selectedMonth)) return false

      // 2. Filter Jenis BA (Di-convert ke String keduanya agar kebal terhadap perbedaan tipe data Number/UUID)
      if (selectedBaType !== 'all' && String(doc.ba_type_id) !== String(selectedBaType)) return false

      // 3. Filter Judul BA (Gunakan trim & lowercase agar aman dari salah spasi & kapitalisasi)
      if (selectedTitle !== 'all') {
        const docTitle = (doc.title || '').trim().toLowerCase()
        const filterTitle = selectedTitle.trim().toLowerCase()
        if (docTitle !== filterTitle) return false
      }

      // 4. Filter Kategori
      if (selectedCategory !== 'all' && (doc.category || 'teknisi') !== selectedCategory) return false
      
      // 5. Filter Status SLA dinamis
      if (selectedStatus !== 'all' && doc.dynamic_status !== selectedStatus) return false
      
      return true
    })
  }, [documents, selectedMonth, selectedBaType, selectedTitle, selectedCategory, selectedStatus])
  if (!isOpen) return null

  const getMonthYearLabel = () => {
    if (!selectedMonth) return 'SEMUA PERIODE'
    const dateObj = new Date(`${selectedMonth}-01`)
    return dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase()
  }

  const getDynamicHeaderTitle = () => {
    const selectedTypeObj = baTypes.find((t) => t.id === selectedBaType)
    const typeLabel = selectedTypeObj ? selectedTypeObj.name.toUpperCase() : 'BERITA ACARA OPERASIONAL'
    const titleLabel = selectedTitle !== 'all' ? selectedTitle.toUpperCase() : 'BA ERROR UPLOADING'

    return `FORMULIR PENGECEKAN ${typeLabel} ( ${titleLabel} )`
  }

  // ================= 1. EXPORT FORM RESMI =================
  const handleExportFormResmi = () => {
    const monthYearStr = getMonthYearLabel()
    const headerTitle = getDynamicHeaderTitle()

    const excelData: any[][] = [
      [headerTitle],
      [monthYearStr],
      [],
      ['BA DATE', 'BA TYPE', 'BA TITLE', 'BA NUMBER', 'ODNER', 'DESCRIPTION', 'CEKLIST SPV', `PARAF ${signeeRole.toUpperCase()}`, 'PARAF SM'],
    ]

    filteredDocs.forEach((doc) => {
      excelData.push([
        doc.creation_date || '',
        doc.master_ba_types?.name || 'BA OPERASIONAL',
        doc.title || 'Berita Acara Operasional',
        doc.ba_number || '',
        '',
        doc.description || '', // <--- MENJADI SEPERTI INI
        '',
        '',
        '',
      ])
    })

    excelData.push(
      [],
      [],
      [`Surabaya, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`],
      [signeeRole, '', '', 'Site Manager'],
      [],
      [],
      [signeeName, '', '', smName],
      [],
      ['APE-OPS-F-37/2022']
    )

    const worksheet = XLSX.utils.aoa_to_sheet(excelData)
    worksheet['!cols'] = [{ wch: 14 }, { wch: 22 }, { wch: 30 }, { wch: 28 }, { wch: 10 }, { wch: 35 }, { wch: 14 }, { wch: 25 }, { wch: 15 }]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Form Pengecekan BA')
    XLSX.writeFile(workbook, `Formulir_Pengecekan_BA_${selectedMonth || 'Filter'}.xlsx`)
    onClose()
  }

  // ================= 2. EXPORT REKAP FULL TABEL =================
  const handleExportFullTable = () => {
    const monthYearStr = getMonthYearLabel()
    const excelData: any[][] = [
      [`REKAP SIRKULASI DOKUMEN - PERIODE ${monthYearStr}`],
      [],
      ['NO URUT', 'TANGGAL', 'NO BA', 'JUDUL BA', 'DESKRIPSI BA', 'KATEGORI', 'JENIS BA', 'POSISI DOKUMEN', 'STATUS SLA', 'KETERANGAN', 'DIUPDATE OLEH'],
    ]

    filteredDocs.forEach((doc) => {
      excelData.push([
        `#${doc.doc_number || ''}`,
        doc.creation_date || '',
        doc.ba_number || '',
        doc.title || '-',
        doc.description || '-',
        (doc.category || 'teknisi') === 'teknisi' ? 'Teknisi' : 'Dispatch',
        doc.master_ba_types?.name || '-',
        doc.master_positions?.name || '-',
        (doc.dynamic_status || '').toUpperCase(),
        doc.notes || '-',
        doc.updater?.full_name || 'Admin',
      ])
    })

    const worksheet = XLSX.utils.aoa_to_sheet(excelData)
    worksheet['!cols'] = [{ wch: 10 }, { wch: 14 }, { wch: 25 }, { wch: 25 }, { wch: 30 }, { wch: 12 }, { wch: 22 }, { wch: 20 }, { wch: 14 }, { wch: 30 }, { wch: 20 }]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Full Dashboard')
    XLSX.writeFile(workbook, `Rekap_Full_Tabel_BA_${selectedMonth || 'Filter'}.xlsx`)
    onClose()
  }

  // ================= 3. PRINT PREVIEW (PRINT FORM) =================
  const handlePrint = () => {
    const monthYearStr = getMonthYearLabel()
    const headerTitle = getDynamicHeaderTitle()

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

  const tableRows = filteredDocs
      .map(
        (doc) => `
      <tr>
        <td>${doc.creation_date || '-'}</td>
        <td>${doc.master_ba_types?.name || '-'}</td>
        <td>${doc.title || 'Berita Acara Operasional'}</td>
        <td>${doc.ba_number || '-'}</td>
        <td></td>
        <td>${doc.description || '-'}</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    `
      )
      .join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${headerTitle}</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            body { font-family: Arial, sans-serif; font-size: 10px; margin: 0; padding: 10px; }
            .title { text-align: center; font-weight: bold; font-size: 12px; margin-bottom: 2px; }
            .subtitle { text-align: center; font-weight: bold; font-size: 11px; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th, td { border: 1px solid #000; padding: 4px 6px; text-align: left; }
            th { text-align: center; font-weight: bold; background-color: #f2f2f2; }
            .footer-table { width: 40%; border: none; margin-top: 15px; }
            .footer-table td { border: none; padding: 2px; }
            .code { font-size: 9px; font-weight: bold; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="title">${headerTitle}</div>
          <div class="subtitle">${monthYearStr}</div>
          <table>
            <thead>
              <tr>
                <th style="width: 10%;">BA DATE</th>
                <th style="width: 15%;">BA TYPE</th>
                <th style="width: 20%;">BA TITLE</th>
                <th style="width: 18%;">BA NUMBER</th>
                <th style="width: 6%;">ODNER</th>
                <th style="width: 20%;">DESCRIPTION</th>
                <th style="width: 7%;">CEKLIST SPV</th>
                <th style="width: 10%;">PARAF ${signeeRole.toUpperCase()}</th>
                <th style="width: 8%;">PARAF SM</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="9" style="text-align:center;">Tidak ada data dipilih</td></tr>'}
            </tbody>
          </table>

          <table class="footer-table">
            <tr><td colspan="2">Surabaya, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
            <tr style="font-weight: bold;"><td>${signeeRole}</td><td>Site Manager</td></tr>
            <tr style="height: 40px;"><td></td><td></td></tr>
            <tr style="font-weight: bold; text-decoration: underline;"><td>${signeeName}</td><td>${smName}</td></tr>
          </table>
          <div class="code">APE-OPS-F-37/2022</div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4 sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold">Export & Print Sirkulasi Dokumen</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          
          {/* BAGIAN 1: FILTER DATA */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-3">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter Periode & Kriteria Data:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">Bulan & Tahun</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#0e7a46] [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">Jenis BA</label>
                <select
                  value={selectedBaType}
                  onChange={(e) => setSelectedBaType(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#0e7a46]"
                >
                  <option value="all">-- Semua Jenis BA --</option>
                  {baTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">Judul BA</label>
                <select
                  value={selectedTitle}
                  onChange={(e) => setSelectedTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#0e7a46]"
                >
                  <option value="all">-- Semua Judul BA --</option>
                  {baTitles.map((t) => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">Status SLA</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#0e7a46]"
                >
                  <option value="all">Semua Status</option>
                  <option value="proses">Dalam Proses</option>
                  <option value="selesai">Selesai</option>
                  <option value="terlambat">Terlambat</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800">
              <span className="text-slate-400 font-semibold">Total Data Terpilih:</span>
              <span className="font-extrabold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-800">
                {filteredDocs.length} Dokumen
              </span>
            </div>
          </div>

          {/* BAGIAN 2: PENGATURAN TANDA TANGAN (NEW) */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 mb-3">
              <PenTool className="w-3.5 h-3.5" />
              <span>Pengaturan Tanda Tangan Cetak:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* NAMA PENANDATANGAN */}
              <div className="sm:col-span-1">
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Nama Pembuat</label>
                <input
                  type="text"
                  placeholder="Ketik nama..."
                  value={signeeName}
                  onChange={(e) => setSigneeName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* JABATAN PENANDATANGAN */}
              <div className="sm:col-span-1">
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Jabatan Pembuat</label>
                <select
                  value={signeeRole}
                  onChange={(e) => setSigneeRole(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Spv Dispatcher">Spv Dispatcher</option>
                  <option value="Pjs. Spv Dispatcher">Pjs. Spv Dispatcher</option>
                  <option value="Spv Teknisi">Spv Teknisi</option>
                  <option value="Pjs. Spv Teknisi">Pjs. Spv Teknisi</option>
                </select>
              </div>

              {/* NAMA SITE MANAGER */}
              <div className="sm:col-span-1">
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Nama Site Manager</label>
                <input
                  type="text"
                  placeholder="Nama Manager"
                  value={smName}
                  onChange={(e) => setSmName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
            
            <p className="text-[10px] text-slate-500 mt-2 italic">
              *Detail di atas akan langsung tercetak di <strong>Print Form</strong> dan <strong>Export Form Resmi Excel</strong>.
            </p>
          </div>

        </div>

        {/* BAGIAN FOOTER / AKSI */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-4 border-t border-slate-800 mt-5 sticky bottom-0 bg-slate-900">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrint}
              disabled={filteredDocs.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-900/80 hover:bg-blue-800 disabled:opacity-40 text-blue-200 rounded-xl text-xs font-bold border border-blue-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Dokumen</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportFullTable}
              disabled={filteredDocs.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold border border-slate-700 transition-colors"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Rekap Full Tabel</span>
            </button>

            <button
              type="button"
              onClick={handleExportFormResmi}
              disabled={filteredDocs.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#0e7a46] hover:bg-[#095530] disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Form Resmi Excel</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}