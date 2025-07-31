import { useState, useRef } from 'react'
import Layout from '../../components/layout/Layout'
import ProtectedRoute from '../../components/layout/ProtectedRoute'
import { useAuth } from '../../contexts/AuthContext'
import { Camera, User, Mail, Calendar, Shield, Save, Upload } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    display_name: profile?.display_name || '',
    email: profile?.email || user?.email || ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          display_name: formData.display_name,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id)

      if (error) {
        console.error('Error updating profile:', error)
        alert('Error updating profile: ' + error.message)
      } else {
        await refreshProfile()
        setIsEditing(false)
        alert('Profile updated successfully!')
      }
    } catch (error) {
      console.error('Exception updating profile:', error)
      alert('Error updating profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    setIsUploadingAvatar(true)
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        alert('Error uploading avatar: ' + uploadError.message)
        return
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      if (urlData) {
        // Update profile with avatar URL
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            avatar_url: urlData.publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (updateError) {
          console.error('Error updating avatar URL:', updateError)
          alert('Error updating profile with avatar: ' + updateError.message)
        } else {
          await refreshProfile()
          alert('Avatar updated successfully!')
        }
      }
    } catch (error) {
      console.error('Exception uploading avatar:', error)
      alert('Error uploading avatar')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const getUserInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  const getDisplayName = () => {
    if (profile?.display_name) return profile.display_name
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`
    }
    if (profile?.first_name) return profile.first_name
    return user?.email?.split('@')[0] || 'User'
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="min-h-screen bg-gray-900 text-white py-12 px-6 md:px-16 lg:px-32">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800 rounded-lg p-8">
              <h1 className="text-3xl font-serif mb-8">Profile Settings</h1>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Avatar Section */}
                <div className="md:col-span-1">
                  <div className="bg-gray-700 rounded-lg p-6 text-center">
                    <div className="relative inline-block mb-4">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Avatar"
                          className="w-24 h-24 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                          {getUserInitials()}
                        </div>
                      )}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="absolute bottom-0 right-0 bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full transition-colors disabled:opacity-50"
                      >
                        {isUploadingAvatar ? (
                          <Upload size={16} className="animate-spin" />
                        ) : (
                          <Camera size={16} />
                        )}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </div>
                    <h3 className="text-xl font-semibold">{getDisplayName()}</h3>
                    <p className="text-gray-400 text-sm">{user?.email}</p>
                    <p className="text-purple-400 text-sm capitalize mt-2">{profile?.role || 'User'}</p>
                  </div>

                  {/* Account Info */}
                  <div className="bg-gray-700 rounded-lg p-6 mt-6">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Shield size={20} className="text-cyan-400" />
                      Account Info
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span>Joined {new Date(user?.created_at || '').toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-gray-400" />
                        <span className={profile?.is_verified ? 'text-green-400' : 'text-yellow-400'}>
                          {profile?.is_verified ? 'Email Verified' : 'Email Pending'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <span className={profile?.is_active ? 'text-green-400' : 'text-red-400'}>
                          {profile?.is_active ? 'Account Active' : 'Account Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Form */}
                <div className="md:col-span-2">
                  <div className="bg-gray-700 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold">Personal Information</h3>
                      {!isEditing && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Edit Profile
                        </button>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">First Name</label>
                          <input
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:opacity-50"
                            placeholder="Enter your first name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Last Name</label>
                          <input
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:opacity-50"
                            placeholder="Enter your last name"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Display Name</label>
                        <input
                          type="text"
                          name="display_name"
                          value={formData.display_name}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:opacity-50"
                          placeholder="How should we display your name?"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          disabled={true}
                          className="w-full px-4 py-2 bg-gray-600 text-gray-400 rounded-lg opacity-50 cursor-not-allowed"
                          placeholder="Email cannot be changed"
                        />
                        <p className="text-xs text-gray-500 mt-1">Email address cannot be changed from this page</p>
                      </div>

                      {isEditing && (
                        <div className="flex gap-4 pt-6 border-t border-gray-600">
                          <button
                            onClick={handleSaveProfile}
                            disabled={isSaving}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <Save size={16} />
                            {isSaving ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditing(false)
                              setFormData({
                                first_name: profile?.first_name || '',
                                last_name: profile?.last_name || '',
                                display_name: profile?.display_name || '',
                                email: profile?.email || user?.email || ''
                              })
                            }}
                            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

export default Profile