import "@testing-library/jest-dom";
import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock localStorage
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock sessionStorage
Object.defineProperty(window, "sessionStorage", {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => "mocked-url");
global.URL.revokeObjectURL = vi.fn();

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = vi.fn();

// Mock pointer capture methods for Radix UI
if (typeof Element !== "undefined") {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
}

// Mock scroll methods
global.scrollTo = vi.fn();
Element.prototype.scrollIntoView = vi.fn();

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 0);
  return 1;
});
global.cancelAnimationFrame = vi.fn();

// Mock getComputedStyle
global.getComputedStyle = vi.fn().mockImplementation(() => ({
  getPropertyValue: vi.fn(() => ""),
  fontSize: "16px",
  fontFamily: "Arial",
}));

// Mock crypto
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: vi.fn(() => "mock-uuid-" + Math.random()),
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

// Mock environment variables for AI services and other APIs
Object.defineProperty(process, "env", {
  value: {
    ...process.env,
    VITE_OPENAI_API_KEY: "mock-openai-key",
    VITE_ANTHROPIC_API_KEY: "mock-anthropic-key",
    VITE_SUPABASE_URL: "https://mock-supabase.com",
    VITE_SUPABASE_ANON_KEY: "mock-supabase-key",
    NODE_ENV: "test",
  },
});

// Mock global fetch
global.fetch = vi.fn().mockImplementation((url) => {
  const urlStr = typeof url === "string" ? url : url.toString();

  // Return appropriate mock responses based on the URL
  if (urlStr.includes("/api/notifications")) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            notifications: [],
            unreadCount: 0,
          },
        }),
      text: () => Promise.resolve(""),
      headers: new Headers(),
      clone: () => ({}),
    });
  }

  // Default response for other API calls
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true, data: {} }),
    text: () => Promise.resolve(""),
    headers: new Headers(),
    clone: () => ({}),
  });
});

// Suppress console warnings in tests
const originalWarn = console.warn;
const originalError = console.error;
const originalLog = console.log;

console.log = (...args: any[]) => {
  // Suppress HTML dumps and debug output in tests
  if (
    typeof args[0] === "string" &&
    (args[0].includes("<button") ||
      args[0].includes("<div") ||
      args[0].includes("aria-") ||
      args[0].includes("class=") ||
      args[0].includes("role=") ||
      args[0].includes("--------------------------------------------------") ||
      args[0].includes("Ignored nodes:"))
  ) {
    return;
  }
  originalLog.call(console, ...args);
};

console.warn = (...args: any[]) => {
  if (
    typeof args[0] === "string" &&
    (args[0].includes("Warning: ReactDOM.render") ||
      args[0].includes("Warning: `ReactDOMTestUtils.act`") ||
      args[0].includes("hasPointerCapture") ||
      args[0].includes("setPointerCapture") ||
      args[0].includes("Expected") ||
      args[0].includes("Received"))
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};

console.error = (...args: any[]) => {
  if (
    typeof args[0] === "string" &&
    (args[0].includes("Warning: ReactDOM.render") ||
      args[0].includes("Warning: `ReactDOMTestUtils.act`") ||
      args[0].includes("hasPointerCapture") ||
      args[0].includes("setPointerCapture") ||
      args[0].includes("target.hasPointerCapture is not a function") ||
      args[0].includes("Expected") ||
      args[0].includes("Received"))
  ) {
    return;
  }
  originalError.call(console, ...args);
};
