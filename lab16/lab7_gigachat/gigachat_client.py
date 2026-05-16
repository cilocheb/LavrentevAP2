import os
import json
from dotenv import load_dotenv
from gigachat import GigaChat
from typing import List, Dict, Optional

load_dotenv()

class GigaChatAssistant:
    def __init__(self):
        self.credentials = os.getenv("GIGACHAT_CREDENTIALS")
        self.model = os.getenv("GIGACHAT_MODEL", "GigaChat-2")
        self.verify_ssl = os.getenv("GIGACHAT_VERIFY_SSL_CERTS", "False").lower() == "true"
        self.client = GigaChat(credentials=self.credentials, model=self.model, verify_ssl_certs=self.verify_ssl)

    def generate_code(self, description: str, lang: str = "python") -> str:
        prompt = f"Напиши код на {lang} для: {description}. Требования: аннотации типов, docstring, обработка ошибок. Верни только код."
        resp = self.client.chat(prompt)
        code = resp.choices[0].message.content
        if code.startswith("```"):
            code = code.split("```")[1]
            if code.startswith(lang):
                code = code[len(lang):]
            code = code.strip()
        return code

    def refactor_code(self, code: str, requirements: str) -> str:
        prompt = f"Рефакторинг кода:\n{code}\nТребования: {requirements}. Верни только код."
        resp = self.client.chat(prompt)
        ref = resp.choices[0].message.content
        if ref.startswith("```"):
            ref = ref.split("```")[1]
            if ref.startswith("python"):
                ref = ref[6:]
            ref = ref.strip()
        return ref

    def generate_tests(self, code: str, framework: str = "pytest") -> str:
        prompt = f"Напиши тесты на {framework} для кода:\n{code}\nВерни только код тестов."
        resp = self.client.chat(prompt)
        tests = resp.choices[0].message.content
        if tests.startswith("```"):
            tests = tests.split("```")[1]
            if tests.startswith(framework) or tests.startswith("python"):
                tests = tests.split("\n", 1)[1] if "\n" in tests else tests
            tests = tests.strip()
        return tests

    def generate_documentation(self, code: str, doc_type: str = "readme") -> str:
        if doc_type == "docstring":
            prompt = f"Добавь docstring в Google стиле в код:\n{code}\nВерни полный код."
        else:
            prompt = f"Создай README для кода:\n{code}\nВключи: описание, установку, примеры."
        resp = self.client.chat(prompt)
        doc = resp.choices[0].message.content
        if doc_type == "docstring" and doc.startswith("```"):
            doc = doc.split("```")[1]
            if doc.startswith("python"):
                doc = doc[6:]
            doc = doc.strip()
        return doc

    def analyze_code(self, code: str) -> Dict:
        prompt = f"Проанализируй код и верни JSON с полями: quality_issues, readability_issues, security_issues, performance_issues, suggestions.\nКод:\n{code}\nТолько JSON."
        resp = self.client.chat(prompt)
        result = resp.choices[0].message.content
        if "```json" in result:
            result = result.split("```json")[1].split("```")[0]
        elif "```" in result:
            result = result.split("```")[1]
        try:
            return json.loads(result.strip())
        except:
            return {"error": "не удалось распарсить"}

    def chat(self, message: str) -> str:
        resp = self.client.chat(message)
        return resp.choices[0].message.content

if __name__ == "__main__":
    assist = GigaChatAssistant()
    print("=== Чат ===")
    print(assist.chat("Привет, ответь 'да'"))

    print("=== Генерация email-валидатора ===")
    f1 = assist.generate_code("функция validate_email(email: str) -> bool, regex, пустая строка -> False")
    print(f1)

    print("=== Генерация сортировки ===")
    f2 = assist.generate_code("функция sort_by_key(data: List[Dict], key: str, reverse=False) -> List[Dict], если ключа нет -> ValueError")
    print(f2)

    print("=== Генерация декоратора timer ===")
    f3 = assist.generate_code("декоратор timer, вывод времени в секундах с 4 знаками, functools.wraps")
    print(f3)

    with open("generated_code.py", "w", encoding="utf-8") as f:
        f.write(f1 + "\n\n" + f2 + "\n\n" + f3)

    if not os.path.exists("bad_code.py"):
        with open("bad_code.py", "w", encoding="utf-8") as f:
            f.write("""def f(x,y): return x+y
def calc(a,b,c): return (a*b+c)/2
G=100
def process(lst): return [x*2 if x%2==0 else x*3 for x in lst]
def get_user(id): return {1:"Alice",2:"Bob"}.get(id)
""")
    with open("bad_code.py", "r", encoding="utf-8") as f:
        bad = f.read()
    ref = assist.refactor_code(bad, "переименовать, добавить типы, docstring, константу, обработку ошибок")
    with open("refactored_code.py", "w", encoding="utf-8") as f:
        f.write(ref)

    tests = assist.generate_tests(ref)
    with open("test_refactored.py", "w", encoding="utf-8") as f:
        f.write(tests)

    analysis = assist.analyze_code(f1 + f2 + f3)
    with open("analysis.json", "w", encoding="utf-8") as f:
        json.dump(analysis, f, indent=2, ensure_ascii=False)

    readme = assist.generate_documentation(f1 + f2 + f3)
    with open("README_generated.md", "w", encoding="utf-8") as f:
        f.write(readme)

    print("Все файлы созданы.")