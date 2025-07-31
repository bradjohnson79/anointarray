import { useState } from 'react'
import Layout from '../../components/layout/Layout'
import { useAuth } from '../../contexts/AuthContext'

const TestUserCreation = () => {
  const { signUp, signIn, user, profile, loading } = useAuth()
  const [formData, setFormData] = useState({
    email: 'test@example.com',
    password: 'TestPassword123'
  })
  const [testResults, setTestResults] = useState<string[]>([])
  const [isTestingSignup, setIsTestingSignup] = useState(false)
  const [isTestingLogin, setIsTestingLogin] = useState(false)

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testSignup = async () => {
    setIsTestingSignup(true)
    addResult(`🔄 Testing signup for: ${formData.email}`)
    
    try {
      const { error } = await signUp(formData.email, formData.password)
      
      if (error) {
        addResult(`❌ Signup failed: ${error.message}`)
      } else {
        addResult(`✅ Signup successful!`)
        addResult(`ℹ️ Check your email for verification (if required)`)
      }
    } catch (err) {
      addResult(`❌ Signup exception: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsTestingSignup(false)
    }
  }

  const testLogin = async () => {
    setIsTestingLogin(true)
    addResult(`🔄 Testing login for: ${formData.email}`)
    
    try {
      const { error } = await signIn(formData.email, formData.password)
      
      if (error) {
        addResult(`❌ Login failed: ${error.message}`)
      } else {
        addResult(`✅ Login successful!`)
      }
    } catch (err) {
      addResult(`❌ Login exception: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsTestingLogin(false)
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-900 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">User Creation Testing</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Test Form */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-6">Test User Creation</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={testSignup}
                    disabled={isTestingSignup || loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                  >
                    {isTestingSignup ? 'Testing...' : 'Test Signup'}
                  </button>
                  
                  <button
                    onClick={testLogin}
                    disabled={isTestingLogin || loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                  >
                    {isTestingLogin ? 'Testing...' : 'Test Login'}
                  </button>
                </div>
                
                <button
                  onClick={clearResults}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                >
                  Clear Results
                </button>
              </div>
            </div>
            
            {/* Current User Status */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-6">Current User Status</h2>
              
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent mr-2"></div>
                  <span>Loading...</span>
                </div>
              ) : user ? (
                <div className="space-y-3">
                  <div className="bg-green-900 p-3 rounded">
                    <p className="text-green-300 font-semibold">✅ User Authenticated</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <span className="ml-2">{user.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">User ID:</span>
                    <span className="ml-2 text-xs font-mono">{user.id}</span>
                  </div>
                  {profile && (
                    <>
                      <div>
                        <span className="text-gray-400">Role:</span>
                        <span className={`ml-2 px-2 py-1 text-xs rounded ${
                          profile.role === 'admin' ? 'bg-purple-900 text-purple-300' :
                          profile.role === 'moderator' ? 'bg-blue-900 text-blue-300' :
                          profile.role === 'vip' ? 'bg-yellow-900 text-yellow-300' :
                          'bg-gray-700 text-gray-300'
                        }`}>
                          {profile.role}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Status:</span>
                        <span className={`ml-2 px-2 py-1 text-xs rounded ${
                          profile.is_active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                        }`}>
                          {profile.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Verified:</span>
                        <span className={`ml-2 px-2 py-1 text-xs rounded ${
                          profile.is_verified ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
                        }`}>
                          {profile.is_verified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-gray-400">❌ No user authenticated</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Test Results */}
          <div className="mt-8 bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6">Test Results</h2>
            
            <div className="bg-black rounded p-4 max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500">No test results yet. Run a test to see results here.</p>
              ) : (
                <div className="space-y-2">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-sm font-mono">
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Instructions */}
          <div className="mt-8 bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">📋 Testing Instructions</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>First, make sure the database is set up (see DATABASE_SETUP_GUIDE.md)</li>
              <li>Enter a test email and password above</li>
              <li>Click "Test Signup" to create a new user</li>
              <li>If successful, click "Test Login" to verify authentication</li>
              <li>Check the "Current User Status" panel for profile information</li>
              <li>View detailed results in the "Test Results" section</li>
            </ol>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default TestUserCreation