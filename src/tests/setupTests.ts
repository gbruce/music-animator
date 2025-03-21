// Mock localStorage
class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}

// Set up global mocks
global.localStorage = new LocalStorageMock() as unknown as Storage;

// Mock fetch API
global.fetch = jest.fn();

// Mock FormData
global.FormData = jest.fn().mockImplementation(() => ({
  append: jest.fn(),
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');

export {}; 