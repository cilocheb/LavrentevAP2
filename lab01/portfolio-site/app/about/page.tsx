export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Обо мне</h1>

      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <h2 className="text-xl font-semibold mb-3">Навыки</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>HTML, CSS, JavaScript, TypeScript</li>
          <li>React, Next.js</li>
          <li>Tailwind CSS, Bootstrap</li>
          <li>Node.js, Express</li>
          <li>Git, GitHub, командная работа</li>
        </ul>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-3">Опыт работы</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Стажёр-разработчик</h3>
            <p className="text-gray-600">IT-компания «Пример», 2025 – настоящее время</p>
            <p>Разработка фронтенда на React, вёрстка по макетам, участие в код-ревью.</p>
          </div>
          <div>
            <h3 className="font-semibold">Фриланс</h3>
            <p className="text-gray-600">2023 – 2025</p>
            <p>Создание лендингов и небольших SPA на React и Vue.</p>
          </div>
        </div>
      </div>
    </div>
  )
}