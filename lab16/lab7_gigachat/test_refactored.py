# Автоматически сгенерированные тесты
import pytest
from refactored_code import *

import pytest

# Тестирование функции сложения чисел
def test_sum_numbers():
    result = sum_numbers(5, 7)
    assert result == 12, f"Функция неверно суммирует числа: ожидалось 12, получено {result}"

# Проверка отрицательных чисел
def test_sum_negative_numbers():
    result = sum_numbers(-4, -6)
    assert result == -10, f"Функция неверно суммирует отрицательные числа: ожидалось -10, получено {result}"

# Проверка нулевых значений
def test_sum_zero():
    result = sum_numbers(0, 0)
    assert result == 0, f"Функция неправильно складывает нули: ожидалось 0, получена {result}"

# Тестирование функции вычисления среднего арифметического
def test_average():
    result = average(1, 2, 3)
    expected_result = 2.5
    assert abs(result - expected_result) < 1e-6, \
           f"Ошибочное значение среднего арифметического: ожидалось {expected_result}, получено {result}"

# Проверка корректной работы при разных типах чисел
def test_average_types():
    result = average(1.0, 2, 3.0)
    expected_result = 2.5
    assert abs(result - expected_result) < 1e-6, \
           f"Некорректная работа с разными числовыми типами: ожидалось {expected_result}, получено {result}"

# Проверка ошибки на недопустимых типах данных
def test_average_incorrect_type():
    with pytest.raises(ValueError):
        average('a', 2, 3)

# Тестирование обработки четных и нечетных чисел
def test_double_even_triple_odd():
    result = double_even_triple_odd([2, 3, 4])
    expected = [4, 9, 8]
    assert result == expected, f"Неверное преобразование списка: ожидалось {expected}, получил {result}"

# Проверка преобразования чисел вида 0
def test_double_even_triple_odd_zero():
    result = double_even_triple_odd([0, 1, 2])
    expected = [0, 3, 4]
    assert result == expected, f"Неправильное поведение при обработке нуля: ожидалось {expected}, получил {result}"

# Проверка обработки пустого списка
def test_empty_list():
    result = double_even_triple_odd([])
    expected = []
    assert result == expected, f"Пустой список обрабатывается некорректно: ожидался пустой список, получили {result}"

# Тестируем функцию получения имени пользователя
def test_get_person_valid_id():
    name = get_person(1)
    assert name == "Alice", f"Имя пользователя не найдено: ожидалось Alice, получило {name}"

# Тестим отсутствие пользователя
def test_get_person_invalid_id():
    name = get_person(5)
    assert name is None, f"Получено неправильное значение для несуществующего пользователя: ожидалось None, получил {name}"