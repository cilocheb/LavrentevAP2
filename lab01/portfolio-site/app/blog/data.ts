export interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  date: string
  author: string
}

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: 'Введение в Next.js',
    slug: 'introduction-to-nextjs',
    excerpt: 'Основы Next.js и преимущества серверного рендеринга',
    content: 'Здесь полный текст статьи о Next.js. Можно рассказать про файловую маршрутизацию, getStaticProps, серверные компоненты.',
    date: '2026-01-15',
    author: 'Иван Иванов'
  },
  {
    id: 2,
    title: 'TypeScript для фронтенда',
    slug: 'typescript-for-frontend',
    excerpt: 'Почему стоит использовать типизацию в веб-проектах',
    content: 'Статья объясняет преимущества TypeScript: автодополнение, рефакторинг, уменьшение багов.',
    date: '2026-02-10',
    author: 'Петр Петров'
  },
  {
    id: 3,
    title: 'Tailwind CSS: за и против',
    slug: 'tailwind-pros-and-cons',
    excerpt: 'Обзор утилитарного подхода к стилизации',
    content: 'Рассматриваем плюсы (быстрота, консистентность) и минусы (захламлённость вёрстки).',
    date: '2026-03-05',
    author: 'Анна Сидорова'
  }
]