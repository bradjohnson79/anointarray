import Layout from '../../components/layout/Layout'
import { getSupabaseConfig } from '../../utils/supabase-config'

const EnvTest = () => {
  const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'NOT SET'
  const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'NOT SET'
  
  // Get the actual config being used by the app
  const { url: supabaseUrl, anonKey: supabaseKey } = getSupabaseConfig()
  const hasTypo = supabaseUrl.includes('xmnghciitifbwxzhgorw')
  const isCorrect = supabaseUrl.includes('xmnghciitiefbwxzhgrw')
  
  return (
    <Layout>
      <div className="min-h-screen bg-gray-900 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Environment Variables Test</h1>
          
          <div className="bg-gray-800 rounded-lg p-6 space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Raw Environment URL:</h2>
              <code className="block bg-gray-900 p-3 rounded text-sm break-all">
                {rawUrl}
              </code>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-2">Actual Config URL (used by app):</h2>
              <code className="block bg-gray-900 p-3 rounded text-sm break-all">
                {supabaseUrl}
              </code>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded ${hasTypo ? 'bg-red-900' : 'bg-gray-700'}`}>
                <p className="font-semibold">Has Typo (wrong):</p>
                <p className="text-2xl">{hasTypo ? '❌ YES' : '✅ NO'}</p>
              </div>
              
              <div className={`p-4 rounded ${isCorrect ? 'bg-green-900' : 'bg-gray-700'}`}>
                <p className="font-semibold">Is Correct:</p>
                <p className="text-2xl">{isCorrect ? '✅ YES' : '❌ NO'}</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-900 rounded">
              <h3 className="font-semibold mb-2">Expected URL:</h3>
              <code className="text-sm">https://xmnghciitiefbwxzhgrw.supabase.co</code>
            </div>
            
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Raw Environment Key:</h2>
              <div className="bg-gray-900 p-3 rounded space-y-2">
                <p className="text-sm">First 50 chars: <code>{rawKey.substring(0, 50)}...</code></p>
                <p className="text-sm">Key length: <span className={rawKey.length > 200 ? 'text-green-400' : 'text-red-400'}>{rawKey.length} characters</span></p>
                {rawKey.length < 200 && (
                  <p className="text-red-400 font-semibold">⚠️ Raw key is truncated!</p>
                )}
              </div>
            </div>
            
            <div className="mt-4">
              <h2 className="text-xl font-semibold mb-2">Actual Config Key (used by app):</h2>
              <div className="bg-gray-900 p-3 rounded space-y-2">
                <p className="text-sm">First 50 chars: <code>{supabaseKey.substring(0, 50)}...</code></p>
                <p className="text-sm">Key length: <span className={supabaseKey.length > 200 ? 'text-green-400' : 'text-red-400'}>{supabaseKey.length} characters</span></p>
                <p className="text-sm">Expected length: ~251 characters</p>
                {supabaseKey.length >= 251 && (
                  <p className="text-green-400 font-semibold">✅ Full key reconstructed successfully!</p>
                )}
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-400">
              <p>Build Time: {new Date().toISOString()}</p>
              <p>Environment: {import.meta.env.MODE}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default EnvTest