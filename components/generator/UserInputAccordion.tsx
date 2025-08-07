'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  Settings, 
  MessageSquare,
  Search,
  AlertTriangle 
} from 'lucide-react'

interface UserInput {
  fullName: string
  birthdate: { month: number, day: number, year: number }
  birthTime?: { hour: number, minute: number, period: 'AM' | 'PM' }
  birthPlace?: {
    displayName: string
    latitude: number
    longitude: number
  }
  template: 'torus-field' | 'flower-of-life' | 'sri-yantra'
  category: string
  sealType: string
  additionalComments?: string
}

interface UserInputAccordionProps {
  onSubmit: (data: UserInput) => void
}

interface LocationSearchResult {
  display_name: string
  lat: string
  lon: string
}

// Seal Array Categories and Types
const SEAL_CATEGORIES = {
  'mental-cognitive': {
    label: '🧠 Mental & Cognitive Enhancement',
    types: [
      'Memory Enhancement', 'Focus and Concentration', 'Anxiety Reduction',
      'Mental Clarity', 'ADD/ADHD Balancing', 'Depression Harmonization',
      'Enhanced Intelligence', 'Neuroplasticity Stimulation', 'Migraine Relief',
      'Synaptic Activation'
    ]
  },
  'physical-healing': {
    label: '🩺 Physical Healing',
    types: [
      'Full Body Detoxification', 'Organ Regeneration', 'Liver Purification',
      'Kidney Support', 'Lung & Breathwork Enhancement', 'Heart Coherence Alignment',
      'Spinal Realignment', 'Joint Repair & Lubrication', 'Muscle Recovery',
      'Hormonal Balance', 'Lymphatic Drainage', 'Immune System Boost',
      'Blood Sugar Regulation', 'Inflammation Reduction', 'Skin Regeneration',
      'Gut Microbiome Balancing', 'Nervous System Restoration', 'Bone Strengthening',
      'Reproductive System Enhancement', 'Adrenal Gland Support'
    ]
  },
  'energy-chakra': {
    label: '🧘 Energy & Chakra Work',
    types: [
      'Root Chakra Grounding', 'Sacral Chakra Flow', 'Solar Plexus Empowerment',
      'Heart Chakra Opening', 'Throat Chakra Expression', 'Third Eye Activation',
      'Crown Chakra Expansion', 'Full Chakra Alignment', 'Meridian Circuit Optimization',
      'Kundalini Awakening Support', 'Torus Field Harmonization', 'Aura Shielding',
      'Subtle Energy Calibration', 'Etheric Cord Clearing'
    ]
  },
  'spiritual-evolution': {
    label: '🌌 Spiritual Evolution',
    types: [
      'Dream Recall', 'Lucid Dreaming', 'Astral Travel Preparation',
      'Pineal Gland Activation', 'Intuitive Enhancement', 'Remote Viewing Amplification',
      'Multidimensional Integration', 'Past Life Access', 'Soul Retrieval',
      'Inner Child Healing', 'Light Body Activation', 'Omnipresent Awareness',
      'Sacred Geometry Alignment', 'Divine Feminine Awakening', 'Divine Masculine Awakening',
      'Akashic Access Calibration', 'Metaphysical Protection', 'Shamanic Grounding',
      'Ancestral Healing', 'Divine Purpose Activation'
    ]
  },
  'protection-shielding': {
    label: '🛡️ Protection & Shielding',
    types: [
      'Psychic Protection', 'EMF Shielding', 'Negative Energy Clearing',
      'Entity Detachment', 'Energetic Boundary Strengthening', 'Curse/Hex Removal',
      'Sovereignty Seal', 'Timeline Stabilization'
    ]
  },
  'performance-boosters': {
    label: '⚡ Performance Boosters',
    types: [
      'Athletic Performance', 'Sexual Vitality', 'Creative Inspiration',
      'Entrepreneurial Focus', 'Manifestation Enhancement', 'Vocal Strengthening',
      'Public Speaking Confidence', 'Artistic Flow Induction', 'Inner Fire / Tapas Amplifier'
    ]
  },
  'emotional-integration': {
    label: '💗 Emotional Integration',
    types: [
      'Self-Love Amplifier', 'Grief Processing', 'Anger Transformation',
      'Emotional Regulation', 'Relationship Healing', 'Forgiveness and Release',
      'Heart Wound Repair', 'Trauma Transmutation', 'Trust Repair',
      'Peace Induction', 'Joy Activation', 'Shame Liberation'
    ]
  },
  'environmental-lifestyle': {
    label: '🕊️ Environmental & Lifestyle',
    types: [
      'Sleep Optimization', 'Weight Balancing', 'Addiction Recovery Support',
      'Digital Detox', 'Sacred Space Harmonizer', 'Pet Healing Frequency',
      'Child Calming Seal', 'Travel Protection Seal', 'Financial Flow Attractor',
      'Plant Growth Harmonizer', 'House Clearing Seal', 'Career Alignment Seal'
    ]
  }
}

const TEMPLATES = [
  { id: 'torus-field', name: 'Torus Field', description: 'Dynamic energy circulation' },
  { id: 'flower-of-life', name: 'Flower of Life', description: 'Sacred geometric perfection' },
  { id: 'sri-yantra', name: 'Sri Yantra', description: 'Divine masculine/feminine balance' }
]

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function UserInputAccordion({ onSubmit }: UserInputAccordionProps) {
  const [formData, setFormData] = useState<UserInput>({
    fullName: '',
    birthdate: { month: 0, day: 0, year: 0 },
    birthTime: { hour: 12, minute: 0, period: 'PM' },
    birthPlace: { displayName: '', latitude: 0, longitude: 0 },
    template: 'flower-of-life',
    category: '',
    sealType: '',
    additionalComments: ''
  })

  const [locationSearch, setLocationSearch] = useState('')
  const [locationResults, setLocationResults] = useState<LocationSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  // Search locations using OpenStreetMap Nominatim
  const searchLocations = async (query: string) => {
    if (query.length < 3) {
      setLocationResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      )
      const results = await response.json()
      setLocationResults(results)
    } catch (error) {
      console.error('Location search failed:', error)
      setLocationResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Debounced location search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (locationSearch) {
        searchLocations(locationSearch)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [locationSearch])

  const updateField = (field: string, value: any) => {
    setFormData(prev => {
      const keys = field.split('.')
      if (keys.length === 1) {
        return { ...prev, [field]: value }
      } else {
        return {
          ...prev,
          [keys[0]]: {
            ...prev[keys[0] as keyof UserInput] as any,
            [keys[1]]: value
          }
        }
      }
    })
  }

  const selectLocation = (location: LocationSearchResult) => {
    updateField('birthPlace', {
      displayName: location.display_name,
      latitude: parseFloat(location.lat),
      longitude: parseFloat(location.lon)
    })
    setLocationSearch(location.display_name)
    setLocationResults([])
  }

  const getAvailableTypes = () => {
    if (!formData.category) return []
    return SEAL_CATEGORIES[formData.category as keyof typeof SEAL_CATEGORIES]?.types || []
  }

  const validateForm = (): boolean => {
    const newErrors: string[] = []

    if (!formData.fullName.trim()) newErrors.push('Full name is required')
    if (!formData.birthdate.month || !formData.birthdate.day || !formData.birthdate.year) {
      newErrors.push('Complete birth date is required')
    }
    if (!formData.category) newErrors.push('Category selection is required')
    if (!formData.sealType) newErrors.push('Seal type selection is required')

    // Validate birth date
    if (formData.birthdate.year < 1900 || formData.birthdate.year > new Date().getFullYear()) {
      newErrors.push('Birth year must be between 1900 and current year')
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate()
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i)

  return (
    <div className="space-y-6">
      {errors.length > 0 && (
        <Alert className="bg-red-900/60 backdrop-blur-lg border-red-700/50 text-red-200" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Personal Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold text-white">
          <User className="h-5 w-5 text-purple-400" />
          Personal Information
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Full Name *</label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => updateField('fullName', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800/60 backdrop-blur-lg border border-gray-700/50 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
            placeholder="Enter your full name"
          />
        </div>

        {/* Birth Date */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Birth Date *</label>
          <div className="grid grid-cols-3 gap-3">
            <select
              value={formData.birthdate.month}
              onChange={(e) => updateField('birthdate.month', parseInt(e.target.value))}
              className="px-3 py-2 bg-gray-800/60 backdrop-blur-lg border border-gray-700/50 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            >
              <option value={0}>Month</option>
              {MONTHS.map((month, index) => (
                <option key={month} value={index + 1}>{month}</option>
              ))}
            </select>
            
            <select
              value={formData.birthdate.day}
              onChange={(e) => updateField('birthdate.day', parseInt(e.target.value))}
              className="px-3 py-2 bg-gray-800/60 backdrop-blur-lg border border-gray-700/50 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            >
              <option value={0}>Day</option>
              {Array.from({ length: formData.birthdate.month ? getDaysInMonth(formData.birthdate.month, formData.birthdate.year || currentYear) : 31 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
            
            <select
              value={formData.birthdate.year}
              onChange={(e) => updateField('birthdate.year', parseInt(e.target.value))}
              className="px-3 py-2 bg-gray-800/60 backdrop-blur-lg border border-gray-700/50 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            >
              <option value={0}>Year</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Birth Time */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Birth Time (Optional)</label>
          <div className="grid grid-cols-3 gap-3">
            <select
              value={formData.birthTime?.hour || 12}
              onChange={(e) => updateField('birthTime.hour', parseInt(e.target.value))}
              className="px-3 py-2 bg-gray-800/60 backdrop-blur-lg border border-gray-700/50 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
            
            <select
              value={formData.birthTime?.minute || 0}
              onChange={(e) => updateField('birthTime.minute', parseInt(e.target.value))}
              className="px-3 py-2 bg-gray-800/60 backdrop-blur-lg border border-gray-700/50 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            >
              {Array.from({ length: 60 }, (_, i) => (
                <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
              ))}
            </select>
            
            <select
              value={formData.birthTime?.period || 'AM'}
              onChange={(e) => updateField('birthTime.period', e.target.value)}
              className="px-3 py-2 bg-gray-800/60 backdrop-blur-lg border border-gray-700/50 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>

        {/* Birth Place */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Birth Place (Optional)</label>
          <div className="relative">
            <input
              type="text"
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800/60 backdrop-blur-lg border border-gray-700/50 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
              placeholder="Search for your birth location..."
            />
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            
            {/* Location Results */}
            {locationResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-gray-800/90 backdrop-blur-lg border border-gray-700/50 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {locationResults.map((location, index) => (
                  <button
                    key={index}
                    onClick={() => selectLocation(location)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-700/50 focus:bg-gray-700/50 focus:outline-none text-white"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-300">{location.display_name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Template Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold text-white">
          <Settings className="h-5 w-5 text-purple-400" />
          Base Template Selection
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TEMPLATES.map(template => (
            <button
              key={template.id}
              onClick={() => updateField('template', template.id)}
              className={`p-4 border-2 rounded-lg text-left transition-all bg-gray-800/60 backdrop-blur-lg ${
                formData.template === template.id
                  ? 'border-purple-500/50 bg-purple-900/20'
                  : 'border-gray-700/50 hover:border-gray-600/50'
              }`}
            >
              <div className="font-semibold text-white">{template.name}</div>
              <div className="text-sm text-gray-300 mt-1">{template.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Category & Type Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold text-white">
          <Settings className="h-5 w-5 text-purple-400" />
          Seal Array Configuration
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Category *</label>
          <select
            value={formData.category}
            onChange={(e) => {
              updateField('category', e.target.value)
              updateField('sealType', '') // Reset type when category changes
            }}
            className="w-full px-3 py-2 bg-gray-800/60 backdrop-blur-lg border border-gray-700/50 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
          >
            <option value="">Select a category</option>
            {Object.entries(SEAL_CATEGORIES).map(([key, data]) => (
              <option key={key} value={key}>{data.label}</option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Seal Array Type *</label>
          <select
            value={formData.sealType}
            onChange={(e) => updateField('sealType', e.target.value)}
            disabled={!formData.category}
            className="w-full px-3 py-2 bg-gray-800/60 backdrop-blur-lg border border-gray-700/50 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white disabled:bg-gray-700/30 disabled:cursor-not-allowed"
          >
            <option value="">Select a type</option>
            {getAvailableTypes().map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Additional Comments */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold text-white">
          <MessageSquare className="h-5 w-5 text-purple-400" />
          Additional Information
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Optional Comments</label>
          <textarea
            value={formData.additionalComments}
            onChange={(e) => updateField('additionalComments', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-gray-800/60 backdrop-blur-lg border border-gray-700/50 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
            placeholder="Any specific needs or intentions for your seal array..."
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={handleSubmit}
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3"
        >
          Generate My ANOINT Array
        </Button>
      </div>
    </div>
  )
}