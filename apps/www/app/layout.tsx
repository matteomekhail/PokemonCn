import type { Metadata } from "next"
import { Geist_Mono, Pixelify_Sans } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { SiteHeader } from "@/components/site-header"
import "./globals.css"

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const pixelifySans = Pixelify_Sans({
  variable: "--font-pixelify",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "PokemonCn — Pokémon-themed components, copy & paste",
    template: "%s · PokemonCn",
  },
  description:
    "A Pokémon-themed component registry built on Radix and Tailwind. Install with the standard shadcn CLI.",
  metadataBase: new URL("https://pokemoncn.com"),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistMono.variable} ${pixelifySans.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SiteHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
