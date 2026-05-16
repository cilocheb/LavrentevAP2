"""
ETL Pipeline для анализа продаж интернет-магазина
Этапы: Extract → Transform → Load → Visualize
"""

import pandas as pd
import numpy as np
import sqlite3
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
from sqlalchemy import create_engine, text   # <-- импортируем text
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class SalesETLPipeline:
    """ETL пайплайн для обработки данных о продажах"""

    def __init__(self, csv_path, db_path='sales.db'):
        self.csv_path = csv_path
        self.db_path = db_path
        self.raw_data = None
        self.cleaned_data = None
        self.aggregated_data = None

    def extract(self):
        """
        Этап 1: Извлечение данных из CSV-файла
        """
        logger.info("Начало этапа EXTRACT")

        try:
            self.raw_data = pd.read_csv(self.csv_path)
            logger.info(f"Загружено {len(self.raw_data)} строк, {len(self.raw_data.columns)} колонок")
            logger.info(f"Колонки: {list(self.raw_data.columns)}")
            logger.info(f"Типы данных:\n{self.raw_data.dtypes}")
        except FileNotFoundError:
            logger.error(f"Файл {self.csv_path} не найден")
            raise
        except pd.errors.EmptyDataError:
            logger.error("Файл пуст")
            raise

        return self.raw_data

    def transform(self):
        """
        Этап 2: Трансформация и очистка данных
        """
        logger.info("Начало этапа TRANSFORM")

        df = self.raw_data.copy()
        initial_rows = len(df)

        # 1. Удаление дубликатов (по всем колонкам)
        before_dedup = len(df)
        df = df.drop_duplicates()
        logger.info(f"Удалено дубликатов: {before_dedup - len(df)}")

        # 2. Обработка пропусков (без inplace, чтобы избежать предупреждений)
        numeric_cols = ['quantity', 'price_per_unit']
        for col in numeric_cols:
            median_val = df[col].median()
            df[col] = df[col].fillna(median_val)   # вместо inplace=True
            logger.info(f"Пропуски в {col} заполнены медианой = {median_val}")

        text_cols = ['category', 'product_name', 'customer_name']
        for col in text_cols:
            df[col] = df[col].fillna("Unknown")    # вместо inplace=True
            logger.info(f"Пропуски в {col} заполнены 'Unknown'")

        # 3. Фильтрация аномалий (quantity <= 0 или price_per_unit <= 0)
        before_filter = len(df)
        df = df[(df['quantity'] > 0) & (df['price_per_unit'] > 0)]
        logger.info(f"Удалено аномальных строк (quantity<=0 или price<=0): {before_filter - len(df)}")

        # 4. Преобразование типов
        df['order_date'] = pd.to_datetime(df['order_date'], errors='coerce')
        # Удалим строки, где дата не распарсилась (если такие есть)
        before_date = len(df)
        df = df.dropna(subset=['order_date'])
        if before_date - len(df) > 0:
            logger.warning(f"Удалено {before_date - len(df)} строк с некорректной датой")

        df['quantity'] = pd.to_numeric(df['quantity'], errors='coerce')
        df['price_per_unit'] = pd.to_numeric(df['price_per_unit'], errors='coerce')
        # Ещё раз удалим строки, где после преобразования появились NaN
        df = df.dropna(subset=['quantity', 'price_per_unit'])

        # 5. Создание колонки total_amount
        df['total_amount'] = df['quantity'] * df['price_per_unit']

        # 6. Создание колонки month_year
        df['month_year'] = df['order_date'].dt.strftime('%Y-%m')

        self.cleaned_data = df
        logger.info(f"После очистки: {len(df)} строк (было {initial_rows})")
        return self.cleaned_data

    def aggregate(self):
        """
        Этап 3: Агрегация данных по категориям и месяцам
        """
        logger.info("Начало этапа AGGREGATE")

        df = self.cleaned_data.copy()

        self.aggregated_data = df.groupby(['category', 'month_year']).agg({
            'quantity': 'sum',
            'total_amount': 'sum',
            'price_per_unit': 'mean',
            'order_id': 'nunique'
        }).rename(columns={
            'quantity': 'total_quantity',
            'total_amount': 'total_revenue',
            'price_per_unit': 'avg_price',
            'order_id': 'order_count'
        }).reset_index()

        logger.info(f"Агрегировано {len(self.aggregated_data)} групп")
        return self.aggregated_data

    def load_to_sqlite(self):
        """
        Этап 4: Загрузка данных в SQLite базу данных
        """
        logger.info("Начало этапа LOAD")

        engine = create_engine(f'sqlite:///{self.db_path}')

        # Сохраняем очищенные данные
        self.cleaned_data.to_sql('sales_cleaned', engine, if_exists='replace', index=False)
        logger.info("Таблица 'sales_cleaned' создана/заменена")

        # Сохраняем агрегированные данные
        self.aggregated_data.to_sql('sales_aggregated', engine, if_exists='replace', index=False)
        logger.info("Таблица 'sales_aggregated' создана/заменена")

        # Выводим список таблиц для проверки (исправленный вызов)
        with engine.connect() as conn:
            # Оборачиваем строку SQL в text()
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table';"))
            tables = result.fetchall()
            logger.info(f"Таблицы в БД: {[t[0] for t in tables]}")

    def visualize(self):
        """
        Этап 5: Визуализация результатов
        """
        logger.info("Начало этапа VISUALIZE")

        # Установим стиль seaborn
        sns.set_style("whitegrid")

        # График 1: Выручка по категориям (суммарно за весь период)
        category_revenue = self.aggregated_data.groupby('category')['total_revenue'].sum().sort_values(ascending=False)

        plt.figure(figsize=(10, 6))
        category_revenue.plot(kind='bar', color='skyblue')
        plt.title('Выручка по категориям товаров', fontsize=14)
        plt.xlabel('Категория')
        plt.ylabel('Выручка (руб.)')
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.show()

        # График 2: Динамика продаж по месяцам (линейный график с разбивкой по категориям)
        # Сначала подготовим данные: сводная таблица (month_year, category) -> total_revenue
        pivot = self.aggregated_data.pivot(index='month_year', columns='category', values='total_revenue').fillna(0)

        plt.figure(figsize=(12, 6))
        pivot.plot(marker='o')
        plt.title('Динамика выручки по категориям', fontsize=14)
        plt.xlabel('Месяц')
        plt.ylabel('Выручка (руб.)')
        plt.xticks(rotation=45)
        plt.legend(title='Категория')
        plt.tight_layout()
        plt.show()

        # График 3: Круговая диаграмма — доля категорий в общей выручке
        plt.figure(figsize=(8, 8))
        category_revenue.plot(kind='pie', autopct='%1.1f%%', startangle=90, cmap='Set3')
        plt.title('Доля категорий в общей выручке', fontsize=14)
        plt.ylabel('')
        plt.tight_layout()
        plt.show()

    def run(self):
        """Запуск полного ETL-пайплайна"""
        logger.info("=" * 50)
        logger.info("ЗАПУСК ETL ПАЙПЛАЙНА")
        logger.info("=" * 50)

        self.extract()
        self.transform()
        self.aggregate()
        self.load_to_sqlite()
        self.visualize()

        logger.info("ETL пайплайн успешно завершён")


if __name__ == "__main__":
    pipeline = SalesETLPipeline('data/sales.csv', 'sales.db')
    pipeline.run()