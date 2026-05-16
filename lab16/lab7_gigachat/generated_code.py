import re

def validate_email(email: str) -> bool:
    """
    Проверяет корректность email адреса согласно регулярному выражению.
    
    Аргументы:
        email (str): Строка, представляющая собой email адрес.
        
    Возвращает:
        bool: True, если email валиден, иначе False.
    
    Примечание:
        Регулярное выражение учитывает следующие правила:
            - Должен присутствовать символ "@"
            - После "@" должно следовать доменное имя (не менее двух символов)
            - Допустимы символы: латинские буквы, цифры, дефис '-', подчеркивание '_', точка '.'
            - Разрешено использование общих доменов (.com, .ru, .org и др.)
    """
    # Регулярка проверяет email адрес
    pattern = r'^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    try:
        if not isinstance(email, str):
            raise TypeError("Параметр 'email' должен быть строкой.")
        
        if len(email.strip()) == 0:
            return False
            
        return bool(re.match(pattern, email))
    
    except Exception as e:
        print(f"Ошибка проверки email: {e}")
        return False

from typing import List, Dict

def sort_by_key(data: List[Dict], key: str, reverse: bool = False) -> List[Dict]:
    """
    Сортирует список словарей по указанному ключу.
    
    :param data: Список словарей, ключи которых нужно отсортировать
    :type data: List[Dict]
    :param key: Ключ, по которому происходит сортировка (обязательно присутствует)
    :type key: str
    :param reverse: Определяет порядок сортировки: True — убывающий, False — возрастающий (по умолчанию)
    :type reverse: bool
    :return: Отсортированный список словарей
    :rtype: List[Dict]
    
    :raises ValueError: Если указанный ключ отсутствует хотя бы в одном словаре
    """
    # Проверка наличия указанного ключа во всех элементах списка
    if not all(key in d for d in data):
        raise ValueError(f"Ключ '{key}' отсутствует в списке словарей")
    
    return sorted(data, key=lambda x: x.get(key), reverse=reverse)

from typing import Callable, Any
import time
from functools import wraps

def timer(func: Callable) -> Callable:
    """
    Декоратор timer выводит время выполнения функции в секундах с точностью до 4 знаков после запятой.
    
    :param func: функция, которую нужно измерить
    :return: декорированная функция
    """
    @wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        try:
            start_time = time.time()
            result = func(*args, **kwargs)
            end_time = time.time()
            execution_time = round(end_time - start_time, 4)
            print(f"Время выполнения функции {func.__name__}: {execution_time} секунд")
            return result
        except Exception as e:
            print(f"Произошла ошибка: {e}")
            raise
    return wrapper