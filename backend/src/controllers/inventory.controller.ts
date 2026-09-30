import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

const VALID_TRANSACTION_TYPES = [
  "PURCHASE",
  "SALE",
  "DAMAGE",
  "RETURN",
  "ADJUSTMENT",
] as const;

type TransactionType =
  (typeof VALID_TRANSACTION_TYPES)[number];

/**
 * Create an inventory transaction
 *
 * PURCHASE   -> increases stock
 * RETURN     -> increases stock
 * ADJUSTMENT -> increases stock
 * SALE       -> decreases stock
 * DAMAGE     -> decreases stock
 */
export async function createInventoryTransaction(
  req: Request,
  res: Response
) {
  try {
    const {
      productId,
      type,
      quantity,
      note,
    } = req.body;

    // -----------------------------
    // Validate product ID
    // -----------------------------

    const parsedProductId = Number(productId);

    if (
      !Number.isInteger(parsedProductId) ||
      parsedProductId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid productId is required",
      });
    }

    // -----------------------------
    // Validate transaction type
    // -----------------------------

    if (
      !VALID_TRANSACTION_TYPES.includes(
        type as TransactionType
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid transaction type. Use PURCHASE, SALE, DAMAGE, RETURN, or ADJUSTMENT",
      });
    }

    // -----------------------------
    // Validate quantity
    // -----------------------------

    const parsedQuantity = Number(quantity);

    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    // -----------------------------
    // Calculate stock change
    // -----------------------------

    const stockChange =
      type === "SALE" || type === "DAMAGE"
        ? -parsedQuantity
        : parsedQuantity;

    // -----------------------------
    // Database transaction
    // -----------------------------

    const result = await prisma.$transaction(
      async (tx) => {
        // Find product
        const product = await tx.product.findUnique({
          where: {
            id: parsedProductId,
          },
        });

        if (!product) {
          const error = new Error(
            "Product not found"
          );

          error.name = "PRODUCT_NOT_FOUND";

          throw error;
        }

        // Calculate new stock
        const newStock =
          product.currentStock + stockChange;

        // Prevent negative inventory
        if (newStock < 0) {
          const error = new Error(
            "Insufficient stock for this transaction"
          );

          error.name = "INSUFFICIENT_STOCK";

          throw error;
        }

        // Update product stock
        const updatedProduct =
          await tx.product.update({
            where: {
              id: parsedProductId,
            },
            data: {
              currentStock: newStock,
            },
          });

        // Create inventory transaction
        const transaction =
          await tx.inventoryTransaction.create({
            data: {
              productId: parsedProductId,
              type,
              quantity: stockChange,
              note: note || null,
            },
          });

        return {
          product: updatedProduct,
          transaction,
        };
      }
    );

    // -----------------------------
    // Success response
    // -----------------------------

    return res.status(201).json({
      success: true,
      message:
        "Inventory transaction created successfully",
      data: result,
    });
  } catch (error) {
    console.error(
      "CREATE INVENTORY TRANSACTION ERROR:",
      error
    );

    // Product not found
    if (
      error instanceof Error &&
      error.name === "PRODUCT_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Insufficient stock
    if (
      error instanceof Error &&
      error.name === "INSUFFICIENT_STOCK"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Insufficient stock for this transaction",
      });
    }

    // Generic server error
    return res.status(500).json({
      success: false,
      message:
        "Failed to create inventory transaction",
    });
  }
}

/**
 * Get all inventory transactions
 */
export async function getInventoryTransactions(
  req: Request,
  res: Response
) {
  try {
    const transactions =
      await prisma.inventoryTransaction.findMany({
        orderBy: {
          createdAt: "desc",
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              unit: true,
            },
          },
        },
      });

    return res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error(
      "GET INVENTORY TRANSACTIONS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch inventory transactions",
    });
  }
}

/**
 * Get inventory history for a specific product
 */
export async function getProductInventoryHistory(
  req: Request,
  res: Response
) {
  try {
    const productId = Number(
      req.params.productId
    );

    if (
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Find product
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        unit: true,
        currentStock: true,
        minimumStock: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Find transactions
    const transactions =
      await prisma.inventoryTransaction.findMany({
        where: {
          productId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return res.status(200).json({
      success: true,
      data: {
        product,
        transactions,
      },
    });
  } catch (error) {
    console.error(
      "GET PRODUCT INVENTORY HISTORY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch product inventory history",
    });
  }
}

