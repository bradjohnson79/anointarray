export interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface HealingArray {
  id: string
  user_id: string
  metadata: Record<string, any>
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface VipWaitlist {
  id: string
  email: string
  full_name: string
  created_at: string
}

export interface Affiliate {
  id: string
  user_id: string
  full_name: string
  email: string
  payout_method: 'paypal' | 'stripe'
  payout_email: string | null
  coupon_code: string
  affiliate_link: string
  clicks: number
  conversions: number
  total_commission: number
  total_paid: number
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SiteUpdate {
  id: string
  title: string
  content: string
  author_id: string
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}