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
        
        {/* Service Worker Unregistration - Clean up stale service workers */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.getRegistrations()
                    .then(function(registrations) {
                      for (let registration of registrations) {
                        registration.unregister()
                          .then(function(boolean) {
                            console.log('ServiceWorker unregistered successfully:', boolean);
                          })
                          .catch(function(error) {
                            console.log('ServiceWorker unregistration failed:', error);
                          });
                      }
                    })
                    .catch(function(error) {
                      console.log('ServiceWorker getRegistrations failed:', error);
                    });
                });
              }
              
              // Network status detection - delayed to avoid hydration mismatch
              // Wait for hydration to complete before updating network status
              setTimeout(function() {
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
              }, 0);
            `,
          }}
        />
      </body>
    </html>
  );
}
