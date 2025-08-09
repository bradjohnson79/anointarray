'use client'

// Clean member dashboard following CLAUDE_GLOBAL_RULES.md
// Uses new authentication system and clean UI patterns

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Zap, 
  Plus,
  Eye,
  Star,
  TrendingUp,
  Shield,
  AlertTriangle
} from 'lucide-react'
import { useAuth, useAuthStatus } from '../../../contexts/auth-context'

export default function MemberDashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const { isMember, isLoading } = useAuthStatus()

  // No redirect logic needed - AuthContext handles all redirects

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-cyan-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // AuthContext handles all redirects - no access denied UI needed
  if (!isMember) {
    return null // AuthContext will redirect to appropriate page
  }

  // Mock data for demonstration - will be replaced with real data
  const recentGenerations = [
    { name: 'Welcome Array', type: 'New Member', date: new Date().toISOString().split('T')[0], status: 'Complete', power: 5 },
    { name: 'Starter Manifestation', type: 'Prosperity', date: '2024-12-15', status: 'Active', power: 4 },
    { name: 'Protection Grid', type: 'Defense', date: '2024-12-14', status: 'Complete', power: 3 },
  ]
  
  const totalArrays = recentGenerations.length
  
  const renderStars = (count: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        size={12} 
        className={i < count ? 'text-yellow-400 fill-current' : 'text-gray-400'} 
      />
    ))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-cyan-900">
      {/* Header */}
      <div className="bg-gray-800/60 backdrop-blur-lg border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-white">ANOINT Array Member</h1>
              <p className="text-gray-400 text-sm">Welcome back, {user?.displayName}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.email}</p>
                <p className="text-xs text-purple-400">Member</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Message */}
          <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg p-6 border border-gray-700/50">
            <h2 className="text-xl font-semibold text-white mb-2">Your ANOINT Array Journey</h2>
            <p className="text-gray-400">Access powerful energy pattern generators and manage your mystical creations.</p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={() => router.push('/member/generator')}
              className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 rounded-lg p-6 text-left transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">Generate New Array</h3>
                  <p className="text-purple-100 text-sm">Create powerful energy patterns</p>
                </div>
                <Plus size={24} className="text-white group-hover:scale-110 transition-transform" />
              </div>
            </button>
            
            <button 
              onClick={() => router.push('/member/creations')}
              className="bg-gray-800/60 backdrop-blur-lg border border-gray-700/50 hover:border-purple-500/50 rounded-lg p-6 text-left transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">View Creations</h3>
                  <p className="text-gray-400 text-sm">Explore your array library</p>
                </div>
                <Eye size={24} className="text-purple-400 group-hover:scale-110 transition-transform" />
              </div>
            </button>
          </div>

          {/* Recent Generations - Now includes total count */}
          <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-white">Recent Generations</h2>
                <div className="bg-purple-600/20 px-3 py-1 rounded-full">
                  <span className="text-purple-400 font-semibold">{totalArrays} Total Arrays</span>
                </div>
              </div>
              <Zap size={20} className="text-purple-400" />
            </div>
              <div className="space-y-4">
                {recentGenerations.map((generation, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-700/50 last:border-b-0">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-white font-medium">{generation.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          generation.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {generation.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-purple-300">{generation.type}</span>
                        <div className="flex items-center space-x-1">
                          {renderStars(generation.power)}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{generation.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          {/* Generator Preview */}
          <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">ANOINT Array Generator</h2>
              <div className="text-right">
                <p className="text-sm text-gray-400">Status</p>
                <p className="text-green-400 font-semibold">Available Now</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-900/50 to-cyan-900/50 rounded-lg p-6 border border-purple-500/20">
              <div className="text-center">
                <Zap size={48} className="text-purple-400 mx-auto mb-4" />
                <h3 className="text-white text-xl font-semibold mb-2">Revolutionary Array Generator</h3>
                <p className="text-gray-300 mb-6">
                  Create personalized mystical seal arrays using AI-powered algorithms
                  based on your birth data and personal preferences.
                </p>
                <button 
                  onClick={() => router.push('/member/generator')}
                  className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 px-8 py-3 rounded-lg text-white font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Start Generating Arrays
                </button>
                <div className="flex items-center justify-center space-x-4 mt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-400">$17</p>
                    <p className="text-xs text-gray-400">Per Array</p>
                  </div>
                  <div className="w-px h-8 bg-gray-600"></div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-cyan-400">AI</p>
                    <p className="text-xs text-gray-400">Powered</p>
                  </div>
                  <div className="w-px h-8 bg-gray-600"></div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-400">24/7</p>
                    <p className="text-xs text-gray-400">Available</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}