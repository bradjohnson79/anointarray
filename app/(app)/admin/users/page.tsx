'use client'

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react'
import { createBrowserSupabase } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  UserIcon,
  StarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface User {
  id: string
  email: string
  created_at: string
  email_confirmed_at?: string
  last_sign_in_at?: string
  profiles?: UserProfile
}

interface UserProfile {
  id: string
  full_name?: string
  role: 'customer' | 'vip' | 'admin'
  phone?: string
  avatar_url?: string
  metadata?: unknown
  created_at: string
  updated_at: string
  last_login?: string
  login_count?: number
  is_active: boolean
  notes?: string
}

interface UserStats {
  total_users: number
  active_users: number
  new_users_today: number
  new_users_week: number
  admins: number
  vip_users: number
  customers: number
}

const USER_ROLES = [
  { value: 'customer', label: 'Customer', color: 'text-blue-400', bgColor: 'bg-blue-900/20' },
  { value: 'vip', label: 'VIP', color: 'text-purple-400', bgColor: 'bg-purple-900/20' },
  { value: 'admin', label: 'Admin', color: 'text-red-400', bgColor: 'bg-red-900/20' }
]

export default function AdminUsers() {
  const supabase = createBrowserSupabase()
  const router = useRouter()
  
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchQuery, roleFilter, statusFilter, dateFilter])

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      router.push('/member/dashboard')
      return
    }

    await Promise.all([
      fetchUsers(),
      fetchUserStats()
    ])
  }

  const fetchUsers = async () => {
    try {
      // Fetch users from auth.users via admin API or profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          auth_users:id(email, created_at, email_confirmed_at, last_sign_in_at)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      // Transform data to match our interface
      const usersWithAuth = data?.map(profile => ({
        id: profile.id,
        email: profile.auth_users?.email || 'N/A',
        created_at: profile.auth_users?.created_at || profile.created_at,
        email_confirmed_at: profile.auth_users?.email_confirmed_at,
        last_sign_in_at: profile.auth_users?.last_sign_in_at || profile.last_login,
        profiles: profile
      })) || []

      setUsers(usersWithAuth)
    } catch (error) {
      console.error('Error fetching users:', error)
      // Fallback: fetch only from profiles table
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)

        if (error) throw error

        const profilesAsUsers = data?.map(profile => ({
          id: profile.id,
          email: 'Email N/A', // Can't fetch email from auth.users
          created_at: profile.created_at,
          profiles: profile
        })) || []

        setUsers(profilesAsUsers)
      } catch (fallbackError) {
        console.error('Error fetching user profiles:', fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchUserStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-tools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          action: 'get_user_stats'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
      // Fallback: calculate stats from local data
      const total = users.length
      const active = users.filter(u => u.profiles?.is_active !== false).length
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      setStats({
        total_users: total,
        active_users: active,
        new_users_today: users.filter(u => new Date(u.created_at) >= today).length,
        new_users_week: users.filter(u => new Date(u.created_at) >= weekAgo).length,
        admins: users.filter(u => u.profiles?.role === 'admin').length,
        vip_users: users.filter(u => u.profiles?.role === 'vip').length,
        customers: users.filter(u => u.profiles?.role === 'customer').length
      })
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(query) ||
        user.profiles?.full_name?.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query)
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.profiles?.role === roleFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      switch (statusFilter) {
        case 'active':
          filtered = filtered.filter(user => user.profiles?.is_active !== false)
          break
        case 'inactive':
          filtered = filtered.filter(user => user.profiles?.is_active === false)
          break
        case 'confirmed':
          filtered = filtered.filter(user => user.email_confirmed_at)
          break
        case 'unconfirmed':
          filtered = filtered.filter(user => !user.email_confirmed_at)
          break
      }
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date()
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          break
      }
      
      if (dateFilter !== 'all') {
        filtered = filtered.filter(user => new Date(user.created_at) >= filterDate)
      }
    }

    setFilteredUsers(filtered)
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    setUpdating(userId)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      setUsers(users.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              profiles: user.profiles ? 
                { ...user.profiles, role: newRole as any, updated_at: new Date().toISOString() } : 
                undefined
            }
          : user
      ))

    } catch (error) {
      console.error('Error updating user role:', error)
      alert('Failed to update user role')
    } finally {
      setUpdating(null)
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setUpdating(userId)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      setUsers(users.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              profiles: user.profiles ? 
                { ...user.profiles, is_active: !currentStatus, updated_at: new Date().toISOString() } : 
                undefined
            }
          : user
      ))

    } catch (error) {
      console.error('Error updating user status:', error)
      alert('Failed to update user status')
    } finally {
      setUpdating(null)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone and will remove all associated data.')) {
      return
    }

    setUpdating(userId)
    try {
      // Call admin function to delete user (handles auth.users and profiles)
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-tools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          action: 'delete_user',
          user_id: userId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      setUsers(users.filter(user => user.id !== userId))
      alert('User deleted successfully')

    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    } finally {
      setUpdating(null)
    }
  }

  const getRoleConfig = (role: string) => {
    return USER_ROLES.find(r => r.value === role) || USER_ROLES[0]
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <ShieldCheckIcon className="h-4 w-4" />
      case 'vip':
        return <StarIcon className="h-4 w-4" />
      default:
        return <UserIcon className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
              <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
              <span>/</span>
              <span className="text-purple-400">Users</span>
            </nav>
            <h1 className="text-3xl font-bold text-purple-400">User Management</h1>
            <p className="text-gray-400 mt-1">{filteredUsers.length} users found</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <FunnelIcon className="h-5 w-5" />
              <span>Filters</span>
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{stats.total_users}</div>
              <div className="text-sm text-gray-400">Total Users</div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">{stats.active_users}</div>
              <div className="text-sm text-gray-400">Active</div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">{stats.new_users_today}</div>
              <div className="text-sm text-gray-400">New Today</div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-400">{stats.new_users_week}</div>
              <div className="text-sm text-gray-400">New Week</div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-400">{stats.admins}</div>
              <div className="text-sm text-gray-400">Admins</div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-400">{stats.vip_users}</div>
              <div className="text-sm text-gray-400">VIP Users</div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">{stats.customers}</div>
              <div className="text-sm text-gray-400">Customers</div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 space-y-6">            
            <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Search Users</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Email, name, ID..."
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="all">All Roles</option>
                  {USER_ROLES.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="confirmed">Email Confirmed</option>
                  <option value="unconfirmed">Email Unconfirmed</option>
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Registration</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="flex-1">
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Registered
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Last Active
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredUsers.map(user => {
                      const roleConfig = getRoleConfig(user.profiles?.role || 'customer')
                      const isActive = user.profiles?.is_active !== false
                      const isConfirmed = !!user.email_confirmed_at
                      
                      return (
                        <tr key={user.id} className="hover:bg-gray-750">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${roleConfig.bgColor}`}>
                                {getRoleIcon(user.profiles?.role || 'customer')}
                              </div>
                              <div>
                                <div className="font-medium text-white">
                                  {user.profiles?.full_name || 'Unknown Name'}
                                </div>
                                <div className="text-sm text-gray-400">{user.email}</div>
                                <div className="text-xs text-gray-500">{user.id.slice(0, 8)}...</div>
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={user.profiles?.role || 'customer'}
                              onChange={(e) => updateUserRole(user.id, e.target.value)}
                              disabled={updating === user.id}
                              className={`text-sm border border-gray-600 rounded-lg px-2 py-1 bg-gray-700 ${roleConfig.color} focus:outline-none focus:border-purple-500`}
                            >
                              {USER_ROLES.map(role => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => toggleUserStatus(user.id, isActive)}
                                disabled={updating === user.id}
                                className={`flex items-center space-x-1 text-sm px-2 py-1 rounded-lg ${
                                  isActive 
                                    ? 'text-green-400 bg-green-900/20' 
                                    : 'text-red-400 bg-red-900/20'
                                }`}
                              >
                                {isActive ? <CheckCircleIcon className="h-4 w-4" /> : <XCircleIcon className="h-4 w-4" />}
                                <span>{isActive ? 'Active' : 'Inactive'}</span>
                              </button>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {isConfirmed ? (
                                <span className="text-green-400">✓ Confirmed</span>
                              ) : (
                                <span className="text-yellow-400">⚠ Unconfirmed</span>
                              )}
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {user.last_sign_in_at 
                              ? new Date(user.last_sign_in_at).toLocaleDateString()
                              : 'Never'
                            }
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <Link
                                href={`/admin/users/${user.id}`}
                                className="text-purple-400 hover:text-purple-300 transition-colors"
                                title="Edit User"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </Link>
                              
                              <button
                                onClick={() => deleteUser(user.id)}
                                disabled={updating === user.id || user.profiles?.role === 'admin'}
                                className="text-red-400 hover:text-red-300 disabled:text-gray-600 transition-colors"
                                title={user.profiles?.role === 'admin' ? 'Cannot delete admin user' : 'Delete User'}
                              >
                                {updating === user.id ? (
                                  <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></div>
                                ) : (
                                  <TrashIcon className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <UserGroupIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No users found</p>
                  <p className="text-gray-500">Try adjusting your filters</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}