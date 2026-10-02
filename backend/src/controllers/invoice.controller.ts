import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

function generateInvoiceNumber() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const random = Math.floor(1000 + Math.random() * 9000);

  return `INV-${year}${month}${day}-${random}`;
}

export async function getInvoices(
  req: Request,
  res: Response
) {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        customer: true,
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        payments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const invoicesWithPaymentSummary = invoices.map(
      (invoice) => {
        const paidAmount = invoice.payments.reduce(
          (sum, payment) => sum + payment.amount,
          0
        );

        const outstanding = Math.max(
          invoice.total - paidAmount,
          0
        );

        return {
          ...invoice,
          paidAmount,
          outstanding,
        };
      }
    );

    return res.status(200).json({
      success: true,
      data: invoicesWithPaymentSummary,
    });
  } catch (error) {
    console.error("GET INVOICES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoices",
    });
  }
}

export async function getInvoiceById(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice ID",
      });
    }

    const invoice = await prisma.invoice.findUnique({
      where: {
        id,
      },
      include: {
        customer: true,
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        payments: {
          orderBy: {
            paymentDate: "desc",
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const paidAmount = invoice.payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    const outstanding = Math.max(
      invoice.total - paidAmount,
      0
    );

    return res.status(200).json({
      success: true,
      data: {
        ...invoice,
        paidAmount,
        outstanding,
      },
    });
  } catch (error) {
    console.error("GET INVOICE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoice",
    });
  }
}

export async function createInvoice(
  req: Request,
  res: Response
) {
  try {
    const { orderId } = req.body;

    const parsedOrderId = Number(orderId);

    if (!Number.isInteger(parsedOrderId)) {
      return res.status(400).json({
        success: false,
        message: "Valid orderId is required",
      });
    }

    const order = await prisma.order.findUnique({
      where: {
        id: parsedOrderId,
      },
      include: {
        invoice: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status === "PENDING") {
      return res.status(400).json({
        success: false,
        message:
          "Invoice cannot be created for a pending order",
      });
    }

    if (order.invoice) {
      return res.status(409).json({
        success: false,
        message: "Invoice already exists for this order",
        data: order.invoice,
      });
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        customerId: order.customerId,
        orderId: order.id,
        subtotal: order.subtotal,
        discount: order.discount,
        tax: 0,
        total: order.total,
        status: "UNPAID",
      },
      include: {
        customer: true,
        order: true,
        payments: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: invoice,
    });
  } catch (error) {
    console.error("CREATE INVOICE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create invoice",
    });
  }
}