interface ProjectCardProps {
  title: string
  description: string
  technologies: string[]
  link?: string
}

export default function ProjectCard({ title, description, technologies, link }: ProjectCardProps) {
  return (
    <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {technologies.map((tech, index) => (
          <span key={index} className="bg-gray-200 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
            {tech}
          </span>
        ))}
      </div>
      {link && (
        <a href={link} target="_blank" rel="noopener noreferrer" className="inline-block text-blue-600 hover:text-blue-800">
          Посмотреть проект →
        </a>
      )}
    </div>
  )
}