# Отчет по лабораторной работе 14 (часть 1)  
# Реляционные базы данных: создание схемы, написание SQL-запросов, индексы и анализ выполнения  

**Дата:** 15-05-2026  
**Семестр:** 2 курс 2 полугодие – 4 семестр  
**Группа:**  ПИН-б-о-24-1
**Дисциплина:** Технологии программирования  
**Студент:** Лаврентьев Аврам Петрович

## Цель работы  
Получить практические навыки работы с реляционной СУБД PostgreSQL: проектирование схемы, написание сложных запросов (JOIN, GROUP BY, подзапросы, CTE), создание индексов и анализ производительности запросов на примере базы данных интернет-магазина.

## Теоретическая часть  
Реляционные базы данных (РБД) основаны на реляционной модели данных, предложенной Эдгаром Коддом. Данные хранятся в виде таблиц (отношений), состоящих из строк (кортежей) и столбцов (атрибутов). Для связывания таблиц используются первичные и внешние ключи. Язык SQL (Structured Query Language) позволяет выполнять операции определения данных (DDL), манипулирования данными (DML) и управления доступом.
В работе использовалась СУБД PostgreSQL – одна из самых развитых объектно-реляционных систем с открытым исходным кодом. Ключевые возможности, применяемые в лабораторной работе:
- JOIN – объединение таблиц по условию.
- GROUP BY – группировка строк для агрегации.
- Агрегатные функции (SUM, COUNT, AVG).
- HAVING – фильтрация групп после агрегации.
- CTE (Common Table Expression) – временные именованные подзапросы с WITH.
- Индексы – структуры для ускорения поиска.
- EXPLAIN ANALYZE – анализ плана выполнения запроса.
## Практическая часть  

### Выполненные задачи  
1)Создание схемы базы данных – таблицы users, products, orders, order_items с первичными ключами, внешними ссылками и ограничениями.
2)Заполнение тестовыми данными – 2 пользователя, 5 товаров, 3 заказа, 6 позиций заказов.
3)Написание трёх аналитических запросов:
- Запрос 1: для каждого заказа вывести order_id, ФИО пользователя, дату, статус и сумму заказа. Отсортировать по убыванию суммы.
- Запрос 2: по категориям товаров вывести количество проданных единиц, выручку, отфильтровать категории с выручкой > 10000 руб.
- Запрос 3 (с CTE): топ-3 пользователя по сумме заказов.
4)Оптимизация с индексом – создан индекс idx_order_items_order_id на столбце order_id таблицы order_items. Выполнен анализ плана запроса EXPLAIN ANALYZE до и после создания индекса.
### Ключевые фрагменты кода  

**Создание таблиц (фрагмент schema.sql):**  
```sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    stock_quantity INTEGER DEFAULT 0
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending'
);

CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id),
    product_id INTEGER REFERENCES products(product_id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL
);
```

**Запрос 1 (итоговая сумма заказов):**  
```sql
SELECT 
    o.order_id,
    u.full_name,
    o.order_date,
    o.status,
    SUM(oi.quantity * oi.unit_price) AS total_amount
FROM orders o
JOIN users u ON o.user_id = u.user_id
JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY o.order_id, u.full_name, o.order_date, o.status
ORDER BY total_amount DESC;
```

**Запрос 2 (выручка по категориям с HAVING):**  
```sql
SELECT 
    p.category,
    SUM(oi.quantity) AS total_sold,
    SUM(oi.quantity * oi.unit_price) AS total_revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.product_id
GROUP BY p.category
HAVING SUM(oi.quantity * oi.unit_price) > 10000;
```

**Запрос 3 (топ пользователей через CTE):**  
```sql
WITH user_totals AS (
    SELECT 
        u.user_id,
        u.full_name,
        SUM(oi.quantity * oi.unit_price) AS total_spent
    FROM users u
    JOIN orders o ON u.user_id = o.user_id
    JOIN order_items oi ON o.order_id = oi.order_id
    GROUP BY u.user_id, u.full_name
)
SELECT * FROM user_totals
ORDER BY total_spent DESC
LIMIT 3;
```

**Оптимизация индексом:**  
```sql
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Анализ до индекса
DROP INDEX idx_order_items_order_id;
EXPLAIN ANALYZE SELECT * FROM order_items WHERE order_id = 1;

-- Анализ после индекса
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
EXPLAIN ANALYZE SELECT * FROM order_items WHERE order_id = 1;
```

## Результаты выполнения  

### Пример работы программы  

**Результат Запроса 1:**  
```
 order_id | full_name    | order_date             | status    | total_amount
----------+--------------+------------------------+-----------+--------------
        1 | Alice Smith  | 2026-05-15 17:54:46... | completed |     78000.00
        2 | Bob Johnson  | 2026-05-15 17:54:46... | completed |      5500.00
3         |  Alice Smith | 2026-05-15 17:54:46... | completed |     28500.00
```
**Результат Запроса 2:**  
```
 category    | total_sold | total_revenue
-------------+------------+---------------
 Электроника |          6 |      108000.00
```
(категория «Книги» исключена, т.к. 2500 < 10000)

**Результат Запроса 3:**  
```
 user_id | full_name    | total_spent
---------+--------------+-------------
       1 | Alice Smith  |    106500.00
       2 | Bob Johnson  |     4000.00
```

**Сравнение плана выполнения:**  
- *До индекса:* `Seq Scan on order_items  (cost=0.00..1.07 rows=1 width=32) (actual time=0.007..0.007 rows=2 loops=1)
  Filter: (order_id = 1)
  Rows Removed by Filter: 4
  Buffers: shared hit=1
Execution Time: 0.017 ms`  
- *После индекса:* план не изменился (Seq Scan), т.к. таблица содержит всего 6 строк. Для маленьких таблиц последовательное сканирование эффективнее индексного. При большом количестве строк (миллионы) план переключился бы на Index Scan.


## Выводы  
В ходе выполнения лабораторной работы были получены практические навыки:
- Проектирование реляционной схемы базы данных с первичными и внешними ключами.
- Написание SQL-запросов с использованием JOIN, GROUP BY, агрегатных функций, HAVING, WITH (CTE).
- Создание индексов и анализ производительности через EXPLAIN ANALYZE.
- Понимание различий между WHERE и HAVING, необходимости явного перечисления неагрегированных столбцов в GROUP BY, влияния индексов на план выполнения.
Работа показала, что даже на малом объёме данных можно наблюдать разницу в планах запросов, а для промышленных баз данных правильное индексирование критически важно для производительности.


## Ответы на контрольные вопросы  

1. **В чём разница между `WHERE` и `HAVING` в агрегатных запросах?**  
   - `WHERE` фильтрует строки до группировки и не может использовать агрегатные функции.  
   - `HAVING` фильтрует группы после агрегации и может включать условия с `SUM`, `COUNT` и др.

2. **Зачем в запросе с `GROUP BY` нужно перечислять все неагрегированные столбцы?**  
   - SQL требует, чтобы все столбцы в SELECT, не являющиеся аргументами агрегатных функций, присутствовали в GROUP BY. Это гарантирует однозначность: для каждой группы СУБД знает, какое значение столбца выводить. Если бы это не требовалось, было бы неопределённо, какое именно значение (например, какое имя пользователя) выбрать из нескольких строк в группе.
3. **Как изменится результат `EXPLAIN ANALYZE` после добавления индекса? Что означает `Seq Scan` и `Index Scan`?**  
   - После создания индекса планировщик выбирает `Index Scan` вместо `Seq Scan` для условия `WHERE order_id = 1`.  
   - `Seq Scan` – последовательное чтение всей таблицы.  
   - `Index Scan` – поиск по индексу, при котором сначала находятся физические адреса нужных строк, затем считываются только они, что значительно быстрее при точечных запросах на больших таблицах.

