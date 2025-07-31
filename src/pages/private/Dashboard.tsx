import { useAuth } from '../../contexts/AuthContext'

export default function Dashboard() {
  const { user, profile } = useAuth()

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900">Welcome back, {profile?.full_name || user?.email}!</h2>
          <p className="mt-2 text-gray-600">This is your personal dashboard where you can access all your healing arrays and tools.</p>
        </div>
      </div>
    </div>
  )
}