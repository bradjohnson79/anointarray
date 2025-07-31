import { createContext, useContext, useState, useEffect } from 'react'

interface CartItem {
  id: string
  title: string
  price: number
  quantity: number
  image?: string
}

interface ShippingOption {
  id: string
  name: string
  price: number
  estimatedDays: string
}

interface CartContextType {
  items: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getCartTotal: () => number
  getItemCount: () => number
  couponCode: string
  setCouponCode: (code: string) => void
  discount: number
  setDiscount: (amount: number) => void
  selectedShipping: ShippingOption | null
  setSelectedShipping: (option: ShippingOption) => void
  getSubtotal: () => number
  getFinalTotal: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('anoint-cart')
    if (savedCart) {
      setItems(JSON.parse(savedCart))
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('anoint-cart', JSON.stringify(items))
  }, [items])

  const addToCart = (item: CartItem) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id)
      if (existingItem) {
        return prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
        )
      }
      return [...prevItems, item]
    })
  }

  const removeFromCart = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }
    setItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, quantity } : item))
    )
  }

  const clearCart = () => {
    setItems([])
    setCouponCode('')
    setDiscount(0)
    setSelectedShipping(null)
  }

  const getCartTotal = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getItemCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0)
  }

  const getSubtotal = () => {
    return getCartTotal()
  }

  const getFinalTotal = () => {
    const subtotal = getSubtotal()
    const discountAmount = discount > 0 ? (subtotal * discount) / 100 : 0
    const shippingCost = selectedShipping?.price || 0
    return subtotal - discountAmount + shippingCost
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getItemCount,
        couponCode,
        setCouponCode,
        discount,
        setDiscount,
        selectedShipping,
        setSelectedShipping,
        getSubtotal,
        getFinalTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}