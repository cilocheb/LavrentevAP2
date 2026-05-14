# Отчет по лабораторной работе 12.2
# Кроссплатформенная разработка с React Native

**Дата:** 14.05.2026  
**Семестр:** 2 курс, 4 семестр  
**Группа:** ПИН-б-о-24-1
**Дисциплина:** Технологии программирования  
**Студент:** Лаврентьев Аврам Петрович

## Цель работы
Получить практические навыки создания кроссплатформенного мобильного приложения на React Native, изучить архитектуру с мостом (Bridge), научиться работать с нативными модулями через Expo и реализовать общую кодовую базу для Android и iOS.

## Теоретическая часть
В ходе работы были изучены следующие концепции:

1. **Архитектура React Native и мост (Bridge)** – механизм асинхронной сериализованной передачи сообщений между JavaScript-потоком и нативными потоками (UI, модули). Позволяет писать код один раз и запускать на iOS и Android.

2. **Redux Toolkit** – библиотека управления состоянием, уменьшающая boilerplate благодаря `createSlice`, `createAsyncThunk` и встроенной поддержке Immmer.

3. **Expo и нативные модули** – фреймворк, предоставляющий унифицированный API для доступа к камере (`expo-image-picker`), геолокации (`expo-location`) и базе данных SQLite (`expo-sqlite`).

4. **Навигация** – использование `@react-navigation/stack` для управления экранами и `navigation.replace()` для безопасного перехода без ошибок стека.

## Практическая часть
**1.Установка Expo CLI и создание проекта**
```bash
# Установка Expo CLI глобально
npm install -g expo-cli

# Создание нового проекта с шаблоном TypeScript
expo init GeoNotes
# Выбран шаблон "blank (TypeScript)"

# Переход в директорию проекта
cd GeoNotes
```
**2.Установка зависимостей**
```bash
# Навигация
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context

# Нативные модули Expo
npm install expo-location expo-image-picker expo-sqlite

# Карты
npm install react-native-maps

# Управление состоянием
npm install @reduxjs/toolkit react-redux

# Генерация UUID и типы
npm install uuid @types/uuid
```
### Выполненные задачи
 **Разработать приложение «Гео-заметки» (GeoNotes) – заметки с привязкой к текущему местоположению, возможностью добавления фото, просмотра на карте и сохранения в локальную базу данных SQLite.**

### Ключевые фрагменты кода

#### 1. Работа с базой данных (`src/utils/database.ts`) – добавление заметки
```typescript
export const addNote = (note: GeoNote): Promise<void> => {
    return new Promise((resolve, reject) => {
        db.transaction(tx => {
            tx.executeSql(
                `INSERT INTO notes 
                 (id, title, content, latitude, longitude, address, photoUri, createdAt) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    note.id, note.title, note.content, 
                    note.latitude, note.longitude, 
                    note.address || null, note.photoUri || null, note.createdAt
                ],
                (_, result) => {
                    console.log('Note added, rowsAffected:', result.rowsAffected);
                    resolve();
                },
                (_, error) => {
                    console.error('Add note error:', error);
                    reject(error);
                    return false;
                }
            );
        });
    });
};
```

#### 2. Redux thunk для сохранения (`src/store/notesSlice.ts`)
```typescript
export const saveNote = createAsyncThunk('notes/saveNote', async (note: GeoNote) => {
    await database.addNote(note);
    return note;
});
// Обработчики в extraReducers обновляют состояние и сортируют заметки
```

#### 3. Исправление навигации после удаления (`src/screens/NoteDetailScreen.tsx`)
```typescript
const handleDelete = () => {
    Alert.alert('Удаление заметки', 'Вы уверены?', [
        { text: 'Отмена', style: 'cancel' },
        {
            text: 'Удалить', style: 'destructive',
            onPress: async () => {
                await dispatch(removeNote(noteId)).unwrap();
                navigation.replace('NotesList'); // вместо goBack/popToTop
            }
        }
    ]);
};
```

#### 4. Предпросмотр фото на экране создания (`src/screens/AddNoteScreen.tsx`)
```tsx
{photoUri && (
    <View style={styles.previewContainer}>
        <Image source={{ uri: photoUri }} style={styles.preview} />
        <TouchableOpacity style={styles.removePhotoButton} onPress={() => setPhotoUri(undefined)}>
            <Text style={styles.removePhotoText}>✕</Text>
        </TouchableOpacity>
    </View>
)}
```

## Результаты выполнения

### Пример работы программы
```bash
> npx expo start
Starting Metro Bundler
App loaded on Android emulator
```
###  Проверка функциональности
**1.Создание заметки:**
- При открытии экрана AddNote запрашиваются разрешения.
- Определяется текущее местоположение, отображается адрес.
- Можно сделать фото (камера открывается).
- После сохранения заметка появляется в списке.
**2.Список заметок:**
- Заметки сортируются по дате (новые сверху).
- Отображается адрес и индикатор фото (если есть).
**3.Детальный просмотр:**
- Карта с маркером в месте создания заметки.
- Фото отображается в полном размере.
- Удаление работает после подтверждения.
**4.Персистентность:**
- После перезапуска приложения данные загружаются из SQLite.


## Выводы
**В ходе выполнения второй части лабораторной работы было разработано полноценное кроссплатформенное приложение «Гео-заметки» на React Native с использованием Expo. Реализованы:**
- Локальная база данных SQLite с полным CRUD.
- Управление состоянием через Redux Toolkit с асинхронными thunk.
- Навигация по экранам (стек).
- Интеграция нативных модулей: геолокация (определение координат и обратное геокодирование), камера (съёмка фото), карты (отображение местоположения заметки).
- Дополнительные UI-улучшения: индикаторы фото, предпросмотр, спиннер загрузки.
- Обработка ошибок и разрешений.
Приложение стабильно работает на Android и iOS (проверено на эмуляторах и реальных устройствах через Expo Go). Получены практические навыки разработки кроссплатформенных приложений, понимание архитектуры React Native и работы с нативными модулями

## Ответы на контрольные вопросы

1. **В чем заключается архитектура React Native и как работает мост (Bridge)?**  
   React Native состоит из JavaScript‑потока (логика), нативного UI‑потока (отрисовка) и асинхронного моста (Bridge). Мост передаёт сериализованные JSON‑сообщения между JS и нативными модулями. Это позволяет вызывать камеру, геолокацию и другие нативные API из JS, но создаёт накладные расходы. В новой архитектуре (Fabric) мост частично заменён на JSI для прямого взаимодействия.

2. **Какие преимущества дает использование Redux Toolkit для управления состоянием?**  
- Меньше шаблонного кода – createSlice генерирует actions и reducers.
- Встроенный Immer – позволяет писать иммутабельные обновления как мутирующие.
- Асинхронные thunk через createAsyncThunk с автоматическими состояниями pending/fulfilled/rejected.
- Отличная типизация для TypeScript.
- Подключение Redux DevTools без дополнительных настроек.

3. **Чем отличается работа с нативными модулями (камера, геолокация) в React Native от нативной разработки?**  
   *Ответ:* В React Native используется единый JavaScript API (`expo-location`, `expo-image-picker`), который через мост вызывает нативные реализации. Разработчик не пишет код на Java/Kotlin/Swift. В нативной разработке – отдельные реализации для каждой платформы, прямой доступ к API, больше контроля, но выше сложность поддержки двух кодовых баз.

4. **Как обеспечивается кроссплатформенность кода в React Native?**  
   *Ответ:* Абстракции компонентов (`<View>`, `<Text>`) рендерятся в нативные аналоги (UIView, android.view.View). Стили (Flexbox) работают одинаково. Можно использовать платформ-специфичные расширения (`.ios.js`, `.android.js`) и `Platform.select`. Нативные модули имеют единый JS-интерфейс. Expo дополнительно сглаживает различия между платформами.




---
