'use client'

// Simple test page to check if tax components render without authentication
import { useState } from 'react'
import { Calculator, Settings, FileText, MapPin, DollarSign } from 'lucide-react'

// Sample data copied from the main tax page
const SAMPLE_TAX_RATES = [
  { id: 1, province_code: 'AB', province_name: 'Alberta', gst_rate: 0.05, hst_rate: 0, pst_rate: 0, qst_rate: 0, tax_type: 'GST_ONLY', effective_date: '2025-01-01', is_active: true },
  { id: 2, province_code: 'BC', province_name: 'British Columbia', gst_rate: 0.05, hst_rate: 0, pst_rate: 0.07, qst_rate: 0, tax_type: 'GST_PST', effective_date: '2025-01-01', is_active: true },
  { id: 9, province_code: 'ON', province_name: 'Ontario', gst_rate: 0, hst_rate: 0.13, pst_rate: 0, qst_rate: 0, tax_type: 'HST', effective_date: '2025-01-01', is_active: true },
  { id: 7, province_code: 'NS', province_name: 'Nova Scotia', gst_rate: 0, hst_rate: 0.14, pst_rate: 0, qst_rate: 0, tax_type: 'HST', effective_date: '2025-04-01', is_active: true },
]

export default function TestTaxesPage() {
  const [amount, setAmount] = useState('100.00')
  const [selectedProvince, setSelectedProvince] = useState('ON')
  const [taxInclusive, setTaxInclusive] = useState(false)
  const [result, setResult] = useState<any>(null)

  const calculateTax = () => {
    const province = SAMPLE_TAX_RATES.find(rate => rate.province_code === selectedProvince)
    if (!province) return

    const baseAmount = parseFloat(amount) || 0
    let totalTax = 0

    if (province.tax_type === 'HST') {
      totalTax = baseAmount * province.hst_rate
    } else if (province.tax_type === 'GST_PST') {
      totalTax = baseAmount * (province.gst_rate + province.pst_rate)
    } else {
      totalTax = baseAmount * province.gst_rate
    }

    setResult({
      province: province.province_name,
      baseAmount,
      totalTax: parseFloat(totalTax.toFixed(2)),
      totalAmount: parseFloat((baseAmount + totalTax).toFixed(2))
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-purple-600 p-3 rounded-xl">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Tax Management Test</h1>
              <p className="text-gray-400">Testing tax components without authentication</p>
            </div>
          </div>
        </div>

        {/* Tax Calculator Test */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Tax Calculator Test</h3>
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
                Calculate
              </label>
              <button
                onClick={calculateTax}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 transition-colors"
              >
                Calculate Tax
              </button>
            </div>
          </div>

          {result && (
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-3">
                Tax Calculation for {result.province}
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Base Amount:</span>
                  <span className="text-white font-mono">${result.baseAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Tax:</span>
                  <span className="text-white font-mono">${result.totalTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t border-gray-600 pt-2">
                  <span className="text-purple-400">Total Amount:</span>
                  <span className="text-purple-400 font-mono">${result.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tax Rates Table Test */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Sample Tax Rates</h3>
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
                  <th className="text-right py-3 px-4 font-semibold text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_TAX_RATES.map((rate) => (
                  <tr key={rate.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{rate.province_name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-900/50 text-blue-300">
                        {rate.tax_type.replace('_', ' + ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-white font-mono">
                      {rate.gst_rate > 0 ? `${(rate.gst_rate * 100).toFixed(2)}%` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-white font-mono">
                      {rate.hst_rate > 0 ? `${(rate.hst_rate * 100).toFixed(2)}%` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-white font-mono">
                      {rate.pst_rate > 0 ? `${(rate.pst_rate * 100).toFixed(2)}%` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-900/50 text-green-300">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Test Info */}
        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <h4 className="text-blue-300 font-semibold mb-2">Test Information:</h4>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>• This is a simplified test page without authentication</li>
            <li>• Business Number: 743839342RT0001 (ANOINT Array)</li>
            <li>• Nova Scotia: 14% HST (updated 2025 rate)</li>
            <li>• Ontario: 13% HST should show $13.00 on $100</li>
            <li>• BC: 5% GST + 7% PST should show $12.00 on $100</li>
          </ul>
        </div>
      </div>
    </div>
  )
}