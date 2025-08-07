// Comprehensive merchandise catalog with custom pricing
export interface MerchandiseProduct {
  id: string
  name: string
  category: 'apparel' | 'headwear' | 'accessories' | 'home' | 'prints'
  subcategory: string
  baseCost: number
  sellingPrice: number
  profit: number
  markup: number
  popular?: boolean
  featured?: boolean
  sizes?: string[]
  colors?: string[]
  description?: string
}

export const MERCHANDISE_CATALOG: Record<string, MerchandiseProduct> = {
  // ===== APPAREL COLLECTION =====
  
  // T-Shirts (8 Variants)
  'classic-tee': {
    id: 'classic-tee',
    name: 'Classic Cotton T-Shirt',
    category: 'apparel',
    subcategory: 'tshirts',
    baseCost: 12.50,
    sellingPrice: 29.99,
    profit: 17.49,
    markup: 140,
    popular: true,
    featured: true,
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
    colors: ['Black', 'White', 'Navy', 'Heather Grey'],
    description: 'Comfortable 100% cotton classic fit tee'
  },
  'premium-tee': {
    id: 'premium-tee',
    name: 'Premium Soft Cotton T-Shirt',
    category: 'apparel',
    subcategory: 'tshirts',
    baseCost: 15.00,
    sellingPrice: 34.99,
    profit: 19.99,
    markup: 133,
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    colors: ['Black', 'White', 'Charcoal', 'Navy'],
    description: 'Ultra-soft premium cotton blend'
  },
  'vintage-tee': {
    id: 'vintage-tee',
    name: 'Vintage Washed T-Shirt',
    category: 'apparel',
    subcategory: 'tshirts',
    baseCost: 16.50,
    sellingPrice: 36.99,
    profit: 20.49,
    markup: 124,
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    colors: ['Vintage Black', 'Vintage Navy', 'Vintage Grey'],
    description: 'Pre-washed vintage look and feel'
  },
  'tri-blend-tee': {
    id: 'tri-blend-tee',
    name: 'Tri-Blend Super Soft T-Shirt',
    category: 'apparel',
    subcategory: 'tshirts',
    baseCost: 17.00,
    sellingPrice: 38.99,
    profit: 21.99,
    markup: 129,
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    colors: ['Tri-Black', 'Tri-Grey', 'Tri-Navy'],
    description: 'Polyester/cotton/rayon blend for ultimate softness'
  },
  'long-sleeve-tee': {
    id: 'long-sleeve-tee',
    name: 'Long Sleeve T-Shirt',
    category: 'apparel',
    subcategory: 'tshirts',
    baseCost: 18.50,
    sellingPrice: 42.99,
    profit: 24.49,
    markup: 132,
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    colors: ['Black', 'White', 'Navy', 'Grey'],
    description: 'Classic long sleeve cotton tee'
  },
  'v-neck-tee': {
    id: 'v-neck-tee',
    name: 'V-Neck T-Shirt',
    category: 'apparel',
    subcategory: 'tshirts',
    baseCost: 14.00,
    sellingPrice: 32.99,
    profit: 18.99,
    markup: 136,
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    colors: ['Black', 'White', 'Navy', 'Grey'],
    description: 'Flattering v-neck design'
  },
  'tank-top': {
    id: 'tank-top',
    name: 'Tank Top',
    category: 'apparel',
    subcategory: 'tshirts',
    baseCost: 13.50,
    sellingPrice: 31.99,
    profit: 18.49,
    markup: 137,
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    colors: ['Black', 'White', 'Navy', 'Grey'],
    description: 'Sleeveless cotton tank top'
  },
  'organic-tee': {
    id: 'organic-tee',
    name: 'Organic Cotton T-Shirt',
    category: 'apparel',
    subcategory: 'tshirts',
    baseCost: 19.50,
    sellingPrice: 44.99,
    profit: 25.49,
    markup: 131,
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    colors: ['Natural', 'Black', 'Navy'],
    description: 'Eco-friendly 100% organic cotton'
  },

  // Hoodies & Sweatshirts (6 Variants)
  'pullover-hoodie': {
    id: 'pullover-hoodie',
    name: 'Classic Pullover Hoodie',
    category: 'apparel',
    subcategory: 'hoodies',
    baseCost: 25.00,
    sellingPrice: 54.99,
    profit: 29.99,
    markup: 120,
    featured: true,
    sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
    colors: ['Black', 'Navy', 'Heather Grey', 'Maroon'],
    description: 'Cozy cotton blend pullover hoodie'
  },
  'zip-hoodie': {
    id: 'zip-hoodie',
    name: 'Full-Zip Hoodie',
    category: 'apparel',
    subcategory: 'hoodies',
    baseCost: 28.50,
    sellingPrice: 59.99,
    profit: 31.49,
    markup: 110,
    sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
    colors: ['Black', 'Navy', 'Grey', 'Charcoal'],
    description: 'Full-zip hoodie with front pockets'
  },
  'premium-hoodie': {
    id: 'premium-hoodie',
    name: 'Premium Fleece Hoodie',
    category: 'apparel',
    subcategory: 'hoodies',
    baseCost: 32.00,
    sellingPrice: 69.99,
    profit: 37.99,
    markup: 119,
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    colors: ['Black', 'Navy', 'Heather Grey'],
    description: 'Premium fleece with superior warmth'
  },
  'crewneck-sweatshirt': {
    id: 'crewneck-sweatshirt',
    name: 'Crewneck Sweatshirt',
    category: 'apparel',
    subcategory: 'hoodies',
    baseCost: 22.00,
    sellingPrice: 49.99,
    profit: 27.99,
    markup: 127,
    sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
    colors: ['Black', 'Navy', 'Grey', 'White'],
    description: 'Classic crewneck sweatshirt'
  },
  'cropped-hoodie': {
    id: 'cropped-hoodie',
    name: 'Cropped Hoodie',
    category: 'apparel',
    subcategory: 'hoodies',
    baseCost: 26.00,
    sellingPrice: 56.99,
    profit: 30.99,
    markup: 119,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Black', 'Grey', 'Pink', 'Navy'],
    description: 'Trendy cropped hoodie style'
  },
  'oversized-hoodie': {
    id: 'oversized-hoodie',
    name: 'Oversized Hoodie',
    category: 'apparel',
    subcategory: 'hoodies',
    baseCost: 29.00,
    sellingPrice: 64.99,
    profit: 35.99,
    markup: 124,
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    colors: ['Black', 'Grey', 'Cream', 'Navy'],
    description: 'Relaxed oversized fit hoodie'
  },

  // ===== HEADWEAR COLLECTION =====
  
  'snapback-cap': {
    id: 'snapback-cap',
    name: 'Snapback Cap',
    category: 'headwear',
    subcategory: 'caps',
    baseCost: 11.50,
    sellingPrice: 27.99,
    profit: 16.49,
    markup: 143,
    featured: true,
    sizes: ['One Size'],
    colors: ['Black', 'Navy', 'Grey', 'White'],
    description: 'Classic snapback with flat brim'
  },
  'dad-hat': {
    id: 'dad-hat',
    name: 'Dad Hat (Curved Bill)',
    category: 'headwear',
    subcategory: 'caps',
    baseCost: 10.00,
    sellingPrice: 24.99,
    profit: 14.99,
    markup: 150,
    popular: true,
    featured: true,
    sizes: ['One Size'],
    colors: ['Black', 'Navy', 'Khaki', 'White'],
    description: 'Relaxed curved bill dad hat'
  },
  'trucker-hat': {
    id: 'trucker-hat',
    name: 'Trucker Hat (Mesh Back)',
    category: 'headwear',
    subcategory: 'caps',
    baseCost: 12.00,
    sellingPrice: 28.99,
    profit: 16.99,
    markup: 142,
    sizes: ['One Size'],
    colors: ['Black/White', 'Navy/White', 'Grey/Black'],
    description: 'Classic trucker hat with mesh back'
  },
  'fitted-cap': {
    id: 'fitted-cap',
    name: 'Fitted Baseball Cap',
    category: 'headwear',
    subcategory: 'caps',
    baseCost: 13.50,
    sellingPrice: 31.99,
    profit: 18.49,
    markup: 137,
    sizes: ['S/M', 'L/XL'],
    colors: ['Black', 'Navy', 'Grey'],
    description: 'Structured fitted baseball cap'
  },
  'beanie': {
    id: 'beanie',
    name: 'Knit Beanie',
    category: 'headwear',
    subcategory: 'beanies',
    baseCost: 8.50,
    sellingPrice: 21.99,
    profit: 13.49,
    markup: 159,
    sizes: ['One Size'],
    colors: ['Black', 'Navy', 'Grey', 'Burgundy'],
    description: 'Warm knit beanie'
  },
  'bucket-hat': {
    id: 'bucket-hat',
    name: 'Bucket Hat',
    category: 'headwear',
    subcategory: 'hats',
    baseCost: 9.50,
    sellingPrice: 23.99,
    profit: 14.49,
    markup: 152,
    sizes: ['S/M', 'L/XL'],
    colors: ['Black', 'Navy', 'Khaki', 'White'],
    description: 'Classic bucket hat style'
  },
  'visor': {
    id: 'visor',
    name: 'Adjustable Visor',
    category: 'headwear',
    subcategory: 'visors',
    baseCost: 8.00,
    sellingPrice: 19.99,
    profit: 11.99,
    markup: 150,
    sizes: ['One Size'],
    colors: ['Black', 'Navy', 'White'],
    description: 'Adjustable sun visor'
  },
  'flexfit-cap': {
    id: 'flexfit-cap',
    name: 'Flexfit Cap',
    category: 'headwear',
    subcategory: 'caps',
    baseCost: 14.00,
    sellingPrice: 32.99,
    profit: 18.99,
    markup: 136,
    sizes: ['S/M', 'L/XL'],
    colors: ['Black', 'Navy', 'Grey'],
    description: 'Flexible fitted cap'
  },
  'military-cap': {
    id: 'military-cap',
    name: 'Military Style Cap',
    category: 'headwear',
    subcategory: 'caps',
    baseCost: 11.00,
    sellingPrice: 26.99,
    profit: 15.99,
    markup: 145,
    sizes: ['One Size'],
    colors: ['Black', 'Olive', 'Navy'],
    description: 'Military inspired cadet cap'
  },
  'vintage-cap': {
    id: 'vintage-cap',
    name: 'Vintage Distressed Cap',
    category: 'headwear',
    subcategory: 'caps',
    baseCost: 12.50,
    sellingPrice: 29.99,
    profit: 17.49,
    markup: 140,
    sizes: ['One Size'],
    colors: ['Distressed Black', 'Distressed Navy', 'Distressed Grey'],
    description: 'Vintage distressed look cap'
  },

  // ===== ACCESSORIES COLLECTION =====
  
  // Drinkware (8 Variants)
  'ceramic-mug': {
    id: 'ceramic-mug',
    name: '11oz Ceramic Coffee Mug',
    category: 'accessories',
    subcategory: 'drinkware',
    baseCost: 8.00,
    sellingPrice: 19.99,
    profit: 11.99,
    markup: 150,
    popular: true,
    featured: true,
    sizes: ['11oz'],
    colors: ['White', 'Black'],
    description: 'Classic ceramic coffee mug'
  },
  'large-mug': {
    id: 'large-mug',
    name: '15oz Large Coffee Mug',
    category: 'accessories',
    subcategory: 'drinkware',
    baseCost: 9.50,
    sellingPrice: 22.99,
    profit: 13.49,
    markup: 142,
    sizes: ['15oz'],
    colors: ['White', 'Black'],
    description: 'Large capacity coffee mug'
  },
  'travel-mug': {
    id: 'travel-mug',
    name: 'Stainless Steel Travel Mug',
    category: 'accessories',
    subcategory: 'drinkware',
    baseCost: 16.00,
    sellingPrice: 34.99,
    profit: 18.99,
    markup: 119,
    sizes: ['15oz'],
    colors: ['Silver', 'Black'],
    description: 'Insulated stainless steel travel mug'
  },
  'water-bottle': {
    id: 'water-bottle',
    name: 'Stainless Steel Water Bottle',
    category: 'accessories',
    subcategory: 'drinkware',
    baseCost: 18.50,
    sellingPrice: 39.99,
    profit: 21.49,
    markup: 116,
    sizes: ['20oz'],
    colors: ['Silver', 'Black', 'White'],
    description: 'Double-wall insulated water bottle'
  },
  'tumbler': {
    id: 'tumbler',
    name: '20oz Insulated Tumbler',
    category: 'accessories',
    subcategory: 'drinkware',
    baseCost: 14.50,
    sellingPrice: 31.99,
    profit: 17.49,
    markup: 121,
    sizes: ['20oz'],
    colors: ['Silver', 'Black', 'White'],
    description: 'Insulated tumbler with lid'
  },
  'wine-tumbler': {
    id: 'wine-tumbler',
    name: '12oz Wine Tumbler',
    category: 'accessories',
    subcategory: 'drinkware',
    baseCost: 13.00,
    sellingPrice: 28.99,
    profit: 15.99,
    markup: 123,
    sizes: ['12oz'],
    colors: ['Silver', 'Black', 'Rose Gold'],
    description: 'Elegant wine tumbler'
  },
  'shot-glass': {
    id: 'shot-glass',
    name: 'Shot Glass',
    category: 'accessories',
    subcategory: 'drinkware',
    baseCost: 6.50,
    sellingPrice: 16.99,
    profit: 10.49,
    markup: 161,
    sizes: ['1.5oz'],
    colors: ['Clear'],
    description: 'Classic shot glass'
  },
  'beer-glass': {
    id: 'beer-glass',
    name: 'Pint Beer Glass',
    category: 'accessories',
    subcategory: 'drinkware',
    baseCost: 9.00,
    sellingPrice: 21.99,
    profit: 12.99,
    markup: 144,
    sizes: ['16oz'],
    colors: ['Clear'],
    description: 'Classic pint beer glass'
  },

  // Tech & Lifestyle (6 Variants)
  'phone-case': {
    id: 'phone-case',
    name: 'Phone Case (Multiple Models)',
    category: 'accessories',
    subcategory: 'tech',
    baseCost: 10.50,
    sellingPrice: 26.99,
    profit: 16.49,
    markup: 157,
    sizes: ['iPhone', 'Samsung'],
    colors: ['Clear', 'Black'],
    description: 'Protective phone case for multiple models'
  },
  'laptop-sleeve': {
    id: 'laptop-sleeve',
    name: 'Laptop Sleeve',
    category: 'accessories',
    subcategory: 'tech',
    baseCost: 15.50,
    sellingPrice: 34.99,
    profit: 19.49,
    markup: 126,
    sizes: ['13"', '15"', '17"'],
    colors: ['Black', 'Grey'],
    description: 'Padded laptop sleeve'
  },
  'tote-bag': {
    id: 'tote-bag',
    name: 'Canvas Tote Bag',
    category: 'accessories',
    subcategory: 'bags',
    baseCost: 7.50,
    sellingPrice: 18.99,
    profit: 11.49,
    markup: 153,
    sizes: ['One Size'],
    colors: ['Natural', 'Black'],
    description: 'Durable canvas tote bag'
  },
  'backpack': {
    id: 'backpack',
    name: 'All-Over Print Backpack',
    category: 'accessories',
    subcategory: 'bags',
    baseCost: 22.00,
    sellingPrice: 49.99,
    profit: 27.99,
    markup: 127,
    sizes: ['One Size'],
    colors: ['Custom Print'],
    description: 'All-over print backpack'
  },
  'fanny-pack': {
    id: 'fanny-pack',
    name: 'Fanny Pack',
    category: 'accessories',
    subcategory: 'bags',
    baseCost: 12.50,
    sellingPrice: 28.99,
    profit: 16.49,
    markup: 132,
    sizes: ['One Size'],
    colors: ['Black', 'Navy'],
    description: 'Trendy fanny pack'
  },
  'keychain': {
    id: 'keychain',
    name: 'Acrylic Keychain',
    category: 'accessories',
    subcategory: 'small',
    baseCost: 3.50,
    sellingPrice: 9.99,
    profit: 6.49,
    markup: 185,
    sizes: ['2" x 2"'],
    colors: ['Clear', 'White'],
    description: 'Custom acrylic keychain'
  },

  // ===== HOME COLLECTION =====
  
  'fleece-blanket': {
    id: 'fleece-blanket',
    name: 'Fleece Throw Blanket 50"x60"',
    category: 'home',
    subcategory: 'blankets',
    baseCost: 28.00,
    sellingPrice: 59.99,
    profit: 31.99,
    markup: 114,
    featured: true,
    sizes: ['50" x 60"'],
    colors: ['White', 'Cream'],
    description: 'Soft fleece throw blanket'
  },
  'sherpa-blanket': {
    id: 'sherpa-blanket',
    name: 'Sherpa Blanket 60"x80"',
    category: 'home',
    subcategory: 'blankets',
    baseCost: 35.00,
    sellingPrice: 74.99,
    profit: 39.99,
    markup: 114,
    sizes: ['60" x 80"'],
    colors: ['White', 'Cream'],
    description: 'Luxury sherpa blanket'
  },
  'minky-blanket': {
    id: 'minky-blanket',
    name: 'Minky Plush Blanket',
    category: 'home',
    subcategory: 'blankets',
    baseCost: 32.50,
    sellingPrice: 69.99,
    profit: 37.49,
    markup: 115,
    sizes: ['50" x 60"'],
    colors: ['White', 'Cream'],
    description: 'Ultra-soft minky plush blanket'
  },
  'throw-pillow': {
    id: 'throw-pillow',
    name: 'Throw Pillow 18"x18"',
    category: 'home',
    subcategory: 'pillows',
    baseCost: 18.00,
    sellingPrice: 39.99,
    profit: 21.99,
    markup: 122,
    popular: true,
    sizes: ['18" x 18"'],
    colors: ['White', 'Natural'],
    description: 'Square throw pillow with insert'
  },
  'body-pillow': {
    id: 'body-pillow',
    name: 'Body Pillow 20"x54"',
    category: 'home',
    subcategory: 'pillows',
    baseCost: 25.00,
    sellingPrice: 54.99,
    profit: 29.99,
    markup: 120,
    sizes: ['20" x 54"'],
    colors: ['White', 'Natural'],
    description: 'Full-length body pillow'
  },
  'lumbar-pillow': {
    id: 'lumbar-pillow',
    name: 'Lumbar Pillow 12"x20"',
    category: 'home',
    subcategory: 'pillows',
    baseCost: 16.50,
    sellingPrice: 36.99,
    profit: 20.49,
    markup: 124,
    sizes: ['12" x 20"'],
    colors: ['White', 'Natural'],
    description: 'Rectangular lumbar support pillow'
  },
  'outdoor-pillow': {
    id: 'outdoor-pillow',
    name: 'Outdoor Pillow (Weather Resistant)',
    category: 'home',
    subcategory: 'pillows',
    baseCost: 22.00,
    sellingPrice: 47.99,
    profit: 25.99,
    markup: 118,
    sizes: ['18" x 18"'],
    colors: ['White', 'Natural'],
    description: 'Weather-resistant outdoor pillow'
  },
  'floor-pillow': {
    id: 'floor-pillow',
    name: 'Floor Pillow 26"x26"',
    category: 'home',
    subcategory: 'pillows',
    baseCost: 28.50,
    sellingPrice: 62.99,
    profit: 34.49,
    markup: 121,
    sizes: ['26" x 26"'],
    colors: ['White', 'Natural'],
    description: 'Large floor cushion pillow'
  },

  // ===== WALL ART & PRINTS COLLECTION =====
  
  'poster-12x18': {
    id: 'poster-12x18',
    name: 'Poster Print 12"x18"',
    category: 'prints',
    subcategory: 'posters',
    baseCost: 8.50,
    sellingPrice: 19.99,
    profit: 11.49,
    markup: 135,
    sizes: ['12" x 18"'],
    colors: ['Full Color'],
    description: 'High-quality poster print'
  },
  'poster-18x24': {
    id: 'poster-18x24',
    name: 'Poster Print 18"x24"',
    category: 'prints',
    subcategory: 'posters',
    baseCost: 12.00,
    sellingPrice: 27.99,
    profit: 15.99,
    markup: 133,
    sizes: ['18" x 24"'],
    colors: ['Full Color'],
    description: 'Large poster print'
  },
  'poster-24x36': {
    id: 'poster-24x36',
    name: 'Large Poster 24"x36"',
    category: 'prints',
    subcategory: 'posters',
    baseCost: 18.50,
    sellingPrice: 42.99,
    profit: 24.49,
    markup: 132,
    sizes: ['24" x 36"'],
    colors: ['Full Color'],
    description: 'Extra large poster print'
  },
  'canvas-12x12': {
    id: 'canvas-12x12',
    name: 'Canvas Print 12"x12"',
    category: 'prints',
    subcategory: 'canvas',
    baseCost: 22.00,
    sellingPrice: 49.99,
    profit: 27.99,
    markup: 127,
    sizes: ['12" x 12"'],
    colors: ['Full Color'],
    description: 'Square canvas print'
  },
  'canvas-16x16': {
    id: 'canvas-16x16',
    name: 'Canvas Print 16"x16"',
    category: 'prints',
    subcategory: 'canvas',
    baseCost: 28.50,
    sellingPrice: 64.99,
    profit: 36.49,
    markup: 128,
    featured: true,
    sizes: ['16" x 16"'],
    colors: ['Full Color'],
    description: 'Premium canvas print'
  },
  'canvas-20x20': {
    id: 'canvas-20x20',
    name: 'Canvas Print 20"x20"',
    category: 'prints',
    subcategory: 'canvas',
    baseCost: 35.00,
    sellingPrice: 79.99,
    profit: 44.99,
    markup: 129,
    sizes: ['20" x 20"'],
    colors: ['Full Color'],
    description: 'Large premium canvas print'
  },
  'metal-print': {
    id: 'metal-print',
    name: 'Metal Print 12"x12"',
    category: 'prints',
    subcategory: 'specialty',
    baseCost: 32.00,
    sellingPrice: 69.99,
    profit: 37.99,
    markup: 119,
    sizes: ['12" x 12"'],
    colors: ['Full Color'],
    description: 'Vibrant metal print'
  },
  'wood-print': {
    id: 'wood-print',
    name: 'Wood Print 12"x12"',
    category: 'prints',
    subcategory: 'specialty',
    baseCost: 29.50,
    sellingPrice: 64.99,
    profit: 35.49,
    markup: 120,
    sizes: ['12" x 12"'],
    colors: ['Full Color'],
    description: 'Natural wood print'
  },
  'acrylic-print': {
    id: 'acrylic-print',
    name: 'Acrylic Print 12"x12"',
    category: 'prints',
    subcategory: 'specialty',
    baseCost: 42.00,
    sellingPrice: 89.99,
    profit: 47.99,
    markup: 114,
    sizes: ['12" x 12"'],
    colors: ['Full Color'],
    description: 'Premium acrylic print'
  },
  'framed-print': {
    id: 'framed-print',
    name: 'Framed Print 12"x12"',
    category: 'prints',
    subcategory: 'framed',
    baseCost: 38.50,
    sellingPrice: 84.99,
    profit: 46.49,
    markup: 121,
    sizes: ['12" x 12"'],
    colors: ['Black Frame', 'White Frame'],
    description: 'Framed print ready to hang'
  }
}

// Helper functions
export function getProductsByCategory(category: string): MerchandiseProduct[] {
  return Object.values(MERCHANDISE_CATALOG).filter(product => product.category === category)
}

export function getFeaturedProducts(): MerchandiseProduct[] {
  return Object.values(MERCHANDISE_CATALOG).filter(product => product.featured)
}

export function getPopularProducts(): MerchandiseProduct[] {
  return Object.values(MERCHANDISE_CATALOG).filter(product => product.popular)
}

export function getProductById(id: string): MerchandiseProduct | undefined {
  return MERCHANDISE_CATALOG[id]
}

export function calculateTotalProfit(productIds: string[]): number {
  return productIds.reduce((total, id) => {
    const product = getProductById(id)
    return total + (product?.profit || 0)
  }, 0)
}

export function calculateTotalPrice(productIds: string[]): number {
  return productIds.reduce((total, id) => {
    const product = getProductById(id)
    return total + (product?.sellingPrice || 0)
  }, 0)
}

// Category definitions
export const CATEGORIES = {
  apparel: {
    name: 'Apparel',
    icon: '👕',
    subcategories: ['tshirts', 'hoodies']
  },
  headwear: {
    name: 'Headwear',
    icon: '🧢',
    subcategories: ['caps', 'beanies', 'hats', 'visors']
  },
  accessories: {
    name: 'Accessories',
    icon: '☕',
    subcategories: ['drinkware', 'tech', 'bags', 'small']
  },
  home: {
    name: 'Home',
    icon: '🏠',
    subcategories: ['blankets', 'pillows']
  },
  prints: {
    name: 'Wall Art',
    icon: '🖼️',
    subcategories: ['posters', 'canvas', 'specialty', 'framed']
  }
}

export const STAFF_PICKS = [
  'classic-tee',      // Most Popular T-Shirt
  'ceramic-mug',      // High Volume Mug
  'canvas-16x16',     // Premium Canvas
  'dad-hat'           // Best Margin Hat
]