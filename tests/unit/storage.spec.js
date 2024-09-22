import { saveState, loadState } from '@/utils/storage';

describe('Storage utils', () => {
  const STORAGE_KEY = 'mowed_data';
  let mockLocalStorage;

  beforeEach(() => {
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
    };
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
    console.error = jest.fn();
  });

  describe('saveState', () => {
    test('saves state to localStorage', () => {
      const state = { test: 'data' };
      saveState(state);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(state));
    });

    test('logs error if saving fails', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Test error');
      });
      saveState({ test: 'data' });
      expect(console.error).toHaveBeenCalledWith('Could not save state', expect.any(Error));
    });
  });

  describe('loadState', () => {
    test('loads state from localStorage', () => {
      const state = { test: 'data' };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(state));
      const result = loadState();
      expect(result).toEqual(state);
    });

    test('returns undefined if no state in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const result = loadState();
      expect(result).toBeUndefined();
    });

    test('logs error and returns undefined if loading fails', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Test error');
      });
      const result = loadState();
      expect(console.error).toHaveBeenCalledWith('Could not load state', expect.any(Error));
      expect(result).toBeUndefined();
    });
  });
});
