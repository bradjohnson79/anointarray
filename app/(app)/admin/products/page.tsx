'use client'

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react'
import { createBrowserSupabase } from '@/lib/supabase-client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  CubeIcon,
  EyeIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import ProductsPreviewTab from './components/ProductsPreviewTab'
import ProductsTab from './components/ProductsTab'
import TaxesTab from './components/TaxesTab'

type TabType = 'preview' | 'products' | 'taxes'

interface TabConfig {
  id: TabType
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const TABS: TabConfig[] = [
  {
    id: 'preview',
    label: 'Products Preview',
    icon: EyeIcon,
    description: 'Customer view of published products'
  },
  {
    id: 'products',
    label: 'Products',
    icon: CubeIcon,
    description: 'Manage product inventory'
  },
  {
    id: 'taxes',
    label: 'Taxes',
    icon: CurrencyDollarIcon,
    description: 'Canadian tax rate management'
  }
]

function AdminProductsContent() {
  const supabase = createBrowserSupabase()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('products')

  useEffect(() => {
    checkAdminAccess()
  }, [])

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType
    if (tab && TABS.find(t => t.id === tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      router.push('/member/dashboard')
      return
    }

    setLoading(false)
  }

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tabId)
    window.history.replaceState({}, '', url.toString())
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
            <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
            <span>/</span>
            <span className="text-purple-400">Products & Taxes</span>
          </nav>
          <h1 className="text-3xl font-bold text-purple-400">Product & Tax Management</h1>
          <p className="text-gray-400 mt-1">Manage your products, taxes, and customer experience</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-700 mb-8">
          <div className="flex flex-wrap gap-2">
            {TABS.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-400 text-purple-400'
                      : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">{tab.label}</div>
                    <div className="text-xs opacity-75">{tab.description}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {activeTab === 'preview' && <ProductsPreviewTab />}
          {activeTab === 'products' && <ProductsTab />}
          {activeTab === 'taxes' && <TaxesTab />}
        </div>
      </div>
    </div>
  )
}

export default function AdminProducts() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4">Loading admin dashboard...</p>
        </div>
      </div>
    }>
      <AdminProductsContent />
    </Suspense>
  )
}