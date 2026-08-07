import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Cek User Login
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Profile User Login
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 3. Ambil Semua Profiles (User Management)
  const { data: profiles } = await supabase.from('profiles').select('*')

  // 4. Ambil Data Master (Termasuk Judul BA)
  const { data: baTypes } = await supabase.from('master_ba_types').select('*').order('name')
  const { data: baTitles } = await supabase.from('master_ba_titles').select('*').order('name')
  const { data: positions } = await supabase.from('master_positions').select('*').order('name')

  // 5. Ambil Data Dokumen + Relasi
  const { data: documents, error } = await supabase
    .from('documents')
    .select(`
      *,
      master_ba_types ( id, name ),
      master_positions ( id, name ),
      updater:updated_by ( id, full_name )
    `)
    .order('doc_number', { ascending: false })

  if (error) {
    console.error('❌ FETCH DOCUMENTS ERROR:', error.message)
  } else {
    console.log('📦 HASIL FETCH DOCUMENTS DARI SERVER:', documents?.length, 'data ditemukan')
  }

  return (
    <DashboardClient
      user={user}
      profile={profile}
      initialDocuments={documents || []} 
      baTypes={baTypes || []}
      baTitles={baTitles || []} // <-- DITAMBAHKAN PROP KESINI
      positions={positions || []}
      profiles={profiles || []}
    />
  )
}