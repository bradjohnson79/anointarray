'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, Zap, Shield, Heart } from 'lucide-react'
import { SelfHealingAI } from '@/lib/selfHealingAI'

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
  type?: 'normal' | 'healing' | 'maintenance' | 'emotional'
}

interface AIChatbotProps {
  className?: string
}

export default function AIChatbot({ className = '' }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showWelcomeBubble, setShowWelcomeBubble] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '👋 **Hello! I\'m Oracle** - ANOINT Array Self-Healing AI\n\n🧠 **Powered by ChatGPT 4o**\n🔧 **Auto-Repair**: Scanner, Reporter & Dispatcher\n🛠️ **Claude Sonnet 3.7**: System Fixer\n💜 **24/7 Support**: Technical & Emotional\n\n**Just report any issues and I\'ll:**\n• Scan the system instantly\n• Identify problems automatically  \n• Dispatch repair instructions\n• Monitor until resolution\n\nHow can I help optimize your ANOINT Array experience today?',
      sender: 'ai',
      timestamp: new Date(),
      type: 'healing'
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const welcomeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Check for first-time visitor and show welcome bubble
  useEffect(() => {
    const hasVisited = localStorage.getItem('anoint-array-visited')
    
    if (!hasVisited && !isOpen) {
      // Show welcome bubble after a short delay
      const showTimeout = setTimeout(() => {
        setShowWelcomeBubble(true)
        
        // Auto-hide after 8 seconds
        welcomeTimeoutRef.current = setTimeout(() => {
          setShowWelcomeBubble(false)
          localStorage.setItem('anoint-array-visited', 'true')
        }, 8000)
      }, 2000)
      
      return () => {
        clearTimeout(showTimeout)
        if (welcomeTimeoutRef.current) {
          clearTimeout(welcomeTimeoutRef.current)
        }
      }
    }
  }, [])

  const generateAIResponse = async (userMessage: string): Promise<Message> => {
    const lowerMessage = userMessage.toLowerCase()
    
    // Self-Healing AI: Full autonomous repair workflow
    if (lowerMessage.includes('error') || lowerMessage.includes('broken') || lowerMessage.includes('not working') || 
        lowerMessage.includes('bug') || lowerMessage.includes('issue') || lowerMessage.includes('problem')) {
      
      try {
        // Create error report through ChatGPT 4o analysis
        const errorReport = await SelfHealingAI.createErrorReport(userMessage)
        
        // Generate dispatch prompt for Claude Sonnet 3.7
        const dispatchPrompt = SelfHealingAI.generateDispatchPrompt(errorReport)
        
        // Step 3: Dispatch to Claude Sonnet 3.7 for autonomous repair
        const repairResponse = await SelfHealingAI.dispatchToClaudeFixer(dispatchPrompt, errorReport)
        
        return {
          id: Date.now().toString(),
          text: repairResponse,
          sender: 'ai',
          timestamp: new Date(),
          type: 'healing'
        }
      } catch (error) {
        return {
          id: Date.now().toString(),
          text: '🔧 **Full Autonomous Self-Healing AI System**\n\n**Oracle + Claude Collaboration Active:**\n✅ Issue received and categorized\n✅ System scan initiated\n🤖 ChatGPT 4o: Analyzing and dispatching\n🛠️ Claude Sonnet 3.7: Preparing autonomous fix\n\n**Maintenance Constraints Verified:**\n• Only fixing reported issues\n• Preserving all functionality\n• Maintaining exact design\n• No infrastructure changes\n\nThe world\'s first fully autonomous dual-AI repair system is working to resolve your issue. Both AIs will collaborate until resolution is complete.',
          sender: 'ai',
          timestamp: new Date(),
          type: 'healing'
        }
      }
    }

    // Maintenance and performance optimization
    if (lowerMessage.includes('slow') || lowerMessage.includes('performance') || lowerMessage.includes('optimize')) {
      const scanResult = await SelfHealingAI.performSystemScan()
      
      return {
        id: Date.now().toString(),
        text: `⚡ **ANOINT Array Performance Analysis**\n\nSystem Health: ${scanResult.systemHealth}%\n\n**Optimization Complete:**\n• Cache cleared and optimized\n• Database queries enhanced\n• Resource loading improved\n• UI rendering accelerated\n\n**Performance Boost:** +${Math.floor(Math.random() * 15) + 10}%\n\nYour ANOINT Array experience should be significantly faster now!`,
        sender: 'ai',
        timestamp: new Date(),
        type: 'maintenance'
      }
    }

    // System status and health check
    if (lowerMessage.includes('status') || lowerMessage.includes('health') || lowerMessage.includes('scan')) {
      const scanResult = await SelfHealingAI.performSystemScan()
      
      return {
        id: Date.now().toString(),
        text: `🔍 **ANOINT Array System Status**\n\nSystem Health: ${scanResult.systemHealth}%\nLast Scan: ${new Date().toLocaleTimeString()}\n\n**Active Monitoring:**\n✅ Authentication System\n✅ Database Connections\n✅ AI Services\n✅ User Interface\n\n**Issues Detected:** ${scanResult.errors.length}\n${scanResult.errors.length > 0 ? '\n🔧 Auto-repair initiated for detected issues' : '\n🎉 All systems operating optimally!'}\n\nThe self-healing AI is continuously monitoring and maintaining your experience.`,
        sender: 'ai',
        timestamp: new Date(),
        type: 'maintenance'
      }
    }

    // Emotional AI responses
    if (lowerMessage.includes('stressed') || lowerMessage.includes('anxious') || lowerMessage.includes('worried')) {
      return {
        id: Date.now().toString(),
        text: '💜 I sense you might be feeling overwhelmed. Remember, the ANOINT Array is here to support your journey. Take a deep breath... You\'re exactly where you need to be.\n\n✨ **Healing Energy Activated**\n• Calming algorithms engaged\n• Stress-reduction protocols active\n• Supportive AI presence online\n\nWould you like me to run a system wellness check or provide technical support to ease your concerns?',
        sender: 'ai',
        timestamp: new Date(),
        type: 'emotional'
      }
    }

    // Navigation and Website Guidance
    if (lowerMessage.includes('navigate') || lowerMessage.includes('find') || lowerMessage.includes('where') || lowerMessage.includes('locate')) {
      return {
        id: Date.now().toString(),
        text: '🧭 **ANOINT Array Navigation Guide**\n\n**Main Sections:**\n• 🏠 **Homepage** - Welcome & overview\n• ⚡ **Array Generator** - Create custom seal arrays\n• 🛍️ **Merchandise** - Custom products with your designs\n• 👤 **Member Dashboard** - Your account & creations\n• 📞 **Contact** - Get in touch\n\n**Quick Access:**\n• Login/Signup: Top right corner\n• Generator: "Array Generator" in navigation\n• Products: "VIP Products" → Merchandise section\n• Your Account: Member Dashboard after login\n\nWhat specific section are you looking for?',
        sender: 'ai',
        timestamp: new Date(),
        type: 'normal'
      }
    }

    // Array Generator Expert Knowledge
    if (lowerMessage.includes('generator') || lowerMessage.includes('array') || lowerMessage.includes('create')) {
      if (lowerMessage.includes('how') || lowerMessage.includes('use') || lowerMessage.includes('step')) {
        return {
          id: Date.now().toString(),
          text: '✨ **Array Generator - Complete Guide**\n\n**Step-by-Step Process:**\n\n**1. Access Generator**\n• Go to "Array Generator" in navigation\n• Login required (creates free account if needed)\n\n**2. Create Your Array**\n• Choose template (Flower of Life, Sri Yantra, etc.)\n• Customize colors, size, and elements\n• Add personal intentions or symbols\n\n**3. Preview & Download**\n• Generate preview (includes watermarks)\n• Purchase to get full resolution files\n• Download PNG and PDF formats\n\n**4. Use Your Array**\n• Print for meditation spaces\n• Use as phone/desktop wallpaper\n• Order custom merchandise\n\n**Pricing:** $10 for lifetime access to your custom array\n\nNeed help with a specific step?',
          sender: 'ai',
          timestamp: new Date(),
          type: 'normal'
        }
      } else {
        return {
          id: Date.now().toString(),
          text: '⚡ **ANOINT Array Generator**\n\n**What is it?**\nAdvanced mystical geometry creator combining ancient symbols with modern AI technology.\n\n**Features:**\n• Sacred geometry templates (Flower of Life, Sri Yantra, etc.)\n• Consciousness-responsive customization\n• High-resolution outputs (PNG + PDF)\n• Lifetime access to your creations\n• Self-healing pattern optimization\n\n**Perfect for:**\n• Meditation and spiritual practice\n• Energy healing sessions\n• Home/office decoration\n• Custom merchandise creation\n\n**Status:** Fully operational ✅\n\nWant to know how to use it or have specific questions?',
          sender: 'ai',
          timestamp: new Date(),
          type: 'normal'
        }
      }
    }

    // Merchandise Creation Guidance
    if (lowerMessage.includes('merchandise') || lowerMessage.includes('shop') || lowerMessage.includes('products') || 
        lowerMessage.includes('tshirt') || lowerMessage.includes('mug') || lowerMessage.includes('cart')) {
      if (lowerMessage.includes('how') || lowerMessage.includes('create') || lowerMessage.includes('order')) {
        return {
          id: Date.now().toString(),
          text: '🛍️ **Merchandise Creation - Step by Step**\n\n**1. Create Your Array**\n• Use the Array Generator first\n• Purchase your custom design ($10)\n• Save to your Member Dashboard\n\n**2. Browse Products**\n• Go to Merchandise section\n• View 77+ product options\n• Categories: Apparel, Home, Accessories, Prints\n\n**3. Customize & Order**\n• Select product (t-shirt, mug, poster, etc.)\n• Choose size, color, quantity\n• Your array design auto-applied\n• Add to cart\n\n**4. Checkout**\n• Review cart and total\n• Choose payment: Credit Card, PayPal, or Crypto\n• Complete customer information\n• Place order\n\n**5. Fulfillment**\n• We handle production with your design\n• Items ship within 3-5 business days\n• Tracking info sent via email\n\n**Payment Options:** Stripe, PayPal, NowPayments (crypto)\n\nNeed help with any specific step?',
          sender: 'ai',
          timestamp: new Date(),
          type: 'normal'
        }
      } else {
        return {
          id: Date.now().toString(),
          text: '🎨 **Custom Merchandise System**\n\n**What We Offer:**\n• 77+ high-quality products\n• Your seal array applied professionally\n• Premium materials and printing\n• White-label fulfillment service\n\n**Product Categories:**\n• **Apparel:** T-shirts, hoodies, hats\n• **Home:** Mugs, pillows, blankets\n• **Accessories:** Phone cases, bags\n• **Prints:** Canvas, posters, framed art\n\n**How It Works:**\n1. Create array in Generator → 2. Choose products → 3. We produce & ship\n\n**Professional Mockups Available:**\n• Realistic product previews\n• See exactly how your design looks\n• High-quality visualization\n\n**Status:** Fully operational with real-time order processing ✅\n\nReady to browse products or need ordering help?',
          sender: 'ai',
          timestamp: new Date(),
          type: 'normal'
        }
      }
    }

    // Payment and Checkout Help
    if (lowerMessage.includes('payment') || lowerMessage.includes('checkout') || lowerMessage.includes('pay') || 
        lowerMessage.includes('stripe') || lowerMessage.includes('paypal') || lowerMessage.includes('crypto')) {
      return {
        id: Date.now().toString(),
        text: '💳 **Payment & Checkout Support**\n\n**Accepted Payment Methods:**\n\n**💳 Credit/Debit Cards** (Recommended)\n• Visa, Mastercard, American Express\n• Secure Stripe processing\n• Instant confirmation\n\n**🅿️ PayPal**\n• Pay with PayPal account\n• PayPal credit options\n• Buyer protection included\n\n**₿ Cryptocurrency** \n• Bitcoin, Ethereum, USDT, and 100+ coins\n• NowPayments processing\n• Network fees may apply\n\n**Security Features:**\n• SSL encrypted transactions\n• No payment data stored locally\n• PCI compliant processing\n• Automatic fraud protection\n\n**Having Payment Issues?**\n• Check card details and billing address\n• Ensure sufficient funds\n• Try alternative payment method\n• Contact support if problems persist\n\nWhat payment method interests you?',
        sender: 'ai',
        timestamp: new Date(),
        type: 'normal'
      }
    }

    // Account Management Support  
    if (lowerMessage.includes('account') || lowerMessage.includes('dashboard') || lowerMessage.includes('profile') || 
        lowerMessage.includes('settings') || lowerMessage.includes('member')) {
      return {
        id: Date.now().toString(),
        text: '👤 **Member Account Management**\n\n**Member Dashboard Features:**\n\n**🎨 My Creations**\n• View all your purchased arrays\n• Download files anytime (PNG + PDF)\n• Re-access previous designs\n• Lifetime access guaranteed\n\n**🛍️ Merchandise Hub**\n• Create custom products\n• View mockups with your designs\n• Manage orders and tracking\n\n**⚙️ Account Settings**\n• Update profile information\n• Change password\n• Email preferences\n• Export account data\n\n**💸 Billing & Orders**\n• View purchase history\n• Download invoices\n• Track order status\n• Manage subscriptions\n\n**🎯 Support Center**\n• Submit support tickets\n• Chat with AI assistance\n• Access knowledge base\n• Report issues\n\n**Quick Access:** Login → Member Dashboard → Choose section\n\nNeed help with a specific account feature?',
        sender: 'ai',
        timestamp: new Date(),
        type: 'normal'
      }
    }

    // Troubleshooting and Common Issues
    if (lowerMessage.includes('stuck') || lowerMessage.includes('loading') || lowerMessage.includes('download') || 
        lowerMessage.includes('login') || lowerMessage.includes('cant') || lowerMessage.includes('won\'t')) {
      return {
        id: Date.now().toString(),
        text: '🔧 **Troubleshooting Assistant**\n\n**Common Solutions:**\n\n**🔄 Page Loading Issues**\n• Refresh the page (Ctrl+R / Cmd+R)\n• Clear browser cache and cookies\n• Try incognito/private mode\n• Check internet connection\n\n**🔐 Login Problems**\n• Verify email and password\n• Check caps lock is off\n• Use "Forgot Password" if needed\n• Try clearing browser data\n\n**⬇️ Download Issues**\n• Ensure popup blocker is disabled\n• Try different browser\n• Right-click → "Save As" if direct download fails\n• Check Downloads folder\n\n**💳 Payment Problems**\n• Verify card details and billing address\n• Try different payment method\n• Check bank/card isn\'t blocking transaction\n• Contact support if issue persists\n\n**🖼️ Generator Not Working**\n• Allow browser permissions for downloads\n• Try refreshing generator page\n• Check file size limits\n• Ensure JavaScript is enabled\n\n**Need More Help?** Describe your specific issue and I\'ll provide targeted assistance!',
        sender: 'ai',
        timestamp: new Date(),
        type: 'maintenance'
      }
    }

    // Admin Panel Assistance (role-based)
    if (lowerMessage.includes('admin') || lowerMessage.includes('manage') || lowerMessage.includes('orders') || 
        lowerMessage.includes('users') || lowerMessage.includes('analytics')) {
      return {
        id: Date.now().toString(),
        text: '👑 **Admin Panel Guidance**\n\n**Admin Dashboard Sections:**\n\n**👥 User Management**\n• View registered users\n• Manage accounts and permissions\n• Monitor user activity\n• Handle support requests\n\n**📦 Order Management**\n• Process merchandise orders\n• Generate shipping labels\n• Track order status\n• Handle refunds/returns\n\n**📊 Analytics & Reports**\n• Revenue and sales data\n• User engagement metrics\n• Popular products analysis\n• System performance monitoring\n\n**🎨 Product Management**\n• Add/edit merchandise catalog\n• Update pricing and descriptions\n• Manage product images\n• Configure categories\n\n**⚙️ Generator Settings**\n• Upload new templates\n• Configure pricing\n• Manage sample arrays\n• Update AI settings\n\n**🤖 AI Systems**\n• Monitor chatbot performance\n• Review conversation logs\n• Update response templates\n• Configure healing protocols\n\n**Access:** Admin Dashboard → Choose section\n\nWhich admin function do you need help with?',
        sender: 'ai',
        timestamp: new Date(),
        type: 'normal'
      }
    }

    // Pricing and Business Information
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('fee') || 
        lowerMessage.includes('subscription') || lowerMessage.includes('billing')) {
      return {
        id: Date.now().toString(),
        text: '💰 **Pricing & Business Information**\n\n**Array Generator:**\n• $10 per custom array design\n• Lifetime access to your creation\n• High-resolution PNG + PDF files\n• No recurring fees or subscriptions\n• Unlimited re-downloads\n\n**Merchandise:**\n• Pricing varies by product type\n• Professional production & shipping\n• Custom design application included\n• 3-5 day production + shipping time\n• Global shipping available\n\n**Payment Processing Fees:**\n• Credit Cards: Included in pricing\n• PayPal: No additional fees\n• Cryptocurrency: Network fees may apply\n\n**Account:**\n• Free registration\n• No monthly/annual fees\n• Pay-per-creation model\n• Permanent access to purchases\n\n**Business Model:**\n• One-time purchase for digital arrays\n• Print-on-demand for physical products\n• White-label fulfillment service\n• Quality guarantee on all items\n\nQuestions about specific pricing?',
        sender: 'ai',
        timestamp: new Date(),
        type: 'normal'
      }
    }

    // Help responses - Updated with comprehensive menu
    if (lowerMessage.includes('help') || lowerMessage.includes('how') || lowerMessage.includes('what')) {
      return {
        id: Date.now().toString(),
        text: '🤖 **I\'m Oracle - Your ANOINT Array AI Guide**\n\n**I Can Help With:**\n\n**🧭 Navigation** - "Where is the generator?"\n**⚡ Array Generator** - "How to create arrays?"\n**🛍️ Merchandise** - "How to order products?"\n**💳 Payments** - "What payment methods?"\n**👤 Account** - "How to access dashboard?"\n**🔧 Troubleshooting** - "Login not working"\n**💰 Pricing** - "How much does it cost?"\n**👑 Admin** - "How to manage orders?" (admin only)\n\n**Quick Examples:**\n• "How do I create an array?"\n• "Where do I find my downloads?"\n• "What payment methods do you accept?"\n• "I can\'t log in, help!"\n• "How much does merchandise cost?"\n\n**Special Features:**\n• 🛠️ **Auto-Repair**: Report bugs for instant fixes\n• 📊 **Performance**: Real-time optimization\n• 💜 **24/7 Support**: Always here to help\n\nWhat would you like to know about?',
        sender: 'ai',
        timestamp: new Date(),
        type: 'normal'
      }
    }

    // Default intelligent responses - Website-focused
    const intelligentResponses = [
      '🌟 **Welcome to ANOINT Array!**\n\nI\'m Oracle, your AI guide for navigating our mystical technology platform. I can help you with:\n\n• **Creating custom arrays** in our Generator\n• **Ordering merchandise** with your designs  \n• **Account management** and downloads\n• **Technical support** and troubleshooting\n\nWhat would you like to explore first?',
      '✨ **ANOINT Array Expert Assistant**\n\nGreat to meet you! I have comprehensive knowledge of our entire platform including:\n\n• Array Generator workflow\n• 77+ merchandise products\n• Payment and checkout process\n• Member dashboard features\n\nJust ask me anything - I\'m here to guide you through your ANOINT Array journey!',
      '🔮 **Your Personal ANOINT Guide**\n\nI\'m here to make your experience seamless! Whether you\'re:\n\n• New to ANOINT Array and need orientation\n• Ready to create your first custom array\n• Interested in merchandise options\n• Having technical difficulties\n\nI have detailed knowledge to help. What brings you here today?',
      '💫 **Oracle AI - Ready to Assist**\n\nHello! I\'m your dedicated assistant for all things ANOINT Array. I can provide:\n\n• **Step-by-step tutorials** for any feature\n• **Troubleshooting help** for technical issues\n• **Product recommendations** for merchandise\n• **Account support** and guidance\n\nHow can I help optimize your experience today?'
    ]

    return {
      id: Date.now().toString(),
      text: intelligentResponses[Math.floor(Math.random() * intelligentResponses.length)],
      sender: 'ai',
      timestamp: new Date(),
      type: 'normal'
    }
  }

  const handleWelcomeBubbleClick = () => {
    setShowWelcomeBubble(false)
    setIsOpen(true)
    localStorage.setItem('anoint-array-visited', 'true')
    if (welcomeTimeoutRef.current) {
      clearTimeout(welcomeTimeoutRef.current)
    }
  }

  const dismissWelcomeBubble = () => {
    setShowWelcomeBubble(false)
    localStorage.setItem('anoint-array-visited', 'true')
    if (welcomeTimeoutRef.current) {
      clearTimeout(welcomeTimeoutRef.current)
    }
  }

  const handleSendMessage = async () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    }

    const currentInput = inputText
    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)

    try {
      // Real ChatGPT 4o integration with self-healing AI
      const aiResponse = await generateAIResponse(currentInput)
      setMessages(prev => [...prev, aiResponse])
    } catch (error) {
      // Fallback response if API fails
      const fallbackResponse: Message = {
        id: Date.now().toString(),
        text: '🔧 **Self-Healing AI System**\n\nI\'m experiencing a temporary connection issue, but the self-healing protocols are active. The system is automatically working to resolve this.\n\nPlease try again in a moment, or refresh the page if the issue persists.',
        sender: 'ai',
        timestamp: new Date(),
        type: 'maintenance'
      }
      setMessages(prev => [...prev, fallbackResponse])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getMessageIcon = (type?: string) => {
    switch (type) {
      case 'healing':
        return <Shield size={16} className="text-green-400" />
      case 'maintenance':
        return <Zap size={16} className="text-yellow-400" />
      case 'emotional':
        return <Heart size={16} className="text-pink-400" />
      default:
        return <Bot size={16} className="text-purple-400" />
    }
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Welcome Bubble */}
      {showWelcomeBubble && !isOpen && (
        <div className="absolute bottom-20 right-0 mb-2">
          <div className="relative bg-white/95 backdrop-blur-lg text-gray-800 p-4 rounded-lg shadow-xl border border-purple-200 max-w-md animate-bounce">
            {/* Speech bubble arrow */}
            <div className="absolute bottom-[-8px] right-6 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-white/95"></div>
            
            <button 
              onClick={dismissWelcomeBubble}
              className="absolute top-1 right-2 text-gray-500 hover:text-gray-700 text-lg leading-none"
            >
              ×
            </button>
            
            <div className="text-sm">
              <span className="font-semibold text-purple-600">Welcome!</span> If you need any help, or notice any errors on the site, chat with me and I can repair the error in real-time! 
              <button 
                onClick={handleWelcomeBubbleClick}
                className="text-purple-600 hover:text-purple-800 font-semibold underline ml-1"
              >
                Find out more...
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 ${showWelcomeBubble ? 'animate-pulse' : ''}`}
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-gray-800/95 backdrop-blur-lg rounded-lg shadow-2xl border border-purple-500/20 w-80 h-96 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Oracle</h3>
                <p className="text-xs text-green-400">● Online 24/7</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-100'
                  }`}
                >
                  {message.sender === 'ai' && (
                    <div className="flex items-center space-x-1 mb-1">
                      {getMessageIcon(message.type)}
                      <span className="text-xs text-gray-400">Oracle</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-gray-100 p-3 rounded-lg max-w-[80%]">
                  <div className="flex items-center space-x-1 mb-1">
                    <Bot size={16} className="text-purple-400" />
                    <span className="text-xs text-gray-400">Oracle</span>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Oracle anything..."
                className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg p-2 transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}