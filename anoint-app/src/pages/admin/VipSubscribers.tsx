import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Layout from '../../components/layout/Layout'
import ProtectedRoute from '../../components/layout/ProtectedRoute'
import { Users, Download, Calendar, Mail, TrendingUp, Copy, Check, AlertCircle, Loader2, Crown, Users as UsersIcon } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

interface VipSubscriber {
  id: number
  name: string
  email: string
  created_at: string
  confirmed: boolean
  confirmed_at: string | null
  ip_address: string | null
  user_agent: string | null
  referrer: string | null
}

interface VipStats {
  total_signups: number
  confirmed_signups: number
  signups_last_7_days: number
  signups_last_30_days: number
  latest_signup: string | null
}

const VipSubscribers = () => {
  const location = useLocation()
  const [subscribers, setSubscribers] = useState<VipSubscriber[]>([])
  const [stats, setStats] = useState<VipStats>({
    total_signups: 0,
    confirmed_signups: 0,
    signups_last_7_days: 0,
    signups_last_30_days: 0,
    latest_signup: null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState<'created_at' | 'name' | 'email'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [copied, setCopied] = useState(false)

  const userTabs = [
    { name: 'System Users', path: '/admin/users', icon: UsersIcon },
    { name: 'VIP Subscribers', path: '/admin/vip-subscribers', icon: Crown }
  ]

  useEffect(() => {
    fetchVipData()
  }, [sortBy, sortOrder])

  const fetchVipData = async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch subscribers with sorting
      const { data: subscribersData, error: subscribersError } = await supabase
        .from('vip_waitlist')
        .select('*')
        .order(sortBy, { ascending: sortOrder === 'asc' })

      if (subscribersError) throw subscribersError

      // Fetch stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_vip_waitlist_stats')

      if (statsError) throw statsError

      setSubscribers(subscribersData || [])
      if (statsData && statsData.length > 0) {
        setStats(statsData[0])
      }

    } catch (err: any) {
      console.error('Error fetching VIP data:', err)
      setError(err.message || 'Failed to load VIP subscriber data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Date Subscribed', 'Confirmed', 'IP Address', 'User Agent']
    const csvContent = [
      headers.join(','),
      ...subscribers.map(sub => [
        `"${sub.name}"`,
        `"${sub.email}"`,
        `"${formatDate(sub.created_at)}"`,
        sub.confirmed ? 'Yes' : 'No',
        `"${sub.ip_address || ''}"`,
        `"${sub.user_agent?.substring(0, 50) || ''}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `vip-subscribers-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const copyEmailList = async () => {
    const emailList = subscribers.map(sub => sub.email).join('\n')
    try {
      await navigator.clipboard.writeText(emailList)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy emails:', err)
    }
  }

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  return (
    <Layout>
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-black pt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
                <p className="text-gray-400">Bio-Scalar Vest waitlist management</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
                <button
                  onClick={copyEmailList}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? 'Copied!' : 'Copy Emails'}
                </button>
                
                <button
                  onClick={exportToCSV}
                  className="flex items-center px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </button>
              </div>
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

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                <span className="ml-2 text-gray-400">Loading VIP subscribers...</span>
              </div>
            ) : error ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                  <span className="text-red-400">{error}</span>
                </div>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                  <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg border border-gray-700 p-6">
                    <div className="flex items-center">
                      <Users className="w-8 h-8 text-purple-400" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-400">Total Signups</p>
                        <p className="text-2xl font-bold text-white">{stats.total_signups}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg border border-gray-700 p-6">
                    <div className="flex items-center">
                      <Check className="w-8 h-8 text-green-400" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-400">Confirmed</p>
                        <p className="text-2xl font-bold text-white">{stats.confirmed_signups}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg border border-gray-700 p-6">
                    <div className="flex items-center">
                      <TrendingUp className="w-8 h-8 text-cyan-400" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-400">Last 7 Days</p>
                        <p className="text-2xl font-bold text-white">{stats.signups_last_7_days}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg border border-gray-700 p-6">
                    <div className="flex items-center">
                      <Calendar className="w-8 h-8 text-yellow-400" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-400">Last 30 Days</p>
                        <p className="text-2xl font-bold text-white">{stats.signups_last_30_days}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg border border-gray-700 p-6">
                    <div className="flex items-center">
                      <Mail className="w-8 h-8 text-purple-400" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-400">Latest Signup</p>
                        <p className="text-sm font-medium text-white">
                          {stats.latest_signup ? formatDate(stats.latest_signup).split(',')[0] : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subscribers Table */}
                <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg border border-gray-700 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-700">
                    <h2 className="text-xl font-semibold text-white">All Subscribers ({subscribers.length})</h2>
                  </div>

                  {subscribers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400">No VIP subscribers yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-700/50">
                          <tr>
                            <th 
                              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                              onClick={() => handleSort('name')}
                            >
                              <div className="flex items-center">
                                Name
                                {sortBy === 'name' && (
                                  <span className="ml-1">
                                    {sortOrder === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </div>
                            </th>
                            <th 
                              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                              onClick={() => handleSort('email')}
                            >
                              <div className="flex items-center">
                                Email
                                {sortBy === 'email' && (
                                  <span className="ml-1">
                                    {sortOrder === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </div>
                            </th>
                            <th 
                              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                              onClick={() => handleSort('created_at')}
                            >
                              <div className="flex items-center">
                                Date Subscribed
                                {sortBy === 'created_at' && (
                                  <span className="ml-1">
                                    {sortOrder === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Details
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {subscribers.map((subscriber) => (
                            <tr key={subscriber.id} className="hover:bg-gray-700/30 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-white">{subscriber.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-300">{subscriber.email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-300">{formatDate(subscriber.created_at)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {subscriber.confirmed ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                                    <Check className="w-3 h-3 mr-1" />
                                    Confirmed
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                <div className="space-y-1">
                                  {subscriber.ip_address && (
                                    <div>IP: {subscriber.ip_address}</div>
                                  )}
                                  {subscriber.referrer && (
                                    <div>Ref: {new URL(subscriber.referrer).hostname}</div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </ProtectedRoute>
    </Layout>
  )
}

export default VipSubscribers