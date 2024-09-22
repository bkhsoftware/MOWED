import IndexedDBAdapter from '@/utils/indexedDBAdapter';

describe('IndexedDBAdapter', () => {
  let adapter;
  let mockIndexedDB;

  beforeEach(() => {
    mockIndexedDB = {
      open: jest.fn(),
      transaction: jest.fn(),
      objectStore: jest.fn(),
      put: jest.fn(),
      get: jest.fn(),
      add: jest.fn(),
      getAll: jest.fn(),
      clear: jest.fn()
    };

    global.indexedDB = {
      open: mockIndexedDB.open
    };

    adapter = new IndexedDBAdapter('test_db', 1);
    adapter.db = mockIndexedDB;
  });

  test('init creates object stores', async () => {
    const mockEvent = {
      target: {
        result: {
          createObjectStore: jest.fn()
        }
      }
    };

    mockIndexedDB.open.mockImplementation((dbName, version) => {
      setTimeout(() => mockIndexedDB.open.mock.calls[0][2](mockEvent));
      return {
        onupgradeneeded: (callback) => callback(mockEvent)
      };
    });

    await adapter.init();

    expect(mockEvent.target.result.createObjectStore).toHaveBeenCalledWith('moduleData', { keyPath: 'moduleName' });
    expect(mockEvent.target.result.createObjectStore).toHaveBeenCalledWith('offlineQueue', { keyPath: 'id', autoIncrement: true });
  });

  test('saveData calls put on the moduleData store', async () => {
    await adapter.saveData('testModule', { data: 'test' });
    expect(mockIndexedDB.put).toHaveBeenCalledWith({ moduleName: 'testModule', data: { data: 'test' } });
  });

  test('getData calls get on the moduleData store', async () => {
    await adapter.getData('testModule');
    expect(mockIndexedDB.get).toHaveBeenCalledWith('testModule');
  });

  test('addToOfflineQueue calls add on the offlineQueue store', async () => {
    await adapter.addToOfflineQueue({ type: 'testAction' });
    expect(mockIndexedDB.add).toHaveBeenCalledWith({ type: 'testAction' });
  });

  test('getOfflineQueue calls getAll on the offlineQueue store', async () => {
    await adapter.getOfflineQueue();
    expect(mockIndexedDB.getAll).toHaveBeenCalled();
  });

  test('clearOfflineQueue calls clear on the offlineQueue store', async () => {
    await adapter.clearOfflineQueue();
    expect(mockIndexedDB.clear).toHaveBeenCalled();
  });
});
