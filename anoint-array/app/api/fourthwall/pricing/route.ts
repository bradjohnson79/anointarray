import { NextResponse } from 'next/server'
import { MERCHANDISE_CATALOG, CATEGORIES, STAFF_PICKS, getProductsByCategory, getFeaturedProducts } from '@/lib/merchandise'

export async function GET() {
  try {
    // Get all products organized by category
    const productsByCategory = Object.entries(CATEGORIES).reduce((acc, [categoryKey, categoryInfo]) => {
      acc[categoryKey] = {
        ...categoryInfo,
        products: getProductsByCategory(categoryKey)
      }
      return acc
    }, {} as any)

    // Get staff picks with full product details
    const staffPickProducts = STAFF_PICKS.map(productId => MERCHANDISE_CATALOG[productId]).filter(Boolean)

    // Get featured products
    const featuredProducts = getFeaturedProducts()

    // Calculate summary statistics
    const allProducts = Object.values(MERCHANDISE_CATALOG)
    const totalProducts = allProducts.length
    const averagePrice = allProducts.reduce((sum, p) => sum + p.sellingPrice, 0) / totalProducts
    const averageProfit = allProducts.reduce((sum, p) => sum + p.profit, 0) / totalProducts
    const averageMargin = allProducts.reduce((sum, p) => sum + p.markup, 0) / totalProducts
    const totalPotentialProfit = allProducts.reduce((sum, p) => sum + p.profit, 0)

    // Find highest and lowest margin products
    const highestMarginProduct = allProducts.reduce((max, p) => p.markup > max.markup ? p : max)
    const lowestMarginProduct = allProducts.reduce((min, p) => p.markup < min.markup ? p : min)
    const highestProfitProduct = allProducts.reduce((max, p) => p.profit > max.profit ? p : max)

    return NextResponse.json({
      success: true,
      catalog: {
        totalProducts,
        categories: productsByCategory,
        staffPicks: staffPickProducts,
        featured: featuredProducts,
        allProducts: MERCHANDISE_CATALOG
      },
      pricing: {
        summary: {
          totalProducts,
          averagePrice: Math.round(averagePrice * 100) / 100,
          averageProfit: Math.round(averageProfit * 100) / 100,
          averageMargin: Math.round(averageMargin),
          totalPotentialProfit: Math.round(totalPotentialProfit * 100) / 100
        },
        highlights: {
          highestMargin: {
            product: highestMarginProduct.name,
            margin: `${highestMarginProduct.markup}%`,
            profit: `$${highestMarginProduct.profit}`
          },
          lowestMargin: {
            product: lowestMarginProduct.name,
            margin: `${lowestMarginProduct.markup}%`,
            profit: `$${lowestMarginProduct.profit}`
          },
          highestProfit: {
            product: highestProfitProduct.name,
            profit: `$${highestProfitProduct.profit}`,
            margin: `${highestProfitProduct.markup}%`
          }
        }
      },
      recommendations: {
        bestSellers: staffPickProducts.map(p => ({
          id: p.id,
          name: p.name,
          price: p.sellingPrice,
          profit: p.profit,
          margin: `${p.markup}%`,
          category: p.category
        })),
        highMargin: allProducts
          .filter(p => p.markup >= 150)
          .sort((a, b) => b.markup - a.markup)
          .slice(0, 5)
          .map(p => ({
            id: p.id,
            name: p.name,
            price: p.sellingPrice,
            profit: p.profit,
            margin: `${p.markup}%`
          })),
        premium: allProducts
          .filter(p => p.sellingPrice >= 50)
          .sort((a, b) => b.profit - a.profit)
          .slice(0, 5)
          .map(p => ({
            id: p.id,
            name: p.name,
            price: p.sellingPrice,
            profit: p.profit,
            margin: `${p.markup}%`
          }))
      }
    })

  } catch (error) {
    console.error('Pricing API error:', error)
    return NextResponse.json(
      { error: 'Failed to load pricing information' },
      { status: 500 }
    )
  }
}