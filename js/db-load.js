// Handles loading and initializing the SQLite database
function loadDatabase(dbName) {
    if (QuizApp.forceDBDownload) {
        console.log(`Forcing new download of ${dbName} from ${QuizApp.dbBaseUrl}...`);
        fetchDatabaseFromServer(dbName, QuizApp.dbBaseUrl);
    } else {
        DB.fetch(dbName).then(dbData => {
            if (dbData) {
                console.log(`${dbName} loaded from IndexedDB`);
                initializeDatabase(new Uint8Array(dbData));
            } else {
                console.log(`${dbName} not found in IndexedDB, fetching from ${QuizApp.dbBaseUrl}...`);
                fetchDatabaseFromServer(dbName, QuizApp.dbBaseUrl);
            }
        }).catch(error => {
            console.error('Error fetching database from IndexedDB:', error);
            fetchDatabaseFromServer(dbName, QuizApp.dbBaseUrl);
        });
    }
}

function fetchDatabaseFromServer(dbName, baseUrl) {
    const dbPath = `${baseUrl}/${dbName}`;
    fetch(dbPath)
        .then(response => {
            if (!response.ok) throw new Error(`Failed to load ${dbName} from ${response.statusText}`);
            return response.arrayBuffer();
        })
        .then(data => {
            DB.store(data, dbName);
            initializeDatabase(new Uint8Array(data));
        })
        .catch(error => {
            console.error(`Failed to load ${dbName} from ${baseUrl}:`, error);
        });
}

function initializeDatabase(data) {
    window.initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.1/sql-wasm.wasm`
    }).then(SQL => {
        QuizApp.db = new SQL.Database(data);
        console.log('SQLite database initialized');
        fetchCourses();
    });
    if (typeof window !== "undefined") {
        window.loadDatabase = loadDatabase;
        window.fetchDatabaseFromServer = fetchDatabaseFromServer;
        window.initializeDatabase = initializeDatabase;
    }
}

if (typeof document !== "undefined") {
    document.addEventListener('DOMContentLoaded', () => {
        loadDatabase(QuizApp.dbFileName);
    });
}


