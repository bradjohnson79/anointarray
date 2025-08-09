'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/auth-context'
import { useRouter } from 'next/navigation'
import { ChevronDown, User, Settings, LogOut, Shield, Crown } from 'lucide-react'

interface UserDropdownProps {
  className?: string
}

export default function UserDropdown({ className = '' }: UserDropdownProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDashboard = () => {
    if (user?.role === 'admin') {
      router.push('/admin/dashboard')
    } else {
      router.push('/member/dashboard')
    }
    setIsOpen(false)
  }

  const handleProfileSettings = () => {
    if (user?.role === 'admin') {
      router.push('/admin/settings')
    } else {
      router.push('/member/settings')
    }
    setIsOpen(false)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      // AuthContext will handle redirect after logout
      setIsOpen(false)
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  if (!user) return null

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-lg border border-gray-600/50 rounded-lg px-4 py-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* User Avatar */}
        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
        </div>

        {/* User Info */}
        <div className="hidden sm:block text-left">
          <div className="text-white font-medium text-sm">
            {user.displayName || user.email.split('@')[0]}
          </div>
          <div className="text-gray-400 text-xs">
            {user.email}
          </div>
        </div>

        {/* Role Badge & Chevron */}
        <div className="flex items-center space-x-2">
          {user.role === 'admin' && (
            <div className="flex items-center space-x-1 bg-purple-600/20 text-purple-300 px-2 py-1 rounded text-xs">
              <Shield size={12} />
              <span>Admin</span>
            </div>
          )}
          {user.role === 'member' && (
            <div className="flex items-center space-x-1 bg-cyan-600/20 text-cyan-300 px-2 py-1 rounded text-xs">
              <Crown size={12} />
              <span>Member</span>
            </div>
          )}
          <ChevronDown 
            size={16} 
            className={`text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800/95 backdrop-blur-lg border border-gray-600/50 rounded-lg shadow-xl z-50 py-2">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <div className="text-white font-medium">
                  {user.displayName || user.email.split('@')[0]}
                </div>
                <div className="text-gray-400 text-sm">
                  {user.email}
                </div>
                <div className="flex items-center space-x-1 mt-1">
                  {user.role === 'admin' ? (
                    <>
                      <Shield size={12} className="text-purple-400" />
                      <span className="text-purple-400 text-xs font-medium">Administrator</span>
                    </>
                  ) : (
                    <>
                      <Crown size={12} className="text-cyan-400" />
                      <span className="text-cyan-400 text-xs font-medium">Member</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={handleDashboard}
              className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors"
            >
              <User size={18} />
              <span>Dashboard</span>
            </button>

            <button
              onClick={handleProfileSettings}
              className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors"
            >
              <Settings size={18} />
              <span>Profile Settings</span>
            </button>

            <div className="border-t border-gray-700/50 mt-2 pt-2">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-red-600/20 hover:text-red-300 transition-colors"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}