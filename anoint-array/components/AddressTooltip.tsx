'use client'

import { ShippingAddress } from '@/lib/orders'
import { MapPin, Phone, Building, Copy } from 'lucide-react'

interface AddressTooltipProps {
  address: ShippingAddress
  show: boolean
  position: { x: number; y: number }
}

const AddressTooltip: React.FC<AddressTooltipProps> = ({ address, show, position }) => {
  if (!show) return null

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Address copied to clipboard!')
  }

  const formatFullAddress = () => {
    let fullAddress = address.name
    if (address.company) fullAddress += `\n${address.company}`
    fullAddress += `\n${address.address1}`
    if (address.address2) fullAddress += `\n${address.address2}`
    fullAddress += `\n${address.city}, ${address.province} ${address.postalCode}`
    fullAddress += `\n${address.country}`
    if (address.phone) fullAddress += `\nPhone: ${address.phone}`
    return fullAddress
  }

  return (
    <div 
      className="fixed z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-4 min-w-64 max-w-80 animate-in fade-in-0 zoom-in-95 duration-200"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: '-8px'
      }}
    >
      {/* Arrow */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
        <div className="w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-gray-800"></div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-gray-700 pb-2">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-purple-400" />
            <h4 className="text-white font-medium">Shipping Address</h4>
          </div>
          <button
            onClick={() => copyToClipboard(formatFullAddress())}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Copy Address"
          >
            <Copy size={14} />
          </button>
        </div>

        <div className="space-y-2">
          {/* Recipient Name */}
          <div>
            <div className="text-white font-medium">{address.name}</div>
            {address.company && (
              <div className="flex items-center gap-1 text-gray-300 text-sm">
                <Building size={12} />
                <span>{address.company}</span>
              </div>
            )}
          </div>

          {/* Address Lines */}
          <div className="text-gray-300 text-sm space-y-1">
            <div>{address.address1}</div>
            {address.address2 && <div>{address.address2}</div>}
            <div>
              <span className="font-medium">{address.city}</span>, {address.province} {address.postalCode}
            </div>
            <div className="text-gray-400">{address.country}</div>
          </div>

          {/* Phone */}
          {address.phone && (
            <div className="flex items-center gap-2 pt-1">
              <Phone size={12} className="text-gray-400" />
              <span className="text-gray-300 text-sm">{address.phone}</span>
            </div>
          )}
        </div>

        {/* Postal Code Validation */}
        <div className="pt-2 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs">Postal Code:</span>
            <div className="flex items-center gap-1">
              <span className="text-white text-sm font-mono">{address.postalCode}</span>
              <div className={`w-2 h-2 rounded-full ${
                /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(address.postalCode) 
                  ? 'bg-green-400' 
                  : 'bg-yellow-400'
              }`} title={
                /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(address.postalCode) 
                  ? 'Valid Canadian postal code' 
                  : 'Check postal code format'
              } />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddressTooltip