// Product Management Data Model and Functions

export interface Product {
  id: string
  sku: string
  title: string
  slug: string
  description: string
  images: string[]
  mainImageIndex: number
  price: number
  compareAtPrice?: number
  category: string
  keywords: string[]
  productType: 'physical' | 'digital'
  
  // Digital product fields
  digitalFile?: string
  fileSize?: number
  downloadLimit?: number
  
  // Physical product fields
  weight?: number
  dimensions?: { length: number; width: number; height: number }
  inventory?: number
  lowStockThreshold?: number
  
  // Common fields
  instructionsPdf?: string
  status: 'draft' | 'published' | 'hidden'
  isVisible: boolean
  relatedProducts?: string[]
  
  // SEO
  metaTitle?: string
  metaDescription?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

export interface ProductCategory {
  id: string
  name: string
  slug: string
  description?: string
  productCount: number
}

// Mock product data
export const mockProducts: Product[] = [
  {
    id: 'prod_001',
    sku: 'AA-CRYSTAL-001',
    title: 'Sacred Crystal Energy Array',
    slug: 'sacred-crystal-energy-array',
    description: 'A powerful crystal formation designed to amplify spiritual energy and enhance meditation practices. This carefully crafted array combines seven sacred stones in perfect geometric harmony.',
    images: [
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500',
      'https://images.unsplash.com/photo-1506629905427-1e85339d8ffd?w=500'
    ],
    mainImageIndex: 0,
    price: 149.99,
    compareAtPrice: 199.99,
    category: 'crystals',
    keywords: ['crystal', 'energy', 'healing', 'meditation', 'spiritual'],
    productType: 'physical',
    weight: 2.5,
    dimensions: { length: 15, width: 15, height: 8 },
    inventory: 25,
    lowStockThreshold: 5,
    instructionsPdf: '/pdfs/crystal-array-guide.pdf',
    status: 'published',
    isVisible: true,
    metaTitle: 'Sacred Crystal Energy Array - ANOINT Array',
    metaDescription: 'Amplify your spiritual practice with our Sacred Crystal Energy Array. Seven sacred stones in perfect harmony.',
    createdAt: '2025-07-15T10:00:00Z',
    updatedAt: '2025-08-01T12:00:00Z',
    publishedAt: '2025-07-16T09:00:00Z'
  },
  {
    id: 'prod_002',
    sku: 'AA-DIGITAL-001',
    title: 'Meditation Frequency Generator Pack',
    slug: 'meditation-frequency-generator-pack',
    description: 'A comprehensive digital collection of binaural beats and sacred frequencies designed to enhance meditation, promote healing, and align chakras. Includes 50+ audio tracks in high-quality format.',
    images: [
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
      'https://images.unsplash.com/photo-1604076792289-a1cf8b75b299?w=500'
    ],
    mainImageIndex: 0,
    price: 47.99,
    category: 'digital',
    keywords: ['meditation', 'binaural beats', 'frequency', 'healing', 'chakra', 'audio'],
    productType: 'digital',
    digitalFile: '/digital/meditation-frequency-pack.zip',
    fileSize: 850, // MB
    downloadLimit: 3,
    status: 'published',
    isVisible: true,
    metaTitle: 'Meditation Frequency Generator Pack - Digital Download',
    metaDescription: '50+ binaural beats and sacred frequencies for meditation and healing. Instant digital download.',
    createdAt: '2025-07-10T14:30:00Z',
    updatedAt: '2025-08-01T11:15:00Z',
    publishedAt: '2025-07-12T08:00:00Z'
  },
  {
    id: 'prod_003',
    sku: 'AA-SAGE-001',
    title: 'Premium White Sage Smudge Kit',
    slug: 'premium-white-sage-smudge-kit',
    description: 'Ethically sourced California white sage bundles with abalone shell and feather. Perfect for cleansing spaces and preparing for spiritual work. Each kit includes detailed cleansing instructions.',
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500',
      'https://images.unsplash.com/photo-1582735833473-e0e69f9be0e4?w=500',
      'https://images.unsplash.com/photo-1578948856697-db91d5225474?w=500'
    ],
    mainImageIndex: 0,
    price: 29.99,
    category: 'ritual',
    keywords: ['sage', 'smudge', 'cleansing', 'ritual', 'spiritual', 'purification'],
    productType: 'physical',
    weight: 0.3,
    dimensions: { length: 20, width: 15, height: 5 },
    inventory: 50,
    lowStockThreshold: 10,
    instructionsPdf: '/pdfs/smudging-guide.pdf',
    status: 'published',
    isVisible: true,
    metaTitle: 'Premium White Sage Smudge Kit - Ethically Sourced',
    metaDescription: 'Complete smudge kit with California white sage, abalone shell, and feather. Perfect for space cleansing.',
    createdAt: '2025-07-20T09:15:00Z',
    updatedAt: '2025-08-01T10:30:00Z',
    publishedAt: '2025-07-21T07:45:00Z'
  },
  {
    id: 'prod_004',
    sku: 'AA-BOOK-001',
    title: 'The Complete Guide to Sacred Geometry',
    slug: 'complete-guide-sacred-geometry',
    description: 'A comprehensive 280-page hardcover book exploring the mathematical principles behind universal patterns. Includes practical exercises for incorporating sacred geometry into daily life and spiritual practice.',
    images: [
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500'
    ],
    mainImageIndex: 0,
    price: 39.99,
    compareAtPrice: 49.99,
    category: 'books',
    keywords: ['sacred geometry', 'mathematics', 'spiritual', 'patterns', 'education'],
    productType: 'physical',
    weight: 0.8,
    dimensions: { length: 23, width: 18, height: 2 },
    inventory: 15,
    lowStockThreshold: 3,
    status: 'published',
    isVisible: true,
    metaTitle: 'The Complete Guide to Sacred Geometry - ANOINT Array',
    metaDescription: 'Discover the mathematical principles behind universal patterns. 280-page comprehensive guide.',
    createdAt: '2025-06-25T16:20:00Z',
    updatedAt: '2025-08-01T13:45:00Z',
    publishedAt: '2025-06-28T12:00:00Z'
  },
  {
    id: 'prod_005',
    sku: 'AA-DIGITAL-002',
    title: 'Astral Projection Training Course',
    slug: 'astral-projection-training-course',
    description: 'A complete digital course on astral projection techniques. Includes 12 video lessons, guided meditation audio files, progress tracking sheets, and a comprehensive PDF manual. Master the art of conscious out-of-body experiences.',
    images: [
      'https://images.unsplash.com/photo-1504198458649-3128b932f49e?w=500',
      'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=500',
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500'
    ],
    mainImageIndex: 0,
    price: 97.00,
    category: 'digital',
    keywords: ['astral projection', 'out of body', 'meditation', 'consciousness', 'spiritual training'],
    productType: 'digital',
    digitalFile: '/digital/astral-projection-course.zip',
    fileSize: 2100, // MB
    downloadLimit: 3,
    status: 'published',
    isVisible: true,
    metaTitle: 'Astral Projection Training Course - Complete Digital Program',
    metaDescription: 'Master astral projection with our complete training course. 12 video lessons plus guided meditations.',
    createdAt: '2025-07-05T11:00:00Z',
    updatedAt: '2025-08-01T14:20:00Z',
    publishedAt: '2025-07-08T10:00:00Z'
  },
  {
    id: 'prod_006',
    sku: 'AA-INCENSE-001',
    title: 'Chakra Alignment Incense Set',
    slug: 'chakra-alignment-incense-set',
    description: 'Seven premium incense sticks, each crafted with specific herbs and essential oils to align and balance the seven main chakras. Includes detailed instructions for chakra meditation and energy work.',
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
      'https://images.unsplash.com/photo-1582735833473-e0e69f9be0e4?w=500'
    ],
    mainImageIndex: 0,
    price: 24.99,
    category: 'ritual',
    keywords: ['chakra', 'incense', 'meditation', 'energy', 'alignment', 'aromatherapy'],
    productType: 'physical',
    weight: 0.2,
    dimensions: { length: 25, width: 5, height: 3 },
    inventory: 75,
    lowStockThreshold: 15,
    instructionsPdf: '/pdfs/chakra-alignment-guide.pdf',
    status: 'published',
    isVisible: true,
    metaTitle: 'Chakra Alignment Incense Set - 7 Sacred Scents',
    metaDescription: 'Balance your chakras with our premium incense set. Seven unique blends for complete energy alignment.',
    createdAt: '2025-07-12T08:30:00Z',
    updatedAt: '2025-08-01T09:45:00Z',
    publishedAt: '2025-07-14T06:15:00Z'
  },
  {
    id: 'prod_007',
    sku: 'AA-TAROT-001',
    title: 'Mystical Tarot Deck & Guidebook',
    slug: 'mystical-tarot-deck-guidebook',
    description: 'A beautifully illustrated 78-card tarot deck with original artwork inspired by cosmic and mystical themes. Includes a comprehensive 200-page guidebook with card meanings, spreads, and interpretation techniques.',
    images: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500',
      'https://images.unsplash.com/photo-1444927714506-8492d94b5ba0?w=500',
      'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=500'
    ],
    mainImageIndex: 0,
    price: 34.99,
    category: 'divination',
    keywords: ['tarot', 'cards', 'divination', 'mystical', 'fortune telling', 'guidance'],
    productType: 'physical',
    weight: 0.4,
    dimensions: { length: 12, width: 8, height: 4 },
    inventory: 30,
    lowStockThreshold: 8,
    status: 'published',
    isVisible: true,
    metaTitle: 'Mystical Tarot Deck & Guidebook - 78 Beautiful Cards',
    metaDescription: 'Explore the mysteries with our cosmic-inspired tarot deck. Includes comprehensive guidebook.',
    createdAt: '2025-06-30T13:45:00Z',
    updatedAt: '2025-08-01T15:10:00Z',
    publishedAt: '2025-07-02T11:30:00Z'
  },
  {
    id: 'prod_008',
    sku: 'AA-DIGITAL-003',
    title: 'Moon Phase Ritual Calendar 2025',
    slug: 'moon-phase-ritual-calendar-2025',
    description: 'A complete digital calendar featuring all moon phases for 2025, with suggested rituals, spell work, and energy practices for each lunar cycle. Includes printable versions and digital planning templates.',
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500',
      'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=500'
    ],
    mainImageIndex: 0,
    price: 19.99,
    category: 'digital',
    keywords: ['moon phases', 'lunar calendar', 'ritual', 'astrology', 'planning'],
    productType: 'digital',
    digitalFile: '/digital/moon-calendar-2025.zip',
    fileSize: 45, // MB
    downloadLimit: 5,
    status: 'published',
    isVisible: true,
    metaTitle: 'Moon Phase Ritual Calendar 2025 - Digital Download',
    metaDescription: 'Plan your spiritual practice with our complete 2025 lunar calendar. Rituals for every moon phase.',
    createdAt: '2025-07-01T10:15:00Z',
    updatedAt: '2025-08-01T08:30:00Z',
    publishedAt: '2025-07-03T09:00:00Z'
  }
]

// Mock product categories
export const mockCategories: ProductCategory[] = [
  { id: 'crystals', name: 'Crystals & Stones', slug: 'crystals', description: 'Sacred crystals and healing stones', productCount: 1 },
  { id: 'digital', name: 'Digital Products', slug: 'digital', description: 'Downloadable courses and content', productCount: 3 },
  { id: 'ritual', name: 'Ritual Supplies', slug: 'ritual', description: 'Tools for spiritual practice', productCount: 2 },
  { id: 'books', name: 'Books & Guides', slug: 'books', description: 'Educational and spiritual books', productCount: 1 },
  { id: 'divination', name: 'Divination Tools', slug: 'divination', description: 'Tarot, oracle, and fortune telling', productCount: 1 }
]

// Product management functions
export function getAllProducts(): Product[] {
  return mockProducts
}

export function getProductById(id: string): Product | undefined {
  return mockProducts.find(product => product.id === id)
}

export function getProductBySlug(slug: string): Product | undefined {
  return mockProducts.find(product => product.slug === slug)
}

export function getProductsByCategory(category: string): Product[] {
  return mockProducts.filter(product => product.category === category && product.isVisible)
}

export function getPublishedProducts(): Product[] {
  return mockProducts.filter(product => product.status === 'published' && product.isVisible)
}

export function searchProducts(query: string): Product[] {
  const lowercaseQuery = query.toLowerCase()
  return mockProducts.filter(product =>
    product.isVisible && (
      product.title.toLowerCase().includes(lowercaseQuery) ||
      product.description.toLowerCase().includes(lowercaseQuery) ||
      product.keywords.some(keyword => keyword.toLowerCase().includes(lowercaseQuery))
    )
  )
}

export function getAllCategories(): ProductCategory[] {
  return mockCategories
}

export function generateSKU(title: string): string {
  const prefix = 'AA'
  const suffix = title.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${prefix}-${suffix}-${random}`
}

export function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function calculateTotalWeight(items: { productId: string; quantity: number }[]): number {
  return items.reduce((total, item) => {
    const product = getProductById(item.productId)
    return total + (product?.weight || 0) * item.quantity
  }, 0)
}

export function calculateTotalValue(items: { productId: string; quantity: number }[]): number {
  return items.reduce((total, item) => {
    const product = getProductById(item.productId)
    return total + (product?.price || 0) * item.quantity
  }, 0)
}

export function isLowStock(product: Product): boolean {
  if (product.productType === 'digital') return false
  return (product.inventory || 0) <= (product.lowStockThreshold || 0)
}

export function updateProductInventory(productId: string, quantity: number): void {
  const productIndex = mockProducts.findIndex(p => p.id === productId)
  if (productIndex !== -1 && mockProducts[productIndex].inventory !== undefined) {
    mockProducts[productIndex].inventory! -= quantity
    mockProducts[productIndex].updatedAt = new Date().toISOString()
  }
}