import * as SQLite from 'expo-sqlite';
import { GeoNote } from '../types';

const db = SQLite.openDatabase('geonotes.db');

export const initDatabase = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        db.transaction(tx => {
            tx.executeSql(
                `CREATE TABLE IF NOT EXISTS notes (
                    id TEXT PRIMARY KEY NOT NULL,
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    latitude REAL NOT NULL,
                    longitude REAL NOT NULL,
                    address TEXT,
                    photoUri TEXT,
                    createdAt INTEGER NOT NULL
                );`,
                [],
                () => {
                    console.log('Database initialized');
                    resolve();
                },
                (_, error) => {
                    console.error('Database initialization error:', error);
                    reject(error);
                    return false;
                }
            );
        });
    });
};

export const getNotes = (): Promise<GeoNote[]> => {
    return new Promise((resolve, reject) => {
        db.transaction(tx => {
            tx.executeSql(
                'SELECT * FROM notes ORDER BY createdAt DESC',
                [],
                (_, { rows }) => {
                    const notes: GeoNote[] = [];
                    for (let i = 0; i < rows.length; i++) {
                        notes.push(rows.item(i));
                    }
                    resolve(notes);
                },
                (_, error) => {
                    console.error('Get notes error:', error);
                    reject(error);
                    return false;
                }
            );
        });
    });
};

export const addNote = (note: GeoNote): Promise<void> => {
    return new Promise((resolve, reject) => {
        db.transaction(tx => {
            tx.executeSql(
                `INSERT INTO notes (id, title, content, latitude, longitude, address, photoUri, createdAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    note.id,
                    note.title,
                    note.content,
                    note.latitude,
                    note.longitude,
                    note.address || null,
                    note.photoUri || null,
                    note.createdAt
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

export const deleteNote = (id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        db.transaction(tx => {
            tx.executeSql(
                'DELETE FROM notes WHERE id = ?',
                [id],
                (_, result) => {
                    console.log('Note deleted, rowsAffected:', result.rowsAffected);
                    resolve();
                },
                (_, error) => {
                    console.error('Delete note error:', error);
                    reject(error);
                    return false;
                }
            );
        });
    });
};

export const updateNote = (note: GeoNote): Promise<void> => {
    return new Promise((resolve, reject) => {
        db.transaction(tx => {
            tx.executeSql(
                `UPDATE notes
                 SET title = ?, content = ?, address = ?, photoUri = ?
                 WHERE id = ?`,
                [
                    note.title,
                    note.content,
                    note.address || null,
                    note.photoUri || null,
                    note.id
                ],
                (_, result) => {
                    console.log('Note updated, rowsAffected:', result.rowsAffected);
                    resolve();
                },
                (_, error) => {
                    console.error('Update note error:', error);
                    reject(error);
                    return false;
                }
            );
        });
    });
};