import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Layout from '../../components/layout/Layout'
import ProtectedRoute from '../../components/layout/ProtectedRoute'
import { Search, UserPlus, Trash2, Edit, Mail, Users as UsersIcon, Crown } from 'lucide-react'

// Mock user data - replace with Supabase query
const mockUsers = [
  { id: '1', email: 'user1@example.com', created_at: '2025-01-10', role: 'user', status: 'active' },
  { id: '2', email: 'user2@example.com', created_at: '2025-01-15', role: 'user', status: 'active' },
  { id: '3', email: 'admin@example.com', created_at: '2025-01-01', role: 'admin', status: 'active' },
  { id: '4', email: 'user3@example.com', created_at: '2025-01-20', role: 'user', status: 'inactive' }
]

const Users = () => {
  const location = useLocation()
  const [users, setUsers] = useState(mockUsers)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'user' })

  const userTabs = [
    { name: 'System Users', path: '/admin/users', icon: UsersIcon },
    { name: 'VIP Subscribers', path: '/admin/vip-subscribers', icon: Crown }
  ]

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddUser = async () => {
    // Implement Supabase user creation
    console.log('Adding user:', newUser)
    setShowAddUser(false)
    setNewUser({ email: '', password: '', role: 'user' })
  }

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      // Implement Supabase user deletion
      setUsers(users.filter(u => u.id !== userId))
    }
  }

  const handleToggleStatus = async (userId: string) => {
    // Implement status toggle in Supabase
    setUsers(users.map(u => 
      u.id === userId 
        ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
        : u
    ))
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Mail size={16} className="text-gray-400 mr-2" />
                            <span>{user.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded ${
                            user.role === 'admin' 
                              ? 'bg-purple-900 text-purple-300' 
                              : 'bg-gray-700 text-gray-300'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleStatus(user.id)}
                            className={`px-3 py-1 text-xs rounded ${
                              user.status === 'active'
                                ? 'bg-green-900 text-green-300'
                                : 'bg-red-900 text-red-300'
                            }`}
                          >
                            {user.status}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {user.created_at}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button className="text-purple-400 hover:text-purple-300 transition-colors">
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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