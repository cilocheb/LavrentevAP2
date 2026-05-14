# Отчет по лабораторной работе 12
# Нативная Android-разработка с Jetpack Compose

**Дата:** 01-04-2026  
**Семестр:** 2 курс 2 полугодие — 4 семестр  
**Группа:** ПИН-б-о-24-1 
**Дисциплина:** Технологии программирования 
**Студент:** Лаврентьев Аврам Петрович  

---

## Цель работы

Получить практические навыки создания нативного Android-приложения на Kotlin с использованием современного декларативного подхода Jetpack Compose, архитектурных компонентов Jetpack (ViewModel, StateFlow) и локальной базы данных Room. В ходе выполнения работы необходимо разработать приложение «Персональный менеджер заметок» (Notes App), которое поддерживает создание, просмотр, редактирование и удаление заметок с сохранением данных в базе данных и реактивным обновлением интерфейса.

---

## Теоретическая часть

В ходе выполнения работы были изучены и применены следующие концепции и технологии:

- **Jetpack Compose** — декларативный фреймворк для построения пользовательского интерфейса Android. В отличие от императивного подхода XML, Compose позволяет описывать UI как функции, реагирующие на состояние (state).
- **MVVM (Model‑View‑ViewModel)** — архитектурный паттерн, разделяющий приложение на модель (данные, бизнес-логика), представление (UI) и ViewModel, которая управляет состоянием UI и взаимодействует с моделью.
- **Room** — библиотека для работы с SQLite, предоставляющая абстракцию над базой данных, проверку запросов на этапе компиляции и поддержку реактивных потоков (Flow).
- **Kotlin Coroutines & Flow** — инструменты для асинхронной обработки данных. Flow используется для получения обновлений из базы данных в реальном времени.
- **StateFlow** — реактивный поток, хранящий текущее состояние и уведомляющий подписчиков об изменениях.
- **ViewModel** — компонент, сохраняющий состояние при повороте экрана и управляющий корутинами.
- **Навигация (Navigation Component)** — библиотека для организации переходов между экранами Compose с передачей параметров.
- **Обработка ошибок и пользовательский опыт** — использование Snackbar для отображения ошибок, диалогов подтверждения удаления, предотвращение белых экранов при быстрых навигационных операциях.

---

## Практическая часть

### Выполненные задачи

1.  **Создание проекта и настройка зависимостей** — проект создан с использованием Kotlin DSL, добавлены зависимости Compose, Room, Coroutines, Navigation.
2.  **Добавление поля `createdAt`** — в модель `Note` добавлено поле `createdAt: Long`, заполняемое при создании заметки текущим временем; в UI дата форматируется и отображается.
3.  **Реализация удаления заметок** — в DAO добавлен метод `deleteNote`, в репозитории и ViewModel — соответствующие функции; в `NoteItem` добавлена иконка корзины с диалогом подтверждения.
4.  **Реализация редактирования заметок** — навигация с параметром `noteId`, загрузка заметки по идентификатору, обновление полей и сохранение изменений.
5.  **Обработка ошибок и улучшение UI** — все операции с БД обёрнуты в `try-catch`, ошибки отображаются через `Snackbar`; добавлено форматирование даты; кнопка «Назад» использует стандартную иконку.
6.  **Решение проблемы белого экрана при быстрой навигации** — для экрана редактирования создана отдельная ViewModel (`EditNoteViewModel`) с изоляцией через ключ `edit_note_$noteId`; каждый экран загружает данные независимо, что исключает состояние гонки.

### Ключевые фрагменты кода

#### 1. Модель заметки с полем `createdAt`

```kotlin
package com.example.notesapp.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "notes")
data class Note(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,
    val title: String,
    val content: String,
    val createdAt: Long = System.currentTimeMillis() // добавлено поле даты
)
```

#### 2. Реактивная загрузка списка (ViewModel)

```kotlin
fun addNote(title: String, content: String) {
    viewModelScope.launch {
        val note = Note(
            title = title,
            content = content,
            createdAt = System.currentTimeMillis()
        )
        repository.insertNote(note)
    }
}
```

#### 3. Удаление с диалогом подтверждения (NoteItem)

```kotlin
package com.example.notesapp.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "notes")
data class Note(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,
    val title: String,
    val content: String,
    val createdAt: Long = System.currentTimeMillis() // добавлено поле даты
)
```

#### 4. Отображение ошибок через Snackbar

```kotlin
val snackbarHostState = remember { SnackbarHostState() }
LaunchedEffect(error) {
    error?.let {
        snackbarHostState.showSnackbar(it)
        viewModel.clearError()
    }
}
Scaffold(
    snackbarHost = { SnackbarHost(snackbarHostState) },
    // ...
) { /* ... */ }
```

#### 5. Изолированная ViewModel для редактирования (ключ – noteId)

```kotlin
composable("add_edit_note/{noteId}") { backStackEntry ->
    val noteId = backStackEntry.arguments?.getString("noteId")?.toInt() ?: -1
    val factory = EditNoteViewModelFactory(owner = backStackEntry, repository = noteRepository, noteId = noteId)
    val editViewModel: EditNoteViewModel = viewModel(key = "edit_note_$noteId", factory = factory)
    AddEditNoteScreen(viewModel = editViewModel, onNavigateBack = { navController.popBackStack() })
}
```
#### 6.В NotesList вызов изменён:
```kotlin
NoteItem(
    note = note,
    onClick = { onNoteClick(note.id) },
    onDelete = { viewModel.deleteNote(note) }
)
```
#### 7.Файл MainActivity.kt:
```kotlin
package com.example.notesapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.*
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.example.notesapp.data.NoteDatabase
import com.example.notesapp.data.NoteRepository
import com.example.notesapp.ui.*
import com.example.notesapp.ui.theme.NotesAppTheme

class MainActivity : ComponentActivity() {

    private lateinit var noteRepository: NoteRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val database = NoteDatabase.getDatabase(this)
        noteRepository = NoteRepository(database.noteDao())

        setContent {
            NotesAppTheme {
                NotesApp(noteRepository)
            }
        }
    }
}

@Composable
fun NotesApp(noteRepository: NoteRepository) {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = "notes_list"
    ) {
        composable("notes_list") {
            val viewModel: NotesViewModel = viewModel(factory = NotesViewModelFactory(noteRepository))
            NotesScreen(
                viewModel = viewModel,
                onNoteClick = { noteId ->
                    navController.navigate("add_edit_note/$noteId")
                },
                onAddClick = {
                    navController.navigate("add_edit_note/-1")
                }
            )
        }

        composable("add_edit_note/{noteId}") { backStackEntry ->
            val noteId = backStackEntry.arguments?.getString("noteId")?.toInt() ?: -1
            val factory = EditNoteViewModelFactory(
                owner = backStackEntry,   // используем явное имя backStackEntry
                repository = noteRepository,
                noteId = noteId
            )
            val editViewModel: EditNoteViewModel = viewModel(
                key = "edit_note_$noteId",
                factory = factory
            )
            AddEditNoteScreen(
                viewModel = editViewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}

```
---

## Результаты выполнения

### Пример работы программы
-Главный экран со списком заметок (минимум 2 заметки)
-Экран создания новой заметки
-Экран с подтверждением удаления
-Экран редактирования заметки (доп. задание)
### Тестирование

-  **Модульные тесты** (не писались, но логирование подтверждает корректную работу)
-  **Интеграционные тесты** — проверена работа базы данных (добавление, обновление, удаление), навигация между экранами, поворот экрана (состояние сохраняется)
-  **Производительность** — список загружается быстро, нет зависаний UI благодаря использованию корутин

---

---

## Ответы на контрольные вопросы

1. **В чем преимущество использования Flow и StateFlow перед обычными списками?**  
   Flow и StateFlow обеспечивают реактивное обновление UI при изменении данных в базе (например, при добавлении, удалении или обновлении заметки). Без них пришлось бы вручную перезагружать список после каждого изменения, что ведёт к лишнему коду и потенциальным ошибкам. Кроме того, Flow работает асинхронно и поддерживает корутины, не блокируя главный поток.

2. **Почему ViewModel не уничтожается при повороте экрана и как это влияет на UX?**  
   ViewModel привязана к жизненному циклу Activity или Fragment и переживает конфигурационные изменения (поворот экрана) благодаря тому, что система сохраняет ссылку на неё. Это позволяет сохранить все данные (например, список заметок или состояние загрузки) без потерь. Пользователь видит тот же экран с теми же данными, что значительно улучшает UX, устраняя необходимость повторной загрузки.

3. **Какие преимущества дает использование Room по сравнению с прямым использованием SQLite?**  
   Room предоставляет проверку SQL-запросов на этапе компиляции, уменьшая вероятность ошибок во время выполнения. Он автоматически преобразует объекты в строки таблиц и обратно, поддерживает корутины и `Flow`, упрощает миграцию и уменьшает количество шаблонного кода.

---

