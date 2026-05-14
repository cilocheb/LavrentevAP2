import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Alert
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { removeNote } from '../store/notesSlice';

interface NoteDetailScreenProps {
    navigation: any;
    route: any;
}

const NoteDetailScreen: React.FC<NoteDetailScreenProps> = ({ navigation, route }) => {
    const { noteId } = route.params;
    const dispatch = useAppDispatch();
    const note = useAppSelector(state =>
        state.notes.items.find(item => item.id === noteId)
    );

    useEffect(() => {
        if (!note) {
            // Если заметка не найдена, заменяем текущий экран на список заметок
            navigation.replace('NotesList');
        }
    }, [note, navigation]);

    const handleDelete = () => {
        Alert.alert(
            'Удаление заметки',
            'Вы уверены, что хотите удалить эту заметку?',
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Удалить',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await dispatch(removeNote(noteId)).unwrap();
                            // После удаления заменяем текущий экран на список заметок
                            navigation.replace('NotesList');
                        } catch (error) {
                            Alert.alert('Ошибка', 'Не удалось удалить заметку');
                        }
                    }
                }
            ]
        );
    };

    if (!note) {
        return null;
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{note.title}</Text>
                <Text style={styles.date}>
                    {new Date(note.createdAt).toLocaleString()}
                </Text>
            </View>

            <View style={styles.contentContainer}>
                <Text style={styles.content}>{note.content}</Text>
            </View>

            {note.address && (
                <View style={styles.addressContainer}>
                    <Text style={styles.addressLabel}>📍 Адрес:</Text>
                    <Text style={styles.addressText}>{note.address}</Text>
                </View>
            )}

            <View style={styles.mapContainer}>
                <MapView
                    style={styles.map}
                    initialRegion={{
                        latitude: note.latitude,
                        longitude: note.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01
                    }}
                >
                    <Marker
                        coordinate={{
                            latitude: note.latitude,
                            longitude: note.longitude
                        }}
                        title={note.title}
                    />
                </MapView>
            </View>

            {note.photoUri && (
                <View style={styles.photoContainer}>
                    <Text style={styles.photoLabel}>📷 Фото:</Text>
                    <Image source={{ uri: note.photoUri }} style={styles.photo} />
                </View>
            )}

            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Text style={styles.deleteButtonText}>Удалить заметку</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5'
    },
    header: {
        backgroundColor: 'white',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8
    },
    date: {
        fontSize: 14,
        color: '#666'
    },
    contentContainer: {
        backgroundColor: 'white',
        padding: 20,
        marginTop: 1
    },
    content: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24
    },
    addressContainer: {
        backgroundColor: 'white',
        padding: 20,
        marginTop: 1
    },
    addressLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4
    },
    addressText: {
        fontSize: 14,
        color: '#007AFF'
    },
    mapContainer: {
        height: 200,
        marginTop: 1,
        backgroundColor: 'white'
    },
    map: {
        flex: 1
    },
    photoContainer: {
        backgroundColor: 'white',
        padding: 20,
        marginTop: 1
    },
    photoLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8
    },
    photo: {
        width: '100%',
        height: 200,
        borderRadius: 8
    },
    deleteButton: {
        backgroundColor: '#ff3b30',
        margin: 20,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center'
    },
    deleteButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16
    }
});

export default NoteDetailScreen;