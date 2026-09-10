import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { IBM_Plex_Sans, IBM_Plex_Serif } from 'next/font/google'
import './globals.css'

const plexSans = IBM_Plex_Sans({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
})

const plexSerif = IBM_Plex_Serif({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  variable: '--font-serif',
})

export const metadata: Metadata = {
  title: 'МедикТест КР',
  description: 'Подготовка к аккредитации для медиков Кыргызстана',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body className={`${plexSans.variable} ${plexSerif.variable}`}>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        {children}
      </body>
    </html>
  )
}
