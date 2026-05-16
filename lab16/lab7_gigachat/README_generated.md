# 📄 Описание проекта

Этот проект содержит набор полезных функций Python:

1. Функция `validate_email` позволяет проверять корректность электронных почтовых адресов с помощью регулярного выражения.
2. Функция `sort_by_key` сортирует списки словарей по заданному ключу.
3. Декоратор `timer` вычисляет время исполнения любой переданной функции и выводит результат с высокой точностью.

## 💡 Установка

Для установки необходимых зависимостей выполните команду:

```bash
pip install -r requirements.txt
```

Файл `requirements.txt` содержит минимальный перечень зависимостей:

- `re`
- `functools`
- `time`

## 🛠 Примеры использования

### Пример 1: Проверка корректности email

```python
from project_name.email_validation import validate_email

email = "example@example.com"
result = validate_email(email)
print(result)  # Вернет True или False
```

### Пример 2: Сортировка словаря по ключу

```python
from project_name.sorting import sort_by_key

data = [
    {"id": 5},
    {"id": 3},
    {"id": 8}
]
sorted_data = sort_by_key(data, "id")
print(sorted_data)
```

### Пример 3: Измерение времени работы функции с декоратором

```python
from project_name.timer_decorator import timer

@timer
def example_function():
    time.sleep(1)

example_function()  # Выведет время выполнения функции
```

## 📌 Лицензия

Лицензируется под лицензией MIT. См. файл LICENSE.md для подробной информации.

---

# 🏷️ Контакты и поддержка

Если возникнут проблемы или потребуется помощь, пожалуйста, обращайтесь!