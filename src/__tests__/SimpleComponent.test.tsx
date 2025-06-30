import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMockUser } from "./test-utils";

// Simple test component
const TestComponent = () => (
  <div>
    <h1>Test Header</h1>
    <p>Test content</p>
    <button>Test Button</button>
  </div>
);

describe("Simple Component Test", () => {
  it("should render basic elements", () => {
    render(<TestComponent />);

    expect(screen.getByText("Test Header")).toBeInTheDocument();
    expect(screen.getByText("Test content")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Test Button" }),
    ).toBeInTheDocument();
  });

  it("should create mock user correctly", () => {
    const user = createMockUser();

    expect(user.id).toBe("test-user-id");
    expect(user.email).toBe("test@example.com");
    expect(user.role).toBe("recruiter");
  });

  it("should create mock user with overrides", () => {
    const user = createMockUser({
      name: "Custom User",
      role: "applicant",
    });

    expect(user.name).toBe("Custom User");
    expect(user.role).toBe("applicant");
  });
});
