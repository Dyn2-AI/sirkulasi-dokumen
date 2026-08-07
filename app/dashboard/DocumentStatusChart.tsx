'use client'

interface DocumentStatusChartProps {
  inProgress: number
  completed: number
  delayed: number
}

export default function DocumentStatusChart({
  inProgress,
  completed,
  delayed
}: DocumentStatusChartProps) {
  const total = inProgress + completed + delayed

  const inProgressPct = total > 0 ? Math.round((inProgress / total) * 100) : 0
  const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0
  const delayedPct = total > 0 ? Math.round((delayed / total) * 100) : 0

  // Perhitungan Keliling Lingkaran SVG (Radius = 40, Keliling = 2 * PI * 40 ≈ 251.2)
  const radius = 40
  const circumference = 2 * Math.PI * radius

  // Porsi Dashes
  const p1 = (inProgress / (total || 1)) * circumference
  const p2 = (completed / (total || 1)) * circumference
  const p3 = (delayed / (total || 1)) * circumference

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-full min-h-[340px]">
      
      {/* JUDUL */}
      <div>
        <h3 className="text-sm font-bold text-gray-800">Persentase Status Dokumen</h3>
        <p className="text-xs text-gray-500 mt-0.5">Distribusi real-time sirkulasi dokumen</p>
      </div>

      {/* LINGKARAN DONUT CHART SVG */}
      <div className="relative h-44 w-full flex items-center justify-center my-2">
        {total === 0 ? (
          <div className="w-32 h-32 rounded-full border-8 border-gray-100 flex items-center justify-center text-xs text-gray-400 font-medium">
            Belum ada data
          </div>
        ) : (
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Segmen 1: Dalam Proses (Kuning/Oranye) */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#f59e0b"
                strokeWidth="12"
                strokeDasharray={`${p1} ${circumference - p1}`}
                strokeDashoffset="0"
                className="transition-all duration-500"
              />

              {/* Segmen 2: Selesai (Hijau) */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#10b981"
                strokeWidth="12"
                strokeDasharray={`${p2} ${circumference - p2}`}
                strokeDashoffset={`-${p1}`}
                className="transition-all duration-500"
              />

              {/* Segmen 3: Terlambat (Merah) */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#ef4444"
                strokeWidth="12"
                strokeDasharray={`${p3} ${circumference - p3}`}
                strokeDashoffset={`-${p1 + p2}`}
                className="transition-all duration-500"
              />
            </svg>

            {/* TOTAL DI TENGAH LINGKARAN */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-gray-800 leading-none">{total}</span>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">Dokumen</span>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER STATS PERSENTASE */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 text-center">
        <div>
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Proses</p>
          </div>
          <p className="text-xs font-extrabold text-amber-500 mt-0.5">{inProgressPct}%</p>
        </div>

        <div>
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Selesai</p>
          </div>
          <p className="text-xs font-extrabold text-emerald-600 mt-0.5">{completedPct}%</p>
        </div>

        <div>
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Terlambat</p>
          </div>
          <p className="text-xs font-extrabold text-red-500 mt-0.5">{delayedPct}%</p>
        </div>
      </div>

    </div>
  )
}