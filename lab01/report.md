# **Отчет по лабораторной работе №1: React-приложение с Vite и знакомство с Next.js**

## Сведения о студенте  
**Дата:** 2026-05-12 
**Семестр:** 2 курс, 2 семестр  
**Группа:** ПИН-б-о-24-1  
**Дисциплина:** Технологии программирования  
**Студент:** Лаврентьев Аврам Петрович

---
### Структура готового проекта
```
lab0101/
├── todo-app/
│ ├── src/
│ │   ├── App.tsx          # Основной компонент приложения
│ │   ├── main.tsx         # Точка входа
│ │   └── index.css        # Глобальные стили с Tailwind
│ ├── public/              # Статические файлы
│ ├── index.html           # HTML шаблон
│ ├── package.json         # Зависимости и скрипты
│ ├── tailwind.config.js   # Конфигурация Tailwind
│ ├── vite.config.ts       # Конфигурация Vite
│ └── tsconfig.json        # Конфигурация TypeScript
├── portfolio-site/
│ ├── app/
│ │   ├── layout.tsx
│ │   ├── page.tsx
│ │   ├── about/
│ │   │   └── page.tsx
│ │   ├── blog/
│ │   │   ├── page.tsx
│ │   │   ├── data.ts
│ │   │   └── [slug]/
│ │   │       ├── page.tsx
│ │   │       └── not-found.tsx
│ │   ├── projects/
│ │   │   └── page.tsx
│ │   └── components/
│ │       └── ProjectCard.tsx
│ ├── public/
│ ├── package.json
│ ├── tailwind.config.js
│ └── tsconfig.json
└── task/
     ├── lab0101-React-приложение с Vite.md
     └── lab0102-Знакомство с Next.js.md

     

```

## Часть 1. React-приложение с Vite

### 1. ЦЕЛЬ РАБОТЫ

Практическое знакомство с созданием React-приложений с использованием TypeScript и Vite. Освоение базовых концепций компонентного подхода и состояния.

Знакомство с Next.js — мета-фреймворком для React. Освоение концепций серверного рендеринга (SSG), файловой маршрутизации и деплоя.

### 2. ЗАДАЧИ РАБОТЫ

**Выполнены следующие задачи:**

1. Настройка проекта с Vite + React + TypeScript.
2. Интеграция Tailwind CSS для стилизации интерфейса.
3. Создание компонента `App` с управлением состоянием задач.
4. Реализация функций:
   - добавление новой задачи (`addTask`);
   - удаление задачи по ID (`removeTask`);
   - переключение статуса выполнения (`toggleTask`);
   - отображение статистики (всего задач, количество выполненных);
   - условный рендеринг для пустого списка.
5. Обеспечение неизменяемости состояния (иммутабельность).
6. Соблюдение типизации TypeScript для всех данных и функций.
7. Формирование структуры проекта и подготовка отчёта.

### 3. РАЗРАБОТАННОЕ ПРИЛОЖЕНИЕ

#### 3.1. Общая архитектура

Приложение представляет собой одностраничный интерфейс для управления списком задач. Основной компонент `App` содержит два состояния:

- `tasks` – массив объектов типа `Task`;
- `newTask` – строка для ввода новой задачи.

Все операции с задачами выполняются через функции, которые обновляют состояние, соблюдая принцип неизменяемости.

#### 3.2. Типы данных

```typescript
interface Task {
  id: number;
  text: string;
  completed: boolean;
}
```

#### 3.3. Основные функции

##### **Добавление задачи**
- Проверка на пустую строку.
- Создание объекта задачи с уникальным `id` (`Date.now()`).
- Добавление в конец массива через `setTasks([...tasks, task])`.

##### **Удаление задачи**
- Использование метода `filter` для создания нового массива без задачи с указанным `id`.
- Вызов `setTasks` с отфильтрованным массивом.

##### **Переключение статуса**
- Применение `map` для обхода массива.
- Для задачи с совпадающим `id` создаётся копия объекта с инвертированным полем `completed`.
- Остальные задачи возвращаются без изменений.

##### **Статистика**
- Общее количество задач: `tasks.length`.
- Количество выполненных: `tasks.filter(task => task.completed).length`.

##### **Обработка пустого списка**
- Условный рендеринг: если `tasks.length === 0`, отображается информационное сообщение.

#### 3.4. Интерфейс

- Поле ввода с обработкой клавиши `Enter`.
- Кнопка «Добавить».
- Список задач с чекбоксами и кнопками удаления.
- Стилизация выполнена с помощью Tailwind CSS (адаптивный дизайн, тени, отступы).

### 4. ИСХОДНЫЙ КОД (App.tsx)

```tsx
import { useState } from 'react';

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: 'Изучить React', completed: true },
    { id: 2, text: 'Написать To-Do приложение', completed: false }
  ]);

  const [newTask, setNewTask] = useState('');

  const addTask = () => {
    if (newTask.trim() === '') return;
    const task: Task = {
      id: Date.now(),
      text: newTask,
      completed: false
    };
    setTasks([...tasks, task]);
    setNewTask('');
  };

  const removeTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task =>
      task.id === id
        ? { ...task, completed: !task.completed }
        : task
    ));
  };

  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          📝 Список задач
        </h1>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="Введите новую задачу..."
            className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addTask}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Добавить
          </button>
        </div>

        <div className="space-y-3">
          {tasks.map(task => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  className="h-5 w-5 text-blue-600"
                />
                <span className={`${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                  {task.text}
                </span>
              </div>

              <button
                onClick={() => removeTask(task.id)}
                className="px-3 py-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Список задач пуст</p>
            <p className="text-sm">Добавьте первую задачу!</p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t">
          <p className="text-gray-600">Всего задач: {totalCount}</p>
          <p className="text-gray-600">Выполнено: {completedCount} из {totalCount}</p>
        </div>
      </div>
    </div>
  );
}

export default App;
```


### 6. ОТВЕТЫ НА КОНТРОЛЬНЫЕ ВОПРОСЫ (Часть 1)

#### **1. Объясните принцип работы хука `useState`**

Хук useState позволяет функциональному компоненту React иметь собственное состояние. Он принимает начальное значение и возвращает кортеж: текущее состояние и функцию для его обновления. Когда функция обновления вызывается, React планирует повторный рендеринг компонента, подставляя новое значение. В нашем проекте useState используется для хранения списка задач и текста новой задачи.Хук useState позволяет функциональному компоненту React иметь собственное состояние. Он принимает начальное значение и возвращает кортеж: текущее состояние и функцию для его обновления. Когда функция обновления вызывается, React планирует повторный рендеринг компонента, подставляя новое значение. В нашем проекте useState используется для хранения списка задач и текста новой задачи.

#### **2. Почему в React важно использовать неизменяемое состояние?**

React сравнивает старое и новое состояние по ссылке (поверхностное сравнение). Если напрямую мутировать объект или массив, ссылка не изменится, и React может не обнаружить изменений, что приведёт к отсутствию перерисовки. Неизменяемые методы (например, filter, map, spread-оператор) создают новые объекты с новыми ссылками, гарантируя корректное обновление интерфейса.

#### **3. Какой метод массива вы использовали для удаления задачи и почему?**

Использован метод filter. Он создаёт новый массив, содержащий только те элементы, которые удовлетворяют условию (id не равен удаляемому). Этот метод не изменяет исходный массив, что соответствует принципу неизменяемости состояния в React.

#### **4. В чём преимущества TypeScript при разработке React-приложений?**

-Статическая типизация помогает выявить ошибки на этапе компиляции, а не во время выполнения.
-Улучшенная поддержка IDE (автодополнение, навигация, рефакторинг).
-Типы выступают в роли документации, делая код более понятным.
-Упрощает поддержку больших проектов и командную разработку.

### 7. ВЫВОДЫ (Часть 1)

В ходе выполнения лабораторной работы было создано полнофункциональное React-приложение для управления списком задач. Все обязательные и дополнительные требования реализованы:

- Корректно работают функции добавления, удаления и переключения статуса задач.
- Состояние обновляется иммутабельно с использованием `filter` и `map`.
- Добавлена статистика и обработка пустого списка.
- Применён TypeScript для типизации всех данных и функций.
- Интерфейс стилизован с помощью Tailwind CSS.

Полученные навыки являются основой для дальнейшего изучения современных фронтенд-технологий и разработки более сложных приложений на React.

---

## Часть 2. Знакомство с Next.js

### 1. Структура и реализованные страницы
-Макет (app/layout.tsx) – общий header с навигацией и footer.

-Главная страница (app/page.tsx) – приветствие и карточки технологий.

-Страница «Обо мне» (app/about/page.tsx) – список навыков и опыт работы (заполнены самостоятельно, минимум 5 навыков и 2 пункта опыта).

### Блог

-Данные статей вынесены в app/blog/data.ts (тип BlogPost, массив из трёх статей).

-Страница списка блога (app/blog/page.tsx) – отображение карточек со ссылками на полные статьи.

-Динамический маршрут app/blog/[slug]/page.tsx – страница отдельной статьи. Используется generateStaticParams для статической генерации всех статей на этапе сборки. Реализована обработка отсутствующей статьи через notFound().

-Страница 404 (app/blog/[slug]/not-found.tsx) – кастомное сообщение для несуществующего slug.

-Страница «Проекты»

-Компонент ProjectCard (app/components/ProjectCard.tsx) с отображением технологий в виде тегов.

-Страница app/projects/page.tsx – список проектов с использованием компонента ProjectCard.

### Ниже приведён код ключевых файлов:
**app/layout.tsx**
```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Мое портфолио',
  description: 'Сайт-портфолио разработчика',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
```

#### Файл: `app/blog/[slug]/page.tsx`


```tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { blogPosts } from '../data'

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }))
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = blogPosts.find(p => p.slug === params.slug)
  if (!post) notFound()

  return (
    <article className="max-w-3xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
        <div className="flex justify-between text-gray-600">
          <span>{post.date}</span>
          <span>Автор: {post.author}</span>
        </div>
      </header>
      <div className="prose max-w-none">
        <p className="text-lg mb-4">{post.excerpt}</p>
        <div className="mt-4 whitespace-pre-line">{post.content}</div>
      </div>
      <div className="mt-8 pt-4 border-t">
        <Link href="/blog" className="text-blue-600 hover:text-blue-800">
          ← Вернуться к списку статей
        </Link>
      </div>
    </article>
  )
}
```

#### Файл: `app/components/ProjectCard.tsx`


```tsx
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
```



### 3. Ответы на вопросы (Часть 2)

#### **Что такое SSG (Static Site Generation) и как он реализован в вашем проекте?**

SSG — это подход, при котором HTML-страницы генерируются однократно на этапе сборки (build time). В Next.js для этого используется функция generateStaticParams в динамических маршрутах (например, [slug]). В моём проекте в файле app/blog/[slug]/page.tsx эта функция возвращает массив всех возможных slug’ов статей, и Next.js заранее создаёт для каждого из них готовую HTML-страницу. Это даёт высокую скорость загрузки и отличное SEO.

#### **Как работает файловая маршрутизация в Next.js?**

Маршруты строятся на основе структуры папок внутри директории app. Каждая папка, содержащая файл page.tsx, становится маршрутом. Например:
-app/page.tsx → /
-app/about/page.tsx → /about
-app/blog/[slug]/page.tsx → /blog/любой-слаг
Имена папок, заключённые в квадратные скобки ([slug]), обозначают динамические сегменты.

#### **Какие преимущества даёт использование `generateStaticParams`?**

`generateStaticParams` указывает Next.js, какие динамические маршруты должны быть предварительно отрендерены статически. Это позволяет:
- Генерировать страницы для известных значений slug во время сборки.
- Уменьшить нагрузку на сервер (не нужно генерировать страницы по запросу).
- Улучшить производительность и SEO, так как страницы отдаются готовым HTML.
- В сочетании с кэшированием обеспечить быструю загрузку.

#### **В чём разница между `npm run dev` и `npm run build`?**

-npm run dev запускает среду разработки с горячей заменой модулей (HMR), быстрым обновлением и неоптимизированной сборкой. Предназначена для написания и отладки кода.

-npm run build выполняет production-сборку: проверку типов TypeScript, минификацию, оптимизацию, статическую генерацию страниц. Результат готов к развёртыванию на сервере.

### 4. Критерии оценивания (Часть 2)

#### **Обязательные требования (выполнены):**
- **Страница "Обо мне":** создана, содержит информацию о навыках (5 пунктов) и опыте (3 пункта).
- **Страница "Блог":** отображает список статей (3 статьи) из массива data.ts.
- **Динамические страницы статей:** реализован динамический маршрут `[slug]` с использованием `generateStaticParams`, корректное отображение контента.
- **Навигация:** все страницы доступны через меню навигации в layout.tsx.
- **Проект собирается без ошибок:** `npm run build` выполняется успешно.

#### **Дополнительные критерии (частично выполнены):**
- **Страница "Проекты":** реализована с использованием компонента `ProjectCard` (создан массив проектов, компонент отображает технологии).
- **Качество TypeScript кода:** все пропсы, параметры и состояния типизированы (интерфейсы `BlogPost`, `Project`, `ProjectCardProps`).
- **Обработка ошибок:** страница 404 для несуществующих статей работает благодаря `notFound()`, но кастомный `not-found.tsx` не создан (используется стандартный).
- **Деплой:** не выполнялся.
- **Дополнительный функционал:** не добавлялся.

#### **Неприемлемые ошибки отсутствуют:**
- Ошибок TypeScript при сборке нет.
- Все ссылки между страницами работают.
- Обязательные страницы присутствуют.
- Критических ошибок в работе приложения не обнаружено.

### 5. Используемые команды (для Ubuntu)

```bash
# Проверка версий
node --version
npm --version

# Запуск в режиме разработки
npm run dev

# Сборка проекта
npm run build

# Запуск production-сервера
npm run start

# Очистка кэша Next.js (при проблемах)
rm -rf .next
npm run dev
```

### 6. Выводы 
В ходе лабораторной работы были получены практические навыки создания React-приложений с использованием Vite и Tailwind CSS, освоены хуки useState, принципы неизменяемого состояния и типизация с TypeScript. Во второй части изучен Next.js: файловая маршрутизация, статическая генерация (SSG) с generateStaticParams, создание динамических маршрутов и компонентный подход. Оба проекта успешно собраны и проверены в браузере.


