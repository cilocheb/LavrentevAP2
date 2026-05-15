

// Выбираем БД
db = db.getSiblingDB("shop_mongo");

// Очистка перед вставкой (чтобы скрипт можно было перезапускать)
db.users.drop();
db.products.drop();
db.orders.drop();

print("=== 1. СОЗДАНИЕ КОЛЛЕКЦИЙ И ЗАПОЛНЕНИЕ ДАННЫМИ ===");

// ----- ПОЛЬЗОВАТЕЛИ (3 шт.) -----
db.users.insertMany([
    {
        _id: 1,
        email: "alice@example.com",
        full_name: "Alice Smith",
        created_at: new Date(),
        address: { city: "Moscow", street: "Tverskaya", zipcode: "101000" }
    },
    {
        _id: 2,
        email: "bob@example.com",
        full_name: "Bob Johnson",
        created_at: new Date(),
        address: { city: "Saint Petersburg", street: "Nevsky", zipcode: "191186" }
    },
    {
        _id: 3,
        email: "carol@example.com",
        full_name: "Carol White",
        created_at: new Date(),
        address: { city: "Kazan", street: "Baumana", zipcode: "420111" }
    }
]);
print(`> Пользователи: ${db.users.countDocuments()}`);

// ----- ТОВАРЫ (5 шт.) -----
db.products.insertMany([
    { _id: 1, name: "Ноутбук", category: "Электроника", price: 75000, stock_quantity: 10, specs: { brand: "Lenovo", ram: "16GB" } },
    { _id: 2, name: "Мышь", category: "Электроника", price: 1500, stock_quantity: 50 },
    { _id: 3, name: "Книга SQL", category: "Книги", price: 2500, stock_quantity: 30, specs: { author: "Дмитрий К.", pages: 450 } },
    { _id: 4, name: "Клавиатура", category: "Электроника", price: 4500, stock_quantity: 20 },
    { _id: 5, name: "Ручка", category: "Канцелярия", price: 100, stock_quantity: 200 }
]);
print(`> Товары: ${db.products.countDocuments()}`);

// ----- ЗАКАЗЫ (4 шт., включая отменённый для DELETE) -----
const now = new Date();
const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
const oldDate = new Date("2023-01-01"); // старый заказ

db.orders.insertMany([
    {
        _id: 1,
        user_id: 1,
        order_date: new Date("2026-04-15"),
        status: "completed",
        items: [{ product_id: 1, quantity: 1, price: 75000 }, { product_id: 2, quantity: 2, price: 1500 }]
    },
    {
        _id: 2,
        user_id: 2,
        order_date: new Date("2026-04-20"),
        status: "completed",
        items: [{ product_id: 3, quantity: 2, price: 2500 }, { product_id: 4, quantity: 1, price: 4500 }]
    },
    {
        _id: 3,
        user_id: 3,
        order_date: new Date("2026-04-28"),
        status: "pending",
        items: [{ product_id: 5, quantity: 10, price: 100 }, { product_id: 2, quantity: 1, price: 1500 }]
    },
    {
        _id: 4,   // отменённый старый заказ (будет удалён)
        user_id: 2,
        order_date: oldDate,
        status: "cancelled",
        items: [{ product_id: 2, quantity: 1, price: 1500 }]
    }
]);
print(`> Заказы: ${db.orders.countDocuments()}`);

// ===============================================================
// B. CRUD-ОПЕРАЦИИ
// ===============================================================

// ---------- READ: заказы Alice с итоговой суммой ----------
print("\n=== 2. READ: Заказы Alice с итоговой суммой ===");
db.orders.aggregate([
    { $lookup: { from: "users", localField: "user_id", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    { $match: { "user.email": "alice@example.com" } },
    {
        $addFields: {
            total_amount: {
                $sum: {
                    $map: {
                        input: "$items",
                        as: "item",
                        in: { $multiply: ["$$item.quantity", "$$item.price"] }
                    }
                }
            }
        }
    },
    { $project: { order_id: "$_id", status: 1, total_amount: 1, "user.full_name": 1, _id: 0 } }
]).pretty();

// ---------- UPDATE: добавить скидку 10% на заказы дороже 80000 ----------
print("\n=== 3. UPDATE: Скидка 10% для заказов > 80000 ===");
// Добавляем поле total_amount всем заказам (один запрос через агрегацию)
db.orders.updateMany(
    {},
    [
        {
            $set: {
                total_amount: {
                    $sum: {
                        $map: {
                            input: "$items",
                            as: "i",
                            in: { $multiply: ["$$i.quantity", "$$i.price"] }
                        }
                    }
                }
            }
        }
    ]
);
// Теперь применяем скидку
const updateResult = db.orders.updateMany(
    { total_amount: { $gt: 80000 } },
    { $set: { discount: 10 } }
);
print(`> Обновлено заказов со скидкой: ${updateResult.modifiedCount}`);

// Показываем заказы, получившие скидку
db.orders.find({ discount: { $exists: true } }, { _id: 1, total_amount: 1, discount: 1 }).pretty();

// ---------- DELETE: удалить отменённые заказы старше 30 дней ----------
print("\n=== 4. DELETE: Удаление cancelled заказов старше 30 дней ===");
const cutoff = new Date();
cutoff.setDate(cutoff.getDate() - 30);
const deleteResult = db.orders.deleteMany({
    status: "cancelled",
    order_date: { $lt: cutoff }
});
print(`> Удалено заказов: ${deleteResult.deletedCount}`);

// ===============================================================
// C. АГРЕГАЦИОННЫЙ ПАЙПЛАЙН: ВЫРУЧКА ПО КАТЕГОРИЯМ
// ===============================================================
print("\n=== 5. Агрегация: выручка, количество, средняя цена по категориям ===");
db.orders.aggregate([
    { $unwind: "$items" },
    {
        $lookup: {
            from: "products",
            localField: "items.product_id",
            foreignField: "_id",
            as: "product"
        }
    },
    { $unwind: "$product" },
    {
        $group: {
            _id: "$product.category",
            total_quantity: { $sum: "$items.quantity" },
            total_revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
            avg_price: { $avg: "$items.price" }
        }
    },
    { $sort: { total_revenue: -1 } },
    {
        $project: {
            category: "$_id",
            total_quantity: 1,
            total_revenue: 1,
            avg_price: { $round: ["$avg_price", 2] },
            _id: 0
        }
    }
]).pretty();

// ===============================================================
// D. СРАВНЕНИЕ С SQL (ЗАПРОСЫ ИЗ ЧАСТИ 1)
// ===============================================================

// ---------- 1. Топ-3 пользователя по сумме заказов ----------
print("\n=== 6. Топ-3 пользователей по сумме заказов ===");
db.orders.aggregate([
    { $unwind: "$items" },
    {
        $group: {
            _id: "$user_id",
            total_spent: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
        }
    },
    { $sort: { total_spent: -1 } },
    { $limit: 3 },
    {
        $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user"
        }
    },
    { $unwind: "$user" },
    {
        $project: {
            full_name: "$user.full_name",
            total_spent: 1,
            _id: 0
        }
    }
]).pretty();

// ---------- 2. Все заказы с пользователем и итоговой суммой ----------
print("\n=== 7. Все заказы с пользователем и итоговой суммой ===");
db.orders.aggregate([
    {
        $addFields: {
            total_amount: {
                $sum: {
                    $map: {
                        input: "$items",
                        as: "i",
                        in: { $multiply: ["$$i.quantity", "$$i.price"] }
                    }
                }
            }
        }
    },
    {
        $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user"
        }
    },
    { $unwind: "$user" },
    {
        $project: {
            order_id: "$_id",
            full_name: "$user.full_name",
            status: 1,
            order_date: 1,
            total_amount: 1,
            _id: 0
        }
    },
    { $sort: { order_id: 1 } }
]).pretty();

// ===============================================================
// ОПТИМИЗАЦИЯ: ИНДЕКСЫ И АНАЛИЗ
// ===============================================================
print("\n=== 8. Создание индексов и проверка их использования ===");

// Создаём индексы (если их нет)
db.orders.createIndex({ user_id: 1 });
db.orders.createIndex({ status: 1, order_date: -1 });
db.products.createIndex({ name: "text" });

// Показываем существующие индексы
print("Индексы в orders:");
db.orders.getIndexes().forEach(idx => printjson(idx));
print("Индексы в products:");
db.products.getIndexes().forEach(idx => printjson(idx));

// Демонстрация анализа запроса с индексом
print("\n=== 9. Анализ плана запроса (explain) для поиска по user_id ===");
const explainResult = db.orders.find({ user_id: 1 }).explain("executionStats");
print(`Использованный индекс: ${explainResult.queryPlanner.winningPlan.inputStage?.indexName || 'не использован'}`);
print(`Количество возвращённых документов: ${explainResult.executionStats.nReturned}`);
print(`Общее количество просмотренных документов: ${explainResult.executionStats.totalDocsExamined}`);

print("\n=== ВСЕ ОПЕРАЦИИ ВЫПОЛНЕНЫ УСПЕШНО ===");
