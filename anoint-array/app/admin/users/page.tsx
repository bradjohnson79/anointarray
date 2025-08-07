'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import { 
  Users as UsersIcon, 
  Search, 
  UserPlus,
  Mail,
  Shield,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react'
import { useState } from 'react'

interface User {
  id: string
  email: string
  displayName: string
  role: 'admin' | 'member'
  status: 'active' | 'inactive' | 'suspended'
  joinDate: string
  lastLogin: string
  arraysGenerated: number
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // Mock users data
  const users: User[] = [
    {
      id: 'admin-001',
      email: 'info@anoint.me',
      displayName: 'Administrator',
      role: 'admin',
      status: 'active',
      joinDate: '2024-01-01',
      lastLogin: '2024-01-15 14:30',
      arraysGenerated: 0
    },
    {
      id: 'member-001',
      email: 'member@example.com',
      displayName: 'Example Member',
      role: 'member',
      status: 'active',
      joinDate: '2024-01-01',
      lastLogin: '2024-01-15 16:45',
      arraysGenerated: 47
    },
    {
      id: 'member-002',
      email: 'mystic@example.com',
      displayName: 'Mystic Creator',
      role: 'member',
      status: 'active',
      joinDate: '2024-01-05',
      lastLogin: '2024-01-14 12:15',
      arraysGenerated: 156
    },
    {
      id: 'member-003',
      email: 'newbie@example.com',
      displayName: 'Array Newbie',
      role: 'member',
      status: 'inactive',
      joinDate: '2024-01-10',
      lastLogin: '2024-01-12 09:30',
      arraysGenerated: 3
    }
  ]

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === 'all' || user.role === selectedRole
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield size={16} className="text-purple-400" />
      default:
        return <UsersIcon size={16} className="text-blue-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400'
      case 'inactive':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'suspended':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <Layout userRole="admin">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
              <p className="text-gray-400">Manage and monitor all platform users</p>
            </div>
            <button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <UserPlus size={20} />
              Add User
            </button>
          </div>

          {/* Filters */}
          <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg p-6 border border-gray-700/50 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              {/* Role Filter */}
              <div>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg border border-gray-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Arrays</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Login</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-700/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                            {user.displayName.charAt(0)}
                          </div>
                          <div>
                            <div className="text-white font-medium">{user.displayName}</div>
                            <div className="text-gray-400 text-sm flex items-center">
                              <Mail size={14} className="mr-1" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getRoleIcon(user.role)}
                          <span className="ml-2 text-white capitalize">{user.role}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-white">
                        {user.arraysGenerated}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                        {user.lastLogin}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button className="text-purple-400 hover:text-purple-300 transition-colors">
                            <Edit size={16} />
                          </button>
                          <button className="text-red-400 hover:text-red-300 transition-colors">
                            <Trash2 size={16} />
                          </button>
                          <button className="text-gray-400 hover:text-gray-300 transition-colors">
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg p-6 border border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-white">{users.length}</p>
                </div>
                <UsersIcon size={24} className="text-blue-400" />
              </div>
            </div>
            <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg p-6 border border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Users</p>
                  <p className="text-2xl font-bold text-white">{users.filter(u => u.status === 'active').length}</p>
                </div>
                <Shield size={24} className="text-green-400" />
              </div>
            </div>
            <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg p-6 border border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Members</p>
                  <p className="text-2xl font-bold text-white">{users.filter(u => u.role === 'member').length}</p>
                </div>
                <UsersIcon size={24} className="text-blue-400" />
              </div>
            </div>
            <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg p-6 border border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Arrays</p>
                  <p className="text-2xl font-bold text-white">{users.reduce((sum, u) => sum + u.arraysGenerated, 0)}</p>
                </div>
                <Shield size={24} className="text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}