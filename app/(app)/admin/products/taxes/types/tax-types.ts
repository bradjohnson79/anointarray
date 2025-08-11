export interface TaxRate {
  id: string
  province_code: string
  province_name: string
  tax_type: 'GST_ONLY' | 'HST' | 'GST_PST' | 'GST_QST'
  gst_rate: number
  hst_rate: number
  pst_rate: number
  qst_rate: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TaxCalculationRequest {
  amount: number
  province_code: string
  is_tax_inclusive?: boolean
  product_type?: 'physical' | 'digital'
}

export interface TaxBreakdown {
  gst: { rate: number; amount: number }
  hst: { rate: number; amount: number }
  pst: { rate: number; amount: number }
  qst: { rate: number; amount: number }
}

export interface TaxCalculationResult {
  province_code: string
  province_name: string
  tax_type: string
  base_amount: number
  tax_breakdown: TaxBreakdown
  total_tax: number
  total_amount: number
  effective_rate: number
}

export interface TaxApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export const CANADIAN_PROVINCES = [
  { code: 'AB', name: 'Alberta', defaultTaxType: 'GST_ONLY' as const },
  { code: 'BC', name: 'British Columbia', defaultTaxType: 'GST_PST' as const },
  { code: 'MB', name: 'Manitoba', defaultTaxType: 'GST_PST' as const },
  { code: 'NB', name: 'New Brunswick', defaultTaxType: 'HST' as const },
  { code: 'NL', name: 'Newfoundland and Labrador', defaultTaxType: 'HST' as const },
  { code: 'NT', name: 'Northwest Territories', defaultTaxType: 'GST_ONLY' as const },
  { code: 'NS', name: 'Nova Scotia', defaultTaxType: 'HST' as const },
  { code: 'NU', name: 'Nunavut', defaultTaxType: 'GST_ONLY' as const },
  { code: 'ON', name: 'Ontario', defaultTaxType: 'HST' as const },
  { code: 'PE', name: 'Prince Edward Island', defaultTaxType: 'HST' as const },
  { code: 'QC', name: 'Quebec', defaultTaxType: 'GST_QST' as const },
  { code: 'SK', name: 'Saskatchewan', defaultTaxType: 'GST_PST' as const },
  { code: 'YT', name: 'Yukon', defaultTaxType: 'GST_ONLY' as const }
] as const

export const TAX_TYPE_DESCRIPTIONS = {
  GST_ONLY: 'GST Only - Federal goods and services tax',
  HST: 'HST - Harmonized sales tax (combines federal and provincial)',
  GST_PST: 'GST + PST - Separate federal and provincial taxes',
  GST_QST: 'GST + QST - Federal GST plus Quebec sales tax (QST calculated on GST-inclusive amount)'
} as const