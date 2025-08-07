'use client'

import { OrderItem } from '@/lib/orders'
import { getProductById } from '@/lib/products'
import { formatCurrency } from '@/lib/orders'
import { Package } from 'lucide-react'

interface OrderItemTooltipProps {
  items: OrderItem[]
  show: boolean
  position: { x: number; y: number }
}

const OrderItemTooltip: React.FC<OrderItemTooltipProps> = ({ items, show, position }) => {
  if (!show || items.length === 0) return null

  return (
    <div 
      className="fixed z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-4 min-w-80 max-w-96 animate-in fade-in-0 zoom-in-95 duration-200"
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
        <div className="flex items-center gap-2 border-b border-gray-700 pb-2">
          <Package size={16} className="text-purple-400" />
          <h4 className="text-white font-medium">Order Items ({items.length})</h4>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {items.map((item) => {
            const product = getProductById(item.productId)
            const mainImage = product?.images[product.mainImageIndex || 0]
            const subtotal = item.price * item.quantity

            return (
              <div key={item.id} className="flex gap-3 p-2 bg-gray-700/30 rounded">
                {/* Product Image */}
                <div className="flex-shrink-0 w-16 h-16 bg-gray-600 rounded overflow-hidden">
                  {mainImage ? (
                    <img
                      src={mainImage}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={20} className="text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <h5 className="text-white text-sm font-medium truncate" title={item.title}>{item.title}</h5>
                  <p className="text-gray-400 text-xs">{item.sku}</p>
                  
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-gray-300 text-xs">
                      Qty: {item.quantity} × {formatCurrency(item.price)}
                    </span>
                    <span className="text-purple-400 text-sm font-medium">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>

                  {/* Product Type Badge */}
                  <div className="mt-1">
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                      item.productType === 'digital' 
                        ? 'bg-blue-500/20 text-blue-300' 
                        : 'bg-green-500/20 text-green-300'
                    }`}>
                      {item.productType === 'digital' ? 'Digital' : 'Physical'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Total */}
        {items.length > 1 && (
          <div className="border-t border-gray-700 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-medium">Subtotal:</span>
              <span className="text-white font-semibold">
                {formatCurrency(items.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderItemTooltip