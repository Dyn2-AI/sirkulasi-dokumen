'use client'

import { useState } from 'react'
import { X, UserPlus, Shield, Trash2, Plus, Users, Loader2 } from 'lucide-react'
import { createUserAction, deleteUserAction } from '@/app/actions/user'
import { useRouter } from 'next/navigation'

interface UserManagementModalProps {
  isOpen: boolean
  onClose: () => void
  profiles?: any[]
  currentUserId?: string
}

export default function UserManagementModal({
  isOpen,
  onClose,
  profiles = [],
  currentUserId
}: UserManagementModalProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)

  // Form State
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('user')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData()
    formData.append('fullName', fullName)
    formData.append('email', email)
    formData.append('password', password)
    formData.append('role', role)

    const res = await createUserAction(formData)
    setLoading(false)

    if (res?.error) {
      alert(`Gagal: ${res.error}`)
    } else {
      alert('User berhasil ditambahkan!')
      setFullName('')
      setEmail('')
      setPassword('')
      setRole('user')
      setShowForm(false)
      router.refresh()
    }
  }

  const handleDeleteUser = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus user "${name}"?`)) {
      const res = await deleteUserAction(id)
      if (res?.error) {
        alert(res.error)
      } else {
        router.refresh()
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* HEADER */}
        <div className="bg-slate-950 border-b border-slate-800 px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-extrabold text-white">Manajemen User System</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* BAR TOMBOL BUAT USER */}
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              {showForm ? 'Form Pengguna Baru' : `Daftar Pengguna (${profiles.length})`}
            </h3>

            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 text-xs font-black px-3 py-1.5 bg-[#0e7a46] hover:bg-[#095530] text-white rounded-xl transition-colors shadow-md"
            >
              {showForm ? (
                'Lihat Daftar User'
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah User Baru</span>
                </>
              )}
            </button>
          </div>

          {/* FORM TAMBAH USER */}
          {showForm ? (
            <form onSubmit={handleCreateUser} className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <label className="block text-[11px] font-black text-slate-300 uppercase tracking-wider mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0e7a46]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-300 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="user@perusahaan.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0e7a46]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-300 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0e7a46]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-300 uppercase tracking-wider mb-1">
                  Role Akses
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#0e7a46] cursor-pointer"
                >
                  <option value="user">User Biasa</option>
                  <option value="admin">Admin Utama</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-extrabold bg-[#0e7a46] hover:bg-[#095530] text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-md"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>{loading ? 'Menyimpan...' : 'Simpan User'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* LIST USER DAN TOMBOL HAPUS */
            <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              {profiles.length === 0 ? (
                <p className="p-6 text-xs text-slate-500 text-center font-bold">Belum ada pengguna terdaftar.</p>
              ) : (
                profiles.map((p) => {
                  const isSelf = p.id === currentUserId
                  return (
                    <div key={p.id} className="p-3.5 flex items-center justify-between hover:bg-slate-900/60 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700 flex items-center justify-center font-black text-sm shrink-0">
                          {p.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-extrabold text-white">{p.full_name || 'Tanpa Nama'}</p>
                            {isSelf && (
                              <span className="text-[9px] bg-blue-500/20 border border-blue-500/40 text-blue-400 px-1.5 py-0.2 rounded font-black uppercase">
                                Anda
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-semibold">{p.email || 'No email record'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase border ${
                          p.role === 'admin' 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {p.role || 'user'}
                        </span>

                        {!isSelf && (
                          <button
                            onClick={() => handleDeleteUser(p.id, p.full_name || 'User')}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 rounded-lg transition-colors"
                            title="Hapus User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-slate-400 text-xs font-bold hover:text-white transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  )
}