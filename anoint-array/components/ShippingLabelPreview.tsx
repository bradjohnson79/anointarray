'use client'

import { ShippingLabel } from '@/lib/orders'
import { X, Printer, Download } from 'lucide-react'

interface ShippingLabelPreviewProps {
  label: ShippingLabel
  show: boolean
  onClose: () => void
}

const ShippingLabelPreview: React.FC<ShippingLabelPreviewProps> = ({ label, show, onClose }) => {
  if (!show) return null

  const isCanadaPost = label.carrier === 'canada-post'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Shipping Label Preview</h3>
              <p className="text-gray-400 mt-1">
                {isCanadaPost ? 'Canada Post' : 'UPS'} • {label.service} • {label.labelSize}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Label Preview */}
          <div className="bg-white text-black p-8 rounded-lg font-mono text-sm">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {isCanadaPost ? 'CANADA POST' : 'UPS'}
                </div>
                <div className="text-lg font-semibold">
                  {label.service.toUpperCase()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs">TRACKING NUMBER</div>
                <div className="text-2xl font-bold">{label.trackingNumber}</div>
              </div>
            </div>

            {/* Barcode Simulation */}
            <div className="mb-6">
              <div className="bg-black h-16 w-full flex items-center justify-center text-white font-bold">
                {label.trackingNumber}
              </div>
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div>
                <div className="font-bold mb-2">FROM:</div>
                <div>ANOINT Array</div>
                <div>123 Spiritual Street</div>
                <div>Toronto, ON M5V 3A8</div>
                <div>Canada</div>
              </div>
              <div>
                <div className="font-bold mb-2">TO:</div>
                <div>Sample Customer</div>
                <div>456 Delivery Avenue</div>
                <div>City, Province</div>
                <div>Postal Code</div>
              </div>
            </div>

            {/* Service Details */}
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <div className="font-bold">SERVICE</div>
                <div>{label.service}</div>
              </div>
              <div>
                <div className="font-bold">WEIGHT</div>
                <div>2.5 kg</div>
              </div>
              <div>
                <div className="font-bold">DATE</div>
                <div>{new Date(label.createdAt).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-300 text-xs text-center">
              <div>Label ID: {label.id}</div>
              <div>Order ID: {label.orderId}</div>
              <div className="mt-2 text-red-600 font-bold">
                4" x 6" THERMAL LABEL - {label.labelFormat}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-6">
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              onClick={() => {
                // Simulate print
                alert(`Printing ${isCanadaPost ? 'Canada Post' : 'UPS'} label...`)
              }}
            >
              <Printer size={16} />
              Print Label
            </button>
            
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              onClick={() => {
                // Simulate download
                alert(`Downloading label PDF...`)
              }}
            >
              <Download size={16} />
              Download PDF
            </button>

            <button 
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              onClick={() => {
                // Simulate email
                alert('Label emailed to customer')
              }}
            >
              Email Customer
            </button>
          </div>

          {/* Label Information */}
          <div className="mt-6 grid grid-cols-2 gap-4 p-4 bg-gray-700/30 rounded-lg text-sm">
            <div>
              <div className="text-gray-400">Carrier:</div>
              <div className="text-white capitalize">{label.carrier.replace('-', ' ')}</div>
            </div>
            <div>
              <div className="text-gray-400">Service:</div>
              <div className="text-white">{label.service}</div>
            </div>
            <div>
              <div className="text-gray-400">Tracking:</div>
              <div className="text-white font-mono">{label.trackingNumber}</div>
            </div>
            <div>
              <div className="text-gray-400">Cost:</div>
              <div className="text-white">${label.cost.toFixed(2)} CAD</div>
            </div>
            <div>
              <div className="text-gray-400">Format:</div>
              <div className="text-white">{label.labelFormat}</div>
            </div>
            <div>
              <div className="text-gray-400">Size:</div>
              <div className="text-white">{label.labelSize}</div>
            </div>
          </div>

          {/* Testing Notes */}
          <div className="mt-6 p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg">
            <div className="text-blue-300 font-medium mb-2">Testing Information</div>
            <div className="text-sm text-gray-300 space-y-1">
              <div>• This is a mock shipping label for testing purposes</div>
              <div>• Real labels would be generated via {isCanadaPost ? 'Canada Post' : 'UPS'} API</div>
              <div>• Thermal printer (4"x6") format optimized for shipping labels</div>
              <div>• Production labels include proper barcodes and postage</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShippingLabelPreview