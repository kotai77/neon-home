import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage from "../SettingsPage";
import { createMockUser } from "../../__tests__/test-utils";

// Mock the persistent state hooks
const mockSetSettings = vi.fn();

vi.mock("../../hooks/usePersistentState", () => ({
  usePersistentSettings: vi.fn(() => [
    {
      theme: "light",
      language: "en",
      timezone: "Europe/Amsterdam",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
      currency: "EUR",
      notifications: {
        email: true,
        push: false,
        marketing: false,
        jobAlerts: true,
        applicationUpdates: true,
        weeklyDigest: true,
        soundEnabled: false,
      },
      privacy: {
        showProfile: true,
        showActivity: false,
        allowMessaging: true,
        showEmail: false,
      },
      dashboard: {
        defaultView: "overview",
        itemsPerPage: 10,
        showMetrics: true,
        compactMode: false,
      },
      search: {
        saveHistory: true,
        defaultSort: "relevance",
        autoComplete: true,
        showSalary: true,
      },
    },
    mockSetSettings,
    true,
  ]),
}));

// Mock toast
const mockToast = vi.fn();
vi.mock("../../hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

describe("SettingsPage Component", () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering and Layout", () => {
    it("should render settings page header correctly", () => {
      render(<SettingsPage user={mockUser} />);

      expect(
        screen.getByRole("heading", { name: /settings/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/customize your experience and preferences/i),
      ).toBeInTheDocument();
    });

    it("should render tab navigation", () => {
      render(<SettingsPage user={mockUser} />);

      expect(screen.getByRole("tab", { name: /general/i })).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /notifications/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /privacy/i })).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /dashboard/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /search/i })).toBeInTheDocument();
    });

    it("should show loading state when data is not loaded", () => {
      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentSettings,
      ).mockReturnValue([{}, vi.fn(), false]);

      render(<SettingsPage user={mockUser} />);

      expect(screen.getByText(/loading settings/i)).toBeInTheDocument();
    });
  });

  describe("General Tab", () => {
    it("should display general settings", () => {
      render(<SettingsPage user={mockUser} />);

      expect(screen.getByText(/appearance/i)).toBeInTheDocument();
      expect(screen.getByText(/language & region/i)).toBeInTheDocument();
      expect(screen.getByText(/date & time/i)).toBeInTheDocument();
    });

    it("should show theme selection", () => {
      render(<SettingsPage user={mockUser} />);

      expect(
        screen.getByRole("button", { name: /light/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /dark/i })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /system/i }),
      ).toBeInTheDocument();
    });

    it("should handle theme change", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      const darkThemeButton = screen.getByRole("button", { name: /dark/i });
      await user.click(darkThemeButton);

      expect(mockSetSettings).toHaveBeenCalledWith(expect.any(Function));
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Settings Updated",
        }),
      );
    });

    it("should show language selection", () => {
      render(<SettingsPage user={mockUser} />);

      const languageSelect = screen.getByRole("combobox", {
        name: /language/i,
      });
      expect(languageSelect).toBeInTheDocument();
    });

    it("should handle language change", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      const languageSelect = screen.getByRole("combobox", {
        name: /language/i,
      });
      await user.click(languageSelect);
      await user.click(screen.getByText(/dutch/i));

      expect(mockSetSettings).toHaveBeenCalled();
    });

    it("should show timezone selection", () => {
      render(<SettingsPage user={mockUser} />);

      const timezoneSelect = screen.getByRole("combobox", {
        name: /timezone/i,
      });
      expect(timezoneSelect).toBeInTheDocument();
    });

    it("should handle timezone change", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      const timezoneSelect = screen.getByRole("combobox", {
        name: /timezone/i,
      });
      await user.click(timezoneSelect);
      await user.click(screen.getByText(/new york/i));

      expect(mockSetSettings).toHaveBeenCalled();
    });

    it("should show date format options", () => {
      render(<SettingsPage user={mockUser} />);

      expect(screen.getByText(/date format/i)).toBeInTheDocument();
      expect(screen.getByText(/time format/i)).toBeInTheDocument();
    });

    it("should handle date format change", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      const dateFormatSelect = screen.getByRole("combobox", {
        name: /date format/i,
      });
      await user.click(dateFormatSelect);
      await user.click(screen.getByText(/dd\/mm\/yyyy/i));

      expect(mockSetSettings).toHaveBeenCalled();
    });

    it("should show currency selection", () => {
      render(<SettingsPage user={mockUser} />);

      const currencySelect = screen.getByRole("combobox", {
        name: /currency/i,
      });
      expect(currencySelect).toBeInTheDocument();
    });
  });

  describe("Notifications Tab", () => {
    it("should display notification settings", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      const notificationsTab = screen.getByRole("tab", {
        name: /notifications/i,
      });
      await user.click(notificationsTab);

      expect(screen.getByText(/email notifications/i)).toBeInTheDocument();
      expect(screen.getByText(/push notifications/i)).toBeInTheDocument();
      expect(screen.getByText(/job alerts/i)).toBeInTheDocument();
      expect(screen.getByText(/application updates/i)).toBeInTheDocument();
    });

    it("should show notification toggles", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      const notificationsTab = screen.getByRole("tab", {
        name: /notifications/i,
      });
      await user.click(notificationsTab);

      const emailSwitch = screen.getByRole("switch", {
        name: /email notifications/i,
      });
      const pushSwitch = screen.getByRole("switch", {
        name: /push notifications/i,
      });

      expect(emailSwitch).toBeInTheDocument();
      expect(pushSwitch).toBeInTheDocument();
    });

    it("should handle notification toggle changes", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      const notificationsTab = screen.getByRole("tab", {
        name: /notifications/i,
      });
      await user.click(notificationsTab);

      const emailSwitch = screen.getByRole("switch", {
        name: /email notifications/i,
      });
      await user.click(emailSwitch);

      expect(mockSetSettings).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Notification Settings Updated",
        }),
      );
    });

    it("should show specific notification types", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      const notificationsTab = screen.getByRole("tab", {
        name: /notifications/i,
      });
      await user.click(notificationsTab);

      expect(screen.getByText(/job alerts/i)).toBeInTheDocument();
      expect(screen.getByText(/application updates/i)).toBeInTheDocument();
      expect(screen.getByText(/weekly digest/i)).toBeInTheDocument();
      expect(screen.getByText(/marketing emails/i)).toBeInTheDocument();
    });

    it("should handle sound preferences", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      const notificationsTab = screen.getByRole("tab", {
        name: /notifications/i,
      });
      await user.click(notificationsTab);

      const soundSwitch = screen.getByRole("switch", {
        name: /sound enabled/i,
      });
      await user.click(soundSwitch);

      expect(mockSetSettings).toHaveBeenCalled();
    });
  });

  describe("Privacy Tab", () => {
    it("should display privacy settings", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      const privacyTab = screen.getByRole("tab", { name: /privacy/i });
      await user.click(privacyTab);

      expect(screen.getByText(/profile visibility/i)).toBeInTheDocument();
      expect(screen.getByText(/contact preferences/i)).toBeInTheDocument();
      expect(screen.getByText(/data & analytics/i)).toBeInTheDocument();
    });

    it("should show profile visibility options", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      const privacyTab = screen.getByRole("tab", { name: /privacy/i });
      await user.click(privacyTab);

      const showProfileSwitch = screen.getByRole("switch", {
        name: /show profile/i,
      });
      const showActivitySwitch = screen.getByRole("switch", {
        name: /show activity/i,
      });

      expect(showProfileSwitch).toBeInTheDocument();
      expect(showActivitySwitch).toBeInTheDocument();
    });

    it("should handle privacy setting changes", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      const privacyTab = screen.getByRole("tab", { name: /privacy/i });
      await user.click(privacyTab);

      const showProfileSwitch = screen.getByRole("switch", {
        name: /show profile/i,
      });
      await user.click(showProfileSwitch);

      expect(mockSetSettings).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Privacy Settings Updated",
        }),
      );
    });

    it("should show contact preferences", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      const privacyTab = screen.getByRole("tab", { name: /privacy/i });
      await user.click(privacyTab);

      expect(screen.getByText(/allow messaging/i)).toBeInTheDocument();
      expect(screen.getByText(/show email/i)).toBeInTheDocument();
    });

    it("should show data export and deletion options", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      const privacyTab = screen.getByRole("tab", { name: /privacy/i });
      await user.click(privacyTab);

      expect(
        screen.getByRole("button", { name: /export data/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /delete account/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Dashboard Tab", () => {
    it("should display dashboard settings", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      const dashboardTab = screen.getByRole("tab", { name: /dashboard/i });
      await user.click(dashboardTab);

      expect(screen.getByText(/default view/i)).toBeInTheDocument();
      expect(screen.getByText(/display options/i)).toBeInTheDocument();
      expect(screen.getByText(/layout preferences/i)).toBeInTheDocument();
    });

    it("should show default view selection", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      const dashboardTab = screen.getByRole("tab", { name: /dashboard/i });
      await user.click(dashboardTab);

      const defaultViewSelect = screen.getByRole("combobox", {
        name: /default view/i,
      });
      expect(defaultViewSelect).toBeInTheDocument();
    });

    it("should handle default view change", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      const dashboardTab = screen.getByRole("tab", { name: /dashboard/i });
      await user.click(dashboardTab);

      const defaultViewSelect = screen.getByRole("combobox", {
        name: /default view/i,
      });
      await user.click(defaultViewSelect);
      await user.click(screen.getByText(/analytics/i));

      expect(mockSetSettings).toHaveBeenCalled();
    });

    it("should show items per page setting", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      const dashboardTab = screen.getByRole("tab", { name: /dashboard/i });
      await user.click(dashboardTab);

      const itemsPerPageSelect = screen.getByRole("combobox", {
        name: /items per page/i,
      });
      expect(itemsPerPageSelect).toBeInTheDocument();
    });

    it("should show display toggles", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      const dashboardTab = screen.getByRole("tab", { name: /dashboard/i });
      await user.click(dashboardTab);

      const showMetricsSwitch = screen.getByRole("switch", {
        name: /show metrics/i,
      });
      const compactModeSwitch = screen.getByRole("switch", {
        name: /compact mode/i,
      });

      expect(showMetricsSwitch).toBeInTheDocument();
      expect(compactModeSwitch).toBeInTheDocument();
    });

    it("should handle display setting changes", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      const dashboardTab = screen.getByRole("tab", { name: /dashboard/i });
      await user.click(dashboardTab);

      const compactModeSwitch = screen.getByRole("switch", {
        name: /compact mode/i,
      });
      await user.click(compactModeSwitch);

      expect(mockSetSettings).toHaveBeenCalled();
    });
  });

  describe("Search Tab", () => {
    it("should display search settings", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      const searchTab = screen.getByRole("tab", { name: /search/i });
      await user.click(searchTab);

      expect(screen.getByText(/search behavior/i)).toBeInTheDocument();
      expect(screen.getByText(/default sorting/i)).toBeInTheDocument();
      expect(screen.getByText(/display preferences/i)).toBeInTheDocument();
    });

    it("should show search history setting", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      const searchTab = screen.getByRole("tab", { name: /search/i });
      await user.click(searchTab);

      const saveHistorySwitch = screen.getByRole("switch", {
        name: /save history/i,
      });
      expect(saveHistorySwitch).toBeInTheDocument();
    });

    it("should handle search settings changes", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      const searchTab = screen.getByRole("tab", { name: /search/i });
      await user.click(searchTab);

      const saveHistorySwitch = screen.getByRole("switch", {
        name: /save history/i,
      });
      await user.click(saveHistorySwitch);

      expect(mockSetSettings).toHaveBeenCalled();
    });

    it("should show default sort selection", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      const searchTab = screen.getByRole("tab", { name: /search/i });
      await user.click(searchTab);

      const defaultSortSelect = screen.getByRole("combobox", {
        name: /default sort/i,
      });
      expect(defaultSortSelect).toBeInTheDocument();
    });

    it("should handle default sort change", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      const searchTab = screen.getByRole("tab", { name: /search/i });
      await user.click(searchTab);

      const defaultSortSelect = screen.getByRole("combobox", {
        name: /default sort/i,
      });
      await user.click(defaultSortSelect);
      await user.click(screen.getByText(/date/i));

      expect(mockSetSettings).toHaveBeenCalled();
    });

    it("should show display preferences", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      const searchTab = screen.getByRole("tab", { name: /search/i });
      await user.click(searchTab);

      const showSalarySwitch = screen.getByRole("switch", {
        name: /show salary/i,
      });
      const autoCompleteSwitch = screen.getByRole("switch", {
        name: /auto complete/i,
      });

      expect(showSalarySwitch).toBeInTheDocument();
      expect(autoCompleteSwitch).toBeInTheDocument();
    });
  });

  describe("Reset and Export", () => {
    it("should show reset settings option", () => {
      render(<SettingsPage user={mockUser} />);

      expect(
        screen.getByRole("button", { name: /reset to defaults/i }),
      ).toBeInTheDocument();
    });

    it("should handle settings reset", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      const resetButton = screen.getByRole("button", {
        name: /reset to defaults/i,
      });
      await user.click(resetButton);

      // Should show confirmation dialog
      expect(
        screen.getByRole("dialog", { name: /reset settings/i }),
      ).toBeInTheDocument();

      const confirmButton = screen.getByRole("button", {
        name: /reset settings/i,
      });
      await user.click(confirmButton);

      expect(mockSetSettings).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Settings Reset",
        }),
      );
    });

    it("should show export settings option", () => {
      render(<SettingsPage user={mockUser} />);

      expect(
        screen.getByRole("button", { name: /export settings/i }),
      ).toBeInTheDocument();
    });

    it("should handle settings export", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      const exportButton = screen.getByRole("button", {
        name: /export settings/i,
      });
      await user.click(exportButton);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Settings Exported",
        }),
      );
    });

    it("should show import settings option", () => {
      render(<SettingsPage user={mockUser} />);

      expect(
        screen.getByRole("button", { name: /import settings/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle settings update errors", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      // Mock settings setter to throw
      mockSetSettings.mockImplementation(() => {
        throw new Error("Failed to update settings");
      });

      const darkThemeButton = screen.getByRole("button", { name: /dark/i });
      await user.click(darkThemeButton);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error Updating Settings",
          variant: "destructive",
        }),
      );
    });

    it("should handle settings loading errors", () => {
      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentSettings,
      ).mockImplementation(() => {
        throw new Error("Failed to load settings");
      });

      expect(() => render(<SettingsPage user={mockUser} />)).not.toThrow();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(<SettingsPage user={mockUser} />);

      expect(screen.getByRole("main")).toBeInTheDocument();
      expect(screen.getByRole("tablist")).toBeInTheDocument();
      expect(screen.getAllByRole("tab")).toHaveLength(5);
      expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      // Tab navigation between tabs
      await user.tab();
      expect(document.activeElement?.getAttribute("role")).toBe("tab");

      // Arrow key navigation
      await user.keyboard("{ArrowRight}");
      expect(document.activeElement?.getAttribute("role")).toBe("tab");
    });

    it("should have proper heading hierarchy", () => {
      render(<SettingsPage user={mockUser} />);

      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
      expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(
        expect.any(Number),
      );
    });

    it("should announce setting changes to screen readers", async () => {
      const user = userEvent.setup();
      render(<SettingsPage user={mockUser} />);

      const darkThemeButton = screen.getByRole("button", { name: /dark/i });
      await user.click(darkThemeButton);

      // Should announce the change
      expect(darkThemeButton).toHaveAttribute("aria-pressed", "true");
    });
  });

  describe("Responsive Design", () => {
    it("should adapt to mobile viewport", () => {
      // Mock mobile viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<SettingsPage user={mockUser} />);

      expect(screen.getByRole("main")).toBeInTheDocument();
    });

    it("should render tabs list on small screens", () => {
      // Mock small viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 640,
      });

      render(<SettingsPage user={mockUser} />);

      const tablist = screen.getByRole("tablist");
      expect(tablist).toBeInTheDocument();
    });
  });
});
