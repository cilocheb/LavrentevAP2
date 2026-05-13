import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Мое портфолио',
  description: 'Сайт-портфолио разработчика',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <header className="bg-gray-800 text-white p-4">
          <nav className="container mx-auto">
            <ul className="flex gap-6">
              <li><Link href="/" className="hover:text-blue-300">Главная</Link></li>
              <li><Link href="/about" className="hover:text-blue-300">Обо мне</Link></li>
              <li><Link href="/blog" className="hover:text-blue-300">Блог</Link></li>
              <li><Link href="/projects" className="hover:text-blue-300">Проекты</Link></li>
            </ul>
          </nav>
        </header>
        <main className="container mx-auto p-4">{children}</main>
        <footer className="bg-gray-800 text-white p-4 text-center">
          <p>© Мое портфолио. Все права защищены.</p>
        </footer>
      </body>
    </html>
  )
}