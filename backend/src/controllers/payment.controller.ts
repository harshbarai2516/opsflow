import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

function generatePaymentNumber() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const random = Math.floor(1000 + Math.random() * 9000);

  return `PAY-${year}${month}${day}-${random}`;
}

// ==========================================
// GET ALL PAYMENTS
// ==========================================

export async function getPayments(
  req: Request,
  res: Response
) {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        customer: true,
        invoice: true,
      },
      orderBy: {
        paymentDate: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("GET PAYMENTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
    });
  }
}

// ==========================================
// GET PAYMENT BY ID
// ==========================================

export async function getPaymentById(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID",
      });
    }

    const payment = await prisma.payment.findUnique({
      where: {
        id,
      },
      include: {
        customer: true,
        invoice: true,
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("GET PAYMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment",
    });
  }
}

// ==========================================
// CREATE PAYMENT
// ==========================================

export async function createPayment(
  req: Request,
  res: Response
) {
  try {
    const {
      invoiceId,
      amount,
      paymentMethod,
      reference,
      notes,
    } = req.body;

    // ==========================================
    // STEP 1
    // Validate invoice ID
    // ==========================================

    const parsedInvoiceId = Number(invoiceId);

    if (!Number.isInteger(parsedInvoiceId)) {
      return res.status(400).json({
        success: false,
        message: "Valid invoiceId is required",
      });
    }

    // ==========================================
    // STEP 2
    // Validate amount
    // ==========================================

    const parsedAmount = Number(amount);

    if (
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be greater than 0",
      });
    }

    // ==========================================
    // STEP 3
    // Validate payment method
    // ==========================================

    if (
      !paymentMethod ||
      typeof paymentMethod !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment method is required",
      });
    }

    // ==========================================
    // STEP 4
    // Get invoice + existing payments
    // ==========================================

    const invoice = await prisma.invoice.findUnique({
      where: {
        id: parsedInvoiceId,
      },
      include: {
        payments: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // ==========================================
    // STEP 5
    // Calculate outstanding amount
    // ==========================================

    const paidAmount = invoice.payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    const outstanding = Math.max(
      invoice.total - paidAmount,
      0
    );

    // ==========================================
    // STEP 6
    // Prevent overpayment
    // ==========================================

    if (parsedAmount > outstanding) {
      return res.status(400).json({
        success: false,
        message: "Payment amount exceeds outstanding balance",
        data: {
          invoiceTotal: invoice.total,
          paidAmount,
          outstanding,
        },
      });
    }

    // ==========================================
    // STEP 7
    // Create payment + update invoice
    // in ONE transaction
    // ==========================================

    const result = await prisma.$transaction(
      async (tx) => {
        const payment =
          await tx.payment.create({
            data: {
              paymentNumber:
                generatePaymentNumber(),

              customerId: invoice.customerId,
              invoiceId: invoice.id,

              amount: parsedAmount,
              paymentMethod,
              reference:
                reference || null,
              notes:
                notes || null,
            },
          });

        const newPaidAmount =
          paidAmount + parsedAmount;

        let invoiceStatus = "UNPAID";

        if (
          newPaidAmount >= invoice.total
        ) {
          invoiceStatus = "PAID";
        } else if (
          newPaidAmount > 0
        ) {
          invoiceStatus =
            "PARTIALLY_PAID";
        }

        const updatedInvoice =
          await tx.invoice.update({
            where: {
              id: invoice.id,
            },
            data: {
              status: invoiceStatus,
            },
          });

        return {
          payment,
          invoice: updatedInvoice,
          paidAmount: newPaidAmount,
          outstanding: Math.max(
            invoice.total -
              newPaidAmount,
            0
          ),
        };
      }
    );

    return res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: result,
    });
  } catch (error) {
    console.error("CREATE PAYMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create payment",
    });
  }
}