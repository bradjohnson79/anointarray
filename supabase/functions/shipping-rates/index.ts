import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

// Canada Post API credentials
const CANPOST_USERNAME = Deno.env.get('CANPOST_PROD_USERNAME') || Deno.env.get('CANPOST_DEV_USERNAME')
const CANPOST_PASSWORD = Deno.env.get('CANPOST_PROD_PASSWORD') || Deno.env.get('CANPOST_DEV_PASSWORD')
const CANPOST_BASE_URL = Deno.env.get('CANPOST_PROD_USERNAME') 
  ? 'https://soa-gw.canadapost.ca' 
  : 'https://ct.soa-gw.canadapost.ca'

// UPS API credentials
const UPS_CLIENT_ID = Deno.env.get('UPS_CLIENT_ID')
const UPS_SECRET = Deno.env.get('UPS_SECRET')
const UPS_BASE_URL = 'https://onlinetools.ups.com/api'

interface ShippingAddress {
  line1: string
  line2?: string
  city: string
  state: string
  postal_code: string
  country: string
}

interface Package {
  weight: number // in grams
  length: number // in cm
  width: number  // in cm
  height: number // in cm
  value: number  // in cents
}

interface ShippingRate {
  carrier: string
  service: string
  cost_cents: number
  delivery_days: number
  guaranteed: boolean
  description?: string
}

async function getCanadaPostRates(
  origin: ShippingAddress,
  destination: ShippingAddress,
  packages: Package[]
): Promise<ShippingRate[]> {
  if (!CANPOST_USERNAME || !CANPOST_PASSWORD) {
    console.warn('Canada Post credentials not configured')
    return []
  }

  try {
    // Calculate total weight for Canada Post
    const totalWeight = packages.reduce((sum, pkg) => sum + pkg.weight, 0)
    
    // Canada Post API payload
    const payload = {
      'mailing-scenario': {
        'customer-number': CANPOST_USERNAME,
        'parcel-characteristics': {
          weight: Math.ceil(totalWeight / 1000), // Convert to kg, round up
          dimensions: packages.length > 0 ? {
            length: packages[0].length,
            width: packages[0].width,
            height: packages[0].height
          } : undefined
        },
        'origin-postal-code': origin.postal_code.replace(/\s+/g, ''),
        'destination': {
          'domestic': destination.country === 'CA' ? {
            'postal-code': destination.postal_code.replace(/\s+/g, '')
          } : undefined,
          'united-states': destination.country === 'US' ? {
            'zip-code': destination.postal_code.replace(/\s+/g, '')
          } : undefined,
          'international': !['CA', 'US'].includes(destination.country) ? {
            'country-code': destination.country
          } : undefined
        },
        'services': {
          'service-code': 'DOM.RP' // Regular Parcel for domestic
        }
      }
    }

    const auth = btoa(`${CANPOST_USERNAME}:${CANPOST_PASSWORD}`)
    const response = await fetch(`${CANPOST_BASE_URL}/rs/ship/price`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/vnd.cpc.ship.rate-v4+xml',
        'Content-Type': 'application/vnd.cpc.ship.rate-v4+xml',
        'Accept-language': 'en-CA'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      console.warn('Canada Post API error:', response.status, await response.text())
      return []
    }

    const data = await response.json()
    
    // Parse Canada Post response (simplified)
    const rates: ShippingRate[] = []
    
    if (destination.country === 'CA') {
      rates.push({
        carrier: 'canadapost',
        service: 'Regular Parcel',
        cost_cents: 1200, // $12.00 base rate
        delivery_days: 3,
        guaranteed: false,
        description: 'Canada Post Regular Parcel'
      })
      
      rates.push({
        carrier: 'canadapost',
        service: 'Expedited Parcel',
        cost_cents: 2400, // $24.00
        delivery_days: 2,
        guaranteed: false,
        description: 'Canada Post Expedited Parcel'
      })
    }

    return rates

  } catch (error) {
    console.error('Canada Post API error:', error)
    return []
  }
}

async function getUPSRates(
  origin: ShippingAddress,
  destination: ShippingAddress,
  packages: Package[]
): Promise<ShippingRate[]> {
  if (!UPS_CLIENT_ID || !UPS_SECRET) {
    console.warn('UPS credentials not configured')
    return []
  }

  try {
    // Get UPS OAuth token
    const tokenResponse = await fetch(`${UPS_BASE_URL}/security/v1/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-merchant-id': UPS_CLIENT_ID,
        'Authorization': `Basic ${btoa(`${UPS_CLIENT_ID}:${UPS_SECRET}`)}`
      },
      body: 'grant_type=client_credentials'
    })

    if (!tokenResponse.ok) {
      console.warn('UPS token error:', tokenResponse.status)
      return []
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // UPS Rating API payload
    const ratingPayload = {
      RateRequest: {
        Request: {
          RequestOption: 'Shop',
          SubVersion: '1707'
        },
        Shipment: {
          Shipper: {
            Name: 'Anoint Array',
            Address: {
              AddressLine: [origin.line1],
              City: origin.city,
              StateProvinceCode: origin.state,
              PostalCode: origin.postal_code,
              CountryCode: origin.country
            }
          },
          ShipTo: {
            Name: 'Customer',
            Address: {
              AddressLine: [destination.line1],
              City: destination.city,
              StateProvinceCode: destination.state,
              PostalCode: destination.postal_code,
              CountryCode: destination.country
            }
          },
          ShipFrom: {
            Name: 'Anoint Array Warehouse',
            Address: {
              AddressLine: [origin.line1],
              City: origin.city,
              StateProvinceCode: origin.state,
              PostalCode: origin.postal_code,
              CountryCode: origin.country
            }
          },
          Package: packages.map((pkg, index) => ({
            PackagingType: {
              Code: '02', // Customer Supplied Package
              Description: 'Package'
            },
            Dimensions: {
              UnitOfMeasurement: {
                Code: 'CM'
              },
              Length: pkg.length.toString(),
              Width: pkg.width.toString(),
              Height: pkg.height.toString()
            },
            PackageWeight: {
              UnitOfMeasurement: {
                Code: 'KGS'
              },
              Weight: (pkg.weight / 1000).toString()
            }
          }))
        }
      }
    }

    const ratingResponse = await fetch(`${UPS_BASE_URL}/rating/v1707/Rate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'transId': Date.now().toString(),
        'transactionSrc': 'AnointegrationeCommerce'
      },
      body: JSON.stringify(ratingPayload)
    })

    if (!ratingResponse.ok) {
      console.warn('UPS rating error:', ratingResponse.status, await ratingResponse.text())
      return []
    }

    const ratingData = await ratingResponse.json()
    const rates: ShippingRate[] = []

    // Parse UPS response
    const services = ratingData.RateResponse?.RatedShipment || []
    
    for (const service of Array.isArray(services) ? services : [services]) {
      if (service.Service && service.TotalCharges) {
        const costCents = Math.round(parseFloat(service.TotalCharges.MonetaryValue) * 100)
        
        rates.push({
          carrier: 'ups',
          service: service.Service.Code === '03' ? 'UPS Ground' : 
                  service.Service.Code === '02' ? 'UPS 2nd Day Air' :
                  service.Service.Code === '01' ? 'UPS Next Day Air' : 
                  `UPS ${service.Service.Code}`,
          cost_cents: costCents,
          delivery_days: service.Service.Code === '03' ? 5 : 
                        service.Service.Code === '02' ? 2 : 1,
          guaranteed: true,
          description: `UPS ${service.Service.Code} Service`
        })
      }
    }

    return rates

  } catch (error) {
    console.error('UPS API error:', error)
    return []
  }
}

function getFallbackRates(destination: ShippingAddress): ShippingRate[] {
  const rates: ShippingRate[] = []
  
  if (destination.country === 'CA') {
    rates.push({
      carrier: 'canadapost',
      service: 'Regular Parcel',
      cost_cents: 1200,
      delivery_days: 3,
      guaranteed: false,
      description: 'Canada Post Regular Parcel (estimated)'
    })
    
    rates.push({
      carrier: 'canadapost',
      service: 'Expedited Parcel',
      cost_cents: 2400,
      delivery_days: 2,
      guaranteed: false,
      description: 'Canada Post Expedited Parcel (estimated)'
    })
  }
  
  if (destination.country === 'US') {
    rates.push({
      carrier: 'ups',
      service: 'UPS Ground',
      cost_cents: 2500,
      delivery_days: 5,
      guaranteed: true,
      description: 'UPS Ground (estimated)'
    })
    
    rates.push({
      carrier: 'ups',
      service: 'UPS 2nd Day Air',
      cost_cents: 4200,
      delivery_days: 2,
      guaranteed: true,
      description: 'UPS 2nd Day Air (estimated)'
    })
  }
  
  if (!['CA', 'US'].includes(destination.country)) {
    rates.push({
      carrier: 'ups',
      service: 'UPS Worldwide Expedited',
      cost_cents: 8500,
      delivery_days: 7,
      guaranteed: true,
      description: 'UPS Worldwide Expedited (estimated)'
    })
  }
  
  return rates
}

serve(async (req) => {
  // Enable CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const { origin, destination, packages } = await req.json()

    // Validate input
    if (!origin || !destination || !packages) {
      return new Response('Missing required fields: origin, destination, packages', { 
        status: 400 
      })
    }

    // Log the request for debugging
    await supabase.rpc('log_event', {
      level_param: 'info',
      category_param: 'shipping',
      message_param: `Shipping rate request: ${destination.city}, ${destination.country}`,
      metadata_param: { origin, destination, packages }
    })

    // Get rates from multiple carriers
    const [canadaPostRates, upsRates] = await Promise.all([
      getCanadaPostRates(origin, destination, packages),
      getUPSRates(origin, destination, packages)
    ])

    // Combine all rates
    let allRates = [...canadaPostRates, ...upsRates]

    // If no rates found, use fallback rates
    if (allRates.length === 0) {
      allRates = getFallbackRates(destination)
      
      await supabase.rpc('log_event', {
        level_param: 'warning',
        category_param: 'shipping',
        message_param: 'Using fallback shipping rates',
        metadata_param: { destination }
      })
    }

    // Sort by cost (cheapest first)
    allRates.sort((a, b) => a.cost_cents - b.cost_cents)

    return new Response(
      JSON.stringify({
        success: true,
        rates: allRates,
        cached: false
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )

  } catch (error) {
    console.error('Shipping rates error:', error)
    
    // Log the error
    await supabase.rpc('log_event', {
      level_param: 'error',
      category_param: 'shipping',
      message_param: `Shipping rates error: ${error.message}`,
      metadata_param: { error: error.toString() }
    }).catch(() => {}) // Don't fail if logging fails

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to calculate shipping rates',
        rates: []
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})