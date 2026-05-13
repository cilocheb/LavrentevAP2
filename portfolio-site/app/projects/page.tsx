import ProjectCard from '../components/ProjectCard'

const projects = [
  {
    title: 'Интернет-магазин',
    description: 'Полнофункциональный интернет-магазин с корзиной и оплатой',
    technologies: ['Next.js', 'TypeScript', 'Stripe'],
    link: 'https://example.com'
  },
  {
    title: 'Лендинг стартапа',
    description: 'Адаптивный лендинг с анимацией и формой обратной связи',
    technologies: ['React', 'Tailwind CSS', 'Vite'],
    link: 'https://example2.com'
  },
  {
    title: 'Telegram-бот для заметок',
    description: 'Бот для создания, просмотра и удаления заметок через Telegram',
    technologies: ['Node.js', 'Telegraf', 'MongoDB'],
    link: 'https://t.me/example_bot'
  }
]

export default function ProjectsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Мои проекты</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project, index) => (
          <ProjectCard
            key={index}
            title={project.title}
            description={project.description}
            technologies={project.technologies}
            link={project.link}
          />
        ))}
      </div>
    </div>
  )
}