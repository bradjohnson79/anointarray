'use client'

import { useState, useEffect } from 'react'
import { 
  PencilIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline'
import { TaxRate, TaxApiResponse, TAX_TYPE_DESCRIPTIONS } from '../types/tax-types'

interface TaxRatesTableProps {
  onEditRate: (rate: TaxRate) => void
}

export default function TaxRatesTable({ onEditRate }: TaxRatesTableProps) {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    fetchTaxRates()
  }, [])

  const fetchTaxRates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/taxes/rates')
      const data: TaxApiResponse<TaxRate[]> = await response.json()
      
      if (data.success && data.data) {
        setTaxRates(data.data)
      } else {
        setError(data.error || 'Failed to fetch tax rates')
      }
    } catch (err) {
      setError('Network error fetching tax rates')
      console.error('Tax rates fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleRateStatus = async (rate: TaxRate) => {
    try {
      setUpdatingId(rate.id)
      const response = await fetch('/api/taxes/rates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...rate,
          is_active: !rate.is_active
        })
      })

      const data: TaxApiResponse<TaxRate> = await response.json()
      
      if (data.success && data.data) {
        setTaxRates(prev => prev.map(r => 
          r.id === rate.id ? data.data! : r
        ))
      } else {
        setError(data.error || 'Failed to update tax rate status')
      }
    } catch (err) {
      setError('Network error updating tax rate')
      console.error('Tax rate update error:', err)
    } finally {
      setUpdatingId(null)
    }
  }

  const formatRate = (rate: number) => {
    return `${(rate * 100).toFixed(2)}%`
  }

  const getEffectiveRate = (rate: TaxRate) => {
    switch (rate.tax_type) {
      case 'GST_ONLY':
        return rate.gst_rate
      case 'HST':
        return rate.hst_rate
      case 'GST_PST':
        return rate.gst_rate + rate.pst_rate
      case 'GST_QST':
        return rate.gst_rate + rate.qst_rate * (1 + rate.gst_rate)
      default:
        return 0
    }
  }

  const getDisplayRates = (rate: TaxRate) => {
    switch (rate.tax_type) {
      case 'GST_ONLY':
        return `GST: ${formatRate(rate.gst_rate)}`
      case 'HST':
        return `HST: ${formatRate(rate.hst_rate)}`
      case 'GST_PST':
        return `GST: ${formatRate(rate.gst_rate)} + PST: ${formatRate(rate.pst_rate)}`
      case 'GST_QST':
        return `GST: ${formatRate(rate.gst_rate)} + QST: ${formatRate(rate.qst_rate)} (on GST-inclusive)`
      default:
        return 'Unknown'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <XCircleIcon className="h-5 w-5 text-red-400" />
          <span className="text-red-400">Error loading tax rates: {error}</span>
        </div>
        <button 
          onClick={fetchTaxRates}
          className="mt-3 text-red-300 hover:text-red-200 underline text-sm"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Canadian Provincial Tax Rates</h3>
        <button
          onClick={fetchTaxRates}
          className="text-sm text-purple-400 hover:text-purple-300"
        >
          Refresh
        </button>
      </div>

      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-4">
        <div className="flex items-start space-x-2">
          <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="text-blue-300 text-sm">
            <p className="font-medium mb-1">Canadian Tax System Overview:</p>
            <ul className="space-y-1 text-xs">
              <li>• <strong>GST:</strong> 5% federal tax applied nationwide</li>
              <li>• <strong>HST:</strong> Combined federal and provincial tax in some provinces</li>
              <li>• <strong>PST:</strong> Provincial sales tax separate from GST</li>
              <li>• <strong>QST:</strong> Quebec sales tax calculated on GST-inclusive amount</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full bg-gray-800 rounded-lg">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-4 px-4 text-gray-300 font-medium">Province</th>
              <th className="text-left py-4 px-4 text-gray-300 font-medium">Tax Type</th>
              <th className="text-left py-4 px-4 text-gray-300 font-medium">Tax Breakdown</th>
              <th className="text-left py-4 px-4 text-gray-300 font-medium">Effective Rate</th>
              <th className="text-left py-4 px-4 text-gray-300 font-medium">Status</th>
              <th className="text-left py-4 px-4 text-gray-300 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {taxRates.map((rate) => (
              <tr key={rate.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                <td className="py-4 px-4">
                  <div>
                    <div className="font-medium text-white">{rate.province_name}</div>
                    <div className="text-sm text-gray-400">{rate.province_code}</div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div>
                    <div className="text-white font-medium">{rate.tax_type}</div>
                    <div className="text-xs text-gray-400 max-w-48">
                      {TAX_TYPE_DESCRIPTIONS[rate.tax_type]}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm text-gray-300">
                    {getDisplayRates(rate)}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-lg font-bold text-purple-400">
                    {formatRate(getEffectiveRate(rate))}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <button
                    onClick={() => toggleRateStatus(rate)}
                    disabled={updatingId === rate.id}
                    className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                      rate.is_active 
                        ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' 
                        : 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                    }`}
                  >
                    {updatingId === rate.id ? (
                      <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
                    ) : rate.is_active ? (
                      <CheckCircleIcon className="h-3 w-3" />
                    ) : (
                      <XCircleIcon className="h-3 w-3" />
                    )}
                    <span>{rate.is_active ? 'Active' : 'Inactive'}</span>
                  </button>
                </td>
                <td className="py-4 px-4">
                  <button
                    onClick={() => onEditRate(rate)}
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-gray-400 mt-4">
        Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  )
}