'use client'

import { useState } from 'react'
import { 
  CurrencyDollarIcon, 
  Cog6ToothIcon, 
  CalculatorIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline'
import TaxRatesTable from '../taxes/components/TaxRatesTable'
import TaxRateEditor from '../taxes/components/TaxRateEditor'
import TaxCalculator from '../taxes/components/TaxCalculator'
import { TaxRate } from '../taxes/types/tax-types'

type TaxView = 'rates' | 'calculator' | 'settings'

export default function TaxesTab() {
  const [currentView, setCurrentView] = useState<TaxView>('rates')
  const [editingRate, setEditingRate] = useState<TaxRate | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  const handleEditRate = (rate: TaxRate) => {
    setEditingRate(rate)
    setIsEditorOpen(true)
  }

  const handleSaveRate = (rate: TaxRate) => {
    setIsEditorOpen(false)
    setEditingRate(null)
    // Force refresh of the rates table
    window.location.reload()
  }

  const handleCloseEditor = () => {
    setIsEditorOpen(false)
    setEditingRate(null)
  }

  const navItems = [
    {
      id: 'rates' as const,
      label: 'Tax Rates',
      icon: CurrencyDollarIcon,
      description: 'Manage Canadian provincial tax rates'
    },
    {
      id: 'calculator' as const,
      label: 'Calculator',
      icon: CalculatorIcon,
      description: 'Test tax calculations'
    },
    {
      id: 'settings' as const,
      label: 'Settings',
      icon: Cog6ToothIcon,
      description: 'Tax configuration settings'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-700 pb-6">
        <div className="flex items-center space-x-3 mb-2">
          <CurrencyDollarIcon className="h-8 w-8 text-purple-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Tax Management</h2>
            <p className="text-gray-400">Manage Canadian tax rates and calculations</p>
          </div>
        </div>
        
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mt-4">
          <div className="flex items-start space-x-2">
            <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="text-blue-300 text-sm">
              <p className="font-medium mb-1">Canadian Tax System</p>
              <p>This system supports all Canadian provinces and territories with their specific tax structures including GST, HST, PST, and QST calculations.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap gap-2">
        {navItems.map(item => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                currentView === item.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Icon className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs opacity-75">{item.description}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="min-h-[600px]">
        {currentView === 'rates' && (
          <TaxRatesTable onEditRate={handleEditRate} />
        )}
        
        {currentView === 'calculator' && (
          <TaxCalculator />
        )}
        
        {currentView === 'settings' && (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <Cog6ToothIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Tax Settings</h3>
            <p className="text-gray-400 mb-4">
              Advanced tax configuration settings will be available here.
            </p>
            <div className="text-sm text-gray-500">
              Features coming soon:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Global tax exemption rules</li>
                <li>Product category tax overrides</li>
                <li>Tax reporting configuration</li>
                <li>Integration settings</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Tax Rate Editor Modal */}
      <TaxRateEditor
        rate={editingRate}
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
        onSave={handleSaveRate}
      />
    </div>
  )
}