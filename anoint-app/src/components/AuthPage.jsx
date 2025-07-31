import React, { useState } from 'react';

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ fullName: '', email: '', password: '' });

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    console.log('Login submitted:', loginForm);
    // TODO: Integrate with Supabase auth
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    console.log('Register submitted:', registerForm);
    // TODO: Integrate with Supabase auth after CAPTCHA validation
  };

  const handleForgotPassword = () => {
    console.log('Forgot password clicked');
    // TODO: Integrate forgot password email function here
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center px-4">
      {/* Animated Background - Similar to homepage */}
      <div className="absolute inset-0">
        {/* Primary aurora gradient */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-3xl animate-pulse"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-emerald-500 rounded-full mix-blend-screen filter blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
      </div>

      {/* Auth Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          
          {/* Header */}
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 bg-gradient-to-r from-cyan-400 to-teal-300 bg-clip-text text-transparent">
            Welcome to ANOINT: Array
          </h1>

          {/* Tab Buttons */}
          <div className="flex mb-8 bg-black/30 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 px-4 rounded-md transition-all duration-300 ${
                activeTab === 'login'
                  ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2 px-4 rounded-md transition-all duration-300 ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {/* Forms Container with Animation */}
          <div className="relative">
            {/* Login Form */}
            <div
              className={`transition-all duration-500 ${
                activeTab === 'login'
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 absolute inset-0 -translate-x-full pointer-events-none'
              }`}
            >
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="block text-sm font-medium text-gray-200 mb-2">
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-sm font-medium text-gray-200 mb-2">
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                    placeholder="••••••••"
                  />
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Forgot your password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg hover:scale-105 transition-transform font-medium"
                >
                  Login
                </button>
              </form>
            </div>

            {/* Register Form */}
            <div
              className={`transition-all duration-500 ${
                activeTab === 'register'
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 absolute inset-0 translate-x-full pointer-events-none'
              }`}
            >
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label htmlFor="register-name" className="block text-sm font-medium text-gray-200 mb-2">
                    Full Name
                  </label>
                  <input
                    id="register-name"
                    type="text"
                    required
                    value={registerForm.fullName}
                    onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="register-email" className="block text-sm font-medium text-gray-200 mb-2">
                    Email
                  </label>
                  <input
                    id="register-email"
                    type="email"
                    required
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="register-password" className="block text-sm font-medium text-gray-200 mb-2">
                    Password
                  </label>
                  <input
                    id="register-password"
                    type="password"
                    required
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                    placeholder="••••••••"
                  />
                </div>

                {/* CAPTCHA Placeholder */}
                <div className="bg-black/20 border border-purple-500/20 rounded-lg p-4 text-center">
                  <p className="text-gray-400 text-sm">
                    {/* TODO: Integrate reCAPTCHA component here */}
                    [reCAPTCHA will be displayed here]
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg hover:scale-105 transition-transform font-medium"
                >
                  Create Account
                </button>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              By continuing, you agree to our{' '}
              <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;