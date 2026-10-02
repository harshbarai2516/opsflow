import { prisma } from "../lib/prisma.js";
const VALID_STATUSES = [
    "PENDING",
    "CONFIRMED",
    "DISPATCHED",
    "DELIVERED",
    "CANCELLED",
];
function generateOrderNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${year}${month}${day}-${randomPart}`;
}
function generateInvoiceNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `INV-${year}${month}${day}-${randomPart}`;
}
// ==========================================
// CREATE ORDER
// ==========================================
export async function createOrder(req, res) {
    try {
        const { customerId, items, discount = 0, notes, } = req.body;
        // -----------------------------
        // Validate customer
        // -----------------------------
        const parsedCustomerId = Number(customerId);
        if (!Number.isInteger(parsedCustomerId) ||
            parsedCustomerId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid customerId is required",
            });
        }
        // -----------------------------
        // Validate items
        // -----------------------------
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one order item is required",
            });
        }
        // -----------------------------
        // Validate discount
        // -----------------------------
        const parsedDiscount = Number(discount);
        if (!Number.isFinite(parsedDiscount) ||
            parsedDiscount < 0) {
            return res.status(400).json({
                success: false,
                message: "Discount cannot be negative",
            });
        }
        // -----------------------------
        // Check customer
        // -----------------------------
        const customer = await prisma.customer.findUnique({
            where: {
                id: parsedCustomerId,
            },
        });
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }
        // -----------------------------
        // Validate products + quantities
        // -----------------------------
        const validatedItems = [];
        for (const item of items) {
            const parsedProductId = Number(item.productId);
            const parsedQuantity = Number(item.quantity);
            if (!Number.isInteger(parsedProductId) ||
                parsedProductId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid product ID",
                });
            }
            if (!Number.isFinite(parsedQuantity) ||
                parsedQuantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Order item quantity must be greater than 0",
                });
            }
            const product = await prisma.product.findUnique({
                where: {
                    id: parsedProductId,
                },
            });
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product ${parsedProductId} not found`,
                });
            }
            if (product.status !== "ACTIVE") {
                return res.status(400).json({
                    success: false,
                    message: `${product.name} is not active`,
                });
            }
            const lineTotal = product.sellingPrice * parsedQuantity;
            validatedItems.push({
                productId: product.id,
                quantity: parsedQuantity,
                unitPrice: product.sellingPrice,
                total: lineTotal,
            });
        }
        // -----------------------------
        // Calculate totals
        // -----------------------------
        const subtotal = validatedItems.reduce((sum, item) => sum + item.total, 0);
        if (parsedDiscount > subtotal) {
            return res.status(400).json({
                success: false,
                message: "Discount cannot be greater than subtotal",
            });
        }
        const total = subtotal - parsedDiscount;
        // -----------------------------
        // Generate unique order number
        // -----------------------------
        let orderNumber = generateOrderNumber();
        let existingOrder = await prisma.order.findUnique({
            where: {
                orderNumber,
            },
        });
        while (existingOrder) {
            orderNumber = generateOrderNumber();
            existingOrder =
                await prisma.order.findUnique({
                    where: {
                        orderNumber,
                    },
                });
        }
        // -----------------------------
        // Create order
        // -----------------------------
        const order = await prisma.order.create({
            data: {
                orderNumber,
                customerId: parsedCustomerId,
                status: "PENDING",
                subtotal,
                discount: parsedDiscount,
                total,
                notes: notes || null,
                items: {
                    create: validatedItems,
                },
            },
            include: {
                customer: true,
                items: {
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
                },
            },
        });
        return res.status(201).json({
            success: true,
            message: "Order created successfully",
            data: order,
        });
    }
    catch (error) {
        console.error("CREATE ORDER ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create order",
        });
    }
}
// ==========================================
// GET ALL ORDERS
// ==========================================
export async function getOrders(req, res) {
    try {
        const orders = await prisma.order.findMany({
            orderBy: {
                createdAt: "desc",
            },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        companyName: true,
                        phone: true,
                    },
                },
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                                unit: true,
                                currentStock: true,
                            },
                        },
                    },
                },
            },
        });
        return res.status(200).json({
            success: true,
            data: orders,
        });
    }
    catch (error) {
        console.error("GET ORDERS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch orders",
        });
    }
}
// ==========================================
// GET ORDER BY ID
// ==========================================
export async function getOrderById(req, res) {
    try {
        const orderId = Number(req.params.id);
        if (!Number.isInteger(orderId) ||
            orderId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID",
            });
        }
        const order = await prisma.order.findUnique({
            where: {
                id: orderId,
            },
            include: {
                customer: true,
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                                unit: true,
                                sellingPrice: true,
                                currentStock: true,
                            },
                        },
                    },
                },
            },
        });
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }
        return res.status(200).json({
            success: true,
            data: order,
        });
    }
    catch (error) {
        console.error("GET ORDER ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch order",
        });
    }
}
// ==========================================
// UPDATE ORDER STATUS
// ==========================================
export async function updateOrderStatus(req, res) {
    try {
        const orderId = Number(req.params.id);
        const { status } = req.body;
        // --------------------------------
        // Validate order ID
        // --------------------------------
        if (!Number.isInteger(orderId) ||
            orderId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID",
            });
        }
        // --------------------------------
        // Validate status
        // --------------------------------
        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status",
            });
        }
        // --------------------------------
        // Get order
        // --------------------------------
        const order = await prisma.order.findUnique({
            where: {
                id: orderId,
            },
            include: {
                items: true,
            },
        });
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }
        // --------------------------------
        // Prevent invalid modifications
        // --------------------------------
        if (order.status === "DELIVERED" ||
            order.status === "CANCELLED") {
            return res.status(400).json({
                success: false,
                message: "Completed or cancelled orders cannot be modified",
            });
        }
        // --------------------------------
        // Don't confirm an already
        // confirmed order
        // --------------------------------
        if (order.status === "CONFIRMED" &&
            status === "CONFIRMED") {
            return res.status(400).json({
                success: false,
                message: "Order is already confirmed",
            });
        }
        // --------------------------------
        // CONFIRM ORDER
        // --------------------------------
        if (order.status === "PENDING" &&
            status === "CONFIRMED") {
            const confirmedOrder = await prisma.$transaction(async (tx) => {
                // ==============================
                // STEP 1
                // Check stock for EVERY item
                // ==============================
                for (const item of order.items) {
                    const product = await tx.product.findUnique({
                        where: {
                            id: item.productId,
                        },
                    });
                    if (!product) {
                        throw new Error(`Product ${item.productId} not found`);
                    }
                    if (product.currentStock <
                        item.quantity) {
                        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.currentStock}, Required: ${item.quantity}`);
                    }
                }
                // ==============================
                // STEP 2
                // Deduct stock + create SALE
                // transactions
                // ==============================
                for (const item of order.items) {
                    const product = await tx.product.findUnique({
                        where: {
                            id: item.productId,
                        },
                    });
                    if (!product) {
                        throw new Error(`Product ${item.productId} not found`);
                    }
                    const newStock = product.currentStock -
                        item.quantity;
                    // Update stock
                    await tx.product.update({
                        where: {
                            id: product.id,
                        },
                        data: {
                            currentStock: newStock,
                        },
                    });
                    // Create inventory transaction
                    await tx.inventoryTransaction.create({
                        data: {
                            productId: product.id,
                            type: "SALE",
                            quantity: -item.quantity,
                            note: `Order ${order.orderNumber}`,
                        },
                    });
                }
                // ==============================
                // STEP 3
                // Create invoice
                // ==============================
                await tx.invoice.create({
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
                });
                // ==============================
                // STEP 4
                // Confirm order
                // ==============================
                return tx.order.update({
                    where: {
                        id: orderId,
                    },
                    data: {
                        status: "CONFIRMED",
                    },
                    include: {
                        customer: {
                            select: {
                                id: true,
                                name: true,
                                companyName: true,
                                phone: true,
                            },
                        },
                        items: {
                            include: {
                                product: {
                                    select: {
                                        id: true,
                                        name: true,
                                        sku: true,
                                        unit: true,
                                        currentStock: true,
                                    },
                                },
                            },
                        },
                    },
                });
            });
            return res.status(200).json({
                success: true,
                message: "Order confirmed and inventory updated successfully",
                data: confirmedOrder,
            });
        }
        // --------------------------------
        // Other status changes
        // --------------------------------
        const updatedOrder = await prisma.order.update({
            where: {
                id: orderId,
            },
            data: {
                status,
            },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        companyName: true,
                        phone: true,
                    },
                },
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                                unit: true,
                                currentStock: true,
                            },
                        },
                    },
                },
            },
        });
        return res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            data: updatedOrder,
        });
    }
    catch (error) {
        console.error("UPDATE ORDER STATUS ERROR:", error);
        return res.status(400).json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Failed to update order status",
        });
    }
}
//# sourceMappingURL=order.controller.js.map