import { useState } from 'react'
import Layout from '../../components/layout/Layout'
import ProtectedRoute from '../../components/layout/ProtectedRoute'
import { Truck, Plus, Edit, Trash2, Key, Eye, EyeOff } from 'lucide-react'

interface ShippingAPI {
  id: string
  name: string
  apiKey: string
  apiSecret: string
  testMode: boolean
  active: boolean
}

interface ShippingOption {
  id: string
  name: string
  carrier: string
  price: number
  estimatedDays: string
  active: boolean
}

const AdminShipping = () => {
  const [activeTab, setActiveTab] = useState<'apis' | 'options'>('apis')
  
  // Mock shipping APIs
  const [shippingAPIs, setShippingAPIs] = useState<ShippingAPI[]>([
    { id: '1', name: 'Canada Post', apiKey: 'cp_***_key', apiSecret: 'cp_***_secret', testMode: true, active: false },
    { id: '2', name: 'UPS', apiKey: '', apiSecret: '', testMode: true, active: false },
    { id: '3', name: 'Purolator', apiKey: '', apiSecret: '', testMode: true, active: false }
  ])

  // Mock shipping options
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([
    { id: '1', name: 'Standard Shipping', carrier: 'Canada Post', price: 5.99, estimatedDays: '5-7 business days', active: true },
    { id: '2', name: 'Express Shipping', carrier: 'UPS', price: 12.99, estimatedDays: '2-3 business days', active: true },
    { id: '3', name: 'Overnight Shipping', carrier: 'Purolator', price: 29.99, estimatedDays: '1 business day', active: false }
  ])

  const [showAPIModal, setShowAPIModal] = useState(false)
  const [showOptionModal, setShowOptionModal] = useState(false)
  const [editingAPI, setEditingAPI] = useState<ShippingAPI | null>(null)
  const [editingOption, setEditingOption] = useState<ShippingOption | null>(null)
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({})

  const [apiFormData, setAPIFormData] = useState({
    name: '',
    apiKey: '',
    apiSecret: '',
    testMode: true
  })

  const [optionFormData, setOptionFormData] = useState({
    name: '',
    carrier: '',
    price: '',
    estimatedDays: ''
  })

  const handleAPISubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingAPI) {
      setShippingAPIs(shippingAPIs.map(api =>
        api.id === editingAPI.id
          ? { ...api, ...apiFormData }
          : api
      ))
    } else {
      const newAPI: ShippingAPI = {
        id: Date.now().toString(),
        ...apiFormData,
        active: false
      }
      setShippingAPIs([...shippingAPIs, newAPI])
    }
    
    resetAPIForm()
  }

  const handleOptionSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingOption) {
      setShippingOptions(shippingOptions.map(option =>
        option.id === editingOption.id
          ? { ...option, ...optionFormData, price: parseFloat(optionFormData.price) }
          : option
      ))
    } else {
      const newOption: ShippingOption = {
        id: Date.now().toString(),
        ...optionFormData,
        price: parseFloat(optionFormData.price),
        active: true
      }
      setShippingOptions([...shippingOptions, newOption])
    }
    
    resetOptionForm()
  }

  const resetAPIForm = () => {
    setAPIFormData({ name: '', apiKey: '', apiSecret: '', testMode: true })
    setEditingAPI(null)
    setShowAPIModal(false)
  }

  const resetOptionForm = () => {
    setOptionFormData({ name: '', carrier: '', price: '', estimatedDays: '' })
    setEditingOption(null)
    setShowOptionModal(false)
  }

  const handleEditAPI = (api: ShippingAPI) => {
    setEditingAPI(api)
    setAPIFormData({
      name: api.name,
      apiKey: api.apiKey,
      apiSecret: api.apiSecret,
      testMode: api.testMode
    })
    setShowAPIModal(true)
  }

  const handleEditOption = (option: ShippingOption) => {
    setEditingOption(option)
    setOptionFormData({
      name: option.name,
      carrier: option.carrier,
      price: option.price.toString(),
      estimatedDays: option.estimatedDays
    })
    setShowOptionModal(true)
  }

  const toggleAPIActive = (id: string) => {
    setShippingAPIs(shippingAPIs.map(api =>
      api.id === id ? { ...api, active: !api.active } : api
    ))
  }

  const toggleOptionActive = (id: string) => {
    setShippingOptions(shippingOptions.map(option =>
      option.id === id ? { ...option, active: !option.active } : option
    ))
  }

  const toggleShowSecret = (id: string) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <Layout>
        <div className="min-h-screen bg-gray-900 text-white py-12 px-6 md:px-16 lg:px-32">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-serif mb-8">Shipping Management</h1>

            {/* Tabs */}
            <div className="flex space-x-1 mb-8">
              <button
                onClick={() => setActiveTab('apis')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'apis'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Key size={20} className="inline mr-2" />
                API Credentials
              </button>
              <button
                onClick={() => setActiveTab('options')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'options'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Truck size={20} className="inline mr-2" />
                Shipping Options
              </button>
            </div>

            {/* API Credentials Tab */}
            {activeTab === 'apis' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Shipping API Credentials</h2>
                  <button
                    onClick={() => setShowAPIModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Plus size={20} />
                    Add API
                  </button>
                </div>

                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Carrier</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">API Key</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Mode</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {shippingAPIs.map((api) => (
                        <tr key={api.id} className="hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-medium">{api.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">
                                {showSecrets[api.id] ? api.apiKey : '••••••••••••••••'}
                              </span>
                              <button
                                onClick={() => toggleShowSecret(api.id)}
                                className="text-gray-400 hover:text-white transition-colors"
                              >
                                {showSecrets[api.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded ${
                              api.testMode ? 'bg-yellow-900 text-yellow-300' : 'bg-green-900 text-green-300'
                            }`}>
                              {api.testMode ? 'Test' : 'Live'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => toggleAPIActive(api.id)}
                              className={`px-3 py-1 text-xs rounded ${
                                api.active
                                  ? 'bg-green-900 text-green-300'
                                  : 'bg-red-900 text-red-300'
                              }`}
                            >
                              {api.active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditAPI(api)}
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

            {/* Shipping Options Tab */}
            {activeTab === 'options' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Shipping Options</h2>
                  <button
                    onClick={() => setShowOptionModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Plus size={20} />
                    Add Option
                  </button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {shippingOptions.map((option) => (
                    <div key={option.id} className="bg-gray-800 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold">{option.name}</h3>
                        <button
                          onClick={() => toggleOptionActive(option.id)}
                          className={`px-2 py-1 text-xs rounded ${
                            option.active
                              ? 'bg-green-900 text-green-300'
                              : 'bg-red-900 text-red-300'
                          }`}
                        >
                          {option.active ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                      
                      <div className="space-y-2 mb-6">
                        <p className="text-gray-400">
                          <span className="font-medium">Carrier:</span> {option.carrier}
                        </p>
                        <p className="text-gray-400">
                          <span className="font-medium">Price:</span> <span className="text-cyan-400">${option.price.toFixed(2)}</span>
                        </p>
                        <p className="text-gray-400">
                          <span className="font-medium">Delivery:</span> {option.estimatedDays}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditOption(option)}
                          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded flex items-center justify-center gap-2 transition-colors"
                        >
                          <Edit size={16} />
                          Edit
                        </button>
                        <button className="flex-1 bg-red-900 hover:bg-red-800 text-white py-2 rounded flex items-center justify-center gap-2 transition-colors">
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* API Modal */}
            {showAPIModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                  <h2 className="text-2xl font-bold mb-4">
                    {editingAPI ? 'Edit API Credentials' : 'Add API Credentials'}
                  </h2>
                  <form onSubmit={handleAPISubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Carrier Name</label>
                      <input
                        type="text"
                        value={apiFormData.name}
                        onChange={(e) => setAPIFormData({ ...apiFormData, name: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">API Key</label>
                      <input
                        type="text"
                        value={apiFormData.apiKey}
                        onChange={(e) => setAPIFormData({ ...apiFormData, apiKey: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">API Secret</label>
                      <input
                        type="password"
                        value={apiFormData.apiSecret}
                        onChange={(e) => setAPIFormData({ ...apiFormData, apiSecret: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                        required
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="testMode"
                        checked={apiFormData.testMode}
                        onChange={(e) => setAPIFormData({ ...apiFormData, testMode: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor="testMode" className="text-sm text-gray-400">Test Mode</label>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors"
                      >
                        {editingAPI ? 'Update' : 'Add'} API
                      </button>
                      <button
                        type="button"
                        onClick={resetAPIForm}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Option Modal */}
            {showOptionModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                  <h2 className="text-2xl font-bold mb-4">
                    {editingOption ? 'Edit Shipping Option' : 'Add Shipping Option'}
                  </h2>
                  <form onSubmit={handleOptionSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Option Name</label>
                      <input
                        type="text"
                        value={optionFormData.name}
                        onChange={(e) => setOptionFormData({ ...optionFormData, name: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Carrier</label>
                      <input
                        type="text"
                        value={optionFormData.carrier}
                        onChange={(e) => setOptionFormData({ ...optionFormData, carrier: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={optionFormData.price}
                        onChange={(e) => setOptionFormData({ ...optionFormData, price: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Estimated Delivery</label>
                      <input
                        type="text"
                        value={optionFormData.estimatedDays}
                        onChange={(e) => setOptionFormData({ ...optionFormData, estimatedDays: e.target.value })}
                        placeholder="5-7 business days"
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                        required
                      />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors"
                      >
                        {editingOption ? 'Update' : 'Add'} Option
                      </button>
                      <button
                        type="button"
                        onClick={resetOptionForm}
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

export default AdminShipping