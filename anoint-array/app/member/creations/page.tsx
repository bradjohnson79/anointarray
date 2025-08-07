'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Eye, 
  Download, 
  Calendar,
  Star,
  Zap
} from 'lucide-react'

export default function MemberCreations() {
  const creations = [
    { 
      id: 1, 
      name: 'Mystic Energy Array', 
      type: 'Healing', 
      template: 'Torus Field',
      date: '2024-01-15', 
      status: 'Complete', 
      power: '★★★★☆',
      purchased: true
    },
    { 
      id: 2,
      name: 'Abundance Manifestation', 
      type: 'Prosperity', 
      template: 'Flower of Life',
      date: '2024-01-14', 
      status: 'Complete', 
      power: '★★★★★',
      purchased: true
    },
    { 
      id: 3,
      name: 'Protection Grid', 
      type: 'Defense', 
      template: 'Sri Yantra',
      date: '2024-01-13', 
      status: 'Complete', 
      power: '★★★☆☆',
      purchased: false
    },
    { 
      id: 4,
      name: 'Love Frequency Array', 
      type: 'Relationship', 
      template: 'Torus Field',
      date: '2024-01-12', 
      status: 'Complete', 
      power: '★★★★☆',
      purchased: true
    }
  ]

  return (
    <ProtectedRoute requiredRole="member">
      <Layout userRole="member">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Your Creations</h1>
            <p className="text-gray-400">Your personal collection of ANOINT Arrays</p>
          </div>

          {/* Creations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creations.map((creation) => (
              <div key={creation.id} className="bg-gray-800/60 backdrop-blur-lg rounded-lg p-6 border border-gray-700/50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg mb-2">{creation.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-purple-600/80 text-white border-0">{creation.template}</Badge>
                      <Badge className="bg-cyan-600/80 text-white border-0">{creation.type}</Badge>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    creation.status === 'Complete' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {creation.status}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Power Level</span>
                    <span className="text-sm text-yellow-400">{creation.power}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar size={14} />
                    <span>{creation.date}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1 bg-gray-700/60 border-gray-600/50 text-white hover:bg-gray-600/70"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  {creation.purchased ? (
                    <Button 
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                    >
                      Purchase
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Stats Section */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg p-6 border border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Arrays</p>
                  <p className="text-2xl font-bold text-white mt-1">47</p>
                </div>
                <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600">
                  <Zap size={20} className="text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg p-6 border border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Purchased</p>
                  <p className="text-2xl font-bold text-white mt-1">34</p>
                </div>
                <div className="p-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600">
                  <Download size={20} className="text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg p-6 border border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Avg Power</p>
                  <p className="text-2xl font-bold text-white mt-1">4.2★</p>
                </div>
                <div className="p-3 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600">
                  <Star size={20} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}