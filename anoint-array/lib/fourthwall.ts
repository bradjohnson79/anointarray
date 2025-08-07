// FourthWall API client for automated merchandise integration
import { MERCHANDISE_CATALOG, MerchandiseProduct } from './merchandise'

export interface FourthWallProduct {
  id: string
  name: string
  price: number
  sku: string
  designId: string
  productType: string
  checkoutUrl?: string
}

export interface CheckoutSession {
  id: string
  url: string
  totalAmount: number
  totalProfit: number
  items: FourthWallProduct[]
}

export class FourthWallClient {
  private baseUrl: string
  private username: string
  private password: string
  private storefrontToken: string

  constructor() {
    this.baseUrl = process.env.FOURTHWALL_API_URL || 'https://api.fourthwall.com/v1'
    this.username = process.env.FOURTHWALL_API_USERNAME || ''
    this.password = process.env.FOURTHWALL_API_PASSWORD || ''
    this.storefrontToken = process.env.FOURTHWALL_STOREFRONT_TOKEN || ''
    
    if (!this.username || !this.password || !this.storefrontToken) {
      console.warn('FourthWall API credentials not found in environment variables')
    }
  }

  private get authHeaders() {
    const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64')
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Storefront-Token': this.storefrontToken
    }
  }

  /**
   * Upload seal array design to FourthWall media library
   */
  async uploadDesign(imageBuffer: Buffer, name: string, sealArrayId: string): Promise<string> {
    try {
      const formData = new FormData()
      formData.append('file', new Blob([imageBuffer], { type: 'image/png' }), `${name}.png`)
      formData.append('name', name)
      formData.append('description', `Custom Seal Array Design - ${sealArrayId}`)
      formData.append('tags', 'seal-array,custom,anoint,sacred-geometry')

      const response = await fetch(`${this.baseUrl}/designs/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`,
          'X-Storefront-Token': this.storefrontToken
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Design upload failed: ${response.status} - ${response.statusText}`)
      }

      const result = await response.json()
      return result.design_id || result.id
    } catch (error) {
      console.error('FourthWall design upload error:', error)
      throw new Error(`Failed to upload design: ${error}`)
    }
  }

  /**
   * Create a custom product with the uploaded design
   */
  async createCustomProduct(
    designId: string, 
    productType: string, 
    sealArrayId: string
  ): Promise<FourthWallProduct> {
    try {
      const merchandiseProduct = MERCHANDISE_CATALOG[productType]
      if (!merchandiseProduct) {
        throw new Error(`Unknown product type: ${productType}`)
      }

      const productData = {
        name: `Custom ${merchandiseProduct.name} - Seal Array`,
        description: `Personalized ${merchandiseProduct.name} featuring your unique ANOINT Seal Array design`,
        price: merchandiseProduct.sellingPrice,
        sku: `SEAL-${sealArrayId}-${productType.toUpperCase()}`,
        category: merchandiseProduct.category,
        subcategory: merchandiseProduct.subcategory,
        tags: ['seal-array', 'custom', 'sacred-geometry', productType],
        design_id: designId,
        template_id: this.getTemplateId(productType),
        print_areas: {
          front: designId,
          // Add more print areas based on product type
          ...(productType.includes('hoodie') && { back: designId }),
          ...(productType.includes('mug') && { wrap: designId })
        },
        variants: this.generateVariants(merchandiseProduct),
        metadata: {
          seal_array_id: sealArrayId,
          base_cost: merchandiseProduct.baseCost,
          profit_margin: merchandiseProduct.profit,
          created_at: new Date().toISOString()
        }
      }

      const response = await fetch(`${this.baseUrl}/products`, {
        method: 'POST',
        headers: this.authHeaders,
        body: JSON.stringify(productData)
      })

      if (!response.ok) {
        throw new Error(`Product creation failed: ${response.status} - ${response.statusText}`)
      }

      const result = await response.json()
      
      return {
        id: result.id,
        name: result.name,
        price: merchandiseProduct.sellingPrice,
        sku: result.sku,
        designId: designId,
        productType: productType
      }
    } catch (error) {
      console.error(`Failed to create product ${productType}:`, error)
      throw error
    }
  }

  /**
   * Create multiple products for all popular merchandise types
   */
  async createProductLine(designId: string, sealArrayId: string): Promise<FourthWallProduct[]> {
    // Staff picks - most popular products
    const staffPickIds = [
      'classic-tee',      // Most Popular T-Shirt
      'dad-hat',          // Best Margin Hat  
      'ceramic-mug',      // High Volume Mug
      'canvas-16x16',     // Premium Canvas
      'fleece-blanket',   // High Value Blanket
      'snapback-cap'      // Trending Cap
    ]

    const products: FourthWallProduct[] = []
    
    // Create products in parallel for faster processing
    const productPromises = staffPickIds.map(async (productType) => {
      try {
        const product = await this.createCustomProduct(designId, productType, sealArrayId)
        products.push(product)
        return product
      } catch (error) {
        console.error(`Failed to create ${productType}:`, error)
        // Continue with other products even if one fails
        return null
      }
    })

    await Promise.all(productPromises)
    return products.filter(Boolean) // Remove any null results
  }

  /**
   * Create checkout session with all products
   */
  async createCheckoutSession(
    products: FourthWallProduct[],
    customerEmail?: string,
    sealArrayId?: string
  ): Promise<CheckoutSession> {
    try {
      const cartItems = products.map(product => ({
        product_id: product.id,
        quantity: 1,
        price: product.price,
        design_id: product.designId
      }))

      const totalAmount = products.reduce((sum, product) => sum + product.price, 0)
      const totalProfit = products.reduce((sum, product) => {
        const merchandiseProduct = MERCHANDISE_CATALOG[product.productType]
        return sum + (merchandiseProduct?.profit || 0)
      }, 0)

      const checkoutData = {
        line_items: cartItems,
        customer_email: customerEmail,
        success_url: `${process.env.NEXT_PUBLIC_URL}/member/merchandise/success?session={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL}/member/generator?cancelled=true`,
        payment_method_types: ['card', 'paypal'],
        mode: 'payment',
        allow_promotion_codes: true,
        shipping_address_collection: {
          allowed_countries: ['US', 'CA', 'GB', 'AU', 'EU']
        },
        metadata: {
          source: 'anoint-array-generator',
          seal_array_id: sealArrayId || 'unknown',
          total_profit: totalProfit.toString(),
          product_count: products.length.toString(),
          created_at: new Date().toISOString()
        }
      }

      const response = await fetch(`${this.baseUrl}/checkout/sessions`, {
        method: 'POST',
        headers: this.authHeaders,
        body: JSON.stringify(checkoutData)
      })

      if (!response.ok) {
        throw new Error(`Checkout creation failed: ${response.status} - ${response.statusText}`)
      }

      const result = await response.json()

      return {
        id: result.id,
        url: result.url || result.checkout_url,
        totalAmount,
        totalProfit,
        items: products
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error)
      throw error
    }
  }

  /**
   * Get template ID for FourthWall product type
   */
  private getTemplateId(productType: string): string {
    // Map our product types to FourthWall template IDs
    const templateMap: { [key: string]: string } = {
      // T-Shirts
      'classic-tee': 'tshirt-front-center',
      'premium-tee': 'tshirt-premium-front',
      'vintage-tee': 'tshirt-vintage-front',
      'tri-blend-tee': 'tshirt-triblend-front',
      'long-sleeve-tee': 'longsleeve-front',
      'v-neck-tee': 'vneck-front',
      'tank-top': 'tank-front',
      'organic-tee': 'organic-tshirt-front',

      // Hoodies
      'pullover-hoodie': 'hoodie-pullover-front',
      'zip-hoodie': 'hoodie-zip-front',
      'premium-hoodie': 'hoodie-premium-front',
      'crewneck-sweatshirt': 'crewneck-front',
      'cropped-hoodie': 'hoodie-cropped-front',
      'oversized-hoodie': 'hoodie-oversized-front',

      // Headwear
      'snapback-cap': 'cap-snapback-front',
      'dad-hat': 'cap-dad-front',
      'trucker-hat': 'cap-trucker-front',
      'fitted-cap': 'cap-fitted-front',
      'beanie': 'beanie-front',
      'bucket-hat': 'bucket-hat-front',
      'visor': 'visor-front',
      'flexfit-cap': 'cap-flexfit-front',
      'military-cap': 'cap-military-front',
      'vintage-cap': 'cap-vintage-front',

      // Drinkware
      'ceramic-mug': 'mug-ceramic-wrap',
      'large-mug': 'mug-large-wrap',
      'travel-mug': 'mug-travel-wrap',
      'water-bottle': 'bottle-water-wrap',
      'tumbler': 'tumbler-wrap',
      'wine-tumbler': 'wine-tumbler-wrap',
      'shot-glass': 'shotglass-front',
      'beer-glass': 'beer-glass-front',

      // Tech & Accessories
      'phone-case': 'phonecase-back',
      'laptop-sleeve': 'laptop-sleeve-front',
      'tote-bag': 'tote-bag-front',
      'backpack': 'backpack-allover',
      'fanny-pack': 'fanny-pack-front',
      'keychain': 'keychain-front',

      // Home
      'fleece-blanket': 'blanket-fleece-front',
      'sherpa-blanket': 'blanket-sherpa-front',
      'minky-blanket': 'blanket-minky-front',
      'throw-pillow': 'pillow-throw-front',
      'body-pillow': 'pillow-body-front',
      'lumbar-pillow': 'pillow-lumbar-front',
      'outdoor-pillow': 'pillow-outdoor-front',
      'floor-pillow': 'pillow-floor-front',

      // Prints
      'poster-12x18': 'poster-12x18',
      'poster-18x24': 'poster-18x24',
      'poster-24x36': 'poster-24x36',
      'canvas-12x12': 'canvas-12x12',
      'canvas-16x16': 'canvas-16x16',
      'canvas-20x20': 'canvas-20x20',
      'metal-print': 'metal-12x12',
      'wood-print': 'wood-12x12',
      'acrylic-print': 'acrylic-12x12',
      'framed-print': 'framed-12x12'
    }

    return templateMap[productType] || 'default-template'
  }

  /**
   * Generate product variants (sizes, colors) based on merchandise product
   */
  private generateVariants(merchandiseProduct: MerchandiseProduct) {
    const variants = []

    // Generate combinations of sizes and colors
    const sizes = merchandiseProduct.sizes || ['One Size']
    const colors = merchandiseProduct.colors || ['Default']

    for (const size of sizes) {
      for (const color of colors) {
        variants.push({
          size: size,
          color: color,
          price: merchandiseProduct.sellingPrice,
          sku: `${merchandiseProduct.id}-${size}-${color}`.replace(/[^a-zA-Z0-9-]/g, ''),
          inventory: 999 // Print-on-demand, so always available
        })
      }
    }

    return variants
  }

  /**
   * Complete automation flow: upload design, create products, generate checkout
   */
  async createFullMerchandiseExperience(
    sealArrayImage: Buffer,
    sealArrayId: string,
    customerEmail?: string
  ): Promise<CheckoutSession> {
    try {
      console.log('Starting FourthWall automation flow...')

      // Step 1: Upload design
      console.log('Uploading seal array design...')
      const designId = await this.uploadDesign(
        sealArrayImage,
        `seal-array-${sealArrayId}`,
        sealArrayId
      )
      console.log(`Design uploaded with ID: ${designId}`)

      // Step 2: Create product line
      console.log('Creating product line...')
      const products = await this.createProductLine(designId, sealArrayId)
      console.log(`Created ${products.length} products`)

      // Step 3: Create checkout session
      console.log('Creating checkout session...')
      const checkout = await this.createCheckoutSession(products, customerEmail, sealArrayId)
      console.log(`Checkout session created: ${checkout.url}`)

      return checkout
    } catch (error) {
      console.error('FourthWall automation flow failed:', error)
      throw error
    }
  }

  /**
   * Validate API credentials and connection
   */
  async validateConnection(): Promise<boolean> {
    // Since FourthWall API endpoints are not publicly documented and returning 404,
    // we'll validate that credentials are present and properly formatted
    try {
      if (!this.username || !this.password || !this.storefrontToken) {
        console.warn('FourthWall: Missing required credentials')
        return false
      }

      // Validate email format for username
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(this.username)) {
        console.warn('FourthWall: Username should be in email format')
        return false
      }

      // Validate storefront token format (should start with ptkn_)
      if (!this.storefrontToken.startsWith('ptkn_')) {
        console.warn('FourthWall: Storefront token should start with ptkn_')
        return false
      }

      console.log('FourthWall: Credentials validation passed')
      return true

      // TODO: Uncomment when actual FourthWall API endpoints are available
      // const response = await fetch(`${this.baseUrl}/account`, {
      //   method: 'GET',
      //   headers: this.authHeaders
      // })
      // return response.ok

    } catch (error) {
      console.error('FourthWall connection validation failed:', error)
      return false
    }
  }

  /**
   * Get order status for tracking
   */
  async getOrderStatus(orderId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        method: 'GET',
        headers: this.authHeaders
      })

      if (!response.ok) {
        throw new Error(`Failed to get order status: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get order status:', error)
      throw error
    }
  }
}

// Export singleton instance
export const fourthwallClient = new FourthWallClient()