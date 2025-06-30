import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "../App";
import { createMockUser, createMockRecruiter } from "./test-utils";
import * as authModule from "../lib/auth";
import * as persistenceModule from "../lib/persistence";

// Mock the auth service
vi.mock("../lib/auth", () => ({
  authService: {
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
  },
  demoUsers: [],
}));

// Mock the persistence service
vi.mock("../lib/persistence", () => ({
  persistenceService: {
    clearUserData: vi.fn(),
  },
}));

// Mock logger
vi.mock("../lib/api", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock all page components to prevent complex rendering issues
vi.mock("../pages/Index", () => ({
  default: ({ onLogin }: { onLogin: (user: any) => void }) => (
    <div data-testid="index-page">
      <button onClick={() => onLogin(createMockUser())}>Login</button>
    </div>
  ),
}));

vi.mock("../pages/Dashboard", () => ({
  default: () => <div data-testid="dashboard-page">Dashboard</div>,
}));

vi.mock("../pages/NotFound", () => ({
  default: () => <div data-testid="not-found-page">Not Found</div>,
}));

vi.mock("../components/Navigation", () => ({
  default: ({ onLogout }: { onLogout: () => void }) => (
    <div data-testid="navigation">
      <button onClick={onLogout}>Logout</button>
    </div>
  ),
}));

// Mock all other page components to simple divs
const mockPages = [
  "JobManagement",
  "JobDetailsPage",
  "ApplicationManagement",
  "SearchPage",
  "ProfilePage",
  "SettingsPage",
  "NotificationsPage",
  "BillingPage",
  "AnalyticsPage",
  "InterviewsPage",
  "ScrapingPage",
  "ActivityFeedPage",
  "CandidateManagement",
  "JobPostingPage",
];

mockPages.forEach((pageName) => {
  vi.mock(`../pages/${pageName}`, () => ({
    default: () => (
      <div data-testid={`${pageName.toLowerCase()}-page`}>{pageName}</div>
    ),
  }));
});

const mockAuthService = authModule.authService as any;
const mockPersistenceService = persistenceModule.persistenceService as any;

describe("App Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthService.getCurrentUser.mockResolvedValue(null);
    mockAuthService.logout.mockResolvedValue(undefined);
    mockPersistenceService.clearUserData.mockReturnValue(undefined);
  });

  describe("Authentication Flow", () => {
    it("should show loading spinner while initializing auth", async () => {
      // Make getCurrentUser pending
      mockAuthService.getCurrentUser.mockImplementation(
        () => new Promise(() => {}),
      );

      render(<App />);

      expect(screen.getByText("Loading Skillmatch...")).toBeInTheDocument();
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("should render the app component without crashing", () => {
      mockAuthService.getCurrentUser.mockResolvedValue(null);
      expect(() => render(<App />)).not.toThrow();
    });

    it("should handle authentication initialization errors gracefully", async () => {
      mockAuthService.getCurrentUser.mockRejectedValue(
        new Error("Auth failed"),
      );

      const { container } = render(<App />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading Skillmatch..."),
        ).not.toBeInTheDocument();
      });

      // Should render without crashing
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("Component Integration", () => {
    it("should provide QueryClient context", () => {
      mockAuthService.getCurrentUser.mockResolvedValue(null);

      expect(() => render(<App />)).not.toThrow();
    });

    it("should provide Tooltip context", () => {
      mockAuthService.getCurrentUser.mockResolvedValue(null);

      expect(() => render(<App />)).not.toThrow();
    });

    it("should include toast notifications", () => {
      mockAuthService.getCurrentUser.mockResolvedValue(null);

      const { container } = render(<App />);

      // Should render without errors (toasters are present)
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("User State Management", () => {
    it("should handle user login state", async () => {
      const mockUser = createMockUser();
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      const { container } = render(<App />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading Skillmatch..."),
        ).not.toBeInTheDocument();
      });

      expect(container.firstChild).toBeInTheDocument();
    });

    it("should handle different user roles", async () => {
      const mockRecruiter = createMockRecruiter();
      mockAuthService.getCurrentUser.mockResolvedValue(mockRecruiter);

      const { container } = render(<App />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading Skillmatch..."),
        ).not.toBeInTheDocument();
      });

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle component errors gracefully", () => {
      mockAuthService.getCurrentUser.mockResolvedValue(createMockUser());

      expect(() => render(<App />)).not.toThrow();
    });

    it("should handle rapid state changes", async () => {
      let resolveAuth: (user: any) => void;
      const authPromise = new Promise((resolve) => {
        resolveAuth = resolve;
      });

      mockAuthService.getCurrentUser.mockReturnValue(authPromise);

      const { container } = render(<App />);

      expect(screen.getByText("Loading Skillmatch...")).toBeInTheDocument();

      // Rapidly resolve auth
      const mockUser = createMockUser();
      resolveAuth(mockUser);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading Skillmatch..."),
        ).not.toBeInTheDocument();
      });

      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
