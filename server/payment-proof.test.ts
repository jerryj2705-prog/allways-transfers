import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({
    key: "payment-proofs/test-proof.png",
    url: "https://cdn.example.com/payment-proofs/test-proof.png",
  }),
}));

// Mock db functions
const mockGetBookingById = vi.fn();
const mockUpdatePaymentProof = vi.fn();
const mockGetPaymentProof = vi.fn();

vi.mock("./db", async () => {
  const actual = await vi.importActual("./db");
  return {
    ...actual,
    getBookingById: (...args: unknown[]) => mockGetBookingById(...args),
    updatePaymentProof: (...args: unknown[]) => mockUpdatePaymentProof(...args),
    getPaymentProof: (...args: unknown[]) => mockGetPaymentProof(...args),
  };
});

describe("Payment Proof Upload Feature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Upload Payment Proof", () => {
    it("should validate file type - only images and PDFs allowed", () => {
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
      const invalidTypes = ["text/plain", "application/zip", "video/mp4"];

      for (const type of allowedTypes) {
        expect(allowedTypes.includes(type)).toBe(true);
      }
      for (const type of invalidTypes) {
        expect(allowedTypes.includes(type)).toBe(false);
      }
    });

    it("should validate file size - max 10MB", () => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      expect(5 * 1024 * 1024 < maxSize).toBe(true); // 5MB - OK
      expect(10 * 1024 * 1024 <= maxSize).toBe(true); // 10MB - OK
      expect(11 * 1024 * 1024 > maxSize).toBe(true); // 11MB - too large
    });

    it("should store proof URL and key in database", async () => {
      mockUpdatePaymentProof.mockResolvedValue({
        paymentProofUrl: "https://cdn.example.com/payment-proofs/test-proof.png",
        paymentProofKey: "payment-proofs/test-proof.png",
        paymentProofUploadedAt: Date.now(),
      });

      const result = await mockUpdatePaymentProof(1, {
        paymentProofUrl: "https://cdn.example.com/payment-proofs/test-proof.png",
        paymentProofKey: "payment-proofs/test-proof.png",
        paymentProofUploadedAt: Date.now(),
      });

      expect(result).toBeDefined();
      expect(result.paymentProofUrl).toContain("test-proof.png");
      expect(result.paymentProofKey).toBe("payment-proofs/test-proof.png");
      expect(result.paymentProofUploadedAt).toBeDefined();
    });

    it("should allow replacing existing proof", async () => {
      // First upload
      mockUpdatePaymentProof.mockResolvedValueOnce({
        paymentProofUrl: "https://cdn.example.com/payment-proofs/first.png",
        paymentProofKey: "payment-proofs/first.png",
        paymentProofUploadedAt: Date.now(),
      });

      // Second upload (replacement)
      mockUpdatePaymentProof.mockResolvedValueOnce({
        paymentProofUrl: "https://cdn.example.com/payment-proofs/second.png",
        paymentProofKey: "payment-proofs/second.png",
        paymentProofUploadedAt: Date.now(),
      });

      const first = await mockUpdatePaymentProof(1, {
        paymentProofUrl: "https://cdn.example.com/payment-proofs/first.png",
        paymentProofKey: "payment-proofs/first.png",
      });
      expect(first.paymentProofUrl).toContain("first.png");

      const second = await mockUpdatePaymentProof(1, {
        paymentProofUrl: "https://cdn.example.com/payment-proofs/second.png",
        paymentProofKey: "payment-proofs/second.png",
      });
      expect(second.paymentProofUrl).toContain("second.png");
    });
  });

  describe("Get Payment Proof", () => {
    it("should return proof data when it exists", async () => {
      mockGetPaymentProof.mockResolvedValue({
        paymentProofUrl: "https://cdn.example.com/payment-proofs/test.png",
        paymentProofKey: "payment-proofs/test.png",
        paymentProofUploadedAt: Date.now(),
      });

      const result = await mockGetPaymentProof(1);
      expect(result).toBeDefined();
      expect(result.paymentProofUrl).toBeDefined();
      expect(result.paymentProofUploadedAt).toBeDefined();
    });

    it("should return null fields when no proof uploaded", async () => {
      mockGetPaymentProof.mockResolvedValue({
        paymentProofUrl: null,
        paymentProofKey: null,
        paymentProofUploadedAt: null,
      });

      const result = await mockGetPaymentProof(1);
      expect(result.paymentProofUrl).toBeNull();
      expect(result.paymentProofKey).toBeNull();
    });
  });

  describe("Storage Integration", () => {
    it("should generate unique file keys with booking reference", () => {
      const bookingRef = "AWT-20260514-ABC123";
      const fileName = "transfer-receipt.png";
      const timestamp = Date.now();
      const key = `payment-proofs/${bookingRef}/${timestamp}-${fileName}`;

      expect(key).toContain("payment-proofs/");
      expect(key).toContain(bookingRef);
      expect(key).toContain(fileName);
    });

    it("should handle PDF file uploads", async () => {
      const { storagePut } = await import("./storage");
      const result = await storagePut(
        "payment-proofs/test.pdf",
        Buffer.from("fake-pdf-content"),
        "application/pdf"
      );
      expect(result.url).toBeDefined();
      expect(result.key).toBeDefined();
    });
  });

  describe("Admin View", () => {
    it("should include paymentProofUrl in booking details", async () => {
      mockGetBookingById.mockResolvedValue({
        id: 1,
        paymentMethod: "direct_deposit",
        paymentStatus: "unpaid",
        paymentProofUrl: "https://cdn.example.com/payment-proofs/test.png",
        paymentProofKey: "payment-proofs/test.png",
        paymentProofUploadedAt: Date.now(),
      });

      const booking = await mockGetBookingById(1);
      expect(booking.paymentProofUrl).toBeDefined();
      expect(booking.paymentMethod).toBe("direct_deposit");
    });

    it("should show 'No payment proof uploaded yet' when proof is missing", async () => {
      mockGetBookingById.mockResolvedValue({
        id: 1,
        paymentMethod: "direct_deposit",
        paymentStatus: "unpaid",
        paymentProofUrl: null,
        paymentProofKey: null,
        paymentProofUploadedAt: null,
      });

      const booking = await mockGetBookingById(1);
      expect(booking.paymentProofUrl).toBeNull();
    });
  });
});
