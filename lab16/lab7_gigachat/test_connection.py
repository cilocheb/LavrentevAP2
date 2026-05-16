from gigachat import GigaChat
import os
from dotenv import load_dotenv

load_dotenv()

credentials = os.getenv("GIGACHAT_CREDENTIALS")
verify_ssl = os.getenv("GIGACHAT_VERIFY_SSL_CERTS", "False").lower() == "true"

with GigaChat(credentials=credentials, verify_ssl_certs=verify_ssl) as giga:
    response = giga.chat("Привет! Ты работаешь? Ответь коротко.")
    print(response.choices[0].message.content)