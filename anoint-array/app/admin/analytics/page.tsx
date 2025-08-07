'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import { 
  TrendingUp, 
  Users, 
  Eye, 
  Clock,
  Globe,
  Search,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  Calendar,
  Filter,
  Download,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react'
import { useState } from 'react'

interface TrafficSource {
  source: string
  visits: number
  percentage: number
  change: number
}

interface TopPage {
  page: string
  views: number
  uniqueViews: number
  avgTime: string
  bounceRate: number
}

interface Keyword {
  keyword: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  change: number
}

interface Backlink {
  domain: string
  links: number
  authority: number
  traffic: number
  status: 'active' | 'new' | 'lost'
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d')

  // Mock Analytics Data
  const overviewStats = [
    {
      title: 'Total Visitors',
      value: '24,847',
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: Users,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Page Views',
      value: '89,234',
      change: '+8.3%',
      changeType: 'positive' as const,
      icon: Eye,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Avg. Session',
      value: '4m 32s',
      change: '+15.2%',
      changeType: 'positive' as const,
      icon: Clock,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Bounce Rate',
      value: '32.1%',
      change: '-5.4%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'from-cyan-500 to-cyan-600'
    }
  ]

  const trafficSources: TrafficSource[] = [
    { source: 'Organic Search', visits: 12450, percentage: 45.2, change: 8.5 },
    { source: 'Direct Traffic', visits: 8320, percentage: 30.1, change: 12.3 },
    { source: 'Social Media', visits: 4280, percentage: 15.5, change: -2.1 },
    { source: 'Referral Sites', visits: 2550, percentage: 9.2, change: 18.7 }
  ]

  const topPages: TopPage[] = [
    { page: '/', views: 15420, uniqueViews: 12340, avgTime: '3m 45s', bounceRate: 28.5 },
    { page: '/login', views: 8930, uniqueViews: 8650, avgTime: '2m 12s', bounceRate: 15.2 },
    { page: '/member/dashboard', views: 6780, uniqueViews: 4320, avgTime: '8m 23s', bounceRate: 12.1 },
    { page: '/admin/dashboard', views: 3240, uniqueViews: 1850, avgTime: '12m 15s', bounceRate: 8.4 },
    { page: '/about', views: 2890, uniqueViews: 2650, avgTime: '4m 33s', bounceRate: 35.2 }
  ]

  const topKeywords: Keyword[] = [
    { keyword: 'AI website builder', clicks: 2340, impressions: 45600, ctr: 5.1, position: 3.2, change: 15.3 },
    { keyword: 'anoint array', clicks: 1890, impressions: 12300, ctr: 15.4, position: 1.8, change: 8.7 },
    { keyword: 'self healing website', clicks: 1650, impressions: 38900, ctr: 4.2, position: 4.1, change: 22.1 },
    { keyword: 'AI web platform', clicks: 1420, impressions: 52100, ctr: 2.7, position: 6.3, change: -3.2 },
    { keyword: 'autonomous website', clicks: 980, impressions: 28700, ctr: 3.4, position: 5.2, change: 12.8 }
  ]

  const backlinks: Backlink[] = [
    { domain: 'techcrunch.com', links: 3, authority: 94, traffic: 1250, status: 'active' },
    { domain: 'producthunt.com', links: 8, authority: 87, traffic: 890, status: 'new' },
    { domain: 'hackernews.com', links: 12, authority: 91, traffic: 2340, status: 'active' },
    { domain: 'medium.com', links: 5, authority: 85, traffic: 650, status: 'active' },
    { domain: 'reddit.com', links: 15, authority: 93, traffic: 1890, status: 'lost' }
  ]

  const getChangeIcon = (changeType: string) => {
    return changeType === 'positive' ? 
      <ArrowUp size={16} className="text-green-400" /> : 
      <ArrowDown size={16} className="text-red-400" />
  }

  const getBacklinkStatus = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400'
      case 'new':
        return 'bg-blue-500/20 text-blue-400'
      case 'lost':
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
              <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
              <p className="text-gray-400">Comprehensive website analytics and performance metrics</p>
            </div>
            <div className="flex gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                <Download size={20} />
                Export
              </button>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {overviewStats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.title} className="bg-gray-800/60 backdrop-blur-lg rounded-lg p-6 border border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">{stat.title}</p>
                      <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                      <div className="flex items-center mt-2">
                        {getChangeIcon(stat.changeType)}
                        <span className={`text-sm ml-1 ${
                          stat.changeType === 'positive' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                      <Icon size={24} className="text-white" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Traffic Sources */}
            <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Traffic Sources</h2>
                <PieChart size={20} className="text-purple-400" />
              </div>
              <div className="space-y-4">
                {trafficSources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-blue-400' :
                        index === 1 ? 'bg-green-400' :
                        index === 2 ? 'bg-purple-400' : 'bg-cyan-400'
                      }`}></div>
                      <div>
                        <p className="text-white text-sm font-medium">{source.source}</p>
                        <p className="text-gray-400 text-xs">{source.visits.toLocaleString()} visits</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-sm">{source.percentage}%</p>
                      <div className="flex items-center">
                        {source.change > 0 ? 
                          <ArrowUp size={12} className="text-green-400" /> : 
                          <ArrowDown size={12} className="text-red-400" />
                        }
                        <span className={`text-xs ml-1 ${
                          source.change > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {Math.abs(source.change)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Pages */}
            <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Top Pages</h2>
                <BarChart3 size={20} className="text-cyan-400" />
              </div>
              <div className="space-y-4">
                {topPages.map((page, index) => (
                  <div key={index} className="border-b border-gray-700/50 pb-3 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white text-sm font-medium">{page.page}</p>
                      <p className="text-gray-400 text-sm">{page.views.toLocaleString()} views</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="text-gray-400">Unique</p>
                        <p className="text-white">{page.uniqueViews.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Avg Time</p>
                        <p className="text-white">{page.avgTime}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Bounce</p>
                        <p className="text-white">{page.bounceRate}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* SEO Keywords */}
            <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Top Keywords</h2>
                <Search size={20} className="text-green-400" />
              </div>
              <div className="space-y-4">
                {topKeywords.map((keyword, index) => (
                  <div key={index} className="border-b border-gray-700/50 pb-3 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white text-sm font-medium">{keyword.keyword}</p>
                      <div className="flex items-center">
                        {keyword.change > 0 ? 
                          <ArrowUp size={12} className="text-green-400" /> : 
                          <ArrowDown size={12} className="text-red-400" />
                        }
                        <span className={`text-xs ml-1 ${
                          keyword.change > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {Math.abs(keyword.change)}%
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-xs">
                      <div>
                        <p className="text-gray-400">Clicks</p>
                        <p className="text-white">{keyword.clicks.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Impressions</p>
                        <p className="text-white">{keyword.impressions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">CTR</p>
                        <p className="text-white">{keyword.ctr}%</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Position</p>
                        <p className="text-white">{keyword.position}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Backlinks */}
            <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Top Backlinks</h2>
                <ExternalLink size={20} className="text-yellow-400" />
              </div>
              <div className="space-y-4">
                {backlinks.map((backlink, index) => (
                  <div key={index} className="border-b border-gray-700/50 pb-3 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <p className="text-white text-sm font-medium">{backlink.domain}</p>
                        <span className={`px-2 py-1 text-xs rounded-full ${getBacklinkStatus(backlink.status)}`}>
                          {backlink.status}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">{backlink.links} links</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="text-gray-400">Authority</p>
                        <p className="text-white">{backlink.authority}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Traffic</p>
                        <p className="text-white">{backlink.traffic.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Links</p>
                        <p className="text-white">{backlink.links}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Real-time Activity */}
          <div className="mt-8 bg-gray-800/60 backdrop-blur-lg rounded-lg p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Real-time Activity</h2>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm">Live</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">127</p>
                <p className="text-gray-400 text-sm">Active Users</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">2.4k</p>
                <p className="text-gray-400 text-sm">Page Views (Today)</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">1.8k</p>
                <p className="text-gray-400 text-sm">Sessions (Today)</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}