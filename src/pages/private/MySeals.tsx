import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { HealingArray } from '../../types/database.types'
import { useAuth } from '../../contexts/AuthContext'

export default function MySeals() {
  const { user } = useAuth()
  const [arrays, setArrays] = useState<HealingArray[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchArrays()
    }
  }, [user])

  const fetchArrays = async () => {
    try {
      const { data, error } = await supabase
        .from('healing_arrays')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setArrays(data || [])
    } catch (error) {
      console.error('Error fetching healing arrays:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900">My Healing Seals</h1>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {arrays.length === 0 ? (
            <p className="text-gray-600">You haven't created any healing arrays yet.</p>
          ) : (
            arrays.map((array) => (
              <div key={array.id} className="bg-white rounded-lg shadow overflow-hidden">
                {array.image_url && (
                  <img src={array.image_url} alt="Healing Array" className="w-full h-48 object-cover" />
                )}
                <div className="p-6">
                  <p className="text-sm text-gray-500">
                    Created on {new Date(array.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}