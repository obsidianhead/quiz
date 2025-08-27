// Handles IndexedDB operations for storing and retrieving the SQLite database
const DB = {
    open: () => new Promise((resolve, reject) => {
        const request = indexedDB.open(QuizApp.dbName, 1);
        request.onupgradeneeded = event => {
            event.target.result.createObjectStore('SQLiteStore');
        };
        request.onsuccess = event => resolve(event.target.result);
        request.onerror = event => reject('Error opening IndexedDB:', event.target.errorCode);
    }),
    store: (arrayBuffer, dbName) => DB.open().then(db => new Promise((resolve, reject) => {
        const transaction = db.transaction(['SQLiteStore'], 'readwrite');
        const store = transaction.objectStore('SQLiteStore');
        store.put(arrayBuffer, dbName);
        transaction.oncomplete = () => resolve();
        transaction.onerror = event => reject('Error storing the database:', event.target.errorCode);
    })),
    fetch: dbName => DB.open().then(db => new Promise((resolve, reject) => {
        const transaction = db.transaction(['SQLiteStore'], 'readonly');
        const store = transaction.objectStore('SQLiteStore');
        const request = store.get(dbName);
        request.onsuccess = () => resolve(request.result);
        request.onerror = event => reject('Error fetching the database:', event.target.errorCode);
    }))
};
