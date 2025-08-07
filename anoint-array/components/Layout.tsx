'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuroraBackground from './AuroraBackground'
import AIChatbot from './AIChatbot'
import { 
  Home, 
  Users, 
  Settings, 
  BarChart3, 
  Shield, 
  LogOut, 
  Menu, 
  X,
  Zap,
  Crown,
  MessageCircle,
  Package,
  ShoppingCart,
  Database
} from 'lucide-react'
import { useState } from 'react'
import BottomNavigation from './mobile/BottomNavigation'

interface LayoutProps {
  children: React.ReactNode
  userRole?: 'admin' | 'member'
}

export default function Layout({ children, userRole }: LayoutProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const adminNavItems = [
    { name: 'Dashboard', icon: Home, path: '/admin/dashboard' },
    { name: 'User Management', icon: Users, path: '/admin/users' },
    { name: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
    { name: 'Product Management', icon: Package, path: '/admin/products' },
    { name: 'Order Management', icon: ShoppingCart, path: '/admin/orders' },
    { name: 'Generator Settings', icon: Zap, path: '/admin/generator-settings' },
    { name: 'AI Systems', icon: Shield, path: '/admin/ai-systems' },
    { name: 'Backup', icon: Database, path: '/admin/backup' },
    { name: 'Settings', icon: Settings, path: '/admin/settings' },
  ]

  const memberNavItems = [
    { name: 'Dashboard', icon: Home, path: '/member/dashboard' },
    { name: 'Array Generator', icon: Zap, path: '/member/generator' },
    { name: 'Merchandise Creation', icon: Package, path: '/member/merchandise' },
    { name: 'My Creations', icon: Crown, path: '/member/creations' },
    { name: 'Support', icon: MessageCircle, path: '/member/support' },
    { name: 'Settings', icon: Settings, path: '/member/settings' },
  ]

  const navItems = (userRole || user?.role) === 'admin' ? adminNavItems : memberNavItems

  return (
    <div className="min-h-screen bg-gray-900 relative">
      <AuroraBackground variant="subtle" />
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800/90 backdrop-blur-lg border-r border-purple-500/20 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700">
          <Link href="/" className="text-xl font-bold text-white hover:text-purple-300 transition-colors">
            ANOINT Array
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.name}>
                  <button
                    onClick={() => {
                      router.push(item.path)
                      setSidebarOpen(false)
                    }}
                    className="w-full flex items-center px-4 py-3 text-gray-300 rounded-lg hover:bg-purple-600/20 hover:text-purple-300 transition-colors group"
                  >
                    <Icon size={20} className="mr-3 group-hover:text-purple-400" />
                    {item.name}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User info and logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <div className="mb-4">
            <p className="text-sm text-gray-400">Logged in as:</p>
            <p className="text-white font-medium">{user?.displayName}</p>
            <p className="text-xs text-purple-300 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-gray-300 rounded-lg hover:bg-red-600/20 hover:text-red-300 transition-colors"
          >
            <LogOut size={18} className="mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="bg-gray-800/80 backdrop-blur-lg border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-400">Welcome back,</p>
                <p className="text-white font-medium">{user?.displayName}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                {user?.displayName?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="relative z-10">
          {children}
        </main>
      </div>

      {/* AI Chatbot - Available on every page */}
      <AIChatbot />
      
      {/* Mobile Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}