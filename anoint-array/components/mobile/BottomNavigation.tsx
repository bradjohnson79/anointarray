'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Home, 
  Zap, 
  Package, 
  ShoppingCart, 
  User,
  Settings,
  BarChart3,
  Users,
  Crown,
  MessageCircle
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface NavItem {
  name: string
  icon: React.ComponentType<{ size?: number, className?: string }>
  path: string
  activeOn: string[]
  role?: 'admin' | 'member'
}

const navigationItems: NavItem[] = [
  {
    name: 'Home',
    icon: Home,
    path: '/',
    activeOn: ['/', '/products', '/about', '/contact'],
  },
  {
    name: 'Generator',
    icon: Zap,
    path: '/anoint-array',
    activeOn: ['/anoint-array', '/generator'],
  },
  {
    name: 'Products',
    icon: Package,
    path: '/products',
    activeOn: ['/products', '/vip-products'],
  },
  {
    name: 'Cart',
    icon: ShoppingCart,
    path: '/cart',
    activeOn: ['/cart', '/checkout'],
  },
  {
    name: 'Account',
    icon: User,
    path: '/login',
    activeOn: ['/login', '/member', '/admin'],
  },
]

const memberNavItems: NavItem[] = [
  {
    name: 'Dashboard',
    icon: Home,
    path: '/member/dashboard',
    activeOn: ['/member/dashboard'],
    role: 'member',
  },
  {
    name: 'Generator',
    icon: Zap,
    path: '/member/generator',
    activeOn: ['/member/generator'],
    role: 'member',
  },
  {
    name: 'Creations',
    icon: Crown,
    path: '/member/creations',
    activeOn: ['/member/creations'],
    role: 'member',
  },
  {
    name: 'Support',
    icon: MessageCircle,
    path: '/member/support',
    activeOn: ['/member/support'],
    role: 'member',
  },
  {
    name: 'Settings',
    icon: Settings,
    path: '/member/settings',
    activeOn: ['/member/settings', '/member/billing'],
    role: 'member',
  },
]

const adminNavItems: NavItem[] = [
  {
    name: 'Dashboard',
    icon: Home,
    path: '/admin/dashboard',
    activeOn: ['/admin/dashboard'],
    role: 'admin',
  },
  {
    name: 'Users',
    icon: Users,
    path: '/admin/users',
    activeOn: ['/admin/users'],
    role: 'admin',
  },
  {
    name: 'Analytics',
    icon: BarChart3,
    path: '/admin/analytics',
    activeOn: ['/admin/analytics'],
    role: 'admin',
  },
  {
    name: 'Orders',
    icon: ShoppingCart,
    path: '/admin/orders',
    activeOn: ['/admin/orders'],
    role: 'admin',
  },
  {
    name: 'Settings',
    icon: Settings,
    path: '/admin/settings',
    activeOn: ['/admin/settings', '/admin/backup', '/admin/ai-systems'],
    role: 'admin',
  },
]

export default function BottomNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuth()
  const [cartCount, setCartCount] = useState(0)

  // Get cart count from localStorage
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]')
        const totalItems = cart.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0)
        setCartCount(totalItems)
      } catch {
        setCartCount(0)
      }
    }

    updateCartCount()
    
    // Listen for storage changes
    window.addEventListener('storage', updateCartCount)
    
    // Listen for custom cart events
    window.addEventListener('cartUpdated', updateCartCount)

    return () => {
      window.removeEventListener('storage', updateCartCount)
      window.removeEventListener('cartUpdated', updateCartCount)
    }
  }, [])

  // Determine which navigation items to show
  const getNavItems = (): NavItem[] => {
    if (!isAuthenticated || !user) {
      return navigationItems
    }

    if (user.role === 'admin') {
      return adminNavItems
    }

    if (user.role === 'member') {
      return memberNavItems
    }

    return navigationItems
  }

  const navItems = getNavItems()

  const isActive = (item: NavItem): boolean => {
    return item.activeOn.some(path => {
      if (path === '/') {
        return pathname === '/'
      }
      return pathname.startsWith(path)
    })
  }

  const handleNavigation = (item: NavItem) => {
    // Add haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }

    // Navigate with loading state
    router.push(item.path)
  }

  return (
    <>
      {/* Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-lg border-t border-gray-700/50">
        <div className="safe-area-padding-bottom">
          <div className="flex items-center justify-around px-2 py-2">
            {navItems.map((item, index) => {
              const Icon = item.icon
              const active = isActive(item)
              
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item)}
                  className={`
                    relative flex flex-col items-center justify-center p-3 rounded-xl min-w-0 flex-1 max-w-[80px] transition-all duration-200 group
                    ${active 
                      ? 'text-purple-400 bg-purple-500/10' 
                      : 'text-gray-400 hover:text-gray-300 active:text-purple-300'
                    }
                  `}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    transform: active ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  {/* Icon with badge */}
                  <div className="relative mb-1">
                    <Icon 
                      size={22} 
                      className={`transition-colors duration-200 ${
                        active ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-300'
                      }`} 
                    />
                    
                    {/* Cart badge */}
                    {item.name === 'Cart' && cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold animate-pulse">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                    
                    {/* Active indicator */}
                    {active && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                    )}
                  </div>
                  
                  {/* Label */}
                  <span className={`
                    text-[10px] font-medium leading-tight truncate max-w-full transition-colors duration-200
                    ${active ? 'text-purple-400' : 'text-gray-500 group-hover:text-gray-400'}
                  `}>
                    {item.name}
                  </span>
                  
                  {/* Ripple effect */}
                  <div className={`
                    absolute inset-0 rounded-xl opacity-0 group-active:opacity-20 transition-opacity duration-150
                    ${active ? 'bg-purple-400' : 'bg-white'}
                  `} />
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Bottom padding for content when bottom nav is visible */}
      <div className="lg:hidden h-20 pointer-events-none" />
    </>
  )
}