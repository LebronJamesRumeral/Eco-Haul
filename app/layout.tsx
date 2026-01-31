import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import { OfflineIndicator } from "@/components/offline-indicator"
import "./globals.css"

const _geist = Inter({ 
  subsets: ["latin"],
  preload: false,
  fallback: ["system-ui", "sans-serif"],
})
const _geistMono = JetBrains_Mono({ 
  subsets: ["latin"],
  preload: false,
  fallback: ["monospace"],
})

export const metadata: Metadata = {
  title: "EcoHaul - Mining Operations Dashboard",
  description: "Dump truck, driver, trip, and cost monitoring system for mining operations",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EcoHaul",
  },
  applicationName: "EcoHaul",
  icons: {
    icon: [
      {
        url: "/pristine.jpg",
        type: "image/jpeg",
        sizes: "any",
      },
    ],
    shortcut: "/pristine.jpg",
    apple: "/pristine.jpg",
    other: [
      {
        rel: "icon",
        url: "/pristine.jpg",
      },
    ],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#16a34a",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/pristine.jpg" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/pristine.jpg" />
      </head>
      <body className={`${_geist.className} ${_geistMono.className} font-sans antialiased`}
        suppressHydrationWarning
        key="body"
      >
        <ThemeProvider>
          <OfflineIndicator />
          {children}
          <PWAInstallPrompt />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
