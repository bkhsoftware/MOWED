export default class IndexedDBAdapter {
  constructor(dbName = 'MOWED_DB', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject('Error opening database');
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        db.createObjectStore('moduleData', { keyPath: 'moduleName' });
        db.createObjectStore('offlineQueue', { keyPath: 'id', autoIncrement: true });
      };
    });
  }

  async saveData(moduleName, data) {
    return this._performTransaction('moduleData', 'readwrite', (store) => {
      store.put({ moduleName, data });
    });
  }

  async getData(moduleName) {
    return this._performTransaction('moduleData', 'readonly', (store) => {
      return store.get(moduleName);
    });
  }

  async addToOfflineQueue(action) {
    return this._performTransaction('offlineQueue', 'readwrite', (store) => {
      return store.add(action);
    });
  }

  async getOfflineQueue() {
    return this._performTransaction('offlineQueue', 'readonly', (store) => {
      return store.getAll();
    });
  }

  async clearOfflineQueue() {
    return this._performTransaction('offlineQueue', 'readwrite', (store) => {
      return store.clear();
    });
  }

  async _performTransaction(storeName, mode, callback) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);

      const request = callback(store);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}
