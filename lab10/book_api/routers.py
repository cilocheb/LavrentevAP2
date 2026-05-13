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
