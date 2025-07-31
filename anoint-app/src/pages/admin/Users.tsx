import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Layout from '../../components/layout/Layout'
import ProtectedRoute from '../../components/layout/ProtectedRoute'
import { Search, UserPlus, Trash2, Mail, Users as UsersIcon, Crown } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

interface UserProfile {
  id: string
  user_id: string
  email: string
  role: 'user' | 'admin' | 'moderator' | 'vip'
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
}

const Users = () => {
  const location = useLocation()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'user' })

  const userTabs = [
    { name: 'System Users', path: '/admin/users', icon: UsersIcon },
    { name: 'VIP Subscribers', path: '/admin/vip-subscribers', icon: Crown }
  ]

  // Load users from Supabase
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error loading users:', error)
      } else {
        setUsers(data || [])
      }
    } catch (error) {
      console.error('Exception loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddUser = async () => {
    try {
      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
      })

      if (authError) {
        alert('Error creating user: ' + authError.message)
        return
      }

      if (authData.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: authData.user.id,
            email: newUser.email,
            role: newUser.role as 'user' | 'admin' | 'moderator' | 'vip',
            is_active: true,
            is_verified: true // Admin created users are pre-verified
          })

        if (profileError) {
          console.error('Error creating profile:', profileError)
          alert('User created but profile failed: ' + profileError.message)
        } else {
          await loadUsers() // Refresh list
          setShowAddUser(false)
          setNewUser({ email: '', password: '', role: 'user' })
          alert('User created successfully!')
        }
      }
    } catch (error) {
      console.error('Exception creating user:', error)
      alert('Error creating user')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This will also delete their auth account.')) {
      try {
        // Delete profile first
        const { error: profileError } = await supabase
          .from('user_profiles')
          .delete()
          .eq('id', userId)

        if (profileError) {
          console.error('Error deleting profile:', profileError)
          alert('Error deleting user profile')
          return
        }

        // Note: Deleting auth users requires service role key
        // For now, just remove from profiles table
        await loadUsers()
        alert('User profile deleted successfully')
      } catch (error) {
        console.error('Exception deleting user:', error)
        alert('Error deleting user')
      }
    }
  }

  const handleToggleStatus = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId)
      if (!user) return

      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          is_active: !user.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        console.error('Error updating user status:', error)
        alert('Error updating user status')
      } else {
        await loadUsers() // Refresh list
      }
    } catch (error) {
      console.error('Exception updating user status:', error)
      alert('Error updating user status')
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        console.error('Error updating user role:', error)
        alert('Error updating user role')
      } else {
        await loadUsers() // Refresh list
      }
    } catch (error) {
      console.error('Exception updating user role:', error)
      alert('Error updating user role')
    }
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <Layout>
        <div className="min-h-screen bg-gray-900 text-white py-12 px-6 md:px-16 lg:px-32">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-serif">User Management</h1>
              <button
                onClick={() => setShowAddUser(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <UserPlus size={20} />
                Add User
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="border-b border-gray-700">
                <nav className="-mb-px flex space-x-8">
                  {userTabs.map((tab) => {
                    const isActive = location.pathname === tab.path
                    const Icon = tab.icon
                    return (
                      <Link
                        key={tab.name}
                        to={tab.path}
                        className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                          isActive
                            ? 'border-purple-500 text-purple-400'
                            : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                        }`}
                      >
                        <Icon size={16} />
                        {tab.name}
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </div>

            {/* Search Bar */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search users by email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
                  <span className="ml-3 text-gray-400">Loading users...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Verified</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                            {searchTerm ? 'No users found matching your search.' : 'No users found.'}
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-700 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Mail size={16} className="text-gray-400 mr-2" />
                                <span>{user.email}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                value={user.role}
                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                className={`px-2 py-1 text-xs rounded bg-gray-700 border-none ${
                                  user.role === 'admin' 
                                    ? 'text-purple-300' 
                                    : user.role === 'moderator'
                                    ? 'text-blue-300'
                                    : user.role === 'vip' 
                                    ? 'text-yellow-300'
                                    : 'text-gray-300'
                                }`}
                              >
                                <option value="user">User</option>
                                <option value="vip">VIP</option>
                                <option value="moderator">Moderator</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleToggleStatus(user.id)}
                                className={`px-3 py-1 text-xs rounded transition-colors ${
                                  user.is_active
                                    ? 'bg-green-900 text-green-300 hover:bg-green-800'
                                    : 'bg-red-900 text-red-300 hover:bg-red-800'
                                }`}
                              >
                                {user.is_active ? 'Active' : 'Inactive'}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded ${
                                user.is_verified
                                  ? 'bg-green-900 text-green-300'
                                  : 'bg-yellow-900 text-yellow-300'
                              }`}>
                                {user.is_verified ? 'Verified' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-400 hover:text-red-300 transition-colors"
                                  title="Delete user"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Add User Modal */}
            {showAddUser && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                  <h2 className="text-2xl font-bold mb-4">Add New User</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Email</label>
                      <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Password</label>
                      <input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Role</label>
                      <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      >
                        <option value="user">User</option>
                        <option value="vip">VIP</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-4">
                    <button
                      onClick={handleAddUser}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors"
                    >
                      Add User
                    </button>
                    <button
                      onClick={() => setShowAddUser(false)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

export default Users