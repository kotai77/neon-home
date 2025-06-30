import { User, UserRole, assert, assertExists } from "./types";

export interface AuthService {
  login(
    email: string,
    password: string,
  ): Promise<{ user: User; token: string }>;
  loginWithOAuth(provider: string): Promise<{ user: User; token: string }>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  refreshToken(): Promise<string>;
  register(userData: Partial<User>): Promise<{ user: User; token: string }>;
}

// Mock implementation for development
export class MockAuthService implements AuthService {
  private users: User[] = [
    {
      id: "demo-recruiter-1",
      email: "demo.recruiter@example.com",
      firstName: "Sarah",
      lastName: "Johnson",
      role: "recruiter" as UserRole,
      company: "TechCorp",
      isDemo: true,
      subscription: {
        status: "trial",
        planType: "pro",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "demo-applicant-1",
      email: "demo.applicant@example.com",
      firstName: "John",
      lastName: "Doe",
      role: "applicant" as UserRole,
      isDemo: true,
      subscription: {
        status: "trial",
        planType: "basic",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  async login(
    email: string,
    password: string,
  ): Promise<{ user: User; token: string }> {
    assert(email.length > 0, "Email must not be empty");
    assert(password.length > 0, "Password must not be empty");

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const user = this.users.find((u) => u.email === email);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const token = "mock-jwt-token-" + Date.now();

    assertExists(user, "User");
    assert(token.length > 0, "Token must be generated");

    return { user, token };
  }

  async loginWithOAuth(
    provider: string,
  ): Promise<{ user: User; token: string }> {
    assert(provider.length > 0, "Provider must be specified");

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const user = this.users[0];
    const token = "mock-oauth-token-" + Date.now();

    assertExists(user, "User");
    assert(token.length > 0, "Token must be generated");

    return { user, token };
  }

  async logout(): Promise<void> {
    // Get user ID before clearing user data
    const userData = localStorage.getItem("user-data");
    let userId = null;
    if (userData) {
      try {
        const user = JSON.parse(userData);
        userId = user.id;
      } catch {
        // Ignore JSON parse errors
      }
    }

    // Clear authentication data
    localStorage.removeItem("auth-token");
    localStorage.removeItem("user-data");

    // Clear user-specific data if we have the user ID
    if (userId) {
      localStorage.removeItem(`jobs_${userId}`);
      localStorage.removeItem(`applications_${userId}`);
      localStorage.removeItem(`savedSearches_${userId}`);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem("auth-token");
    if (!token) return null;

    const userData = localStorage.getItem("user-data");
    if (!userData) return null;

    const user = JSON.parse(userData) as User;
    assertExists(user.id, "User ID");

    return user;
  }

  async refreshToken(): Promise<string> {
    const currentToken = localStorage.getItem("auth-token");
    assert(currentToken !== null, "Current token must exist");

    const newToken = "refreshed-token-" + Date.now();
    localStorage.setItem("auth-token", newToken);

    assert(newToken.length > 0, "New token must be generated");
    return newToken;
  }

  async register(
    userData: Partial<User>,
  ): Promise<{ user: User; token: string }> {
    assertExists(userData.email, "Email");
    assertExists(userData.firstName, "First name");
    assertExists(userData.lastName, "Last name");
    assertExists(userData.role, "Role");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newUser: User = {
      id: "user-" + Date.now(),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      company: userData.company,
      isDemo: false,
      subscription: {
        status: "trial",
        planType: "basic",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const token = "new-user-token-" + Date.now();

    assertExists(newUser.id, "New user ID");
    assert(token.length > 0, "Token must be generated");

    return { user: newUser, token };
  }
}

export const demoUsers = {
  recruiter: {
    email: "demo.recruiter@example.com",
    password: "demo123",
  },
  applicant: {
    email: "demo.applicant@example.com",
    password: "demo123",
  },
};

export const authService = new MockAuthService();
