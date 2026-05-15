-- ========== 1. Удаляем старые таблицы, если есть (для перезапуска) ==========
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

-- ========== 2. Создание таблиц ==========
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

-- ========== 3. Тестовые данные ==========
INSERT INTO users (email, full_name) VALUES
    ('alice@example.com', 'Alice Smith'),
    ('bob@example.com', 'Bob Johnson');

INSERT INTO products (name, category, price, stock_quantity) VALUES
    ('Ноутбук', 'Электроника', 75000.00, 10),
    ('Мышь', 'Электроника', 1500.00, 50),
    ('Книга SQL', 'Книги', 2500.00, 30),
    -- Добавляем ещё 2 продукта (всего 5)
    ('Монитор', 'Электроника', 25000.00, 15),
    ('Клавиатура', 'Электроника', 3500.00, 20);

-- Вставка заказов (минимум 2 заказа, лучше 3)
INSERT INTO orders (user_id, status) VALUES
    (1, 'completed'),   -- заказ Alice
    (2, 'completed'),   -- заказ Bob
    (1, 'completed');   -- второй заказ Alice

-- Вставка позиций заказов (order_items)
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
    -- Заказ 1 (Alice): ноутбук + мышь
    (1, 1, 1, 75000.00),
    (1, 2, 2, 1500.00),
    -- Заказ 2 (Bob): книга SQL + мышь
    (2, 3, 1, 2500.00),
    (2, 2, 1, 1500.00),
    -- Заказ 3 (Alice): монитор + клавиатура
    (3, 4, 1, 25000.00),
    (3, 5, 1, 3500.00);