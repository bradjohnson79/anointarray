'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  FileText,
  Wallet,
  Bitcoin,
  Shield
} from 'lucide-react'
import { useState } from 'react'

interface SavedPaymentMethod {
  id: string
  type: 'card' | 'paypal' | 'crypto'
  brand?: string // For cards: visa, mastercard, etc.
  last4?: string // For cards
  email?: string // For PayPal
  wallet?: string // For crypto
  currency?: string // For crypto: BTC, ETH, etc.
  isDefault: boolean
  createdAt: string
}

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  status: 'completed' | 'pending' | 'failed'
  paymentMethod: string
}

export default function MemberBilling() {
  const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      brand: 'visa',
      last4: '4242',
      isDefault: true,
      createdAt: '2024-01-10'
    },
    {
      id: '2',
      type: 'paypal',
      email: 'brad@example.com',
      isDefault: false,
      createdAt: '2024-01-08'
    }
  ])

  const [transactions] = useState<Transaction[]>([
    {
      id: 'tx_1',
      date: '2024-01-15',
      description: 'ANOINT Array - Mystic Energy',
      amount: 17.00,
      status: 'completed',
      paymentMethod: 'Visa •••• 4242'
    },
    {
      id: 'tx_2',
      date: '2024-01-14',
      description: 'ANOINT Array - Abundance Manifestation',
      amount: 17.00,
      status: 'completed',
      paymentMethod: 'PayPal'
    },
    {
      id: 'tx_3',
      date: '2024-01-12',
      description: 'ANOINT Array - Love Frequency',
      amount: 17.00,
      status: 'completed',
      paymentMethod: 'Visa •••• 4242'
    }
  ])

  const [showAddMethod, setShowAddMethod] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSetDefault = async (methodId: string) => {
    setIsLoading(true)
    try {
      // In production, this would call an API to update the default method
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setSavedMethods(methods => 
        methods.map(method => ({
          ...method,
          isDefault: method.id === methodId
        }))
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMethod = async (methodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) return
    
    setIsLoading(true)
    try {
      // In production, this would call an API to remove the method
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setSavedMethods(methods => methods.filter(m => m.id !== methodId))
    } finally {
      setIsLoading(false)
    }
  }

  const getPaymentIcon = (type: string, brand?: string) => {
    if (type === 'card') {
      return <CreditCard size={20} />
    } else if (type === 'paypal') {
      return <span className="text-xl">🅿️</span>
    } else if (type === 'crypto') {
      return <Bitcoin size={20} />
    }
    return <Wallet size={20} />
  }

  const formatPaymentDisplay = (method: SavedPaymentMethod) => {
    if (method.type === 'card') {
      return `${method.brand?.charAt(0).toUpperCase()}${method.brand?.slice(1)} •••• ${method.last4}`
    } else if (method.type === 'paypal') {
      return `PayPal (${method.email})`
    } else if (method.type === 'crypto') {
      return `${method.currency} Wallet`
    }
    return 'Payment Method'
  }

  return (
    <ProtectedRoute requiredRole="member">
      <Layout userRole="member">
        <div className="p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Billing & Payments</h1>
            <p className="text-gray-400">Manage your payment methods and view transaction history</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Saved Payment Methods */}
              <Card className="bg-gray-800/60 backdrop-blur-lg border-gray-700/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <CreditCard size={20} />
                      Saved Payment Methods
                    </CardTitle>
                    <Button
                      size="sm"
                      onClick={() => setShowAddMethod(true)}
                      className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Method
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {savedMethods.length === 0 ? (
                    <div className="text-center py-8">
                      <Wallet size={48} className="mx-auto text-gray-500 mb-4" />
                      <p className="text-gray-400">No payment methods saved</p>
                      <p className="text-sm text-gray-500 mt-2">Add a payment method for faster checkout</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {savedMethods.map((method) => (
                        <div key={method.id} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                          <div className="flex items-center gap-3">
                            <div className="text-purple-400">
                              {getPaymentIcon(method.type, method.brand)}
                            </div>
                            <div>
                              <p className="text-white font-medium">{formatPaymentDisplay(method)}</p>
                              <p className="text-xs text-gray-400">Added {method.createdAt}</p>
                            </div>
                            {method.isDefault && (
                              <Badge className="bg-green-600/20 text-green-400 border-green-600/30">Default</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {!method.isDefault && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSetDefault(method.id)}
                                disabled={isLoading}
                                className="bg-gray-700/60 border-gray-600/50 text-white hover:bg-gray-600/70"
                              >
                                Set Default
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveMethod(method.id)}
                              disabled={isLoading}
                              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Transaction History */}
              <Card className="bg-gray-800/60 backdrop-blur-lg border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText size={20} />
                    Transaction History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            transaction.status === 'completed' ? 'bg-green-600/20' :
                            transaction.status === 'pending' ? 'bg-yellow-600/20' : 'bg-red-600/20'
                          }`}>
                            {transaction.status === 'completed' ? (
                              <CheckCircle size={16} className="text-green-400" />
                            ) : transaction.status === 'pending' ? (
                              <Calendar size={16} className="text-yellow-400" />
                            ) : (
                              <AlertCircle size={16} className="text-red-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium">{transaction.description}</p>
                            <p className="text-sm text-gray-400">{transaction.date} • {transaction.paymentMethod}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">${transaction.amount.toFixed(2)}</p>
                          <p className={`text-xs ${
                            transaction.status === 'completed' ? 'text-green-400' :
                            transaction.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <Button variant="outline" className="bg-gray-700/60 border-gray-600/50 text-white hover:bg-gray-600/70">
                      View All Transactions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card className="bg-gray-800/60 backdrop-blur-lg border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Billing Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-gray-400 text-sm">Total Spent</p>
                    <p className="text-2xl font-bold text-white">$578.00</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Arrays Purchased</p>
                    <p className="text-xl font-semibold text-purple-400">34</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Average per Array</p>
                    <p className="text-xl font-semibold text-cyan-400">$17.00</p>
                  </div>
                </CardContent>
              </Card>

              {/* Security Notice */}
              <Card className="bg-gradient-to-r from-purple-900/50 to-cyan-900/50 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield size={20} />
                    Payment Security
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm mb-3">
                    Your payment information is encrypted and securely stored. We never store full card numbers.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle size={14} />
                      <span>PCI DSS Compliant</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle size={14} />
                      <span>256-bit SSL Encryption</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle size={14} />
                      <span>Tokenized Card Storage</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Partners */}
              <Card className="bg-gray-800/60 backdrop-blur-lg border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Accepted Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="bg-gray-700/30 rounded-lg p-3">
                        <CreditCard className="mx-auto text-purple-400" />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Cards</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-gray-700/30 rounded-lg p-3">
                        <span className="text-2xl">🅿️</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">PayPal</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-gray-700/30 rounded-lg p-3">
                        <Bitcoin className="mx-auto text-yellow-400" />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Crypto</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    Powered by Stripe, PayPal & NOWPayments
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Add Payment Method Modal (placeholder) */}
          {showAddMethod && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowAddMethod(false)}>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-semibold text-white mb-4">Add Payment Method</h3>
                <p className="text-gray-400 mb-4">Choose a payment method to add:</p>
                <div className="space-y-3">
                  <Button className="w-full justify-start bg-gray-700/60 border-gray-600/50 text-white hover:bg-gray-600/70">
                    <CreditCard className="mr-3 h-5 w-5" />
                    Add Credit/Debit Card
                  </Button>
                  <Button className="w-full justify-start bg-gray-700/60 border-gray-600/50 text-white hover:bg-gray-600/70">
                    <span className="mr-3 text-xl">🅿️</span>
                    Connect PayPal Account
                  </Button>
                  <Button className="w-full justify-start bg-gray-700/60 border-gray-600/50 text-white hover:bg-gray-600/70">
                    <Bitcoin className="mr-3 h-5 w-5" />
                    Add Crypto Wallet
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4 border-gray-600/50 text-gray-400 hover:bg-gray-700/50"
                  onClick={() => setShowAddMethod(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}