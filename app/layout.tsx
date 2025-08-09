import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ANOINT Array - Revolutionary AI Platform",
  description: "The world's first fully autonomous, self-healing website with AI maintenance",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ANOINT Array",
  },
  icons: {
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152" },
      { url: "/icons/icon-192x192.png", sizes: "192x192" },
    ],
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192" },
      { url: "/icons/icon-512x512.png", sizes: "512x512" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#9333ea",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* PWA Additional Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ANOINT Array" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#9333ea" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(registration) {
                      console.log('ServiceWorker registration successful with scope: ', registration.scope);
                      
                      // Check for updates
                      registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New content available, notify user
                            if (window.confirm('New version available! Refresh to update?')) {
                              window.location.reload();
                            }
                          }
                        });
                      });
                    })
                    .catch(function(error) {
                      console.log('ServiceWorker registration failed: ', error);
                    });
                });
              }
              
              // PWA Install Prompt
              let deferredPrompt;
              const installButton = document.createElement('button');
              installButton.style.display = 'none';
              installButton.textContent = 'Install App';
              installButton.className = 'pwa-install-btn';
              
              window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                
                // Show install button/prompt
                const showInstallPrompt = () => {
                  if (deferredPrompt && !window.matchMedia('(display-mode: standalone)').matches) {
                    // Create install banner
                    const banner = document.createElement('div');
                    banner.innerHTML = \`
                      <div style="position: fixed; top: 0; left: 0; right: 0; background: linear-gradient(135deg, #9333ea, #7c3aed); color: white; padding: 12px; text-align: center; z-index: 9999; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
                        <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                          <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold;">A</div>
                            <div>
                              <div style="font-weight: 600; font-size: 14px;">Install ANOINT Array</div>
                              <div style="font-size: 12px; opacity: 0.9;">Get the full app experience</div>
                            </div>
                          </div>
                          <div style="display: flex; gap: 8px;">
                            <button onclick="installPWA()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 16px; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 600;">Install</button>
                            <button onclick="dismissInstallPrompt()" style="background: transparent; border: 1px solid rgba(255,255,255,0.3); color: white; padding: 8px 16px; border-radius: 6px; font-size: 12px; cursor: pointer;">Later</button>
                          </div>
                        </div>
                      </div>
                    \`;
                    banner.id = 'pwa-install-banner';
                    document.body.appendChild(banner);
                    
                    // Add margin to body to compensate for banner
                    document.body.style.marginTop = '70px';
                  }
                };
                
                // Show install prompt after 3 seconds if not installed
                setTimeout(showInstallPrompt, 3000);
              });
              
              window.installPWA = () => {
                if (deferredPrompt) {
                  deferredPrompt.prompt();
                  deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                      console.log('User accepted the install prompt');
                    }
                    deferredPrompt = null;
                    dismissInstallPrompt();
                  });
                }
              };
              
              window.dismissInstallPrompt = () => {
                const banner = document.getElementById('pwa-install-banner');
                if (banner) {
                  banner.remove();
                  document.body.style.marginTop = '0';
                }
                localStorage.setItem('pwa-install-dismissed', 'true');
              };
              
              // Handle app installation
              window.addEventListener('appinstalled', (evt) => {
                console.log('PWA was installed');
                dismissInstallPrompt();
              });
              
              // Detect if running as PWA
              if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
                document.documentElement.classList.add('pwa-mode');
              }
              
              // Network status detection
              function updateNetworkStatus() {
                if (navigator.onLine) {
                  document.documentElement.classList.remove('offline');
                  document.documentElement.classList.add('online');
                } else {
                  document.documentElement.classList.remove('online');
                  document.documentElement.classList.add('offline');
                }
              }
              
              window.addEventListener('online', updateNetworkStatus);
              window.addEventListener('offline', updateNetworkStatus);
              updateNetworkStatus();
            `,
          }}
        />
      </body>
    </html>
  );
}
