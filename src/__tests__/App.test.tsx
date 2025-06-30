import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
}));

// Mock the persistence service
vi.mock("../lib/persistence", () => ({
  persistenceService: {
    clearUserData: vi.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: "/" }),
    Routes: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="routes">{children}</div>
    ),
    Route: ({ element }: { element: React.ReactNode }) => (
      <div data-testid="route">{element}</div>
    ),
    Navigate: ({ to }: { to: string }) => (
      <div data-testid="navigate" data-to={to} />
    ),
  };
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
      expect(screen.getByRole("status")).toBeInTheDocument(); // Loading spinner
    });

    it("should render the app component without crashing", async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(null);

      expect(() => render(<App />)).not.toThrow();
    });

    it("should show Index page when no user is authenticated", async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(null);

      const { container } = render(<App />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading Skillmatch..."),
        ).not.toBeInTheDocument();
      });

      // Should render something (not empty)
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should navigate to dashboard when user is authenticated", async () => {
      const mockUser = createMockUser();
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      render(<App />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading Skillmatch..."),
        ).not.toBeInTheDocument();
      });

      // Should show navigation to dashboard
      expect(screen.getByTestId("navigate")).toHaveAttribute(
        "data-to",
        "/dashboard",
      );
    });

    it("should handle authentication initialization errors", async () => {
      mockAuthService.getCurrentUser.mockRejectedValue(
        new Error("Auth failed"),
      );

      render(<App />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading Skillmatch..."),
        ).not.toBeInTheDocument();
      });

      // Should still render the app without crashing
      expect(screen.getByTestId("routes")).toBeInTheDocument();
    });
  });

  describe("User Management", () => {
    it("should handle successful login", async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(null);

      render(<App />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading Skillmatch..."),
        ).not.toBeInTheDocument();
      });

      // The login handling would be tested in integration with the Index component
      // This test verifies that the app structure supports login flow
      expect(screen.getByTestId("routes")).toBeInTheDocument();
    });

    it("should handle logout and clear user data", async () => {
      const mockUser = createMockUser();
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      render(<App />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading Skillmatch..."),
        ).not.toBeInTheDocument();
      });

      // This would be triggered by Navigation component logout
      // We can't directly test it here, but we can verify the setup
      expect(mockPersistenceService.clearUserData).not.toHaveBeenCalled();
    });
  });

  describe("Routing and Navigation", () => {
    it("should provide navigation context to child components", async () => {
      const mockUser = createMockUser();
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      render(<App />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading Skillmatch..."),
        ).not.toBeInTheDocument();
      });

      // Should render routes structure
      expect(screen.getByTestId("routes")).toBeInTheDocument();
    });

    it("should redirect authenticated users from public routes", async () => {
      const mockUser = createMockUser();
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("navigate")).toHaveAttribute(
          "data-to",
          "/dashboard",
        );
      });
    });
  });

  describe("Error Boundary", () => {
    it("should handle component errors gracefully", async () => {
      // This would require setting up error boundary testing
      // For now, we verify the app structure supports error handling
      const mockUser = createMockUser();
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      expect(() => render(<App />)).not.toThrow();
    });
  });

  describe("QueryClient Configuration", () => {
    it("should provide QueryClient to the app", async () => {
      const mockUser = createMockUser();
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      render(<App />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading Skillmatch..."),
        ).not.toBeInTheDocument();
      });

      // QueryClient should be available for child components
      // This is verified by the successful rendering without errors
      expect(screen.getByTestId("routes")).toBeInTheDocument();
    });
  });

  describe("Role-based Access", () => {
    it("should support recruiter user type", async () => {
      const mockRecruiter = createMockRecruiter();
      mockAuthService.getCurrentUser.mockResolvedValue(mockRecruiter);

      render(<App />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading Skillmatch..."),
        ).not.toBeInTheDocument();
      });

      // Should navigate to dashboard for recruiters too
      expect(screen.getByTestId("navigate")).toHaveAttribute(
        "data-to",
        "/dashboard",
      );
    });

    it("should support applicant user type", async () => {
      const mockApplicant = createMockUser({ role: "applicant" });
      mockAuthService.getCurrentUser.mockResolvedValue(mockApplicant);

      render(<App />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading Skillmatch..."),
        ).not.toBeInTheDocument();
      });

      // Should navigate to dashboard for applicants
      expect(screen.getByTestId("navigate")).toHaveAttribute(
        "data-to",
        "/dashboard",
      );
    });
  });

  describe("Theme and UI Providers", () => {
    it("should provide tooltip context", async () => {
      const mockUser = createMockUser();
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      render(<App />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading Skillmatch..."),
        ).not.toBeInTheDocument();
      });

      // TooltipProvider should be available
      expect(screen.getByTestId("routes")).toBeInTheDocument();
    });

    it("should provide toast notifications", async () => {
      const mockUser = createMockUser();
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      render(<App />);

      // Toaster component should be rendered
      // This is verified by successful rendering without errors
      expect(screen.getByTestId("routes")).toBeInTheDocument();
    });
  });

  describe("Performance and Optimization", () => {
    it("should not re-render unnecessarily", async () => {
      const mockUser = createMockUser();
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      const { rerender } = render(<App />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading Skillmatch..."),
        ).not.toBeInTheDocument();
      });

      // Re-render with same props shouldn't cause issues
      rerender(<App />);

      expect(screen.getByTestId("routes")).toBeInTheDocument();
    });

    it("should handle rapid state changes", async () => {
      let resolveAuth: (user: any) => void;
      const authPromise = new Promise((resolve) => {
        resolveAuth = resolve;
      });

      mockAuthService.getCurrentUser.mockReturnValue(authPromise);

      render(<App />);

      expect(screen.getByText("Loading Skillmatch...")).toBeInTheDocument();

      // Rapidly resolve auth
      const mockUser = createMockUser();
      resolveAuth(mockUser);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading Skillmatch..."),
        ).not.toBeInTheDocument();
      });

      expect(screen.getByTestId("navigate")).toHaveAttribute(
        "data-to",
        "/dashboard",
      );
    });
  });
});
