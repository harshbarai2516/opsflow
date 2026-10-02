import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
/* =====================================================
   GET ALL CUSTOMERS
===================================================== */

export async function getCustomers(
  _req: Request,
  res: Response
) {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error("GET CUSTOMERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
    });
  }
}

/* =====================================================
   CREATE CUSTOMER
===================================================== */

export async function createCustomer(
  req: Request,
  res: Response
) {
  try {
    const {
      name,
      companyName,
      email,
      phone,
      gstin,
      address,
      city,
      creditLimit,
      status,
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required",
      });
    }

    if (gstin) {
      const existingCustomer =
        await prisma.customer.findFirst({
          where: {
            gstin,
          },
        });

      if (existingCustomer) {
        return res.status(409).json({
          success: false,
          message:
            "Customer with this GSTIN already exists",
        });
      }
    }

    const data = {
      name,
      phone,
      ...(companyName && { companyName }),
      ...(email && { email }),
      ...(gstin && { gstin }),
      ...(address && { address }),
      ...(city && { city }),
      ...(creditLimit !== undefined &&
        creditLimit !== null && {
          creditLimit: Number(creditLimit),
        }),
      ...(status && { status }),
    };

    const customer = await prisma.customer.create({
      data,
    });

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error) {
    console.error(
      "CREATE CUSTOMER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create customer",
    });
  }
}

/* =====================================================
   GET CUSTOMER BY ID
===================================================== */

export async function getCustomerById(
  req: Request,
  res: Response
) {

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer =
      await prisma.customer.findUnique({
        where: {
          id,
        },
        include: {
          orders: {
            orderBy: {
              createdAt: "desc",
            },
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          },

          invoices: {
            orderBy: {
              createdAt: "desc",
            },
            include: {
              payments: {
                orderBy: {
                  paymentDate: "desc",
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

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    /* =================================================
       ORDER SUMMARY
    ================================================= */

    const totalOrders = customer.orders.length;

    const totalOrderValue = customer.orders.reduce(
      (sum, order) => sum + order.total,
      0
    );

    const deliveredOrders = customer.orders.filter(
      (order) => order.status === "DELIVERED"
    ).length;

    /* =================================================
       INVOICE SUMMARY
    ================================================= */

    const totalInvoices = customer.invoices.length;

    const totalInvoiced = customer.invoices.reduce(
      (sum, invoice) => sum + invoice.total,
      0
    );

    /* =================================================
       PAYMENT SUMMARY
    ================================================= */

    const totalPaid = customer.payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    /* =================================================
       OUTSTANDING
    ================================================= */

    const outstandingBalance = Math.max(
      totalInvoiced - totalPaid,
      0
    );

    /* =================================================
       AVAILABLE CREDIT
    ================================================= */

    const creditLimit = customer.creditLimit ?? 0;

    const availableCredit = Math.max(
      creditLimit - outstandingBalance,
      0
    );

    /* =================================================
       RESPONSE
    ================================================= */

    return res.status(200).json({
      success: true,

      data: {
        ...customer,

        summary: {
          totalOrders,
          deliveredOrders,
          totalOrderValue,
          totalInvoices,
          totalInvoiced,
          totalPaid,
          outstandingBalance,
          creditLimit,
          availableCredit,
        },
      },
    });
  } catch (error) {
    console.error(
      "GET CUSTOMER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer",
    });
  }
}

/* =====================================================
   UPDATE CUSTOMER
===================================================== */

export async function updateCustomer(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const existingCustomer =
      await prisma.customer.findUnique({
        where: {
          id,
        },
      });

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const {
      name,
      companyName,
      email,
      phone,
      gstin,
      address,
      city,
      creditLimit,
      status,
    } = req.body;

    if (
      gstin &&
      gstin !== existingCustomer.gstin
    ) {
      const gstinExists =
        await prisma.customer.findFirst({
          where: {
            gstin,
            NOT: {
              id,
            },
          },
        });

      if (gstinExists) {
        return res.status(409).json({
          success: false,
          message:
            "GSTIN already belongs to another customer",
        });
      }
    }

    const customer =
      await prisma.customer.update({
        where: {
          id,
        },
        data: {
          ...(name !== undefined && {
            name,
          }),

          ...(companyName !== undefined && {
            companyName,
          }),

          ...(email !== undefined && {
            email,
          }),

          ...(phone !== undefined && {
            phone,
          }),

          ...(gstin !== undefined && {
            gstin,
          }),

          ...(address !== undefined && {
            address,
          }),

          ...(city !== undefined && {
            city,
          }),

          ...(creditLimit !== undefined && {
            creditLimit:
              creditLimit === null
                ? null
                : Number(creditLimit),
          }),

          ...(status !== undefined && {
            status,
          }),
        },
      });

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error) {
    console.error(
      "UPDATE CUSTOMER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update customer",
    });
  }
}

/* =====================================================
   DELETE CUSTOMER
===================================================== */

export async function deleteCustomer(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const existingCustomer =
      await prisma.customer.findUnique({
        where: {
          id,
        },
      });

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    await prisma.customer.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE CUSTOMER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete customer",
    });
  }
}