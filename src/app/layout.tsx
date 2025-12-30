import './globals.css'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import { SessionProvider } from '@/components/providers/SessionProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

const coiny = localFont({
  src: [
    {
      path: '../../public/Coiny/Coiny-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-coiny',
  display: 'swap',
})

export const metadata = {
  title: 'Penda - Connect with Penpals Worldwide',
  description: 'A secure penpal messaging app to connect with strangers around the world',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${coiny.variable} font-sans`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
