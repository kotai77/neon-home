import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Navigation from "../Navigation";
import { createMockUser } from "../../__tests__/test-utils";

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockLocation = { pathname: "/dashboard" };

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

// Mock hooks
const mockSetTheme = vi.fn();
vi.mock("../../hooks/use-theme", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: mockSetTheme,
  }),
}));

// Mock toast
const mockToast = vi.fn();
vi.mock("../../hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

describe("Navigation Component", () => {
  const mockUser = createMockUser();
  const mockSetUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.pathname = "/dashboard";
  });

  describe("Rendering and Layout", () => {
    it("should render navigation header", () => {
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      expect(screen.getByRole("navigation")).toBeInTheDocument();
      expect(screen.getByText(/fusion/i)).toBeInTheDocument();
    });

    it("should display user avatar and name", () => {
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      expect(screen.getByRole("img", { name: /avatar/i })).toBeInTheDocument();
      expect(screen.getByText(/test user/i)).toBeInTheDocument();
    });

    it("should render main navigation links", () => {
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      expect(
        screen.getByRole("link", { name: /dashboard/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /search/i })).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /job management/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /applications/i }),
      ).toBeInTheDocument();
    });

    it("should show mobile menu toggle on small screens", () => {
      // Mock mobile viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      expect(
        screen.getByRole("button", { name: /toggle menu/i }),
      ).toBeInTheDocument();
    });

    it("should highlight active navigation item", () => {
      mockLocation.pathname = "/search";

      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      const searchLink = screen.getByRole("link", { name: /search/i });
      expect(searchLink).toHaveClass("active");
    });
  });

  describe("Navigation Links", () => {
    it("should render all primary navigation items", () => {
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      const expectedLinks = [
        "Dashboard",
        "Search",
        "Job Management",
        "Applications",
        "Analytics",
        "Interviews",
        "Candidates",
        "Settings",
      ];

      expectedLinks.forEach((linkText) => {
        expect(
          screen.getByRole("link", { name: new RegExp(linkText, "i") }),
        ).toBeInTheDocument();
      });
    });

    it("should handle navigation clicks", async () => {
      const user = userEvent.setup();
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      const searchLink = screen.getByRole("link", { name: /search/i });
      await user.click(searchLink);

      expect(searchLink.getAttribute("href")).toBe("/search");
    });

    it("should show correct icons for navigation items", () => {
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      expect(screen.getByTestId("dashboard-icon")).toBeInTheDocument();
      expect(screen.getByTestId("search-icon")).toBeInTheDocument();
      expect(screen.getByTestId("briefcase-icon")).toBeInTheDocument();
      expect(screen.getByTestId("users-icon")).toBeInTheDocument();
    });

    it("should show navigation labels", () => {
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/search/i)).toBeInTheDocument();
      expect(screen.getByText(/job management/i)).toBeInTheDocument();
      expect(screen.getByText(/applications/i)).toBeInTheDocument();
    });
  });

  describe("User Menu", () => {
    it("should open user menu on avatar click", async () => {
      const user = userEvent.setup();
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      const avatarButton = screen.getByRole("button", { name: /user menu/i });
      await user.click(avatarButton);

      expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    it("should display user information in menu", async () => {
      const user = userEvent.setup();
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      const avatarButton = screen.getByRole("button", { name: /user menu/i });
      await user.click(avatarButton);

      expect(screen.getByText(/test user/i)).toBeInTheDocument();
      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
      expect(screen.getByText(/recruiter/i)).toBeInTheDocument();
    });

    it("should show user menu options", async () => {
      const user = userEvent.setup();
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      const avatarButton = screen.getByRole("button", { name: /user menu/i });
      await user.click(avatarButton);

      expect(
        screen.getByRole("menuitem", { name: /profile/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitem", { name: /settings/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitem", { name: /billing/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitem", { name: /help/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitem", { name: /sign out/i }),
      ).toBeInTheDocument();
    });

    it("should handle profile navigation", async () => {
      const user = userEvent.setup();
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      const avatarButton = screen.getByRole("button", { name: /user menu/i });
      await user.click(avatarButton);

      const profileItem = screen.getByRole("menuitem", { name: /profile/i });
      await user.click(profileItem);

      expect(mockNavigate).toHaveBeenCalledWith("/profile");
    });

    it("should handle settings navigation", async () => {
      const user = userEvent.setup();
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      const avatarButton = screen.getByRole("button", { name: /user menu/i });
      await user.click(avatarButton);

      const settingsItem = screen.getByRole("menuitem", { name: /settings/i });
      await user.click(settingsItem);

      expect(mockNavigate).toHaveBeenCalledWith("/settings");
    });

    it("should handle sign out", async () => {
      const user = userEvent.setup();
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      const avatarButton = screen.getByRole("button", { name: /user menu/i });
      await user.click(avatarButton);

      const signOutItem = screen.getByRole("menuitem", { name: /sign out/i });
      await user.click(signOutItem);

      expect(mockSetUser).toHaveBeenCalledWith(null);
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  describe("Notifications", () => {
    it("should display notifications button", () => {
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      expect(
        screen.getByRole("button", { name: /notifications/i }),
      ).toBeInTheDocument();
    });

    it("should show notification count badge", () => {
      const userWithNotifications = {
        ...mockUser,
        unreadNotifications: 3,
      };

      render(<Navigation user={userWithNotifications} setUser={mockSetUser} />);

      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("should open notifications dropdown", async () => {
      const user = userEvent.setup();
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      const notificationsButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      await user.click(notificationsButton);

      expect(
        screen.getByRole("menu", { name: /notifications/i }),
      ).toBeInTheDocument();
    });

    it("should handle mark all as read", async () => {
      const user = userEvent.setup();
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      const notificationsButton = screen.getByRole("button", {
        name: /notifications/i,
      });
      await user.click(notificationsButton);

      const markAllButton = screen.getByRole("button", {
        name: /mark all as read/i,
      });
      await user.click(markAllButton);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "All notifications marked as read",
        }),
      );
    });
  });

  describe("Theme Toggle", () => {
    it("should display theme toggle button", () => {
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      expect(
        screen.getByRole("button", { name: /toggle theme/i }),
      ).toBeInTheDocument();
    });

    it("should handle theme toggle", async () => {
      const user = userEvent.setup();
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      const themeButton = screen.getByRole("button", { name: /toggle theme/i });
      await user.click(themeButton);

      expect(mockSetTheme).toHaveBeenCalledWith("dark");
    });

    it("should show correct theme icon", () => {
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      expect(screen.getByTestId("sun-icon")).toBeInTheDocument();
    });

    it("should toggle to moon icon in dark mode", () => {
      vi.mocked(require("../../hooks/use-theme").useTheme).mockReturnValue({
        theme: "dark",
        setTheme: mockSetTheme,
      });

      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      expect(screen.getByTestId("moon-icon")).toBeInTheDocument();
    });
  });

  describe("Mobile Navigation", () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });
    });

    it("should toggle mobile menu", async () => {
      const user = userEvent.setup();
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      const menuToggle = screen.getByRole("button", { name: /toggle menu/i });
      await user.click(menuToggle);

      expect(screen.getByRole("navigation")).toHaveClass("mobile-open");
    });

    it("should close mobile menu on link click", async () => {
      const user = userEvent.setup();
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      const menuToggle = screen.getByRole("button", { name: /toggle menu/i });
      await user.click(menuToggle);

      const searchLink = screen.getByRole("link", { name: /search/i });
      await user.click(searchLink);

      expect(screen.getByRole("navigation")).not.toHaveClass("mobile-open");
    });

    it("should close mobile menu on outside click", async () => {
      const user = userEvent.setup();
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      const menuToggle = screen.getByRole("button", { name: /toggle menu/i });
      await user.click(menuToggle);

      // Click outside the navigation
      await user.click(document.body);

      expect(screen.getByRole("navigation")).not.toHaveClass("mobile-open");
    });
  });

  describe("Search", () => {
    it("should display search input", () => {
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      expect(
        screen.getByPlaceholderText(/search jobs, candidates/i),
      ).toBeInTheDocument();
    });

    it("should handle search input", async () => {
      const user = userEvent.setup();
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      const searchInput = screen.getByPlaceholderText(
        /search jobs, candidates/i,
      );
      await user.type(searchInput, "frontend developer");

      expect(searchInput).toHaveValue("frontend developer");
    });

    it("should handle search submission", async () => {
      const user = userEvent.setup();
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      const searchInput = screen.getByPlaceholderText(
        /search jobs, candidates/i,
      );
      await user.type(searchInput, "frontend developer");
      await user.keyboard("{Enter}");

      expect(mockNavigate).toHaveBeenCalledWith("/search", {
        state: { query: "frontend developer" },
      });
    });

    it("should show search suggestions", async () => {
      const user = userEvent.setup();
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      const searchInput = screen.getByPlaceholderText(
        /search jobs, candidates/i,
      );
      await user.type(searchInput, "dev");

      await waitFor(() => {
        expect(screen.getByText(/developer/i)).toBeInTheDocument();
        expect(screen.getByText(/devops/i)).toBeInTheDocument();
      });
    });
  });

  describe("Breadcrumbs", () => {
    it("should display breadcrumbs for nested pages", () => {
      mockLocation.pathname = "/job-management/create";

      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      expect(
        screen.getByRole("navigation", { name: /breadcrumb/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(/job management/i)).toBeInTheDocument();
      expect(screen.getByText(/create/i)).toBeInTheDocument();
    });

    it("should handle breadcrumb navigation", async () => {
      const user = userEvent.setup();
      mockLocation.pathname = "/job-management/create";

      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      const jobManagementLink = screen.getByRole("link", {
        name: /job management/i,
      });
      await user.click(jobManagementLink);

      expect(jobManagementLink.getAttribute("href")).toBe("/job-management");
    });
  });

  describe("Help and Support", () => {
    it("should display help button", () => {
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      expect(screen.getByRole("button", { name: /help/i })).toBeInTheDocument();
    });

    it("should open help modal", async () => {
      const user = userEvent.setup();
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      const helpButton = screen.getByRole("button", { name: /help/i });
      await user.click(helpButton);

      expect(
        screen.getByRole("dialog", { name: /help & support/i }),
      ).toBeInTheDocument();
    });

    it("should show keyboard shortcuts", async () => {
      const user = userEvent.setup();
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      // Press ? key to open shortcuts
      await user.keyboard("?");

      expect(
        screen.getByRole("dialog", { name: /keyboard shortcuts/i }),
      ).toBeInTheDocument();
    });
  });

  describe("User Role Permissions", () => {
    it("should show admin-only links for admin users", () => {
      const adminUser = { ...mockUser, role: "admin" };
      render(<Navigation user={adminUser} setUser={mockSetUser} />);

      expect(
        screen.getByRole("link", { name: /admin panel/i }),
      ).toBeInTheDocument();
    });

    it("should hide admin links for non-admin users", () => {
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      expect(
        screen.queryByRole("link", { name: /admin panel/i }),
      ).not.toBeInTheDocument();
    });

    it("should show limited navigation for applicant users", () => {
      const applicantUser = { ...mockUser, role: "applicant" };
      render(<Navigation user={applicantUser} setUser={mockSetUser} />);

      expect(
        screen.queryByRole("link", { name: /job management/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /my applications/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      expect(screen.getByRole("navigation")).toHaveAttribute(
        "aria-label",
        "Main navigation",
      );
      expect(screen.getByRole("menu")).toHaveAttribute(
        "aria-label",
        "User menu",
      );
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      // Tab through navigation items
      await user.tab();
      expect(document.activeElement).toHaveAttribute("role", "link");

      // Arrow key navigation
      await user.keyboard("{ArrowDown}");
      expect(document.activeElement).toHaveAttribute("role", "link");
    });

    it("should have proper focus management", async () => {
      const user = userEvent.setup();
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      const avatarButton = screen.getByRole("button", { name: /user menu/i });
      await user.click(avatarButton);

      // Focus should be on first menu item
      expect(document.activeElement).toHaveAttribute("role", "menuitem");
    });

    it("should handle escape key to close menus", async () => {
      const user = userEvent.setup();
      render(<Navigation user={mockUser} setUser={mockSetUser} />);

      const avatarButton = screen.getByRole("button", { name: /user menu/i });
      await user.click(avatarButton);

      await user.keyboard("{Escape}");

      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("should not re-render unnecessarily", () => {
      const { rerender } = render(
        <Navigation user={mockUser} setUser={mockSetUser} />,
      );

      const renderCount = vi.fn();
      const WrappedNavigation = () => {
        renderCount();
        return <Navigation user={mockUser} setUser={mockSetUser} />;
      };

      rerender(<WrappedNavigation />);
      rerender(<WrappedNavigation />);

      expect(renderCount).toHaveBeenCalledTimes(2);
    });

    it("should handle memory cleanup", () => {
      const { unmount } = render(
        <Navigation user={mockUser} setUser={mockSetUser} />,
      );

      expect(() => unmount()).not.toThrow();
    });
  });
});
