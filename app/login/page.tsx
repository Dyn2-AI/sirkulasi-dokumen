'use client'

import { useState } from 'react'
import { loginAction } from '@/app/actions/auth'

export default function LoginPage() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    const formData = new FormData(event.currentTarget)
    const res = await loginAction(formData)

    if (res?.error) {
      setErrorMsg(res.error)
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-700 min-h-screen flex items-center justify-center p-4 font-sans">
      <div className="relative w-full max-w-4xl min-h-[580px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* LEFT PANEL: Brand Overlay */}
        <div className="relative w-full md:w-1/2 bg-gradient-to-br from-[#0e7a46] to-[#095530] text-white flex flex-col justify-between p-8 md:p-12 z-20">
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-2 shadow-inner">
              <svg className="w-8 h-8 text-white fill-current" viewBox="0 0 24 24">
                <path d="M12 23c-4.97 0-9-4.03-9-9 0-3.92 2.51-7.24 6-8.5.55-.2.85-.77.7-1.33a.996.996 0 0 0-1.22-.72C4.13 4.8 1 8.54 1 14c0 6.08 4.92 11 11 11s11-4.92 11-11c0-6.07-4.14-11.23-9.88-12.63a1 1 0 0 0-1.21.78c-.14.56.17 1.13.72 1.32C18.49 4.76 21 8.08 21 14c0 4.97-4.03 9-9 9z"/>
              </svg>
            </div>
            <h1 className="text-xl font-semibold tracking-wide">blueflame</h1>
          </div>

          <div className="relative z-10 text-center my-8">
            <h2 className="text-3xl font-bold mb-3">Welcome Back!</h2>
            <p className="text-sm font-light text-emerald-100 max-w-xs mx-auto leading-relaxed">
              Sistem Sirkulasi Dokumen Internal
            </p>
          </div>

          <div className="relative z-10 text-center text-[10px] tracking-widest text-emerald-200/80 font-medium">
            CREATOR HERE &nbsp;|&nbsp; DIRECTOR HERE
          </div>
        </div>

        {/* RIGHT PANEL: Form Section */}
        <div className="relative w-full md:w-1/2 bg-white p-8 md:p-12 flex flex-col justify-center items-center">
          <div className="w-full max-w-sm flex flex-col items-center">
            <h2 className="text-3xl font-bold text-[#0e7a46] mb-1">welcome</h2>
            <p className="text-xs text-gray-500 mb-8">Login in to your account to continue</p>

            {errorMsg && (
              <div className="w-full p-3 mb-4 text-xs text-red-700 bg-red-100 rounded-lg text-center font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <div>
                <input 
                  type="email" 
                  name="email" 
                  required
                  placeholder="Email............" 
                  className="w-full px-6 py-3.5 rounded-full bg-[#d2eae0] text-gray-700 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e7a46]/50 transition shadow-inner"
                />
              </div>
              <div>
                <input 
                  type="password" 
                  name="password" 
                  required
                  placeholder="Password............" 
                  className="w-full px-6 py-3.5 rounded-full bg-[#d2eae0] text-gray-700 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e7a46]/50 transition shadow-inner"
                />
              </div>

              <div className="pt-4 flex justify-center">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-36 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'LOGGING IN...' : 'LOG IN'}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  )
}