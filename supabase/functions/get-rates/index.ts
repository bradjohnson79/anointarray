import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ShippingAddress {
  name: string
  address: string
  city: string
  province: string
  postalCode: string
  country: string
}

interface CartItem {
  id: string
  quantity: number
  weight?: number // in kg
}

interface ShippingRate {
  id: string
  name: string
  carrier: string
  price: number
  estimatedDays: string
  description?: string
}

// UPS API Integration
async function getUPSRates(
  fromAddress: ShippingAddress,
  toAddress: ShippingAddress,
  packageWeight: number
): Promise<ShippingRate[]> {
  const clientId = Deno.env.get('UPS_CLIENT_ID')
  const clientSecret = Deno.env.get('UPS_SECRET')
  
  if (!clientId || !clientSecret) {
    console.error('UPS credentials not found')
    return []
  }

  try {
    // Get OAuth token
    const tokenResponse = await fetch('https://wwwcie.ups.com/security/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: 'grant_type=client_credentials'
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to get UPS OAuth token')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Rating request payload
    const ratingPayload = {
      RateRequest: {
        Request: {
          SubVersion: "1801",
          RequestOption: "15", // Get all available services
          TransactionReference: {
            CustomerContext: `anoint-array-${Date.now()}`
          }
        },
        Shipment: {
          Shipper: {
            Name: "ANOINT Array",
            Address: {
              AddressLine: [fromAddress.address],
              City: fromAddress.city,
              StateProvinceCode: fromAddress.province,
              PostalCode: fromAddress.postalCode,
              CountryCode: fromAddress.country
            }
          },
          ShipTo: {
            Name: toAddress.name,
            Address: {
              AddressLine: [toAddress.address],
              City: toAddress.city,
              StateProvinceCode: toAddress.province,
              PostalCode: toAddress.postalCode,
              CountryCode: toAddress.country
            }
          },
          Package: [{
            PackagingType: {
              Code: "02", // Customer supplied package
              Description: "Package"
            },
            Dimensions: {
              UnitOfMeasurement: {
                Code: "CM"
              },
              Length: "20",
              Width: "15",
              Height: "10"
            },
            PackageWeight: {
              UnitOfMeasurement: {
                Code: "KG"
              },
              Weight: packageWeight.toString()
            }
          }]
        }
      }
    }

    // Get shipping rates
    const ratingResponse = await fetch('https://wwwcie.ups.com/api/rating/v1/Rate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'transId': `anoint-array-${Date.now()}`,
        'transactionSrc': 'anoint-array'
      },
      body: JSON.stringify(ratingPayload)
    })

    if (!ratingResponse.ok) {
      throw new Error('Failed to get UPS rates')
    }

    const ratingData = await ratingResponse.json()
    const rates: ShippingRate[] = []

    if (ratingData.RateResponse?.RatedShipment) {
      const ratedShipments = Array.isArray(ratingData.RateResponse.RatedShipment) 
        ? ratingData.RateResponse.RatedShipment 
        : [ratingData.RateResponse.RatedShipment]

      for (const shipment of ratedShipments) {
        const serviceCode = shipment.Service?.Code
        let serviceName = 'UPS Service'
        let estimatedDays = '3-5 business days'

        // Map UPS service codes to readable names
        switch (serviceCode) {
          case '11':
            serviceName = 'UPS Standard'
            estimatedDays = '1-5 business days'
            break
          case '12':
            serviceName = 'UPS 3 Day Select'
            estimatedDays = '3 business days'
            break
          case '03':
            serviceName = 'UPS Ground'
            estimatedDays = '1-5 business days'
            break
          case '02':
            serviceName = 'UPS 2nd Day Air'
            estimatedDays = '2 business days'
            break
          case '01':
            serviceName = 'UPS Next Day Air'
            estimatedDays = '1 business day'
            break
        }

        rates.push({
          id: `ups-${serviceCode}`,
          name: serviceName,
          carrier: 'UPS',
          price: parseFloat(shipment.TotalCharges?.MonetaryValue || '0'),
          estimatedDays,
          description: shipment.Service?.Description || serviceName
        })
      }
    }

    return rates
  } catch (error) {
    console.error('UPS API Error:', error)
    return []
  }
}

// Canada Post API Integration
async function getCanadaPostRates(
  fromAddress: ShippingAddress,
  toAddress: ShippingAddress,
  packageWeight: number
): Promise<ShippingRate[]> {
  const username = Deno.env.get('CANPOST_DEV_USERNAME') // Use DEV for testing
  const password = Deno.env.get('CANPOST_DEV_PASSWORD')
  
  if (!username || !password) {
    console.error('Canada Post credentials not found')
    return []
  }

  try {
    // Canada Post uses basic auth
    const auth = btoa(`${username}:${password}`)
    
    // Build the rating request XML
    const ratingXML = `<?xml version="1.0" encoding="UTF-8"?>
    <mailing-scenario xmlns="http://www.canadapost.ca/ws/ship/rate-v4">
      <customer-number>${username}</customer-number>
      <parcel-characteristics>
        <weight>${packageWeight}</weight>
        <dimensions>
          <length>20</length>
          <width>15</width>
          <height>10</height>
        </dimensions>
      </parcel-characteristics>
      <services>
        <service-code>DOM.RP</service-code>
        <service-code>DOM.EP</service-code>
        <service-code>DOM.XP</service-code>
        <service-code>DOM.PC</service-code>
      </services>
      <origin-postal-code>${fromAddress.postalCode.replace(/\s/g, '')}</origin-postal-code>
      <destination>
        <domestic>
          <postal-code>${toAddress.postalCode.replace(/\s/g, '')}</postal-code>
        </domestic>
      </destination>
    </mailing-scenario>`

    const response = await fetch('https://ct.soa-gw.canadapost.ca/rs/ship/price', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.cpc.ship.rate-v4+xml',
        'Accept': 'application/vnd.cpc.ship.rate-v4+xml',
        'Authorization': `Basic ${auth}`,
        'Accept-language': 'en-CA'
      },
      body: ratingXML
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Canada Post API Error:', response.status, errorText)
      return []
    }

    const responseText = await response.text()
    
    // Parse XML response (basic parsing - in production, use a proper XML parser)
    const rates: ShippingRate[] = []
    
    // Extract service information using regex (simplified for demo)
    const serviceMatches = responseText.match(/<service-code>(.*?)<\/service-code>[\s\S]*?<service-name>(.*?)<\/service-name>[\s\S]*?<base>(.*?)<\/base>/g)
    
    if (serviceMatches) {
      for (const match of serviceMatches) {
        const codeMatch = match.match(/<service-code>(.*?)<\/service-code>/)
        const nameMatch = match.match(/<service-name>(.*?)<\/service-name>/)
        const priceMatch = match.match(/<base>(.*?)<\/base>/)
        
        if (codeMatch && nameMatch && priceMatch) {
          const code = codeMatch[1]
          const name = nameMatch[1]
          const price = parseFloat(priceMatch[1])
          
          let estimatedDays = '3-5 business days'
          
          // Map Canada Post service codes
          switch (code) {
            case 'DOM.RP':
              estimatedDays = '2-9 business days'
              break
            case 'DOM.EP':
              estimatedDays = '1-2 business days'
              break
            case 'DOM.XP':
              estimatedDays = '1 business day'
              break
            case 'DOM.PC':
              estimatedDays = '3-5 business days'
              break
          }
          
          rates.push({
            id: `canpost-${code}`,
            name: name,
            carrier: 'Canada Post',
            price: price,
            estimatedDays,
            description: name
          })
        }
      }
    }

    return rates
  } catch (error) {
    console.error('Canada Post API Error:', error)
    return []
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  // Handle warm-up requests to prevent cold starts
  const warmupHeader = req.headers.get('X-Warmup')
  if (warmupHeader === 'true') {
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Function warmed up',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    const { toAddress, items } = await req.json()

    if (!toAddress || !items || !Array.isArray(items)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: toAddress, items' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    // Default sender address (ANOINT Array headquarters)
    const fromAddress: ShippingAddress = {
      name: 'ANOINT Array',
      address: '123 Main Street', // Replace with actual address
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5V 3A8',
      country: 'CA'
    }

    // Calculate total package weight (default 0.5kg per item if not specified)
    const totalWeight = items.reduce((total: number, item: CartItem) => {
      const itemWeight = item.weight || 0.5 // Default 0.5kg per item
      return total + (itemWeight * item.quantity)
    }, 0)

    // Create Supabase client for caching
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Create cache key for shipping rates
    const cacheKey = `shipping_${JSON.stringify({
      from: fromAddress.postalCode,
      to: toAddress.postalCode,
      weight: totalWeight
    })}`

    // Check cache first
    const { data: cachedRates } = await supabase
      .from('shipping_rate_cache')
      .select('rates, created_at')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single()

    let allRates: ShippingRate[] = []

    if (cachedRates) {
      // Use cached rates
      allRates = cachedRates.rates as ShippingRate[]
      console.log('Using cached shipping rates')
    } else {
      // Get rates from both carriers concurrently
      const [upsRates, canPostRates] = await Promise.all([
        getUPSRates(fromAddress, toAddress, totalWeight),
        getCanadaPostRates(fromAddress, toAddress, totalWeight)
      ])

      // Combine and sort rates by price
      allRates = [...upsRates, ...canPostRates].sort((a, b) => a.price - b.price)

      // Cache the results for 1 hour
      if (allRates.length > 0) {
        await supabase.from('shipping_rate_cache').upsert({
          cache_key: cacheKey,
          rates: allRates,
          package_weight: totalWeight,
          expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        rates: allRates,
        packageWeight: totalWeight
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('Error in get-rates function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})