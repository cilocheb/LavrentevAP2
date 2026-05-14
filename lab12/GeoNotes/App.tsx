import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { store } from './src/store';
import NotesListScreen from './src/screens/NotesListScreen';
import AddNoteScreen from './src/screens/AddNoteScreen';
import NoteDetailScreen from './src/screens/NoteDetailScreen';
import { initDatabase } from './src/utils/database';
import { Alert } from 'react-native';

const Stack = createStackNavigator();

export default function App() {
    useEffect(() => {
        initDatabase().catch(error => {
            Alert.alert('Ошибка', 'Не удалось инициализировать базу данных');
            console.error(error);
        });
    }, []);

    return (
        <Provider store={store}>
            <NavigationContainer>
                <Stack.Navigator
                    initialRouteName="NotesList"
                    screenOptions={{
                        headerStyle: {
                            backgroundColor: '#007AFF'
                        },
                        headerTintColor: 'white',
                        headerTitleStyle: {
                            fontWeight: 'bold'
                        }
                    }}
                >
                    <Stack.Screen
                        name="NotesList"
                        component={NotesListScreen}
                        options={{ title: 'Гео-заметки' }}
                    />
                    <Stack.Screen
                        name="AddNote"
                        component={AddNoteScreen}
                        options={{ title: 'Новая заметка' }}
                    />
                    <Stack.Screen
                        name="NoteDetail"
                        component={NoteDetailScreen}
                        options={{ title: 'Детали заметки' }}
                    />
                </Stack.Navigator>
            </NavigationContainer>
        </Provider>
    );
}