import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfilePage from "../ProfilePage";
import { createMockUser } from "../../__tests__/test-utils";

// Mock the persistent state hooks
const mockSetUser = vi.fn();
const mockSetSettings = vi.fn();

vi.mock("../../hooks/usePersistentState", () => ({
  usePersistentSettings: vi.fn(() => [
    {
      theme: "light",
      language: "en",
      timezone: "Europe/Amsterdam",
      notifications: {
        email: true,
        push: false,
        marketing: false,
      },
      privacy: {
        showProfile: true,
        showActivity: false,
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

// Mock file upload
const mockUploadFile = vi.fn();
vi.mock("../../lib/file-upload", () => ({
  uploadFile: mockUploadFile,
}));

// Mock image cropper
vi.mock("react-image-crop", () => ({
  ReactCrop: ({ children, ...props }: any) => (
    <div data-testid="image-crop" {...props}>
      {children}
    </div>
  ),
  centerCrop: vi.fn(),
  makeAspectCrop: vi.fn(),
}));

describe("ProfilePage Component", () => {
  const mockUser = createMockUser({
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: "/avatars/john-doe.jpg",
    bio: "Experienced software developer",
    company: "TechCorp",
    location: "Amsterdam, Netherlands",
    website: "https://johndoe.dev",
    linkedin: "https://linkedin.com/in/johndoe",
    github: "https://github.com/johndoe",
    twitter: "https://twitter.com/johndoe",
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering and Layout", () => {
    it("should render profile page header correctly", () => {
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      expect(
        screen.getByRole("heading", { name: /profile settings/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/manage your profile information and preferences/i),
      ).toBeInTheDocument();
    });

    it("should render tab navigation", () => {
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      expect(screen.getByRole("tab", { name: /profile/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /account/i })).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /preferences/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /privacy/i })).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /notifications/i }),
      ).toBeInTheDocument();
    });

    it("should display current user information", () => {
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      expect(screen.getByDisplayValue(/john doe/i)).toBeInTheDocument();
      expect(
        screen.getByDisplayValue(/john.doe@example.com/i),
      ).toBeInTheDocument();
      expect(
        screen.getByDisplayValue(/experienced software developer/i),
      ).toBeInTheDocument();
    });
  });

  describe("Profile Tab", () => {
    it("should display profile form fields", () => {
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/website/i)).toBeInTheDocument();
    });

    it("should display social media links", () => {
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      expect(screen.getByLabelText(/linkedin/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/github/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/twitter/i)).toBeInTheDocument();
    });

    it("should show avatar upload section", () => {
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      expect(screen.getByText(/profile picture/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /upload/i }),
      ).toBeInTheDocument();
    });

    it("should handle profile form submission", async () => {
      const user = userEvent.setup();
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      const nameInput = screen.getByLabelText(/full name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "Jane Doe");

      const bioInput = screen.getByLabelText(/bio/i);
      await user.clear(bioInput);
      await user.type(bioInput, "Senior software engineer");

      const saveButton = screen.getByRole("button", {
        name: /save profile/i,
      });
      await user.click(saveButton);

      expect(mockSetUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Jane Doe",
          bio: "Senior software engineer",
        }),
      );

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Profile Updated",
        }),
      );
    });

    it("should validate required fields", async () => {
      const user = userEvent.setup();
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      const nameInput = screen.getByLabelText(/full name/i);
      await user.clear(nameInput);

      const saveButton = screen.getByRole("button", {
        name: /save profile/i,
      });
      await user.click(saveButton);

      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });

    it("should validate email format", async () => {
      const user = userEvent.setup();
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.clear(emailInput);
      await user.type(emailInput, "invalid-email");

      const saveButton = screen.getByRole("button", {
        name: /save profile/i,
      });
      await user.click(saveButton);

      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });

    it("should validate URL format for social links", async () => {
      const user = userEvent.setup();
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      const websiteInput = screen.getByLabelText(/website/i);
      await user.clear(websiteInput);
      await user.type(websiteInput, "not-a-url");

      const saveButton = screen.getByRole("button", {
        name: /save profile/i,
      });
      await user.click(saveButton);

      expect(screen.getByText(/invalid url format/i)).toBeInTheDocument();
    });
  });

  describe("Avatar Upload", () => {
    it("should handle avatar file upload", async () => {
      const user = userEvent.setup();
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      mockUploadFile.mockResolvedValue("/avatars/new-avatar.jpg");

      const fileInput = screen.getByLabelText(/upload avatar/i);
      const file = new File(["avatar"], "avatar.jpg", { type: "image/jpeg" });

      await user.upload(fileInput, file);

      expect(mockUploadFile).toHaveBeenCalledWith(file, "avatars");

      await waitFor(() => {
        expect(mockSetUser).toHaveBeenCalledWith(
          expect.objectContaining({
            avatar: "/avatars/new-avatar.jpg",
          }),
        );
      });
    });

    it("should show image cropper for avatar", async () => {
      const user = userEvent.setup();
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      const fileInput = screen.getByLabelText(/upload avatar/i);
      const file = new File(["avatar"], "avatar.jpg", { type: "image/jpeg" });

      await user.upload(fileInput, file);

      expect(screen.getByTestId("image-crop")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /crop & save/i }),
      ).toBeInTheDocument();
    });

    it("should handle invalid file types", async () => {
      const user = userEvent.setup();
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      const fileInput = screen.getByLabelText(/upload avatar/i);
      const file = new File(["document"], "document.pdf", {
        type: "application/pdf",
      });

      await user.upload(fileInput, file);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Invalid File Type",
          variant: "destructive",
        }),
      );
    });

    it("should handle file size limit", async () => {
      const user = userEvent.setup();
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      const fileInput = screen.getByLabelText(/upload avatar/i);
      const largeFile = new File(["x".repeat(10 * 1024 * 1024)], "large.jpg", {
        type: "image/jpeg",
      });

      await user.upload(fileInput, largeFile);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "File Too Large",
          variant: "destructive",
        }),
      );
    });
  });

  describe("Account Tab", () => {
    it("should display account information", async () => {
      const user = userEvent.setup();
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      const accountTab = screen.getByRole("tab", { name: /account/i });
      await user.click(accountTab);

      expect(screen.getByText(/account information/i)).toBeInTheDocument();
      expect(screen.getByText(/member since/i)).toBeInTheDocument();
      expect(screen.getByText(/account type/i)).toBeInTheDocument();
    });

    it("should show password change form", async () => {
      const user = userEvent.setup();
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      const accountTab = screen.getByRole("tab", { name: /account/i });
      await user.click(accountTab);

      expect(screen.getByText(/change password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it("should handle password change", async () => {
      const user = userEvent.setup();
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      const accountTab = screen.getByRole("tab", { name: /account/i });
      await user.click(accountTab);

      await user.type(
        screen.getByLabelText(/current password/i),
        "oldpassword",
      );
      await user.type(screen.getByLabelText(/new password/i), "newpassword123");
      await user.type(
        screen.getByLabelText(/confirm password/i),
        "newpassword123",
      );

      const changePasswordButton = screen.getByRole("button", {
        name: /change password/i,
      });
      await user.click(changePasswordButton);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Password Updated",
        }),
      );
    });

    it("should validate password confirmation", async () => {
      const user = userEvent.setup();
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      const accountTab = screen.getByRole("tab", { name: /account/i });
      await user.click(accountTab);

      await user.type(
        screen.getByLabelText(/current password/i),
        "oldpassword",
      );
      await user.type(screen.getByLabelText(/new password/i), "newpassword123");
      await user.type(
        screen.getByLabelText(/confirm password/i),
        "differentpassword",
      );

      const changePasswordButton = screen.getByRole("button", {
        name: /change password/i,
      });
      await user.click(changePasswordButton);

      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    it("should show two-factor authentication section", async () => {
      const user = userEvent.setup();
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      const accountTab = screen.getByRole("tab", { name: /account/i });
      await user.click(accountTab);

      expect(
        screen.getByText(/two-factor authentication/i),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /enable 2fa/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Preferences Tab", () => {
    it("should display preference settings", async () => {
      const user = userEvent.setup();
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      const preferencesTab = screen.getByRole("tab", { name: /preferences/i });
      await user.click(preferencesTab);

      expect(screen.getByText(/theme/i)).toBeInTheDocument();
      expect(screen.getByText(/language/i)).toBeInTheDocument();
      expect(screen.getByText(/timezone/i)).toBeInTheDocument();
    });

    it("should handle theme change", async () => {
      const user = userEvent.setup();
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      const preferencesTab = screen.getByRole("tab", { name: /preferences/i });
      await user.click(preferencesTab);

      const darkThemeButton = screen.getByRole("button", { name: /dark/i });
      await user.click(darkThemeButton);

      expect(mockSetSettings).toHaveBeenCalledWith(
        expect.any(Function), // updater function
      );

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Preferences Updated",
        }),
      );
    });

    it("should handle language change", async () => {
      const user = userEvent.setup();
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      const preferencesTab = screen.getByRole("tab", { name: /preferences/i });
      await user.click(preferencesTab);

      const languageSelect = screen.getByRole("combobox", {
        name: /language/i,
      });
      await user.click(languageSelect);
      await user.click(screen.getByText(/dutch/i));

      expect(mockSetSettings).toHaveBeenCalled();
    });

    it("should handle timezone change", async () => {
      const user = userEvent.setup();
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      const preferencesTab = screen.getByRole("tab", { name: /preferences/i });
      await user.click(preferencesTab);

      const timezoneSelect = screen.getByRole("combobox", {
        name: /timezone/i,
      });
      await user.click(timezoneSelect);
      await user.click(screen.getByText(/new york/i));

      expect(mockSetSettings).toHaveBeenCalled();
    });
  });

  describe("Privacy Tab", () => {
    it("should display privacy settings", async () => {
      const user = userEvent.setup();
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      const privacyTab = screen.getByRole("tab", { name: /privacy/i });
      await user.click(privacyTab);

      expect(screen.getByText(/profile visibility/i)).toBeInTheDocument();
      expect(screen.getByText(/activity visibility/i)).toBeInTheDocument();
      expect(screen.getByText(/data export/i)).toBeInTheDocument();
    });

    it("should handle privacy setting changes", async () => {
      const user = userEvent.setup();
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      const privacyTab = screen.getByRole("tab", { name: /privacy/i });
      await user.click(privacyTab);

      const profileVisibilitySwitch = screen.getByRole("switch", {
        name: /show profile/i,
      });
      await user.click(profileVisibilitySwitch);

      expect(mockSetSettings).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Privacy Settings Updated",
        }),
      );
    });

    it("should handle data export request", async () => {
      const user = userEvent.setup();
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      const privacyTab = screen.getByRole("tab", { name: /privacy/i });
      await user.click(privacyTab);

      const exportButton = screen.getByRole("button", {
        name: /export data/i,
      });
      await user.click(exportButton);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Data Export Started",
        }),
      );
    });

    it("should show account deletion section", async () => {
      const user = userEvent.setup();
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      const privacyTab = screen.getByRole("tab", { name: /privacy/i });
      await user.click(privacyTab);

      expect(screen.getByText(/delete account/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /delete account/i }),
      ).toBeInTheDocument();
    });

    it("should handle account deletion confirmation", async () => {
      const user = userEvent.setup();
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      const privacyTab = screen.getByRole("tab", { name: /privacy/i });
      await user.click(privacyTab);

      const deleteButton = screen.getByRole("button", {
        name: /delete account/i,
      });
      await user.click(deleteButton);

      expect(
        screen.getByRole("dialog", { name: /delete account/i }),
      ).toBeInTheDocument();

      const confirmInput = screen.getByLabelText(/type "DELETE"/i);
      await user.type(confirmInput, "DELETE");

      const confirmButton = screen.getByRole("button", {
        name: /permanently delete/i,
      });
      await user.click(confirmButton);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Account Deletion Requested",
        }),
      );
    });
  });

  describe("Notifications Tab", () => {
    it("should display notification settings", async () => {
      const user = userEvent.setup();
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      const notificationsTab = screen.getByRole("tab", {
        name: /notifications/i,
      });
      await user.click(notificationsTab);

      expect(screen.getByText(/email notifications/i)).toBeInTheDocument();
      expect(screen.getByText(/push notifications/i)).toBeInTheDocument();
      expect(screen.getByText(/marketing emails/i)).toBeInTheDocument();
    });

    it("should handle notification setting changes", async () => {
      const user = userEvent.setup();
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

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

    it("should show notification preferences", async () => {
      const user = userEvent.setup();
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      const notificationsTab = screen.getByRole("tab", {
        name: /notifications/i,
      });
      await user.click(notificationsTab);

      expect(screen.getByText(/job alerts/i)).toBeInTheDocument();
      expect(screen.getByText(/application updates/i)).toBeInTheDocument();
      expect(screen.getByText(/weekly summary/i)).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle profile update errors", async () => {
      const user = userEvent.setup();
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      // Mock setUser to throw
      mockSetUser.mockImplementation(() => {
        throw new Error("Failed to update profile");
      });

      const nameInput = screen.getByLabelText(/full name/i);
      await user.type(nameInput, "Updated Name");

      const saveButton = screen.getByRole("button", {
        name: /save profile/i,
      });
      await user.click(saveButton);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error Updating Profile",
          variant: "destructive",
        }),
      );
    });

    it("should handle avatar upload errors", async () => {
      const user = userEvent.setup();
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      mockUploadFile.mockRejectedValue(new Error("Upload failed"));

      const fileInput = screen.getByLabelText(/upload avatar/i);
      const file = new File(["avatar"], "avatar.jpg", { type: "image/jpeg" });

      await user.upload(fileInput, file);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Upload Failed",
          variant: "destructive",
        }),
      );
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      expect(screen.getByRole("main")).toBeInTheDocument();
      expect(screen.getByRole("tablist")).toBeInTheDocument();
      expect(screen.getAllByRole("tab")).toHaveLength(5);
      expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      // Tab navigation between tabs
      await user.tab();
      expect(document.activeElement?.getAttribute("role")).toBe("tab");

      // Arrow key navigation
      await user.keyboard("{ArrowRight}");
      expect(document.activeElement?.getAttribute("role")).toBe("tab");
    });

    it("should have proper heading hierarchy", () => {
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
      expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(
        expect.any(Number),
      );
    });

    it("should announce form errors to screen readers", async () => {
      const user = userEvent.setup();
      render(<ProfilePage user={mockUser} setUser={mockSetUser} />);

      const nameInput = screen.getByLabelText(/full name/i);
      await user.clear(nameInput);

      const saveButton = screen.getByRole("button", {
        name: /save profile/i,
      });
      await user.click(saveButton);

      const errorElement = screen.getByText(/name is required/i);
      expect(errorElement).toHaveAttribute("role", "alert");
    });
  });
});
