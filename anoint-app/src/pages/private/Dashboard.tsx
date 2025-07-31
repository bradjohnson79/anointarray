import { useState } from 'react'
import Layout from '../../components/layout/Layout'
import ProtectedRoute from '../../components/layout/ProtectedRoute'
import { useAuth } from '../../contexts/AuthContext'
import { Download, Eye, Grid3X3, FileText } from 'lucide-react'

// Mock data for generated arrays - replace with Supabase query
const mockArrays = [
  {
    id: '1',
    name: 'Healing Matrix Array',
    type: 'PDF',
    createdAt: '2025-01-15',
    description: 'Sacred geometry pattern for deep healing',
    downloadUrl: '#',
    previewUrl: '#'
  },
  {
    id: '2',
    name: 'Abundance Flow Array',
    type: 'PNG',
    createdAt: '2025-01-20',
    description: 'Manifestation array for prosperity',
    downloadUrl: '#',
    previewUrl: '#'
  }
]

const Dashboard = () => {
  const { user } = useAuth()
  const [arrays] = useState(mockArrays)

  const handleDownload = (arrayId: string) => {
    // Implement download from Supabase Storage
    console.log('Downloading array:', arrayId)
  }

  const handlePreview = (arrayId: string) => {
    // Implement preview functionality
    console.log('Previewing array:', arrayId)
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="min-h-screen bg-gray-900 text-white py-12 px-6 md:px-16 lg:px-32">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-12">
              <h1 className="text-4xl font-serif mb-4">Welcome back, {user?.email?.split('@')[0]}!</h1>
              <p className="text-gray-400">Manage your arrays and account settings</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* User Profile Card */}
              <div className="lg:col-span-1">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Grid3X3 size={24} className="text-purple-400" />
                    Profile Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400">Email</label>
                      <p className="text-white">{user?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Member Since</label>
                      <p className="text-white">{new Date(user?.created_at || '').toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Account Type</label>
                      <p className="text-purple-400 font-semibold">Premium Member</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors">
                      Edit Profile
                    </button>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-gray-800 rounded-lg p-6 mt-6">
                  <h3 className="text-lg font-bold mb-4">Your Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-cyan-400">{arrays.length}</p>
                      <p className="text-sm text-gray-400">Arrays Created</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-purple-400">∞</p>
                      <p className="text-sm text-gray-400">Possibilities</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Generated Arrays Section */}
              <div className="lg:col-span-2">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <FileText size={24} className="text-cyan-400" />
                    Your Generated Arrays
                  </h2>

                  {arrays.length === 0 ? (
                    <div className="text-center py-12">
                      <Grid3X3 size={48} className="mx-auto mb-4 text-gray-600" />
                      <p className="text-gray-400 mb-4">No arrays generated yet</p>
                      <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors">
                        Create Your First Array
                      </button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                      {arrays.map((array) => (
                        <div key={array.id} className="bg-gray-700 rounded-lg p-6 hover:bg-gray-600 transition-colors">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-bold text-white mb-1">{array.name}</h3>
                              <p className="text-sm text-gray-400">{array.description}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded ${
                              array.type === 'PDF' ? 'bg-red-900 text-red-300' : 'bg-blue-900 text-blue-300'
                            }`}>
                              {array.type}
                            </span>
                          </div>
                          
                          <p className="text-xs text-gray-500 mb-4">Created on {array.createdAt}</p>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handlePreview(array.id)}
                              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded flex items-center justify-center gap-2 transition-colors"
                            >
                              <Eye size={16} />
                              Preview
                            </button>
                            <button
                              onClick={() => handleDownload(array.id)}
                              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded flex items-center justify-center gap-2 transition-colors"
                            >
                              <Download size={16} />
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Array Generator CTA */}
                <div className="bg-gradient-to-br from-purple-900/50 to-cyan-900/50 rounded-lg p-8 mt-6 text-center">
                  <h3 className="text-2xl font-bold mb-4">Ready to Create More?</h3>
                  <p className="text-gray-300 mb-6">Generate custom healing arrays tailored to your specific needs</p>
                  <button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105">
                    Launch Array Generator
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

export default Dashboard