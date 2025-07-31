import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { SiteUpdate } from '../../types/database.types'

export default function Blog() {
  const [updates, setUpdates] = useState<SiteUpdate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUpdates()
  }, [])

  const fetchUpdates = async () => {
    try {
      const { data, error } = await supabase
        .from('site_updates')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })

      if (error) throw error
      setUpdates(data || [])
    } catch (error) {
      console.error('Error fetching updates:', error)
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
        <h1 className="text-4xl font-bold text-gray-900">Blog</h1>
        <div className="mt-8 space-y-8">
          {updates.length === 0 ? (
            <p className="text-gray-600">No blog posts available yet.</p>
          ) : (
            updates.map((update) => (
              <article key={update.id} className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-semibold text-gray-900">{update.title}</h2>
                <p className="mt-2 text-sm text-gray-500">
                  Published on {new Date(update.published_at!).toLocaleDateString()}
                </p>
                <div className="mt-4 text-gray-700 prose max-w-none" dangerouslySetInnerHTML={{ __html: update.content }} />
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  )
}