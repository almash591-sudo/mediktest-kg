import type { Metadata } from 'next'
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body className={`${plexSans.variable} ${plexSerif.variable}`}>{children}</body>
    </html>
  )
}
