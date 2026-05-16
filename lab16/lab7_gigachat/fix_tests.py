import os
from gigachat_client import GigaChatAssistant

assistant = GigaChatAssistant()

with open("refactored_code.py", "r", encoding="utf-8") as f:
    refactored_code = f.read()

# Улучшенный запрос для генерации тестов
tests = assistant.generate_tests(
    refactored_code,
    framework="pytest"
)

# Сохраняем
with open("test_refactored.py", "w", encoding="utf-8") as f:
    f.write("# Автоматически сгенерированные тесты\n")
    f.write("import pytest\n")
    f.write("from refactored_code import *\n\n")
    f.write(tests)

print("Файл test_refactored.py перезаписан.")