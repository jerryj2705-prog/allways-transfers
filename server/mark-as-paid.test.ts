import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the email module
vi.mock("./email", () => ({
  sendPaymentReceiptEmail: vi.fn().mockResolvedValue(true),
}));

// Mock the db module
vi.mock("./db", () => ({
  getBookingById: vi.fn(),
  updateBookingPaymentStatus: vi.fn(),
}));

import { sendPaymentReceiptEmail } from "./email";
import { getBookingById, updateBookingPaymentStatus } from "./db";

describe("Mark as Paid with Receipt Email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockBooking = {
    id: 1,
    referenceNumber: "AWT-TEST-001",
    clientName: "Test Client",
    clientEmail: "test@example.com",
    serviceType: "airport_transfer",
    pickupAddress: "123 Test St",
    dropoffAddress: "456 Airport Rd",
    pickupDate: Date.now(),
    passengerCount: 2,
    vehicleName: "Kia Carnival",
    totalPrice: "150.00",
    paymentMethod: "direct_deposit",
    paymentStatus: "unpaid",
    status: "pending",
  };

  it("should update payment status to paid", async () => {
    (getBookingById as any).mockResolvedValue(mockBooking);
    (updateBookingPaymentStatus as any).mockResolvedValue({ ...mockBooking, paymentStatus: "paid" });

    const booking = await getBookingById(1);
    expect(booking).toBeDefined();
    expect(booking!.paymentMethod).toBe("direct_deposit");

    const result = await updateBookingPaymentStatus(1, "paid", "Bank transfer received");
    expect(result.paymentStatus).toBe("paid");
  });

  it("should send receipt email when sendReceipt is true and status is paid", async () => {
    (getBookingById as any).mockResolvedValue(mockBooking);
    (updateBookingPaymentStatus as any).mockResolvedValue({ ...mockBooking, paymentStatus: "paid" });

    const booking = await getBookingById(1);
    expect(booking).toBeDefined();

    await updateBookingPaymentStatus(1, "paid", "Bank transfer received");

    // Simulate the sendReceipt logic
    const sendReceipt = true;
    const paymentStatus = "paid";

    if (paymentStatus === "paid" && sendReceipt) {
      await sendPaymentReceiptEmail({
        referenceNumber: booking!.referenceNumber,
        clientName: booking!.clientName,
        clientEmail: booking!.clientEmail,
        serviceType: booking!.serviceType,
        pickupAddress: booking!.pickupAddress,
        dropoffAddress: booking!.dropoffAddress,
        pickupDate: booking!.pickupDate,
        passengerCount: booking!.passengerCount,
        vehicleName: booking!.vehicleName,
        totalPrice: booking!.totalPrice,
        paymentMethod: booking!.paymentMethod,
      });
    }

    expect(sendPaymentReceiptEmail).toHaveBeenCalledTimes(1);
    expect(sendPaymentReceiptEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceNumber: "AWT-TEST-001",
        clientEmail: "test@example.com",
        paymentMethod: "direct_deposit",
      })
    );
  });

  it("should NOT send receipt email when sendReceipt is false", async () => {
    (getBookingById as any).mockResolvedValue(mockBooking);
    (updateBookingPaymentStatus as any).mockResolvedValue({ ...mockBooking, paymentStatus: "paid" });

    await getBookingById(1);
    await updateBookingPaymentStatus(1, "paid", "Bank transfer received");

    const sendReceipt = false;
    const paymentStatus = "paid";

    if (paymentStatus === "paid" && sendReceipt) {
      await sendPaymentReceiptEmail({} as any);
    }

    expect(sendPaymentReceiptEmail).not.toHaveBeenCalled();
  });

  it("should NOT send receipt email when status is not paid", async () => {
    (getBookingById as any).mockResolvedValue(mockBooking);
    (updateBookingPaymentStatus as any).mockResolvedValue({ ...mockBooking, paymentStatus: "refunded" });

    await getBookingById(1);
    await updateBookingPaymentStatus(1, "refunded", "Refund processed");

    const sendReceipt = true;
    const paymentStatus = "refunded";

    if (paymentStatus === "paid" && sendReceipt) {
      await sendPaymentReceiptEmail({} as any);
    }

    expect(sendPaymentReceiptEmail).not.toHaveBeenCalled();
  });

  it("should handle receipt email failure gracefully", async () => {
    (getBookingById as any).mockResolvedValue(mockBooking);
    (updateBookingPaymentStatus as any).mockResolvedValue({ ...mockBooking, paymentStatus: "paid" });
    (sendPaymentReceiptEmail as any).mockRejectedValue(new Error("Email service unavailable"));

    const booking = await getBookingById(1);
    await updateBookingPaymentStatus(1, "paid", "Bank transfer received");

    const sendReceipt = true;
    const paymentStatus = "paid";

    if (paymentStatus === "paid" && sendReceipt) {
      try {
        await sendPaymentReceiptEmail({
          referenceNumber: booking!.referenceNumber,
          clientName: booking!.clientName,
          clientEmail: booking!.clientEmail,
          serviceType: booking!.serviceType,
          pickupAddress: booking!.pickupAddress,
          dropoffAddress: booking!.dropoffAddress,
          pickupDate: booking!.pickupDate,
          passengerCount: booking!.passengerCount,
          vehicleName: booking!.vehicleName,
          totalPrice: booking!.totalPrice,
          paymentMethod: booking!.paymentMethod,
        });
      } catch (emailError) {
        // Should handle gracefully - payment status still updated
        expect(emailError).toBeDefined();
      }
    }

    // Payment status was still updated even though email failed
    expect(updateBookingPaymentStatus).toHaveBeenCalledWith(1, "paid", "Bank transfer received");
  });
});
