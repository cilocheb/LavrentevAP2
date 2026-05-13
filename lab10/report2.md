# **Отчет по лабораторной работе №2 (Часть 2)**

## Сведения о студенте  
**Дата:** 2026-03-11  
**Семестр:** 2 курс, 2 семестр  
**Группа:** Пин-б-о-24-1  
**Дисциплина:** Технологии программирования  
**Студент:** Лаврентьев Аврам Петрович

---
### Структура готового проекта
```
task-api/
├── src/
│   ├── app.js                 # основное приложение
│   ├── server.js              # точка входа
│   ├── routes/tasks.js        # роутер задач
│   ├── middleware/validation.js   # валидация Joi
│   ├── middleware/errorHandler.js # обработчики ошибок
│   └── utils/fileOperations.js    # работа с файлами (чтение/запись)
├── tasks.json                 # файл данных (создаётся автоматически)
├── package.json
├── .env
```

## Часть 1. Разработка REST API на FastAPI

### 1. ЦЕЛЬ РАБОТЫ

Практическое знакомство с созданием RESTful API на Node.js с использованием Express. Освоение middleware, валидации данных, работы с файловой системой и сравнение подходов разных фреймворков.

### 2. Исходный код ключевых файлов

**src/routes/tasks.js (основные эндпоинты)**
-GET /api/tasks – получение всех задач с фильтрацией (category, completed, priority), сортировкой и пагинацией.
-GET /api/tasks/:id – получение задачи по ID.
-POST /api/tasks – создание задачи (валидация через Joi).
-PUT /api/tasks/:id – полное обновление.
-PATCH /api/tasks/:id/complete – отметка как выполненной.
-DELETE /api/tasks/:id – удаление задачи.
-GET /api/tasks/stats/summary – статистика (общее количество, выполненные, просроченные, распределение по категориям и приоритетам).
-GET /api/tasks/search/text?q= – полнотекстовый поиск по названию и описанию.
### 3. Пример реализации статистики:

#### Файл: `models.py` (полный)

```java
router.get('/stats/summary', async (req, res, next) => {
  const data = await readData();
  const tasks = data.tasks;
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    overdue: tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length,
    byCategory: {},
    byPriority: {1:0,2:0,3:0,4:0,5:0}
  };
  for (const t of tasks) {
    stats.byCategory[t.category] = (stats.byCategory[t.category] || 0) + 1;
    stats.byPriority[t.priority] += 1;
  }
  res.json({ success: true, data: stats });
});
```

#### Тестирование через PowerShell (примеры команд)

```json
# Создание задачи
$body = @{ title="Купить продукты"; category="shopping"; priority=2 } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/tasks" -Method Post -Body $body -ContentType "application/json"

# Получение всех задач
Invoke-RestMethod -Uri "http://localhost:3000/api/tasks"

# Фильтрация по категории work
Invoke-RestMethod -Uri "http://localhost:3000/api/tasks?category=work"

# Статистика
Invoke-RestMethod -Uri "http://localhost:3000/api/tasks/stats/summary" | ConvertTo-Json -Depth 3

# Поиск
Invoke-RestMethod -Uri "http://localhost:3000/api/tasks/search/text?q=продукты"
```

### 4. ОТВЕТЫ НА КОНТРОЛЬНЫЕ ВОПРОСЫ

#### 1. Какие middleware вы использовали и для чего?
-express.json() – парсинг JSON-тела запросов.
-cors – разрешает кросс-доменные запросы (необходимо для взаимодействия с фронтендом).
-helmet – устанавливает защитные HTTP-заголовки (безопасность).
-express-rate-limit – ограничивает число запросов с одного IP (защита от DDoS).
-validateCreateTask, validateUpdateTask, validateId – собственные middleware для валидации входных данных (Joi).
-errorHandler – централизованная обработка ошибок, логирование, единый формат ответа.
-notFoundHandler – обработка запросов к несуществующим маршрутам.
#### 2. Как работает валидация с Joi в сравнении с Pydantic?
Joi – библиотека для валидации JavaScript-объектов, используется в middleware вручную. Pydantic интегрирован в FastAPI на уровне типов и автоматически вызывается при получении запроса. В Express с Joi разработчик сам вызывает валидацию, а ошибки формирует вручную. Pydantic даёт более плотную интеграцию с системой типов Python, Joi более гибкий для динамических схем.

#### 3. В чем преимущества файлового хранения данных для этого задания?
Простота реализации – не нужна внешняя база данных. Данные сохраняются между перезапусками сервера. Легко отлаживать (файл tasks.json можно открыть и посмотреть). Подходит для учебных и прототипных проектов.

#### 4. Как бы вы улучшили это API для production использования?
-Перейти на настоящую реляционную БД (PostgreSQL) с ORM (Sequelize).
-Добавить аутентификацию и авторизацию (JWT, роли).
-Использовать переменные окружения для всех конфиденциальных данных.
-Написать автоматические тесты (Jest + Supertest).
-Добавить структурированное логирование (Winston).
-Контейнеризация (Docker, docker-compose).
-Внедрить мониторинг (Prometheus + Grafana).
-Использовать TypeScript для статической типизации.


###  ВЫВОДЫ

В ходе выполнения лабораторной работы были разработаны два полноценных REST API:

1)FastAPI – для управления библиотекой книг (CRUD, заимствование, возврат, статистика).

2)Express – для управления задачами (фильтрация, пагинация, сортировка, поиск, статистика).

-Освоены принципы валидации данных (Pydantic и Joi), автоматической документации (Swagger), обработки ошибок, асинхронного программирования, работы с файловой системой.
-Оба API успешно протестированы вручную через PowerShell и через встроенную документацию.
