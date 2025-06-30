import { assert, assertExists } from "./types";
import { logger } from "./api";

// Payment interfaces for dependency injection
export interface PaymentService {
  createCustomer(email: string, name: string): Promise<string>;
  createSubscription(
    customerId: string,
    priceId: string,
  ): Promise<SubscriptionResult>;
  updateSubscription(
    subscriptionId: string,
    priceId: string,
  ): Promise<SubscriptionResult>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  createPaymentIntent(
    amount: number,
    currency: string,
    customerId: string,
  ): Promise<PaymentIntentResult>;
  confirmPayment(
    paymentIntentId: string,
    paymentMethodId: string,
  ): Promise<PaymentResult>;
  createSetupIntent(customerId: string): Promise<SetupIntentResult>;
  attachPaymentMethod(
    paymentMethodId: string,
    customerId: string,
  ): Promise<void>;
  getCustomerSubscriptions(customerId: string): Promise<Subscription[]>;
  getInvoices(customerId: string): Promise<Invoice[]>;
  createPortalSession(customerId: string, returnUrl: string): Promise<string>;
}

export interface SubscriptionResult {
  id: string;
  status: "active" | "incomplete" | "past_due" | "canceled" | "unpaid";
  clientSecret?: string;
  currentPeriodEnd: Date;
  priceId: string;
}

export interface PaymentIntentResult {
  id: string;
  clientSecret: string;
  status: string;
}

export interface SetupIntentResult {
  id: string;
  clientSecret: string;
  status: string;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId: string;
  error?: string;
}

export interface Subscription {
  id: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  priceId: string;
  planName: string;
  amount: number;
  currency: string;
}

export interface Invoice {
  id: string;
  number: string;
  status: string;
  amount: number;
  currency: string;
  created: Date;
  dueDate: Date;
  pdfUrl: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: "month" | "year";
  features: string[];
  popular?: boolean;
  stripePriceId: string;
}

// Stripe Payment Service Implementation
export class StripePaymentService implements PaymentService {
  private stripePublicKey: string;
  private apiBaseUrl: string;

  constructor(stripePublicKey: string, apiBaseUrl: string = "/api") {
    assert(stripePublicKey.length > 0, "Stripe public key must be provided");
    assert(apiBaseUrl.length > 0, "API base URL must be provided");

    this.stripePublicKey = stripePublicKey;
    this.apiBaseUrl = apiBaseUrl;

    logger.info("Stripe Payment Service initialized");
  }

  async createCustomer(email: string, name: string): Promise<string> {
    assert(email.length > 0, "Email must be provided");
    assert(name.length > 0, "Name must be provided");

    logger.info("Creating Stripe customer", { email, name });

    try {
      const response = await fetch(`${this.apiBaseUrl}/payments/customer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
        },
        body: JSON.stringify({ email, name }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      assertExists(data.customerId, "Customer ID");

      logger.info("Stripe customer created", { customerId: data.customerId });
      return data.customerId;
    } catch (error) {
      logger.error("Failed to create Stripe customer", { error, email, name });
      throw new Error(
        `Customer creation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async createSubscription(
    customerId: string,
    priceId: string,
  ): Promise<SubscriptionResult> {
    assert(customerId.length > 0, "Customer ID must be provided");
    assert(priceId.length > 0, "Price ID must be provided");

    logger.info("Creating subscription", { customerId, priceId });

    try {
      const response = await fetch(`${this.apiBaseUrl}/payments/subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
        },
        body: JSON.stringify({ customerId, priceId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      const result: SubscriptionResult = {
        id: data.id,
        status: data.status,
        clientSecret: data.clientSecret,
        currentPeriodEnd: new Date(data.currentPeriodEnd * 1000),
        priceId: data.priceId,
      };

      this.validateSubscriptionResult(result);

      logger.info("Subscription created", {
        subscriptionId: result.id,
        status: result.status,
      });
      return result;
    } catch (error) {
      logger.error("Failed to create subscription", {
        error,
        customerId,
        priceId,
      });
      throw new Error(
        `Subscription creation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async updateSubscription(
    subscriptionId: string,
    priceId: string,
  ): Promise<SubscriptionResult> {
    assert(subscriptionId.length > 0, "Subscription ID must be provided");
    assert(priceId.length > 0, "Price ID must be provided");

    logger.info("Updating subscription", { subscriptionId, priceId });

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/payments/subscription/${subscriptionId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
          },
          body: JSON.stringify({ priceId }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      const result: SubscriptionResult = {
        id: data.id,
        status: data.status,
        currentPeriodEnd: new Date(data.currentPeriodEnd * 1000),
        priceId: data.priceId,
      };

      this.validateSubscriptionResult(result);

      logger.info("Subscription updated", {
        subscriptionId: result.id,
        status: result.status,
      });
      return result;
    } catch (error) {
      logger.error("Failed to update subscription", {
        error,
        subscriptionId,
        priceId,
      });
      throw new Error(
        `Subscription update failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    assert(subscriptionId.length > 0, "Subscription ID must be provided");

    logger.info("Canceling subscription", { subscriptionId });

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/payments/subscription/${subscriptionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      logger.info("Subscription canceled", { subscriptionId });
    } catch (error) {
      logger.error("Failed to cancel subscription", { error, subscriptionId });
      throw new Error(
        `Subscription cancellation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    customerId: string,
  ): Promise<PaymentIntentResult> {
    assert(amount > 0, "Amount must be positive");
    assert(currency.length > 0, "Currency must be provided");
    assert(customerId.length > 0, "Customer ID must be provided");

    logger.info("Creating payment intent", { amount, currency, customerId });

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/payments/payment-intent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
          },
          body: JSON.stringify({ amount, currency, customerId }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      const result: PaymentIntentResult = {
        id: data.id,
        clientSecret: data.clientSecret,
        status: data.status,
      };

      assertExists(result.id, "Payment intent ID");
      assertExists(result.clientSecret, "Client secret");

      logger.info("Payment intent created", { paymentIntentId: result.id });
      return result;
    } catch (error) {
      logger.error("Failed to create payment intent", {
        error,
        amount,
        currency,
        customerId,
      });
      throw new Error(
        `Payment intent creation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async confirmPayment(
    paymentIntentId: string,
    paymentMethodId: string,
  ): Promise<PaymentResult> {
    assert(paymentIntentId.length > 0, "Payment intent ID must be provided");
    assert(paymentMethodId.length > 0, "Payment method ID must be provided");

    logger.info("Confirming payment", { paymentIntentId, paymentMethodId });

    try {
      const response = await fetch(`${this.apiBaseUrl}/payments/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
        },
        body: JSON.stringify({ paymentIntentId, paymentMethodId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      const result: PaymentResult = {
        success: data.success,
        paymentIntentId: data.paymentIntentId,
        error: data.error,
      };

      logger.info("Payment confirmation completed", {
        paymentIntentId: result.paymentIntentId,
        success: result.success,
      });

      return result;
    } catch (error) {
      logger.error("Failed to confirm payment", {
        error,
        paymentIntentId,
        paymentMethodId,
      });
      throw new Error(
        `Payment confirmation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async createSetupIntent(customerId: string): Promise<SetupIntentResult> {
    assert(customerId.length > 0, "Customer ID must be provided");

    logger.info("Creating setup intent", { customerId });

    try {
      const response = await fetch(`${this.apiBaseUrl}/payments/setup-intent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
        },
        body: JSON.stringify({ customerId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      const result: SetupIntentResult = {
        id: data.id,
        clientSecret: data.clientSecret,
        status: data.status,
      };

      assertExists(result.id, "Setup intent ID");
      assertExists(result.clientSecret, "Client secret");

      logger.info("Setup intent created", { setupIntentId: result.id });
      return result;
    } catch (error) {
      logger.error("Failed to create setup intent", { error, customerId });
      throw new Error(
        `Setup intent creation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string,
  ): Promise<void> {
    assert(paymentMethodId.length > 0, "Payment method ID must be provided");
    assert(customerId.length > 0, "Customer ID must be provided");

    logger.info("Attaching payment method", { paymentMethodId, customerId });

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/payments/payment-method/attach`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
          },
          body: JSON.stringify({ paymentMethodId, customerId }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      logger.info("Payment method attached", { paymentMethodId, customerId });
    } catch (error) {
      logger.error("Failed to attach payment method", {
        error,
        paymentMethodId,
        customerId,
      });
      throw new Error(
        `Payment method attachment failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getCustomerSubscriptions(customerId: string): Promise<Subscription[]> {
    assert(customerId.length > 0, "Customer ID must be provided");

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/payments/subscriptions/${customerId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      const subscriptions: Subscription[] = data.map((sub: any) => ({
        id: sub.id,
        status: sub.status,
        currentPeriodStart: new Date(sub.currentPeriodStart * 1000),
        currentPeriodEnd: new Date(sub.currentPeriodEnd * 1000),
        priceId: sub.priceId,
        planName: sub.planName,
        amount: sub.amount,
        currency: sub.currency,
      }));

      logger.info("Customer subscriptions retrieved", {
        customerId,
        count: subscriptions.length,
      });
      return subscriptions;
    } catch (error) {
      logger.error("Failed to get customer subscriptions", {
        error,
        customerId,
      });
      throw new Error(
        `Failed to retrieve subscriptions: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getInvoices(customerId: string): Promise<Invoice[]> {
    assert(customerId.length > 0, "Customer ID must be provided");

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/payments/invoices/${customerId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      const invoices: Invoice[] = data.map((invoice: any) => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        amount: invoice.amount,
        currency: invoice.currency,
        created: new Date(invoice.created * 1000),
        dueDate: new Date(invoice.dueDate * 1000),
        pdfUrl: invoice.pdfUrl,
      }));

      logger.info("Customer invoices retrieved", {
        customerId,
        count: invoices.length,
      });
      return invoices;
    } catch (error) {
      logger.error("Failed to get customer invoices", { error, customerId });
      throw new Error(
        `Failed to retrieve invoices: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async createPortalSession(
    customerId: string,
    returnUrl: string,
  ): Promise<string> {
    assert(customerId.length > 0, "Customer ID must be provided");
    assert(returnUrl.length > 0, "Return URL must be provided");

    logger.info("Creating customer portal session", { customerId, returnUrl });

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/payments/portal-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
          },
          body: JSON.stringify({ customerId, returnUrl }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      assertExists(data.url, "Portal session URL");

      logger.info("Customer portal session created", { customerId });
      return data.url;
    } catch (error) {
      logger.error("Failed to create portal session", {
        error,
        customerId,
        returnUrl,
      });
      throw new Error(
        `Portal session creation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private validateSubscriptionResult(result: SubscriptionResult): void {
    assertExists(result.id, "Subscription ID");
    assert(
      ["active", "incomplete", "past_due", "canceled", "unpaid"].includes(
        result.status,
      ),
      "Invalid subscription status",
    );
    assertExists(result.currentPeriodEnd, "Current period end");
    assertExists(result.priceId, "Price ID");
  }
}

// Pricing plans configuration
export const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for small teams and startups",
    amount: 4900, // $49.00 in cents
    currency: "usd",
    interval: "month",
    stripePriceId:
      import.meta.env.VITE_STRIPE_STARTER_PRICE_ID || "price_starter",
    features: [
      "5 active job postings",
      "100 candidate searches",
      "Basic AI matching",
      "Email support",
      "Standard analytics",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    description: "Ideal for growing companies",
    amount: 14900, // $149.00 in cents
    currency: "usd",
    interval: "month",
    stripePriceId:
      import.meta.env.VITE_STRIPE_PRO_PRICE_ID || "price_professional",
    popular: true,
    features: [
      "25 active job postings",
      "Unlimited candidate searches",
      "Advanced AI matching",
      "Priority support",
      "Advanced analytics",
      "Team collaboration",
      "Custom branding",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations",
    amount: 0, // Custom pricing
    currency: "usd",
    interval: "month",
    stripePriceId:
      import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID || "price_enterprise",
    features: [
      "Unlimited job postings",
      "Unlimited everything",
      "Custom AI training",
      "Dedicated support",
      "Custom integrations",
      "SSO & SAML",
      "White-label solution",
    ],
  },
];

// Create singleton payment service
const stripePublicKey =
  import.meta.env.VITE_STRIPE_PUBLIC_KEY || "pk_test_example";
export const paymentService = new StripePaymentService(stripePublicKey);
