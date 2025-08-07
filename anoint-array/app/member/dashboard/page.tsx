'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import { 
  Zap, 
  Plus,
  Eye
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function MemberDashboard() {
  const router = useRouter()

  const recentGenerations = [
    { name: 'Mystic Energy Array', type: 'Healing', date: '2024-01-15', status: 'Complete', power: '★★★★☆' },
    { name: 'Abundance Manifestation', type: 'Prosperity', date: '2024-01-14', status: 'Active', power: '★★★★★' },
    { name: 'Protection Grid', type: 'Defense', date: '2024-01-13', status: 'Complete', power: '★★★☆☆' },
    { name: 'Love Frequency Array', type: 'Relationship', date: '2024-01-12', status: 'Complete', power: '★★★★☆' }
  ]
  
  const totalArrays = 47 // This would come from your database/state

  return (
    <ProtectedRoute requiredRole="member">
      <Layout userRole="member">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back, Brad</h1>
            <p className="text-gray-400">Your ANOINT Array journey continues...</p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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
                        <span className="text-sm text-yellow-400">{generation.power}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{generation.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          {/* Generator Preview */}
          <div className="mt-8 bg-gray-800/60 backdrop-blur-lg rounded-lg p-6 border border-gray-700/50">
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
      </Layout>
    </ProtectedRoute>
  )
}