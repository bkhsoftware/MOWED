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

  test('saveData calls put on the moduleData store with serialized data', async () => {
    const testData = { data: 'test' };
    serialize.mockReturnValue(JSON.stringify(testData));
    await adapter.saveData('testModule', testData);
    expect(mockIndexedDB.put).toHaveBeenCalledWith({ moduleName: 'testModule', data: JSON.stringify(testData) });
  });

  test('getData calls get on the moduleData store and deserializes the result', async () => {
    const serializedData = JSON.stringify({ data: 'test' });
    const deserializedData = { data: 'test' };
    mockIndexedDB.get.mockResolvedValue({ data: serializedData });
    deserialize.mockReturnValue(deserializedData);
    
    const result = await adapter.getData('testModule');
    expect(mockIndexedDB.get).toHaveBeenCalledWith('testModule');
    expect(deserialize).toHaveBeenCalledWith(serializedData);
    expect(result).toEqual(deserializedData);
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
