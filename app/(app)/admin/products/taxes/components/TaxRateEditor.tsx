'use client'

import { useState, useEffect } from 'react'
import { 
  XMarkIcon, 
  CheckIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline'
import { TaxRate, TaxApiResponse, TAX_TYPE_DESCRIPTIONS } from '../types/tax-types'

interface TaxRateEditorProps {
  rate: TaxRate | null
  isOpen: boolean
  onClose: () => void
  onSave: (rate: TaxRate) => void
}

export default function TaxRateEditor({ rate, isOpen, onClose, onSave }: TaxRateEditorProps) {
  const [formData, setFormData] = useState<Partial<TaxRate>>({})
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (rate && isOpen) {
      setFormData(rate)
      setErrors({})
    }
  }, [rate, isOpen])

  const validateRate = (value: string, field: string): number | null => {
    const num = parseFloat(value)
    if (isNaN(num)) {
      setErrors(prev => ({ ...prev, [field]: 'Must be a valid number' }))
      return null
    }
    if (num < 0 || num > 1) {
      setErrors(prev => ({ ...prev, [field]: 'Rate must be between 0 and 1 (e.g., 0.13 for 13%)' }))
      return null
    }
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
    return num
  }

  const handleRateChange = (field: keyof TaxRate, value: string) => {
    if (field.endsWith('_rate')) {
      const validatedRate = validateRate(value, field)
      if (validatedRate !== null) {
        setFormData(prev => ({ ...prev, [field]: validatedRate }))
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const getPreview = () => {
    if (!formData.tax_type) return ''
    
    const gst = formData.gst_rate || 0
    const hst = formData.hst_rate || 0
    const pst = formData.pst_rate || 0
    const qst = formData.qst_rate || 0

    switch (formData.tax_type) {
      case 'GST_ONLY':
        return `Total: ${(gst * 100).toFixed(2)}% (GST: ${(gst * 100).toFixed(2)}%)`
      case 'HST':
        return `Total: ${(hst * 100).toFixed(2)}% (HST: ${(hst * 100).toFixed(2)}%)`
      case 'GST_PST':
        return `Total: ${((gst + pst) * 100).toFixed(2)}% (GST: ${(gst * 100).toFixed(2)}% + PST: ${(pst * 100).toFixed(2)}%)`
      case 'GST_QST':
        const effective = gst + qst * (1 + gst)
        return `Total: ${(effective * 100).toFixed(2)}% (GST: ${(gst * 100).toFixed(2)}% + QST: ${(qst * 100).toFixed(2)}% on GST-inclusive)`
      default:
        return ''
    }
  }

  const handleSave = async () => {
    if (!rate) return

    // Validate all required fields
    const newErrors: Record<string, string> = {}
    
    if (!formData.tax_type) {
      newErrors.tax_type = 'Tax type is required'
    }

    // Validate rates based on tax type
    if (formData.tax_type) {
      switch (formData.tax_type) {
        case 'GST_ONLY':
          if (!formData.gst_rate) newErrors.gst_rate = 'GST rate is required'
          break
        case 'HST':
          if (!formData.hst_rate) newErrors.hst_rate = 'HST rate is required'
          break
        case 'GST_PST':
          if (!formData.gst_rate) newErrors.gst_rate = 'GST rate is required'
          if (!formData.pst_rate) newErrors.pst_rate = 'PST rate is required'
          break
        case 'GST_QST':
          if (!formData.gst_rate) newErrors.gst_rate = 'GST rate is required'
          if (!formData.qst_rate) newErrors.qst_rate = 'QST rate is required'
          break
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/taxes/rates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...rate,
          ...formData,
          updated_at: new Date().toISOString()
        })
      })

      const data: TaxApiResponse<TaxRate> = await response.json()
      
      if (data.success && data.data) {
        onSave(data.data)
        onClose()
      } else {
        setErrors({ general: data.error || 'Failed to save tax rate' })
      }
    } catch (err) {
      setErrors({ general: 'Network error saving tax rate' })
      console.error('Tax rate save error:', err)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen || !rate) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">Edit Tax Rate</h2>
            <p className="text-gray-400 text-sm mt-1">
              {rate.province_name} ({rate.province_code})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {errors.general && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                <span className="text-red-400">{errors.general}</span>
              </div>
            </div>
          )}

          {/* Tax Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tax Type
            </label>
            <select
              value={formData.tax_type || ''}
              onChange={(e) => handleRateChange('tax_type', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="">Select tax type...</option>
              {Object.entries(TAX_TYPE_DESCRIPTIONS).map(([key, description]) => (
                <option key={key} value={key}>{key} - {description}</option>
              ))}
            </select>
            {errors.tax_type && (
              <p className="text-red-400 text-sm mt-1">{errors.tax_type}</p>
            )}
          </div>

          {/* Tax Rate Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* GST Rate */}
            {(formData.tax_type === 'GST_ONLY' || formData.tax_type === 'GST_PST' || formData.tax_type === 'GST_QST') && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  GST Rate (Federal)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  max="1"
                  value={formData.gst_rate || ''}
                  onChange={(e) => handleRateChange('gst_rate', e.target.value)}
                  placeholder="0.05 (for 5%)"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
                {errors.gst_rate && (
                  <p className="text-red-400 text-sm mt-1">{errors.gst_rate}</p>
                )}
              </div>
            )}

            {/* HST Rate */}
            {formData.tax_type === 'HST' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  HST Rate (Harmonized)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  max="1"
                  value={formData.hst_rate || ''}
                  onChange={(e) => handleRateChange('hst_rate', e.target.value)}
                  placeholder="0.13 (for 13%)"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
                {errors.hst_rate && (
                  <p className="text-red-400 text-sm mt-1">{errors.hst_rate}</p>
                )}
              </div>
            )}

            {/* PST Rate */}
            {formData.tax_type === 'GST_PST' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  PST Rate (Provincial)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  max="1"
                  value={formData.pst_rate || ''}
                  onChange={(e) => handleRateChange('pst_rate', e.target.value)}
                  placeholder="0.07 (for 7%)"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
                {errors.pst_rate && (
                  <p className="text-red-400 text-sm mt-1">{errors.pst_rate}</p>
                )}
              </div>
            )}

            {/* QST Rate */}
            {formData.tax_type === 'GST_QST' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  QST Rate (Quebec)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  max="1"
                  value={formData.qst_rate || ''}
                  onChange={(e) => handleRateChange('qst_rate', e.target.value)}
                  placeholder="0.09975 (for 9.975%)"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
                {errors.qst_rate && (
                  <p className="text-red-400 text-sm mt-1">{errors.qst_rate}</p>
                )}
                <p className="text-blue-400 text-xs mt-1">
                  QST is calculated on GST-inclusive amount
                </p>
              </div>
            )}
          </div>

          {/* Status Toggle */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.is_active ?? true}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-300">Tax rate is active</span>
            </label>
          </div>

          {/* Tax Preview */}
          {formData.tax_type && (
            <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <InformationCircleIcon className="h-5 w-5 text-purple-400 mt-0.5" />
                <div>
                  <h4 className="text-purple-400 font-medium mb-1">Tax Calculation Preview</h4>
                  <p className="text-purple-300 text-sm">{getPreview()}</p>
                  <p className="text-purple-300 text-xs mt-1">
                    {TAX_TYPE_DESCRIPTIONS[formData.tax_type as keyof typeof TAX_TYPE_DESCRIPTIONS]}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || Object.keys(errors).length > 0}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center space-x-2 transition-colors"
          >
            {saving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}