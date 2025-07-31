import Layout from '../../components/layout/Layout'

const EnvTest = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'NOT SET'
  const hasTypo = supabaseUrl.includes('xmnghciitifbwxzhgorw')
  const isCorrect = supabaseUrl.includes('xmnghciitiefbwxzhgrw')
  
  return (
    <Layout>
      <div className="min-h-screen bg-gray-900 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Environment Variables Test</h1>
          
          <div className="bg-gray-800 rounded-lg p-6 space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">VITE_SUPABASE_URL:</h2>
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