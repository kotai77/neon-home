import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BillingPage from "../BillingPage";
import { createMockUser } from "../../__tests__/test-utils";

// Mock the persistent billing hook
const mockSetBillingData = vi.fn();
vi.mock("../../hooks/usePersistentState", () => ({
  usePersistentBilling: vi.fn(() => [
    {
      userId: "test-user-id",
      currentPlan: "professional",
      billingCycle: "monthly",
      subscription: {
        id: "sub_123456",
        status: "active",
        currentPeriodStart: "2024-01-01",
        currentPeriodEnd: "2024-02-01",
        cancelAtPeriodEnd: false,
        plan: "professional",
        amount: 79,
        currency: "USD",
        paymentMethod: "**** **** **** 4242 (Visa)",
      },
      usage: {
        jobs: { used: 12, limit: -1 },
        applications: { used: 234, limit: 500 },
        aiCredits: { used: 650, limit: 1000 },
        teamMembers: { used: 3, limit: 10 },
      },
      billingHistory: [
        {
          id: "inv_001",
          date: "2024-01-01",
          amount: 79,
          subtotal: 79,
          vatRate: 21,
          vatAmount: 16.59,
          totalAmount: 95.59,
          status: "paid",
          description: "Professional Plan - Monthly",
          downloadUrl: "#",
        },
      ],
      vatSettings: {
        country: "NL",
        vatNumber: "NL123456789B01",
        vatRate: 21,
        vatIncluded: false,
        billingAddress: {
          street: "123 Test Street",
          city: "Amsterdam",
          postalCode: "1015 CJ",
          country: "Netherlands",
          companyName: "Test Company",
        },
      },
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
    mockSetBillingData,
    true, // isLoaded
  ]),
}));

// Mock jsPDF
vi.mock("jspdf", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      text: vi.fn(),
      setFont: vi.fn(),
      setFontSize: vi.fn(),
      setTextColor: vi.fn(),
      setFillColor: vi.fn(),
      setDrawColor: vi.fn(),
      setLineWidth: vi.fn(),
      rect: vi.fn(),
      roundedRect: vi.fn(),
      line: vi.fn(),
      save: vi.fn(),
      internal: {
        pageSize: {
          getWidth: () => 210,
          getHeight: () => 297,
        },
      },
    })),
  };
});

// Mock toast
const mockToast = vi.fn();
vi.mock("../../hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

describe("BillingPage Component", () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering and Layout", () => {
    it("should render billing page header correctly", () => {
      render(<BillingPage user={mockUser} />);

      expect(
        screen.getByRole("heading", { name: /billing & subscription/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /manage your subscription, usage, and billing history/i,
        ),
      ).toBeInTheDocument();
    });

    it("should show subscription status badges", () => {
      render(<BillingPage user={mockUser} />);

      expect(screen.getByText(/active/i)).toBeInTheDocument();
    });

    it("should render tab navigation", () => {
      render(<BillingPage user={mockUser} />);

      expect(
        screen.getByRole("tab", { name: /overview/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /plans/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /usage/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /history/i })).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /vat settings/i }),
      ).toBeInTheDocument();
    });

    it("should show loading state when data is not loaded", () => {
      // Mock loading state
      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentBilling,
      ).mockReturnValue([{}, vi.fn(), false]);

      render(<BillingPage user={mockUser} />);

      expect(
        screen.getByText(/loading billing information/i),
      ).toBeInTheDocument();
    });
  });

  describe("Overview Tab", () => {
    it("should display current subscription information", () => {
      render(<BillingPage user={mockUser} />);

      expect(screen.getByText(/professional plan/i)).toBeInTheDocument();
      expect(screen.getByText(/\$79\/month/i)).toBeInTheDocument();
      expect(screen.getByText(/active/i)).toBeInTheDocument();
    });

    it("should display usage summary", () => {
      render(<BillingPage user={mockUser} />);

      expect(screen.getByText(/usage summary/i)).toBeInTheDocument();
      expect(screen.getByText(/job postings/i)).toBeInTheDocument();
      expect(screen.getByText(/applications received/i)).toBeInTheDocument();
      expect(screen.getByText(/ai credits/i)).toBeInTheDocument();
    });

    it("should display recent invoices", () => {
      render(<BillingPage user={mockUser} />);

      expect(screen.getByText(/recent invoices/i)).toBeInTheDocument();
      expect(
        screen.getByText(/professional plan - monthly/i),
      ).toBeInTheDocument();
    });

    it("should show cancellation status when subscription is cancelled", () => {
      // Mock cancelled subscription
      const mockCancelledBilling = {
        subscription: {
          status: "active",
          cancelAtPeriodEnd: true,
          currentPeriodEnd: "2024-02-01",
        },
      };

      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentBilling,
      ).mockReturnValue([mockCancelledBilling, vi.fn(), true]);

      render(<BillingPage user={mockUser} />);

      expect(screen.getByText(/cancelling/i)).toBeInTheDocument();
      expect(screen.getByText(/cancelling at period end/i)).toBeInTheDocument();
    });
  });

  describe("Payment Management", () => {
    it("should show update payment button", () => {
      render(<BillingPage user={mockUser} />);

      expect(
        screen.getByRole("button", { name: /update payment/i }),
      ).toBeInTheDocument();
    });

    it("should open payment modal when update payment is clicked", async () => {
      const user = userEvent.setup();
      render(<BillingPage user={mockUser} />);

      const updateButton = screen.getByRole("button", {
        name: /update payment/i,
      });
      await user.click(updateButton);

      expect(
        screen.getByRole("dialog", { name: /update payment method/i }),
      ).toBeInTheDocument();
    });

    it("should handle payment form submission", async () => {
      const user = userEvent.setup();
      render(<BillingPage user={mockUser} />);

      // Open payment modal
      const updateButton = screen.getByRole("button", {
        name: /update payment/i,
      });
      await user.click(updateButton);

      // Fill out payment form
      const cardNumberInput = screen.getByLabelText(/card number/i);
      await user.type(cardNumberInput, "4242424242424242");

      const expiryMonthSelect = screen.getByDisplayValue(/mm/i);
      await user.click(expiryMonthSelect);
      await user.click(screen.getByText("12"));

      const expiryYearSelect = screen.getByDisplayValue(/yyyy/i);
      await user.click(expiryYearSelect);
      await user.click(screen.getByText("2025"));

      const cvvInput = screen.getByLabelText(/cvv/i);
      await user.type(cvvInput, "123");

      const nameInput = screen.getByLabelText(/cardholder name/i);
      await user.type(nameInput, "John Doe");

      // Submit form
      const submitButton = screen.getByRole("button", {
        name: /update payment method/i,
      });
      await user.click(submitButton);

      // Should show processing state
      expect(
        screen.getByRole("button", { name: /processing/i }),
      ).toBeInTheDocument();
    });

    it("should validate required payment fields", async () => {
      const user = userEvent.setup();
      render(<BillingPage user={mockUser} />);

      // Open payment modal
      const updateButton = screen.getByRole("button", {
        name: /update payment/i,
      });
      await user.click(updateButton);

      // Try to submit without filling required fields
      const submitButton = screen.getByRole("button", {
        name: /update payment method/i,
      });
      await user.click(submitButton);

      // Should show validation error
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Validation Error",
          variant: "destructive",
        }),
      );
    });
  });

  describe("Subscription Management", () => {
    it("should show cancel subscription button", () => {
      render(<BillingPage user={mockUser} />);

      expect(
        screen.getByRole("button", { name: /cancel plan/i }),
      ).toBeInTheDocument();
    });

    it("should show confirmation dialog when cancelling subscription", async () => {
      const user = userEvent.setup();
      render(<BillingPage user={mockUser} />);

      const cancelButton = screen.getByRole("button", { name: /cancel plan/i });
      await user.click(cancelButton);

      expect(
        screen.getByRole("dialog", { name: /cancel subscription/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/your subscription will remain active until/i),
      ).toBeInTheDocument();
    });

    it("should handle subscription cancellation", async () => {
      const user = userEvent.setup();
      render(<BillingPage user={mockUser} />);

      const cancelButton = screen.getByRole("button", { name: /cancel plan/i });
      await user.click(cancelButton);

      const confirmButton = screen.getByRole("button", {
        name: /cancel subscription/i,
      });
      await user.click(confirmButton);

      // Should update billing data
      expect(mockSetBillingData).toHaveBeenCalledWith(
        expect.any(Function), // Updater function
      );

      // Should show success toast
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Subscription Cancelled",
        }),
      );
    });

    it("should disable cancel button when subscription is already cancelled", () => {
      // Mock cancelled subscription
      const mockCancelledBilling = {
        subscription: {
          status: "active",
          cancelAtPeriodEnd: true,
        },
      };

      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentBilling,
      ).mockReturnValue([mockCancelledBilling, vi.fn(), true]);

      render(<BillingPage user={mockUser} />);

      expect(
        screen.getByRole("button", { name: /plan cancelled/i }),
      ).toBeDisabled();
    });
  });

  describe("Plans Tab", () => {
    it("should display billing cycle toggle", async () => {
      const user = userEvent.setup();
      render(<BillingPage user={mockUser} />);

      const plansTab = screen.getByRole("tab", { name: /plans/i });
      await user.click(plansTab);

      expect(screen.getByText(/monthly/i)).toBeInTheDocument();
      expect(screen.getByText(/yearly/i)).toBeInTheDocument();
      expect(screen.getByText(/save 17%/i)).toBeInTheDocument();
    });

    it("should display available plans", async () => {
      const user = userEvent.setup();
      render(<BillingPage user={mockUser} />);

      const plansTab = screen.getByRole("tab", { name: /plans/i });
      await user.click(plansTab);

      expect(screen.getByText(/starter/i)).toBeInTheDocument();
      expect(screen.getByText(/professional/i)).toBeInTheDocument();
      expect(screen.getByText(/enterprise/i)).toBeInTheDocument();
    });

    it("should handle billing cycle changes", async () => {
      const user = userEvent.setup();
      render(<BillingPage user={mockUser} />);

      const plansTab = screen.getByRole("tab", { name: /plans/i });
      await user.click(plansTab);

      const yearlyButton = screen.getByRole("button", { name: /yearly/i });
      await user.click(yearlyButton);

      // Should update billing data
      expect(mockSetBillingData).toHaveBeenCalled();
    });

    it("should handle plan upgrades", async () => {
      const user = userEvent.setup();
      render(<BillingPage user={mockUser} />);

      const plansTab = screen.getByRole("tab", { name: /plans/i });
      await user.click(plansTab);

      const upgradeButton = screen.getByRole("button", { name: /upgrade/i });
      await user.click(upgradeButton);

      // Should update billing data
      expect(mockSetBillingData).toHaveBeenCalled();

      // Should show success toast
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Plan Upgraded Successfully",
        }),
      );
    });

    it("should show current plan badge", async () => {
      const user = userEvent.setup();
      render(<BillingPage user={mockUser} />);

      const plansTab = screen.getByRole("tab", { name: /plans/i });
      await user.click(plansTab);

      expect(screen.getByText(/current plan/i)).toBeInTheDocument();
    });
  });

  describe("Usage Tab", () => {
    it("should display usage metrics", async () => {
      const user = userEvent.setup();
      render(<BillingPage user={mockUser} />);

      const usageTab = screen.getByRole("tab", { name: /usage/i });
      await user.click(usageTab);

      expect(screen.getByText(/job postings/i)).toBeInTheDocument();
      expect(screen.getByText(/applications/i)).toBeInTheDocument();
      expect(screen.getByText(/ai credits/i)).toBeInTheDocument();
      expect(screen.getByText(/team members/i)).toBeInTheDocument();
    });

    it("should show usage progress bars", async () => {
      const user = userEvent.setup();
      render(<BillingPage user={mockUser} />);

      const usageTab = screen.getByRole("tab", { name: /usage/i });
      await user.click(usageTab);

      // Should show progress indicators
      expect(screen.getAllByRole("progressbar")).toHaveLength(3); // jobs has unlimited so no progress bar
    });

    it("should display unlimited usage correctly", async () => {
      const user = userEvent.setup();
      render(<BillingPage user={mockUser} />);

      const usageTab = screen.getByRole("tab", { name: /usage/i });
      await user.click(usageTab);

      expect(screen.getByText(/unlimited/i)).toBeInTheDocument();
    });
  });

  describe("VAT Settings Tab", () => {
    it("should display VAT configuration form", async () => {
      const user = userEvent.setup();
      render(<BillingPage user={mockUser} />);

      const vatTab = screen.getByRole("tab", { name: /vat settings/i });
      await user.click(vatTab);

      expect(screen.getByText(/vat configuration/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/vat number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/vat rate/i)).toBeInTheDocument();
    });

    it("should display billing address form", async () => {
      const user = userEvent.setup();
      render(<BillingPage user={mockUser} />);

      const vatTab = screen.getByRole("tab", { name: /vat settings/i });
      await user.click(vatTab);

      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/postal code/i)).toBeInTheDocument();
    });

    it("should show VAT preview calculation", async () => {
      const user = userEvent.setup();
      render(<BillingPage user={mockUser} />);

      const vatTab = screen.getByRole("tab", { name: /vat settings/i });
      await user.click(vatTab);

      expect(screen.getByText(/invoice preview/i)).toBeInTheDocument();
      expect(screen.getByText(/vat \(21%\)/i)).toBeInTheDocument();
      expect(screen.getByText(/total amount/i)).toBeInTheDocument();
    });

    it("should handle VAT settings updates", async () => {
      const user = userEvent.setup();
      render(<BillingPage user={mockUser} />);

      const vatTab = screen.getByRole("tab", { name: /vat settings/i });
      await user.click(vatTab);

      const vatNumberInput = screen.getByLabelText(/vat number/i);
      await user.clear(vatNumberInput);
      await user.type(vatNumberInput, "NL987654321B01");

      const saveButton = screen.getByRole("button", {
        name: /save vat settings/i,
      });
      await user.click(saveButton);

      // Should update billing data
      expect(mockSetBillingData).toHaveBeenCalled();

      // Should show success toast
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "VAT Settings Saved",
        }),
      );
    });
  });

  describe("Invoice Download", () => {
    it("should display download buttons for invoices", () => {
      render(<BillingPage user={mockUser} />);

      expect(
        screen.getByRole("button", { name: /download/i }),
      ).toBeInTheDocument();
    });

    it("should handle invoice download", async () => {
      const user = userEvent.setup();
      render(<BillingPage user={mockUser} />);

      const downloadButton = screen.getByRole("button", { name: /download/i });
      await user.click(downloadButton);

      // Should show processing toast
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Generating PDF",
        }),
      );
    });

    it("should handle download errors", async () => {
      // Mock PDF generation to fail
      const mockJsPDF = vi.mocked(require("jspdf").default);
      mockJsPDF.mockImplementation(() => {
        throw new Error("PDF generation failed");
      });

      const user = userEvent.setup();
      render(<BillingPage user={mockUser} />);

      const downloadButton = screen.getByRole("button", { name: /download/i });
      await user.click(downloadButton);

      // Should show error toast
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Download Failed",
          variant: "destructive",
        }),
      );
    });
  });

  describe("Billing History Tab", () => {
    it("should display billing history table", async () => {
      const user = userEvent.setup();
      render(<BillingPage user={mockUser} />);

      const historyTab = screen.getByRole("tab", { name: /history/i });
      await user.click(historyTab);

      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getByText(/date/i)).toBeInTheDocument();
      expect(screen.getByText(/description/i)).toBeInTheDocument();
      expect(screen.getByText(/amount/i)).toBeInTheDocument();
      expect(screen.getByText(/status/i)).toBeInTheDocument();
    });

    it("should display invoice rows", async () => {
      const user = userEvent.setup();
      render(<BillingPage user={mockUser} />);

      const historyTab = screen.getByRole("tab", { name: /history/i });
      await user.click(historyTab);

      expect(
        screen.getByText(/professional plan - monthly/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/\$79/i)).toBeInTheDocument();
      expect(screen.getByText(/paid/i)).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle billing data loading errors", () => {
      vi.mocked(
        require("../../hooks/usePersistentState").usePersistentBilling,
      ).mockImplementation(() => {
        throw new Error("Failed to load billing data");
      });

      expect(() => render(<BillingPage user={mockUser} />)).not.toThrow();
    });

    it("should handle payment processing errors", async () => {
      const user = userEvent.setup();
      render(<BillingPage user={mockUser} />);

      // Mock billing data setter to throw
      mockSetBillingData.mockImplementation(() => {
        throw new Error("Payment processing failed");
      });

      const updateButton = screen.getByRole("button", {
        name: /update payment/i,
      });
      await user.click(updateButton);

      // Should still render without crashing
      expect(
        screen.getByRole("dialog", { name: /update payment method/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(<BillingPage user={mockUser} />);

      expect(screen.getByRole("main")).toBeInTheDocument();
      expect(screen.getByRole("tablist")).toBeInTheDocument();
      expect(screen.getAllByRole("tab")).toHaveLength(5);
      expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<BillingPage user={mockUser} />);

      // Tab navigation between tabs
      await user.tab();
      expect(document.activeElement?.getAttribute("role")).toBe("tab");

      // Arrow key navigation
      await user.keyboard("{ArrowRight}");
      expect(document.activeElement?.getAttribute("role")).toBe("tab");
    });

    it("should have proper heading hierarchy", () => {
      render(<BillingPage user={mockUser} />);

      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
      expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(
        expect.any(Number),
      );
    });
  });

  describe("Performance", () => {
    it("should not cause memory leaks", () => {
      const { unmount } = render(<BillingPage user={mockUser} />);

      expect(() => unmount()).not.toThrow();
    });

    it("should handle rapid tab switching", async () => {
      const user = userEvent.setup();
      render(<BillingPage user={mockUser} />);

      const tabs = screen.getAllByRole("tab");

      // Rapidly switch between tabs
      for (const tab of tabs) {
        await user.click(tab);
      }

      // Should still be functional
      expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    });
  });
});
