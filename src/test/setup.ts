import '@testing-library/jest-dom';

// Mock window.ethereum
Object.defineProperty(window, 'ethereum', {
  value: {
    request: async () => {},
    on: () => {},
    removeListener: () => {},
  },
});