import { useState } from 'react'
import Layout from '../../components/layout/Layout'
import ProtectedRoute from '../../components/layout/ProtectedRoute'
import { Plus, Edit, Trash2, Mail, Send, Tag, Percent } from 'lucide-react'

interface CouponCode {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  expirationDate: string
  usageLimit?: number
  usedCount: number
  active: boolean
  createdAt: string
}

interface EmailCampaign {
  id: string
  subject: string
  recipients: 'all' | 'premium' | 'custom'
  customEmails?: string[]
  content: string
  status: 'draft' | 'scheduled' | 'sent'
  scheduledDate?: string
  sentAt?: string
  openRate?: number
  clickRate?: number
}

const AdminMarketing = () => {
  const [activeTab, setActiveTab] = useState<'coupons' | 'email'>('coupons')
  
  // Mock coupon data
  const [coupons, setCoupons] = useState<CouponCode[]>([
    { id: '1', code: 'SAVE10', type: 'percentage', value: 10, expirationDate: '2025-03-01', usageLimit: 100, usedCount: 25, active: true, createdAt: '2025-01-15' },
    { id: '2', code: 'SAVE20', type: 'percentage', value: 20, expirationDate: '2025-02-15', usageLimit: 50, usedCount: 12, active: true, createdAt: '2025-01-10' },
    { id: '3', code: 'WELCOME25', type: 'fixed', value: 25, expirationDate: '2025-06-01', usedCount: 5, active: true, createdAt: '2025-01-20' }
  ])

  // Mock email campaigns
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([
    { id: '1', subject: 'New Product Launch - VIP Scalar Technology', recipients: 'all', content: 'Exciting news about our new VIP line...', status: 'sent', sentAt: '2025-01-20', openRate: 45.2, clickRate: 12.3 },
    { id: '2', subject: 'Winter Sale - 20% Off Everything', recipients: 'premium', content: 'Limited time offer for our premium members...', status: 'scheduled', scheduledDate: '2025-02-01' },
    { id: '3', subject: 'February Newsletter', recipients: 'all', content: 'Monthly updates and healing tips...', status: 'draft' }
  ])

  const [showCouponModal, setShowCouponModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<CouponCode | null>(null)
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null)

  const [couponFormData, setCouponFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    expirationDate: '',
    usageLimit: ''
  })

  const [campaignFormData, setCampaignFormData] = useState({
    subject: '',
    recipients: 'all' as 'all' | 'premium' | 'custom',
    customEmails: '',
    content: '',
    scheduledDate: ''
  })

  const [emailSettings, setEmailSettings] = useState({
    provider: 'sendgrid',
    apiKey: '',
    fromEmail: 'noreply@anointarray.com',
    fromName: 'ANOINT Array'
  })

  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingCoupon) {
      setCoupons(coupons.map(coupon =>
        coupon.id === editingCoupon.id
          ? {
              ...coupon,
              ...couponFormData,
              value: parseFloat(couponFormData.value),
              usageLimit: couponFormData.usageLimit ? parseInt(couponFormData.usageLimit) : undefined
            }
          : coupon
      ))
    } else {
      const newCoupon: CouponCode = {
        id: Date.now().toString(),
        ...couponFormData,
        value: parseFloat(couponFormData.value),
        usageLimit: couponFormData.usageLimit ? parseInt(couponFormData.usageLimit) : undefined,
        usedCount: 0,
        active: true,
        createdAt: new Date().toISOString().split('T')[0]
      }
      setCoupons([...coupons, newCoupon])
    }
    
    resetCouponForm()
  }

  const handleCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingCampaign) {
      setCampaigns(campaigns.map(campaign =>
        campaign.id === editingCampaign.id
          ? {
              ...campaign,
              ...campaignFormData,
              customEmails: campaignFormData.customEmails ? campaignFormData.customEmails.split(',').map(e => e.trim()) : undefined
            }
          : campaign
      ))
    } else {
      const newCampaign: EmailCampaign = {
        id: Date.now().toString(),
        ...campaignFormData,
        customEmails: campaignFormData.customEmails ? campaignFormData.customEmails.split(',').map(e => e.trim()) : undefined,
        status: 'draft'
      }
      setCampaigns([...campaigns, newCampaign])
    }
    
    resetCampaignForm()
  }

  const resetCouponForm = () => {
    setCouponFormData({ code: '', type: 'percentage', value: '', expirationDate: '', usageLimit: '' })
    setEditingCoupon(null)
    setShowCouponModal(false)
  }

  const resetCampaignForm = () => {
    setCampaignFormData({ subject: '', recipients: 'all', customEmails: '', content: '', scheduledDate: '' })
    setEditingCampaign(null)
    setShowEmailModal(false)
  }

  const handleEditCoupon = (coupon: CouponCode) => {
    setEditingCoupon(coupon)
    setCouponFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value.toString(),
      expirationDate: coupon.expirationDate,
      usageLimit: coupon.usageLimit?.toString() || ''
    })
    setShowCouponModal(true)
  }

  const handleEditCampaign = (campaign: EmailCampaign) => {
    setEditingCampaign(campaign)
    setCampaignFormData({
      subject: campaign.subject,
      recipients: campaign.recipients,
      customEmails: campaign.customEmails?.join(', ') || '',
      content: campaign.content,
      scheduledDate: campaign.scheduledDate || ''
    })
    setShowEmailModal(true)
  }

  const toggleCouponActive = (id: string) => {
    setCoupons(coupons.map(coupon =>
      coupon.id === id ? { ...coupon, active: !coupon.active } : coupon
    ))
  }

  const sendCampaign = (campaignId: string) => {
    if (confirm('Are you sure you want to send this campaign?')) {
      setCampaigns(campaigns.map(campaign =>
        campaign.id === campaignId
          ? { ...campaign, status: 'sent', sentAt: new Date().toISOString().split('T')[0] }
          : campaign
      ))
    }
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <Layout>
        <div className="min-h-screen bg-gray-900 text-white py-12 px-6 md:px-16 lg:px-32">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-serif mb-8">Marketing Management</h1>

            {/* Tabs */}
            <div className="flex space-x-1 mb-8">
              <button
                onClick={() => setActiveTab('coupons')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'coupons'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Tag size={20} className="inline mr-2" />
                Coupon Codes
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'email'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Mail size={20} className="inline mr-2" />
                Email Marketing
              </button>
            </div>

            {/* Coupon Codes Tab */}
            {activeTab === 'coupons' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Coupon Codes</h2>
                  <button
                    onClick={() => setShowCouponModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Plus size={20} />
                    Create Coupon
                  </button>
                </div>

                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Value</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Usage</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Expires</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {coupons.map((coupon) => (
                        <tr key={coupon.id} className="hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{coupon.code}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded ${
                              coupon.type === 'percentage' ? 'bg-blue-900 text-blue-300' : 'bg-green-900 text-green-300'
                            }`}>
                              {coupon.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="flex items-center">
                              {coupon.type === 'percentage' ? <Percent size={16} className="mr-1" /> : '$'}
                              {coupon.value}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {coupon.usedCount}{coupon.usageLimit && `/${coupon.usageLimit}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{coupon.expirationDate}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => toggleCouponActive(coupon.id)}
                              className={`px-3 py-1 text-xs rounded ${
                                coupon.active
                                  ? 'bg-green-900 text-green-300'
                                  : 'bg-red-900 text-red-300'
                              }`}
                            >
                              {coupon.active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditCoupon(coupon)}
                                className="text-purple-400 hover:text-purple-300 transition-colors"
                              >
                                <Edit size={18} />
                              </button>
                              <button className="text-red-400 hover:text-red-300 transition-colors">
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
            )}

            {/* Email Marketing Tab */}
            {activeTab === 'email' && (
              <div>
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Email Settings */}
                  <div className="lg:col-span-1">
                    <div className="bg-gray-800 rounded-lg p-6 mb-6">
                      <h3 className="text-lg font-bold mb-4">Email Settings</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Provider</label>
                          <select
                            value={emailSettings.provider}
                            onChange={(e) => setEmailSettings({ ...emailSettings, provider: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                          >
                            <option value="sendgrid">SendGrid</option>
                            <option value="mailersend">MailerSend</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">API Key</label>
                          <input
                            type="password"
                            value={emailSettings.apiKey}
                            onChange={(e) => setEmailSettings({ ...emailSettings, apiKey: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">From Email</label>
                          <input
                            type="email"
                            value={emailSettings.fromEmail}
                            onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                          />
                        </div>
                        <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors">
                          Save Settings
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Email Campaigns */}
                  <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">Email Campaigns</h2>
                      <button
                        onClick={() => setShowEmailModal(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Plus size={20} />
                        Create Campaign
                      </button>
                    </div>

                    <div className="space-y-4">
                      {campaigns.map((campaign) => (
                        <div key={campaign.id} className="bg-gray-800 rounded-lg p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-xl font-bold">{campaign.subject}</h3>
                              <p className="text-gray-400 text-sm">
                                Recipients: {campaign.recipients} 
                                {campaign.customEmails && ` (${campaign.customEmails.length} custom)`}
                              </p>
                            </div>
                            <span className={`px-3 py-1 text-xs rounded ${
                              campaign.status === 'sent' ? 'bg-green-900 text-green-300' :
                              campaign.status === 'scheduled' ? 'bg-blue-900 text-blue-300' :
                              'bg-gray-700 text-gray-300'
                            }`}>
                              {campaign.status}
                            </span>
                          </div>
                          
                          <p className="text-gray-300 mb-4 line-clamp-2">{campaign.content}</p>
                          
                          {campaign.status === 'sent' && (
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-cyan-400">{campaign.openRate}%</p>
                                <p className="text-sm text-gray-400">Open Rate</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-purple-400">{campaign.clickRate}%</p>
                                <p className="text-sm text-gray-400">Click Rate</p>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditCampaign(campaign)}
                              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded flex items-center justify-center gap-2 transition-colors"
                            >
                              <Edit size={16} />
                              Edit
                            </button>
                            {campaign.status === 'draft' && (
                              <button
                                onClick={() => sendCampaign(campaign.id)}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded flex items-center justify-center gap-2 transition-colors"
                              >
                                <Send size={16} />
                                Send Now
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Coupon Modal */}
            {showCouponModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                  <h2 className="text-2xl font-bold mb-4">
                    {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
                  </h2>
                  <form onSubmit={handleCouponSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Coupon Code</label>
                      <input
                        type="text"
                        value={couponFormData.code}
                        onChange={(e) => setCouponFormData({ ...couponFormData, code: e.target.value.toUpperCase() })}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Type</label>
                        <select
                          value={couponFormData.type}
                          onChange={(e) => setCouponFormData({ ...couponFormData, type: e.target.value as 'percentage' | 'fixed' })}
                          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                        >
                          <option value="percentage">Percentage</option>
                          <option value="fixed">Fixed Amount</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Value</label>
                        <input
                          type="number"
                          step="0.01"
                          value={couponFormData.value}
                          onChange={(e) => setCouponFormData({ ...couponFormData, value: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Expiration Date</label>
                      <input
                        type="date"
                        value={couponFormData.expirationDate}
                        onChange={(e) => setCouponFormData({ ...couponFormData, expirationDate: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Usage Limit (optional)</label>
                      <input
                        type="number"
                        value={couponFormData.usageLimit}
                        onChange={(e) => setCouponFormData({ ...couponFormData, usageLimit: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors"
                      >
                        {editingCoupon ? 'Update' : 'Create'} Coupon
                      </button>
                      <button
                        type="button"
                        onClick={resetCouponForm}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Email Campaign Modal */}
            {showEmailModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <h2 className="text-2xl font-bold mb-4">
                    {editingCampaign ? 'Edit Campaign' : 'Create Campaign'}
                  </h2>
                  <form onSubmit={handleCampaignSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Subject</label>
                      <input
                        type="text"
                        value={campaignFormData.subject}
                        onChange={(e) => setCampaignFormData({ ...campaignFormData, subject: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Recipients</label>
                      <select
                        value={campaignFormData.recipients}
                        onChange={(e) => setCampaignFormData({ ...campaignFormData, recipients: e.target.value as 'all' | 'premium' | 'custom' })}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      >
                        <option value="all">All Users</option>
                        <option value="premium">Premium Members</option>
                        <option value="custom">Custom List</option>
                      </select>
                    </div>
                    {campaignFormData.recipients === 'custom' && (
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Custom Emails (comma-separated)</label>
                        <textarea
                          value={campaignFormData.customEmails}
                          onChange={(e) => setCampaignFormData({ ...campaignFormData, customEmails: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Content</label>
                      <textarea
                        value={campaignFormData.content}
                        onChange={(e) => setCampaignFormData({ ...campaignFormData, content: e.target.value })}
                        rows={8}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Schedule Date (optional)</label>
                      <input
                        type="datetime-local"
                        value={campaignFormData.scheduledDate}
                        onChange={(e) => setCampaignFormData({ ...campaignFormData, scheduledDate: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors"
                      >
                        {editingCampaign ? 'Update' : 'Create'} Campaign
                      </button>
                      <button
                        type="button"
                        onClick={resetCampaignForm}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

export default AdminMarketing