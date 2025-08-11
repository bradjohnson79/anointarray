'use client'

import { useState, useEffect } from 'react'
import { Calculator, Settings, FileText, Info, Save, RefreshCw, MapPin, DollarSign } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'

// Types for tax management
interface TaxRate {
  id: number
  province_code: string
  province_name: string
  gst_rate: number
  hst_rate: number
  pst_rate: number
  qst_rate: number
  tax_type: 'GST_ONLY' | 'HST' | 'GST_PST' | 'GST_QST'
  effective_date: string
  is_active: boolean
}

interface TaxSettings {
  id: number
  business_number: string
  company_name: string
  company_address: any
  registration_threshold: number
  tax_calculation_method: 'INCLUSIVE' | 'EXCLUSIVE'
  invoice_prefix: string
  invoice_counter: number
}

interface TaxCalculationResult {
  province_code: string
  province_name: string
  tax_type: string
  base_amount: number
  tax_breakdown: {
    gst: { rate: number; amount: number }
    hst: { rate: number; amount: number }
    pst: { rate: number; amount: number }
    qst: { rate: number; amount: number }
  }
  total_tax: number
  total_amount: number
}

// Sample data - this would come from Supabase in the real implementation
const SAMPLE_TAX_RATES: TaxRate[] = [
  { id: 1, province_code: 'AB', province_name: 'Alberta', gst_rate: 0.05, hst_rate: 0, pst_rate: 0, qst_rate: 0, tax_type: 'GST_ONLY', effective_date: '2025-01-01', is_active: true },
  { id: 2, province_code: 'BC', province_name: 'British Columbia', gst_rate: 0.05, hst_rate: 0, pst_rate: 0.07, qst_rate: 0, tax_type: 'GST_PST', effective_date: '2025-01-01', is_active: true },
  { id: 3, province_code: 'MB', province_name: 'Manitoba', gst_rate: 0.05, hst_rate: 0, pst_rate: 0.07, qst_rate: 0, tax_type: 'GST_PST', effective_date: '2025-01-01', is_active: true },
  { id: 4, province_code: 'NB', province_name: 'New Brunswick', gst_rate: 0, hst_rate: 0.15, pst_rate: 0, qst_rate: 0, tax_type: 'HST', effective_date: '2025-01-01', is_active: true },
  { id: 5, province_code: 'NL', province_name: 'Newfoundland and Labrador', gst_rate: 0, hst_rate: 0.15, pst_rate: 0, qst_rate: 0, tax_type: 'HST', effective_date: '2025-01-01', is_active: true },
  { id: 6, province_code: 'NT', province_name: 'Northwest Territories', gst_rate: 0.05, hst_rate: 0, pst_rate: 0, qst_rate: 0, tax_type: 'GST_ONLY', effective_date: '2025-01-01', is_active: true },
  { id: 7, province_code: 'NS', province_name: 'Nova Scotia', gst_rate: 0, hst_rate: 0.14, pst_rate: 0, qst_rate: 0, tax_type: 'HST', effective_date: '2025-04-01', is_active: true },
  { id: 8, province_code: 'NU', province_name: 'Nunavut', gst_rate: 0.05, hst_rate: 0, pst_rate: 0, qst_rate: 0, tax_type: 'GST_ONLY', effective_date: '2025-01-01', is_active: true },
  { id: 9, province_code: 'ON', province_name: 'Ontario', gst_rate: 0, hst_rate: 0.13, pst_rate: 0, qst_rate: 0, tax_type: 'HST', effective_date: '2025-01-01', is_active: true },
  { id: 10, province_code: 'PE', province_name: 'Prince Edward Island', gst_rate: 0, hst_rate: 0.15, pst_rate: 0, qst_rate: 0, tax_type: 'HST', effective_date: '2025-01-01', is_active: true },
  { id: 11, province_code: 'QC', province_name: 'Quebec', gst_rate: 0.05, hst_rate: 0, pst_rate: 0, qst_rate: 0.09975, tax_type: 'GST_QST', effective_date: '2025-01-01', is_active: true },
  { id: 12, province_code: 'SK', province_name: 'Saskatchewan', gst_rate: 0.05, hst_rate: 0, pst_rate: 0.06, qst_rate: 0, tax_type: 'GST_PST', effective_date: '2025-01-01', is_active: true },
  { id: 13, province_code: 'YT', province_name: 'Yukon', gst_rate: 0.05, hst_rate: 0, pst_rate: 0, qst_rate: 0, tax_type: 'GST_ONLY', effective_date: '2025-01-01', is_active: true }
]

const SAMPLE_TAX_SETTINGS: TaxSettings = {
  id: 1,
  business_number: '743839342RT0001',
  company_name: 'ANOINT Array',
  company_address: {
    street: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'Canada'
  },
  registration_threshold: 30000.00,
  tax_calculation_method: 'EXCLUSIVE',
  invoice_prefix: 'INV',
  invoice_counter: 1
}

function TaxCalculator() {
  const [amount, setAmount] = useState<string>('100.00')
  const [selectedProvince, setSelectedProvince] = useState<string>('ON')
  const [taxInclusive, setTaxInclusive] = useState<boolean>(false)
  const [calculationResult, setCalculationResult] = useState<TaxCalculationResult | null>(null)

  const calculateTax = () => {
    const province = SAMPLE_TAX_RATES.find(rate => rate.province_code === selectedProvince)
    if (!province) return

    const baseAmount = parseFloat(amount) || 0
    let gstAmount = 0, hstAmount = 0, pstAmount = 0, qstAmount = 0
    let finalBaseAmount = baseAmount
    
    if (taxInclusive) {
      // Calculate base amount from tax-inclusive price
      switch (province.tax_type) {
        case 'HST':
          finalBaseAmount = baseAmount / (1 + province.hst_rate)
          hstAmount = baseAmount - finalBaseAmount
          break
        case 'GST_PST':
          finalBaseAmount = baseAmount / (1 + province.gst_rate + province.pst_rate)
          gstAmount = finalBaseAmount * province.gst_rate
          pstAmount = finalBaseAmount * province.pst_rate
          break
        case 'GST_QST':
          // Quebec: QST applies to GST-inclusive amount
          const totalRate = province.gst_rate + province.qst_rate * (1 + province.gst_rate)
          finalBaseAmount = baseAmount / (1 + totalRate)
          gstAmount = finalBaseAmount * province.gst_rate
          qstAmount = (finalBaseAmount + gstAmount) * province.qst_rate
          break
        case 'GST_ONLY':
          finalBaseAmount = baseAmount / (1 + province.gst_rate)
          gstAmount = baseAmount - finalBaseAmount
          break
      }
    } else {
      // Calculate tax on the given amount
      switch (province.tax_type) {
        case 'HST':
          hstAmount = baseAmount * province.hst_rate
          break
        case 'GST_PST':
          gstAmount = baseAmount * province.gst_rate
          pstAmount = baseAmount * province.pst_rate
          break
        case 'GST_QST':
          gstAmount = baseAmount * province.gst_rate
          qstAmount = (baseAmount + gstAmount) * province.qst_rate
          break
        case 'GST_ONLY':
          gstAmount = baseAmount * province.gst_rate
          break
      }
    }

    const totalTax = gstAmount + hstAmount + pstAmount + qstAmount
    const totalAmount = finalBaseAmount + totalTax

    setCalculationResult({
      province_code: province.province_code,
      province_name: province.province_name,
      tax_type: province.tax_type,
      base_amount: parseFloat(finalBaseAmount.toFixed(2)),
      tax_breakdown: {
        gst: { rate: province.gst_rate, amount: parseFloat(gstAmount.toFixed(2)) },
        hst: { rate: province.hst_rate, amount: parseFloat(hstAmount.toFixed(2)) },
        pst: { rate: province.pst_rate, amount: parseFloat(pstAmount.toFixed(2)) },
        qst: { rate: province.qst_rate, amount: parseFloat(qstAmount.toFixed(2)) }
      },
      total_tax: parseFloat(totalTax.toFixed(2)),
      total_amount: parseFloat(totalAmount.toFixed(2))
    })
  }

  useEffect(() => {
    if (amount && selectedProvince) {
      calculateTax()
    }
  }, [amount, selectedProvince, taxInclusive])

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-6 h-6 text-purple-400" />
        <h3 className="text-xl font-semibold text-white">Tax Calculator</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Amount ($)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
            step="0.01"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Province
          </label>
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
          >
            {SAMPLE_TAX_RATES.map(rate => (
              <option key={rate.province_code} value={rate.province_code}>
                {rate.province_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tax Type
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="taxType"
                checked={!taxInclusive}
                onChange={() => setTaxInclusive(false)}
                className="mr-2"
              />
              <span className="text-gray-300">Exclusive</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="taxType"
                checked={taxInclusive}
                onChange={() => setTaxInclusive(true)}
                className="mr-2"
              />
              <span className="text-gray-300">Inclusive</span>
            </label>
          </div>
        </div>
      </div>

      {calculationResult && (
        <div className="bg-gray-700/50 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-3">
            Tax Calculation for {calculationResult.province_name}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Base Amount:</span>
                <span className="text-white font-mono">${calculationResult.base_amount.toFixed(2)}</span>
              </div>
              
              {calculationResult.tax_breakdown.gst.amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-300">GST ({(calculationResult.tax_breakdown.gst.rate * 100).toFixed(2)}%):</span>
                  <span className="text-white font-mono">${calculationResult.tax_breakdown.gst.amount.toFixed(2)}</span>
                </div>
              )}
              
              {calculationResult.tax_breakdown.hst.amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-300">HST ({(calculationResult.tax_breakdown.hst.rate * 100).toFixed(2)}%):</span>
                  <span className="text-white font-mono">${calculationResult.tax_breakdown.hst.amount.toFixed(2)}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              {calculationResult.tax_breakdown.pst.amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-300">PST ({(calculationResult.tax_breakdown.pst.rate * 100).toFixed(2)}%):</span>
                  <span className="text-white font-mono">${calculationResult.tax_breakdown.pst.amount.toFixed(2)}</span>
                </div>
              )}
              
              {calculationResult.tax_breakdown.qst.amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-300">QST ({(calculationResult.tax_breakdown.qst.rate * 100).toFixed(4)}%):</span>
                  <span className="text-white font-mono">${calculationResult.tax_breakdown.qst.amount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="border-t border-gray-600 pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-300">Total Tax:</span>
                  <span className="text-white font-mono">${calculationResult.total_tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span className="text-purple-400">Total Amount:</span>
                  <span className="text-purple-400 font-mono">${calculationResult.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TaxRatesTable() {
  const [taxRates, setTaxRates] = useState<TaxRate[]>(SAMPLE_TAX_RATES)
  const [editingRate, setEditingRate] = useState<TaxRate | null>(null)

  const getTotalRate = (rate: TaxRate) => {
    switch (rate.tax_type) {
      case 'HST':
        return rate.hst_rate
      case 'GST_PST':
        return rate.gst_rate + rate.pst_rate
      case 'GST_QST':
        return rate.gst_rate + rate.qst_rate + (rate.gst_rate * rate.qst_rate)
      case 'GST_ONLY':
        return rate.gst_rate
      default:
        return 0
    }
  }

  const formatRate = (rate: number) => `${(rate * 100).toFixed(rate === 0 ? 0 : rate.toString().includes('9975') ? 3 : 2)}%`

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">Canadian Tax Rates (2025)</h3>
        </div>
        <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <RefreshCw className="w-4 h-4" />
          Refresh Rates
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left py-3 px-4 font-semibold text-gray-300">Province</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-300">Tax Type</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-300">GST</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-300">HST</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-300">PST</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-300">QST</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-300">Total</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-300">Status</th>
            </tr>
          </thead>
          <tbody>
            {taxRates.map((rate) => (
              <tr key={rate.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                <td className="py-3 px-4">
                  <div>
                    <div className="font-medium text-white">{rate.province_name}</div>
                    <div className="text-xs text-gray-400">{rate.province_code}</div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    rate.tax_type === 'HST' ? 'bg-blue-900/50 text-blue-300' :
                    rate.tax_type === 'GST_PST' ? 'bg-green-900/50 text-green-300' :
                    rate.tax_type === 'GST_QST' ? 'bg-purple-900/50 text-purple-300' :
                    'bg-gray-700/50 text-gray-300'
                  }`}>
                    {rate.tax_type.replace('_', ' + ')}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-white font-mono">
                  {rate.gst_rate > 0 ? formatRate(rate.gst_rate) : '—'}
                </td>
                <td className="py-3 px-4 text-right text-white font-mono">
                  {rate.hst_rate > 0 ? formatRate(rate.hst_rate) : '—'}
                </td>
                <td className="py-3 px-4 text-right text-white font-mono">
                  {rate.pst_rate > 0 ? formatRate(rate.pst_rate) : '—'}
                </td>
                <td className="py-3 px-4 text-right text-white font-mono">
                  {rate.qst_rate > 0 ? formatRate(rate.qst_rate) : '—'}
                </td>
                <td className="py-3 px-4 text-right text-white font-mono font-semibold">
                  {formatRate(getTotalRate(rate))}
                </td>
                <td className="py-3 px-4 text-right">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    rate.is_active ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                  }`}>
                    {rate.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-200">
            <p className="font-semibold mb-1">2025 Tax Rate Updates:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-300">
              <li><strong>Nova Scotia</strong>: HST reduced from 15% to 14% effective April 1, 2025</li>
              <li><strong>Quebec</strong>: QST calculated on GST-inclusive amount (compound tax)</li>
              <li><strong>Business Number</strong>: 743839342RT0001 (ANOINT Array)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function TaxSettingsForm() {
  const [settings, setSettings] = useState<TaxSettings>(SAMPLE_TAX_SETTINGS)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    // Show success message
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">Tax Configuration</h3>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Business Number (GST/HST Registration)
            </label>
            <input
              type="text"
              value={settings.business_number}
              onChange={(e) => setSettings({...settings, business_number: e.target.value})}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none font-mono"
              placeholder="123456789RT0001"
            />
            <p className="text-xs text-gray-400 mt-1">Format: 9-digit business number + RT + 4-digit account number</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={settings.company_name}
              onChange={(e) => setSettings({...settings, company_name: e.target.value})}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              GST Registration Threshold ($)
            </label>
            <input
              type="number"
              value={settings.registration_threshold}
              onChange={(e) => setSettings({...settings, registration_threshold: parseFloat(e.target.value) || 0})}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
              step="1000"
              min="0"
            />
            <p className="text-xs text-gray-400 mt-1">Businesses must register for GST/HST when exceeding this threshold</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tax Calculation Method
            </label>
            <select
              value={settings.tax_calculation_method}
              onChange={(e) => setSettings({...settings, tax_calculation_method: e.target.value as 'INCLUSIVE' | 'EXCLUSIVE'})}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
            >
              <option value="EXCLUSIVE">Tax Exclusive (add tax to price)</option>
              <option value="INCLUSIVE">Tax Inclusive (price includes tax)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Invoice Prefix
            </label>
            <input
              type="text"
              value={settings.invoice_prefix}
              onChange={(e) => setSettings({...settings, invoice_prefix: e.target.value})}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
              maxLength={10}
            />
            <p className="text-xs text-gray-400 mt-1">Used for generating invoice numbers (e.g., INV-20250101-0001)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Next Invoice Number
            </label>
            <input
              type="number"
              value={settings.invoice_counter}
              onChange={(e) => setSettings({...settings, invoice_counter: parseInt(e.target.value) || 1})}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
              min="1"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-200">
            <p className="font-semibold mb-1">CRA Invoice Requirements:</p>
            <ul className="list-disc list-inside space-y-1 text-yellow-300">
              <li>Business name and GST/HST registration number must appear on all invoices $100+</li>
              <li>Separate tax line items required for GST/HST and PST/QST where applicable</li>
              <li>Invoice date, customer information, and tax amounts must be clearly shown</li>
              <li>Digital receipts must meet same requirements as paper invoices</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TaxManagementPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <Layout>
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-purple-600 p-3 rounded-xl">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Tax Management</h1>
                <p className="text-gray-400">Manage Canadian GST/HST/PST rates and tax calculations</p>
              </div>
            </div>
          </div>

          {/* Tax Calculator */}
          <div className="mb-8">
            <TaxCalculator />
          </div>

          {/* Tax Rates Table */}
          <div className="mb-8">
            <TaxRatesTable />
          </div>

          {/* Tax Settings */}
          <div>
            <TaxSettingsForm />
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}