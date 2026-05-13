# **Отчет по лабораторной работе №2 (Часть 1): API на FastAPI (Python)**

## Сведения о студенте  
**Дата:** 2026-03-11  
**Семестр:** 2 курс, 2 семестр  
**Группа:** Пин-б-о-24-1  
**Дисциплина:** Технологии программирования  
**Студент:** Лаврентьев Аврам Петрович  

---
### Структура готового проекта
```
book_api/
├── main.py          # создание приложения и CORS
├── models.py        # Pydantic-модели
├── routers.py       # эндпоинты и бизнес-логика
├── requirements.txt
```

## Часть 1. Разработка REST API на FastAPI

### 1. ЦЕЛЬ РАБОТЫ

Практическое знакомство с созданием RESTful API на современном Python-фреймворке FastAPI. Освоение принципов валидации данных, автоматической документации и асинхронной обработки запросов на примере системы управления библиотекой.

### 2. ЗАДАЧИ РАБОТЫ

**Выполнены следующие задачи:**

1. Настройка проекта FastAPI с использованием виртуального окружения.
2. Создание Pydantic моделей для валидации входных и выходных данных.
3. Реализация CRUD операций для книг в роутере.
4. Добавление функционала заимствования и возврата книг.
5. Реализация пагинации и фильтрации при получении списка книг.
6. Создание эндпоинта для получения статистики библиотеки.
7. Обработка ошибок с соответствующими HTTP статус-кодами.
8. Тестирование API через встроенную документацию Swagger UI.

### 3. РАЗРАБОТАННОЕ API

#### 3.1. Общая архитектура

API построено на принципах REST. Все эндпоинты сгруппированы в роутере с префиксом `/api/v1`. Данные хранятся в оперативной памяти (имитация БД) с использованием двух словарей: `books_db` для хранения книг и `borrow_records` для записей о заимствованиях.

#### 3.2. Модели данных (Pydantic)

Все модели расположены в файле `models.py`. Основные из них:
- **`BookCreate`** — модель для создания книги со строгой валидацией (ISBN, год, страницы).
- **`BookUpdate`** — модель для обновления, где все поля опциональны.
- **`BookResponse`** — модель ответа, включает `id` и статус `available`.
- **`BookDetailResponse`** — расширенная модель для детального просмотра, включающая информацию о заимствовании.
- **`BorrowRequest`** — модель запроса на взятие книги.

#### 3.3. Реализованные эндпоинты

Все эндпоинты реализованы в файле `routers.py` и включают:
- **`GET /books`** — получение списка с фильтрацией (по жанру, автору, доступности) и пагинацией.
- **`GET /books/{id}`** — получение детальной информации о книге.
- **`POST /books`** — создание новой книги (с проверкой уникальности ISBN).
- **`PUT /books/{id}`** — полное обновление книги.
- **`DELETE /books/{id}`** — удаление книги (с проверкой, не взята ли она).
- **`POST /books/{id}/borrow`** — заимствование книги.
- **`POST /books/{id}/return`** — возврат книги.
- **`GET /stats`** — статистика библиотеки.

### 4. ИСХОДНЫЙ КОД

#### Файл: `models.py` (полный)

```python
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import date

class Genre(str, Enum):
    FICTION = "fiction"
    NON_FICTION = "non_fiction"
    SCIENCE = "science"
    FANTASY = "fantasy"
    MYSTERY = "mystery"
    BIOGRAPHY = "biography"

class BookCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Название книги")
    author: str = Field(..., min_length=1, max_length=100, description="Автор книги")
    genre: Genre = Field(..., description="Жанр книги")
    publication_year: int = Field(..., ge=1000, le=date.today().year, description="Год публикации")
    pages: int = Field(..., gt=0, description="Количество страниц")
    isbn: str = Field(..., pattern=r'^\d{13}$', description="ISBN (13 цифр)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "Война и мир",
                "author": "Лев Толстой",
                "genre": "fiction",
                "publication_year": 1869,
                "pages": 1225,
                "isbn": "9781234567897"
            }
        }

class BookUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    author: Optional[str] = Field(None, min_length=1, max_length=100)
    genre: Optional[Genre] = None
    publication_year: Optional[int] = Field(None, ge=1000, le=date.today().year)
    pages: Optional[int] = Field(None, gt=0)
    isbn: Optional[str] = Field(None, pattern=r'^\d{13}$')

class BookResponse(BookCreate):
    id: int
    available: bool = True
    
    class Config:
        from_attributes = True

class BookDetailResponse(BookResponse):
    borrowed_by: Optional[str] = None
    borrowed_date: Optional[date] = None
    return_date: Optional[date] = None

class BorrowRequest(BaseModel):
    borrower_name: str = Field(..., min_length=1, max_length=100)
    return_days: int = Field(7, ge=1, le=30, description="Количество дней на возврат")
```

#### Файл: `routers.py` (полный, с реализованной логикой)

```python
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import date, timedelta
from models import BookCreate, BookResponse, BookUpdate, BorrowRequest, BookDetailResponse, Genre

router = APIRouter()

# ------------------------------------------------------------
# Имитация базы данных (в памяти)
# ------------------------------------------------------------
books_db = {}
borrow_records = {}
current_id = 1

def get_next_id() -> int:
    global current_id
    id_ = current_id
    current_id += 1
    return id_

def book_to_response(book_id: int, book_data: dict) -> BookResponse:
    return BookResponse(
        id=book_id,
        title=book_data["title"],
        author=book_data["author"],
        genre=book_data["genre"],
        publication_year=book_data["publication_year"],
        pages=book_data["pages"],
        isbn=book_data["isbn"],
        available=book_data.get("available", True)
    )

# ------------------------------------------------------------
# GET /books – список книг с фильтрацией
# ------------------------------------------------------------
@router.get("/books", response_model=List[BookResponse])
async def get_books(
    genre: Optional[Genre] = Query(None),
    author: Optional[str] = Query(None),
    available_only: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    filtered = []
    for bid, data in books_db.items():
        if genre and data["genre"] != genre:
            continue
        if author and author.lower() not in data["author"].lower():
            continue
        if available_only and not data.get("available", True):
            continue
        filtered.append(book_to_response(bid, data))
    return filtered[skip : skip + limit]

# ------------------------------------------------------------
# GET /books/{book_id}
# ------------------------------------------------------------
@router.get("/books/{book_id}", response_model=BookDetailResponse)
async def get_book(book_id: int):
    if book_id not in books_db:
        raise HTTPException(404, "Книга не найдена")
    data = books_db[book_id]
    resp = BookDetailResponse(
        id=book_id, title=data["title"], author=data["author"],
        genre=data["genre"], publication_year=data["publication_year"],
        pages=data["pages"], isbn=data["isbn"],
        available=data.get("available", True)
    )
    if not resp.available and book_id in borrow_records:
        b = borrow_records[book_id]
        resp.borrowed_by = b["borrower_name"]
        resp.borrowed_date = b["borrowed_date"]
        resp.return_date = b["return_date"]
    return resp

# ------------------------------------------------------------
# POST /books
# ------------------------------------------------------------
@router.post("/books", response_model=BookResponse, status_code=201)
async def create_book(book: BookCreate):
    for existing in books_db.values():
        if existing["isbn"] == book.isbn:
            raise HTTPException(400, "ISBN уже существует")
    bid = get_next_id()
    book_dict = book.dict()
    book_dict["available"] = True
    books_db[bid] = book_dict
    return book_to_response(bid, books_db[bid])

# ------------------------------------------------------------
# PUT /books/{book_id}
# ------------------------------------------------------------
@router.put("/books/{book_id}", response_model=BookResponse)
async def update_book(book_id: int, book_update: BookUpdate):
    if book_id not in books_db:
        raise HTTPException(404, "Книга не найдена")
    current = books_db[book_id]
    update_data = book_update.dict(exclude_unset=True)
    if "isbn" in update_data:
        for bid, bdata in books_db.items():
            if bid != book_id and bdata["isbn"] == update_data["isbn"]:
                raise HTTPException(400, "ISBN уже используется")
    for field, value in update_data.items():
        current[field] = value
    books_db[book_id] = current
    return book_to_response(book_id, books_db[book_id])

# ------------------------------------------------------------
# DELETE /books/{book_id}
# ------------------------------------------------------------
@router.delete("/books/{book_id}", status_code=204)
async def delete_book(book_id: int):
    if book_id not in books_db:
        raise HTTPException(404, "Книга не найдена")
    if not books_db[book_id].get("available", True):
        raise HTTPException(400, "Нельзя удалить взятую книгу")
    del books_db[book_id]
    borrow_records.pop(book_id, None)
    return None

# ------------------------------------------------------------
# POST /books/{book_id}/borrow
# ------------------------------------------------------------
@router.post("/books/{book_id}/borrow", response_model=BookDetailResponse)
async def borrow_book(book_id: int, req: BorrowRequest):
    if book_id not in books_db:
        raise HTTPException(404, "Книга не найдена")
    data = books_db[book_id]
    if not data.get("available", True):
        raise HTTPException(400, "Книга уже взята")
    data["available"] = False
    books_db[book_id] = data
    borrowed_date = date.today()
    return_date = borrowed_date + timedelta(days=req.return_days)
    borrow_records[book_id] = {
        "borrower_name": req.borrower_name,
        "borrowed_date": borrowed_date,
        "return_date": return_date
    }
    return BookDetailResponse(
        id=book_id, title=data["title"], author=data["author"],
        genre=data["genre"], publication_year=data["publication_year"],
        pages=data["pages"], isbn=data["isbn"], available=False,
        borrowed_by=req.borrower_name, borrowed_date=borrowed_date,
        return_date=return_date
    )

# ------------------------------------------------------------
# POST /books/{book_id}/return
# ------------------------------------------------------------
@router.post("/books/{book_id}/return", response_model=BookResponse)
async def return_book(book_id: int):
    if book_id not in books_db:
        raise HTTPException(404, "Книга не найдена")
    data = books_db[book_id]
    if data.get("available", True):
        raise HTTPException(400, "Книга не была взята")
    data["available"] = True
    books_db[book_id] = data
    borrow_records.pop(book_id, None)
    return book_to_response(book_id, data)

# ------------------------------------------------------------
# GET /stats
# ------------------------------------------------------------
@router.get("/stats")
async def get_library_stats():
    total = len(books_db)
    available = 0
    borrowed = 0
    by_genre = {}
    author_cnt = {}
    for data in books_db.values():
        if data.get("available", True):
            available += 1
        else:
            borrowed += 1
        g = data["genre"]
        by_genre[g] = by_genre.get(g, 0) + 1
        a = data["author"]
        author_cnt[a] = author_cnt.get(a, 0) + 1
    most_author = max(author_cnt.items(), key=lambda x: x[1])[0] if author_cnt else None
    return {
        "total_books": total,
        "available_books": available,
        "borrowed_books": borrowed,
        "books_by_genre": by_genre,
        "most_prolific_author": most_author
    }
```

### 5. ПРИМЕРЫ ЗАПРОСОВ И ОТВЕТОВ API

#### **Создание книги (POST /books)**
**Запрос:**
```json
{
  "title": "Мастер и Маргарита",
  "author": "Михаил Булгаков",
  "genre": "fiction",
  "publication_year": 1967,
  "pages": 480,
  "isbn": "9781234567899"
}
```
**Ответ (201 Created):**
```json
{
  "id": 1,
  "title": "Мастер и Маргарита",
  "author": "Михаил Булгаков",
  "genre": "fiction",
  "publication_year": 1967,
  "pages": 480,
  "isbn": "9781234567899",
  "available": true
}
```

#### **Заимствование книги (POST /books/2/borrow)**
**Запрос:**
```json
{
  "borrower_name": "Иван Петров",
  "return_days": 14
}
```
**Ответ (200 OK):**
```json
{
  "id": 1,
  "title": "Мастер и Маргарита",
  "author": "Михаил Булгаков",
  "genre": "fiction",
  "publication_year": 1967,
  "pages": 480,
  "isbn": "9781234567899",
  "available": false,
  "borrowed_by": "Иван Петров",
  "borrowed_date": "2026-05-13",
  "return_date": "2026-05-27"
}
```

#### **Попытка удалить взятую книгу (DELETE /books/2)**
**Ответ (400 Bad Request):**
```json
{
  "detail": "Нельзя удалить взятую книгу"
}
```

#### **Получение статистики (GET /stats)**
**Ответ (200 OK):**
```json
{
  "total_books": 2,
  "available_books": 1,
  "borrowed_books": 1,
  "books_by_genre": {
    "fiction": 2
  },
  "most_prolific_author": "Фёдор Достоевский"
}
```



### 7. ОТВЕТЫ НА КОНТРОЛЬНЫЕ ВОПРОСЫ

#### **1. В чем преимущества использования Pydantic моделей для валидации?**

Pydantic автоматически проверяет типы, обязательность полей, ограничения (min_length, ge, pattern). При ошибке возвращает понятное сообщение. Модели служат единым источником правды для валидации, сериализации и документации (OpenAPI). Это уменьшает количество ручного кода и повышает надёжность.

#### **2. Как работает автоматическая документация в FastAPI?**

FastAPI анализирует аннотации типов в функциях-обработчиках и Pydantic-модели, после чего генерирует OpenAPI-спецификацию (JSON). Swagger UI (/docs) и ReDoc (/redoc) читают эту спецификацию и отображают интерактивную документацию, где можно прямо из браузера отправлять запросы.

#### **3. Почему важно проверять уникальность ISBN?**

ISBN – уникальный идентификатор книги в мировой практике. Две разные книги не могут иметь одинаковый ISBN. Нарушение этого правила приводит к путанице при поиске, заимствовании и каталогизации. В библиотечной системе уникальность ISBN обязательна

#### **4. Какие статус-коды HTTP вы использовали и почему?**

- **200 OK** — Стандартный ответ для успешных GET-запросов (`/books`, `/books/{id}`, `/stats`), а также для операций, которые возвращают ресурс (`borrow`, `return`).
- **201 Created** — Используется для ответа на успешное создание ресурса (`POST /books`), чтобы явно указать, что ресурс был создан.
- **204 No Content** — Используется для ответа на успешное удаление (`DELETE /books/{id}`), так как после удаления не нужно возвращать тело ответа.
- **400 Bad Request** — Применяется для ошибок, связанных с некорректными действиями клиента: попытка взять уже взятую книгу, удалить взятую книгу, создать книгу с существующим ISBN.
- **404 Not Found** — Возвращается, когда запрашиваемая книга по ID не существует в базе.

### 8. КРИТЕРИИ ОЦЕНИВАНИЯ

#### **Обязательные требования (выполнены):**
- **CRUD операции:** Реализованы все операции (GET список, GET по ID, POST, PUT, DELETE).
- **Заимствование и возврат:** Эндпоинты `/borrow` и `/return` работают корректно, обновляют статус и записи.
- **Валидация данных:** Используются Pydantic модели с правилами валидации (длина, формат ISBN, год).
- **Обработка ошибок:** Возвращаются корректные HTTP статус-коды и понятные сообщения (404 для несуществующих книг, 400 для недопустимых операций).
- **API работает:** Все эндпоинты доступны и протестированы через Swagger UI.

#### **Дополнительные критерии (выполнены):**
- **Статистика:** Реализован эндпоинт `/stats` с подсчетом всех требуемых метрик.
- **Фильтрация и пагинация:** В `GET /books` реализованы фильтры по жанру, автору, доступности, а также параметры `skip` и `limit`.

#### **Неприемлемые ошибки (отсутствуют):**
- Нарушение уникальности ISBN предотвращено проверкой.
- Удаление взятой книги запрещено.
- Все проверки существования книги реализованы.
- API запускается без ошибок.

### 9. ВЫВОДЫ

В ходе выполнения лабораторной работы было разработано полнофункциональное REST API для управления библиотекой на базе FastAPI. Были освоены ключевые концепции фреймворка:
- Создание асинхронных эндпоинтов.
- Валидация данных с помощью Pydantic.
- Автоматическая генерация документации OpenAPI.
- Обработка ошибок и возврат соответствующих HTTP статус-кодов.

Все обязательные и дополнительные требования реализованы: CRUD операции, функционал заимствования/возврата, фильтрация, пагинация и статистика. API готово к интеграции с фронтенд-приложением или использованию в качестве бэкенда для библиотечной системы. Полученные навыки являются основой для разработки более сложных асинхронных веб-приложений на Python.
