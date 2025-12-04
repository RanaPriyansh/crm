import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Building2,
  Users,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  Plus,
  AlertTriangle
} from 'lucide-react'
import { PROVINCE_NAMES } from '@/lib/utils/phone'
import * as devStore from '@/lib/dev-store'

// Check dev mode inline - imported config may not work in server components
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const isDevMode = !supabaseUrl || supabaseUrl.includes('your-project') || !supabaseUrl.startsWith('https://')

async function getDashboardStats() {
  // Dev mode: use local store
  if (isDevMode) {
    return devStore.getStats()
  }

  // Production mode: use Supabase
  const supabase = await createClient()

  const { count: totalBusinesses } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)

  const { count: totalContacts } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: totalInteractions } = await supabase
    .from('interactions')
    .select('*', { count: 'exact', head: true })
    .gte('occurred_at', startOfMonth.toISOString())

  const { data: byProvinceData } = await supabase
    .from('businesses')
    .select('province')
    .is('deleted_at', null)

  const byProvince = (byProvinceData || []).reduce((acc, { province }) => {
    acc[province] = (acc[province] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const { data: recentBusinesses } = await supabase
    .from('businesses')
    .select('id, name, city, province, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    totalBusinesses: totalBusinesses || 0,
    totalContacts: totalContacts || 0,
    totalInteractions: totalInteractions || 0,
    byProvince,
    recentBusinesses: recentBusinesses || []
  }
}

export default async function Dashboard() {
  // In dev mode, skip auth check
  if (!isDevMode) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }
  }

  const stats = await getDashboardStats()

  // Format province data for display
  const provinceData = ['NS', 'NB', 'PE', 'NL'].map(p => ({
    province: p,
    name: PROVINCE_NAMES[p],
    count: stats.byProvince[p] || 0
  }))
  const totalByProvince = provinceData.reduce((a, b) => a + b.count, 0)

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Dev Mode Banner */}
      {isDevMode && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-yellow-500">Development Mode</p>
            <p className="text-sm text-[hsl(var(--muted))]">
              Supabase is not configured. Using local JSON storage. Data is saved to <code>.dev-data/</code>
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-[hsl(var(--muted))] mt-1">
            Atlantic Canada Business Directory Overview
          </p>
        </div>
        <Link href="/businesses/new" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Add Business
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[hsl(var(--muted))] text-sm">Total Businesses</p>
              <p className="text-3xl font-bold mt-1">{stats.totalBusinesses.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[hsl(var(--color-primary))]/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-[hsl(var(--color-primary))]" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[hsl(var(--muted))] text-sm">Total Contacts</p>
              <p className="text-3xl font-bold mt-1">{stats.totalContacts.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[hsl(var(--color-secondary))]/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-[hsl(var(--color-secondary))]" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[hsl(var(--muted))] text-sm">Interactions (This Month)</p>
              <p className="text-3xl font-bold mt-1">{stats.totalInteractions.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[hsl(var(--color-accent))]/10 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-[hsl(var(--color-accent))]" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[hsl(var(--muted))] text-sm">Growth Rate</p>
              <p className="text-3xl font-bold mt-1">+12%</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Province breakdown and Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Province */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Businesses by Province</h2>
          <div className="space-y-4">
            {provinceData.map(({ province, name, count }) => {
              const percentage = totalByProvince > 0 ? (count / totalByProvince) * 100 : 0
              const colors: Record<string, string> = {
                NS: 'bg-blue-500',
                NB: 'bg-green-500',
                PE: 'bg-yellow-500',
                NL: 'bg-purple-500'
              }
              return (
                <div key={province}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{name}</span>
                    <span className="text-[hsl(var(--muted))]">{count}</span>
                  </div>
                  <div className="h-2 bg-[hsl(var(--background-tertiary))] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors[province]} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recently Added */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recently Added</h2>
            <Link
              href="/businesses"
              className="text-sm text-[hsl(var(--color-primary))] hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {stats.recentBusinesses.length === 0 ? (
            <div className="text-center py-8 text-[hsl(var(--muted))]">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No businesses added yet</p>
              <Link href="/businesses/new" className="text-[hsl(var(--color-primary))] hover:underline">
                Add your first business
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentBusinesses.map((business) => (
                <Link
                  key={business.id}
                  href={`/businesses/${business.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[hsl(var(--background-tertiary))] transition-colors"
                >
                  <div>
                    <p className="font-medium">{business.name}</p>
                    <p className="text-sm text-[hsl(var(--muted))]">
                      {business.city && `${business.city}, `}{business.province}
                    </p>
                  </div>
                  <span className="text-xs text-[hsl(var(--muted))]">
                    {new Date(business.created_at).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/businesses/new"
            className="p-4 rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--color-primary))] hover:bg-[hsl(var(--background-tertiary))] transition-all text-center"
          >
            <Plus className="w-8 h-8 mx-auto mb-2 text-[hsl(var(--color-primary))]" />
            <p className="font-medium">Add Business</p>
          </Link>
          <Link
            href="/import"
            className="p-4 rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--color-secondary))] hover:bg-[hsl(var(--background-tertiary))] transition-all text-center"
          >
            <svg className="w-8 h-8 mx-auto mb-2 text-[hsl(var(--color-secondary))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="font-medium">Import CSV</p>
          </Link>
          <Link
            href="/businesses"
            className="p-4 rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--color-accent))] hover:bg-[hsl(var(--background-tertiary))] transition-all text-center"
          >
            <svg className="w-8 h-8 mx-auto mb-2 text-[hsl(var(--color-accent))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="font-medium">Search</p>
          </Link>
          <Link
            href="/businesses?export=true"
            className="p-4 rounded-lg border border-[hsl(var(--border))] hover:border-green-500 hover:bg-[hsl(var(--background-tertiary))] transition-all text-center"
          >
            <svg className="w-8 h-8 mx-auto mb-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <p className="font-medium">Export Data</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
