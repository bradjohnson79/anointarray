'use client'

import { useState } from 'react'
import { 
  CalculatorIcon, 
  InformationCircleIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline'
import { 
  TaxCalculationRequest, 
  TaxCalculationResult, 
  TaxApiResponse, 
  CANADIAN_PROVINCES 
} from '../types/tax-types'

export default function TaxCalculator() {
  const [request, setRequest] = useState<TaxCalculationRequest>({
    amount: 100,
    province_code: 'ON',
    is_tax_inclusive: false,
    product_type: 'physical'
  })
  const [result, setResult] = useState<TaxCalculationResult | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculateTax = async () => {
    setCalculating(true)
    setError(null)
    
    try {
      const response = await fetch('/api/taxes/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      const data: TaxApiResponse<TaxCalculationResult> = await response.json()
      
      if (data.success && data.data) {
        setResult(data.data)
      } else {
        setError(data.error || 'Failed to calculate taxes')
        setResult(null)
      }
    } catch (err) {
      setError('Network error calculating taxes')
      setResult(null)
      console.error('Tax calculation error:', err)
    } finally {
      setCalculating(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount)
  }

  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(4)}%`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <CalculatorIcon className="h-6 w-6 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">Tax Calculator</h3>
      </div>

      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="text-blue-300 text-sm">
            <p>Use this calculator to test tax calculations with current rates. Enter an amount, select a province, and specify whether the amount includes or excludes taxes.</p>
          </div>
        </div>
      </div>

      {/* Calculator Form */}
      <div className="bg-gray-800 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount (CAD)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={request.amount}
              onChange={(e) => setRequest(prev => ({ 
                ...prev, 
                amount: parseFloat(e.target.value) || 0 
              }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Province */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Province/Territory
            </label>
            <select
              value={request.province_code}
              onChange={(e) => setRequest(prev => ({ 
                ...prev, 
                province_code: e.target.value 
              }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
            >
              {CANADIAN_PROVINCES.map(province => (
                <option key={province.code} value={province.code}>
                  {province.name} ({province.code})
                </option>
              ))}
            </select>
          </div>

          {/* Tax Inclusive */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tax Calculation Type
            </label>
            <select
              value={request.is_tax_inclusive ? 'inclusive' : 'exclusive'}
              onChange={(e) => setRequest(prev => ({ 
                ...prev, 
                is_tax_inclusive: e.target.value === 'inclusive' 
              }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="exclusive">Tax Exclusive (add tax to amount)</option>
              <option value="inclusive">Tax Inclusive (extract tax from amount)</option>
            </select>
          </div>

          {/* Product Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Product Type
            </label>
            <select
              value={request.product_type || 'physical'}
              onChange={(e) => setRequest(prev => ({ 
                ...prev, 
                product_type: e.target.value as 'physical' | 'digital' 
              }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="physical">Physical Product</option>
              <option value="digital">Digital Product</option>
            </select>
          </div>
        </div>

        <button
          onClick={calculateTax}
          disabled={calculating || request.amount <= 0}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
        >
          {calculating ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              <span>Calculating...</span>
            </>
          ) : (
            <>
              <CalculatorIcon className="h-5 w-5" />
              <span>Calculate Taxes</span>
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Calculation Results</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Summary */}
            <div className="space-y-3">
              <h5 className="text-purple-400 font-medium">Summary</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Province:</span>
                  <span className="text-white">{result.province_name} ({result.province_code})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tax System:</span>
                  <span className="text-white">{result.tax_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Base Amount:</span>
                  <span className="text-white">{formatCurrency(result.base_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Tax:</span>
                  <span className="text-green-400 font-medium">{formatCurrency(result.total_tax)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-700 pt-2">
                  <span className="text-gray-400 font-medium">Total Amount:</span>
                  <span className="text-purple-400 font-bold text-lg">{formatCurrency(result.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Effective Rate:</span>
                  <span className="text-yellow-400">{formatPercentage(result.effective_rate)}</span>
                </div>
              </div>
            </div>

            {/* Tax Breakdown */}
            <div className="space-y-3">
              <h5 className="text-purple-400 font-medium">Tax Breakdown</h5>
              <div className="space-y-2 text-sm">
                {result.tax_breakdown.gst.rate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">GST ({formatPercentage(result.tax_breakdown.gst.rate)}):</span>
                    <span className="text-white">{formatCurrency(result.tax_breakdown.gst.amount)}</span>
                  </div>
                )}
                {result.tax_breakdown.hst.rate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">HST ({formatPercentage(result.tax_breakdown.hst.rate)}):</span>
                    <span className="text-white">{formatCurrency(result.tax_breakdown.hst.amount)}</span>
                  </div>
                )}
                {result.tax_breakdown.pst.rate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">PST ({formatPercentage(result.tax_breakdown.pst.rate)}):</span>
                    <span className="text-white">{formatCurrency(result.tax_breakdown.pst.amount)}</span>
                  </div>
                )}
                {result.tax_breakdown.qst.rate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">QST ({formatPercentage(result.tax_breakdown.qst.rate)}):</span>
                    <span className="text-white">{formatCurrency(result.tax_breakdown.qst.amount)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Special Notes for Quebec */}
          {result.tax_type === 'GST_QST' && (
            <div className="mt-4 bg-blue-900/20 border border-blue-700 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <InformationCircleIcon className="h-4 w-4 text-blue-400 mt-0.5" />
                <div className="text-blue-300 text-xs">
                  <p><strong>Quebec QST Calculation:</strong> QST is calculated on the GST-inclusive amount, which is why the effective rate appears higher than simply adding GST + QST rates.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}