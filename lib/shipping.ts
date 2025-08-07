// Shipping Rate Calculations and API Integrations

export interface ShippingAddress {
  name: string
  company?: string
  address1: string
  address2?: string
  city: string
  province: string
  postalCode: string
  country: string
  phone?: string
}

export interface ShippingRate {
  id: string
  name: string
  description: string
  price: number
  estimatedDays: string
  carrier: 'canada-post' | 'ups'
  serviceCode: string
  guaranteed: boolean
}

export interface CartItem {
  productId: string
  quantity: number
  product: {
    title: string
    price: number
    weight?: number
    dimensions?: {
      length: number
      width: number
      height: number
    }
    productType: 'physical' | 'digital'
  }
}

// Mock shipping rates - In production, these would come from Canada Post and UPS APIs
const MOCK_SHIPPING_RATES: ShippingRate[] = [
  {
    id: 'cp-regular',
    name: 'Canada Post Regular Parcel',
    description: 'Standard ground delivery',
    price: 12.99,
    estimatedDays: '5-8 business days',
    carrier: 'canada-post',
    serviceCode: 'DOM.RP',
    guaranteed: false
  },
  {
    id: 'cp-expedited',
    name: 'Canada Post Expedited Parcel',
    description: 'Faster ground delivery with tracking',
    price: 18.99,
    estimatedDays: '2-3 business days',
    carrier: 'canada-post',
    serviceCode: 'DOM.EP',
    guaranteed: false
  },
  {
    id: 'cp-xpresspost',
    name: 'Canada Post Xpresspost',
    description: 'Next business day delivery',
    price: 26.99,
    estimatedDays: '1-2 business days',
    carrier: 'canada-post',
    serviceCode: 'DOM.XP',
    guaranteed: true
  },
  {
    id: 'ups-ground',
    name: 'UPS Ground',
    description: 'Reliable ground delivery',
    price: 15.49,
    estimatedDays: '3-5 business days',
    carrier: 'ups',
    serviceCode: '03',
    guaranteed: false
  },
  {
    id: 'ups-3day',
    name: 'UPS 3 Day Select',
    description: 'Guaranteed 3-day delivery',
    price: 24.99,
    estimatedDays: '3 business days',
    carrier: 'ups',
    serviceCode: '12',
    guaranteed: true
  },
  {
    id: 'ups-2day',
    name: 'UPS 2nd Day Air',
    description: 'Guaranteed 2-day delivery',
    price: 34.99,
    estimatedDays: '2 business days',
    carrier: 'ups',
    serviceCode: '02',
    guaranteed: true
  },
  {
    id: 'ups-overnight',
    name: 'UPS Next Day Air',
    description: 'Guaranteed next business day',
    price: 49.99,
    estimatedDays: '1 business day',
    carrier: 'ups',
    serviceCode: '01',
    guaranteed: true
  }
]

export function calculateCartWeight(items: CartItem[]): number {
  return items.reduce((total, item) => {
    if (item.product.productType === 'digital') return total
    return total + (item.product.weight || 0) * item.quantity
  }, 0)
}

export function calculateCartDimensions(items: CartItem[]): { length: number; width: number; height: number } {
  // Simplified box packing - in production this would be more sophisticated
  const physicalItems = items.filter(item => item.product.productType === 'physical')
  
  if (physicalItems.length === 0) {
    return { length: 0, width: 0, height: 0 }
  }

  // Find maximum dimensions and add some padding
  const maxLength = Math.max(...physicalItems.map(item => item.product.dimensions?.length || 10))
  const maxWidth = Math.max(...physicalItems.map(item => item.product.dimensions?.width || 10))
  const totalHeight = physicalItems.reduce((total, item) => 
    total + (item.product.dimensions?.height || 5) * item.quantity, 0
  )

  return {
    length: maxLength + 5, // Add 5cm padding
    width: maxWidth + 5,
    height: Math.max(totalHeight + 3, 10) // Minimum 10cm height
  }
}

export function hasPhysicalItems(items: CartItem[]): boolean {
  return items.some(item => item.product.productType === 'physical')
}

export async function getShippingRates(
  items: CartItem[],
  shippingAddress: ShippingAddress
): Promise<ShippingRate[]> {
  // If cart has no physical items, return empty array
  if (!hasPhysicalItems(items)) {
    return []
  }

  // Calculate total weight and dimensions
  const totalWeight = calculateCartWeight(items)
  const dimensions = calculateCartDimensions(items)

  // In production, this would make actual API calls to Canada Post and UPS
  // For now, we'll simulate the API calls and adjust rates based on weight/distance

  await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate API delay

  // Mock rate adjustments based on weight and destination
  const adjustedRates = MOCK_SHIPPING_RATES.map(rate => {
    let adjustedPrice = rate.price

    // Weight adjustments
    if (totalWeight > 2) {
      adjustedPrice += (totalWeight - 2) * 2.50 // $2.50 per kg over 2kg
    }

    // Distance/location adjustments (simplified)
    if (shippingAddress.province !== 'ON') {
      adjustedPrice += 3.00 // Add $3 for out-of-province
    }

    // Size adjustments for large packages
    const volume = dimensions.length * dimensions.width * dimensions.height
    if (volume > 50000) { // 50,000 cm³
      adjustedPrice += 8.00
    }

    return {
      ...rate,
      price: Math.round(adjustedPrice * 100) / 100 // Round to 2 decimal places
    }
  })

  // Sort by price (cheapest first)
  return adjustedRates.sort((a, b) => a.price - b.price)
}

export function calculateTax(subtotal: number, shippingCost: number, province: string): {
  hst: number
  gst: number
  pst: number
  total: number
} {
  const taxableAmount = subtotal + shippingCost
  let hst = 0
  let gst = 0
  let pst = 0

  switch (province) {
    case 'ON':
      hst = taxableAmount * 0.13 // 13% HST
      break
    case 'BC':
      gst = taxableAmount * 0.05 // 5% GST
      pst = taxableAmount * 0.07 // 7% PST
      break
    case 'AB':
      gst = taxableAmount * 0.05 // 5% GST only
      break
    case 'SK':
      gst = taxableAmount * 0.05 // 5% GST
      pst = taxableAmount * 0.06 // 6% PST
      break
    case 'MB':
      gst = taxableAmount * 0.05 // 5% GST
      pst = taxableAmount * 0.07 // 7% PST
      break
    case 'QC':
      gst = taxableAmount * 0.05 // 5% GST
      pst = taxableAmount * 0.09975 // 9.975% QST
      break
    case 'NB':
    case 'NL':
    case 'NS':
    case 'PE':
      hst = taxableAmount * 0.15 // 15% HST
      break
    case 'NT':
    case 'NU':
    case 'YT':
      gst = taxableAmount * 0.05 // 5% GST only
      break
    default:
      gst = taxableAmount * 0.05 // Default to 5% GST
  }

  const total = hst + gst + pst

  return {
    hst: Math.round(hst * 100) / 100,
    gst: Math.round(gst * 100) / 100,
    pst: Math.round(pst * 100) / 100,
    total: Math.round(total * 100) / 100
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD'
  }).format(amount)
}

// Canada Post API integration (production)
export async function getCanadaPostRates(
  items: CartItem[],
  originPostalCode: string,
  destinationPostalCode: string
): Promise<ShippingRate[]> {
  // In production, this would use the Canada Post Rating API
  // https://www.canadapost.ca/cpo/mc/business/productsservices/developers/services/rating/default.jsf
  
  const weight = calculateCartWeight(items)
  const dimensions = calculateCartDimensions(items)
  
  // Mock implementation - replace with actual API call
  console.log('Canada Post API call would be made here with:', {
    weight,
    dimensions,
    originPostalCode,
    destinationPostalCode
  })
  
  return MOCK_SHIPPING_RATES.filter(rate => rate.carrier === 'canada-post')
}

// UPS API integration (production)
export async function getUPSRates(
  items: CartItem[],
  originAddress: ShippingAddress,
  destinationAddress: ShippingAddress
): Promise<ShippingRate[]> {
  // In production, this would use the UPS Rating API
  // https://developer.ups.com/api/reference/rating/rating
  
  const weight = calculateCartWeight(items)
  const dimensions = calculateCartDimensions(items)
  
  // Mock implementation - replace with actual API call
  console.log('UPS API call would be made here with:', {
    weight,
    dimensions,
    originAddress,
    destinationAddress
  })
  
  return MOCK_SHIPPING_RATES.filter(rate => rate.carrier === 'ups')
}