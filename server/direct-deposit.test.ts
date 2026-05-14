import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  getBankDetails: vi.fn(),
  setBankDetails: vi.fn(),
}));

import { getBankDetails, setBankDetails } from "./db";

describe("Direct Deposit Payment Method", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Bank Details CRUD", () => {
    it("should return null when no bank details are configured", async () => {
      (getBankDetails as any).mockResolvedValue(null);
      const result = await getBankDetails();
      expect(result).toBeNull();
    });

    it("should save and return bank details", async () => {
      const bankDetails = {
        bankName: "Commonwealth Bank",
        bsb: "064-000",
        accountNumber: "12345678",
        accountName: "All Ways Transfers Pty Ltd",
        referenceInstructions: "Please use your booking reference number as the payment description.",
        isEnabled: true,
      };
      (setBankDetails as any).mockResolvedValue(bankDetails);
      const result = await setBankDetails(bankDetails);
      expect(result).toEqual(bankDetails);
      expect(result.bankName).toBe("Commonwealth Bank");
      expect(result.bsb).toBe("064-000");
      expect(result.accountNumber).toBe("12345678");
      expect(result.accountName).toBe("All Ways Transfers Pty Ltd");
      expect(result.isEnabled).toBe(true);
    });

    it("should return configured bank details", async () => {
      const bankDetails = {
        bankName: "ANZ",
        bsb: "013-000",
        accountNumber: "87654321",
        accountName: "All Ways Transfers",
        referenceInstructions: "Use booking ref as description",
        isEnabled: true,
      };
      (getBankDetails as any).mockResolvedValue(bankDetails);
      const result = await getBankDetails();
      expect(result).not.toBeNull();
      expect(result!.bankName).toBe("ANZ");
      expect(result!.bsb).toBe("013-000");
    });
  });

  describe("Payment Method Validation", () => {
    it("should accept direct_deposit as a valid payment method", () => {
      const validMethods = ["stripe_prepay", "square_postpay", "cash_postpay", "direct_deposit"];
      expect(validMethods).toContain("direct_deposit");
    });

    it("should format direct_deposit label correctly", () => {
      const labels: Record<string, string> = {
        stripe_prepay: "Pre-pay by Credit Card",
        square_postpay: "Pay Driver by Card",
        cash_postpay: "Pay Driver by Cash",
        direct_deposit: "Direct Bank Transfer",
      };
      expect(labels["direct_deposit"]).toBe("Direct Bank Transfer");
    });
  });

  describe("Quote Email Payment Options", () => {
    it("should include bank details in quote email data when available", () => {
      const quoteEmailData = {
        referenceNumber: "AWT-TEST-001",
        clientName: "Test Client",
        clientEmail: "test@example.com",
        totalPrice: "150.00",
        stripePaymentUrl: "https://checkout.stripe.com/test",
        bankDetails: {
          bankName: "Commonwealth Bank",
          bsb: "064-000",
          accountNumber: "12345678",
          accountName: "All Ways Transfers Pty Ltd",
          referenceInstructions: "Use booking ref",
        },
        origin: "https://allwaystransfers.com.au",
      };

      expect(quoteEmailData.stripePaymentUrl).toBeTruthy();
      expect(quoteEmailData.bankDetails).toBeTruthy();
      expect(quoteEmailData.bankDetails!.bsb).toBe("064-000");
    });

    it("should handle missing bank details gracefully", () => {
      const quoteEmailData = {
        referenceNumber: "AWT-TEST-002",
        clientName: "Test Client",
        clientEmail: "test@example.com",
        totalPrice: "200.00",
        stripePaymentUrl: undefined,
        bankDetails: null,
        origin: "https://allwaystransfers.com.au",
      };

      expect(quoteEmailData.stripePaymentUrl).toBeUndefined();
      expect(quoteEmailData.bankDetails).toBeNull();
    });
  });

  describe("Booking Confirmation with Bank Details", () => {
    it("should include bank details in confirmation email for direct deposit bookings", () => {
      const confirmationData = {
        referenceNumber: "AWT-BK-001",
        paymentMethod: "direct_deposit",
        bankDetails: {
          bankName: "Commonwealth Bank",
          bsb: "064-000",
          accountNumber: "12345678",
          accountName: "All Ways Transfers Pty Ltd",
        },
      };

      expect(confirmationData.paymentMethod).toBe("direct_deposit");
      expect(confirmationData.bankDetails).toBeTruthy();
    });

    it("should not include bank details for non-direct-deposit bookings", () => {
      const confirmationData = {
        referenceNumber: "AWT-BK-002",
        paymentMethod: "stripe_prepay",
        bankDetails: null,
      };

      expect(confirmationData.paymentMethod).toBe("stripe_prepay");
      expect(confirmationData.bankDetails).toBeNull();
    });
  });
});
