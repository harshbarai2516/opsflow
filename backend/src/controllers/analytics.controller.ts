import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export async function getAnalyticsSummary(
    req: Request,
    res: Response
) {
    try {
        const [
            customers,
            products,
            orders,
            invoices,
            paymentTotal,
            payments,
        ] = await Promise.all([
            prisma.customer.findMany({
                select: {
                    id: true,
                },
            }),

            prisma.product.findMany({
                select: {
                    id: true,
                    name: true,
                    currentStock: true,
                },
            }),

            prisma.order.findMany({
                select: {
                    id: true,
                    status: true,
                    total: true,
                    createdAt: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
            }),

            prisma.invoice.findMany({
                select: {
                    id: true,
                    total: true,
                    status: true,
                    createdAt: true,
                    payments: {
                        select: {
                            amount: true,
                        },
                    },
                },
            }),

            prisma.payment.aggregate({
                _sum: {
                    amount: true,
                },
            }),

            prisma.payment.findMany({
                select: {
                    id: true,
                    paymentNumber: true,
                    amount: true,
                    paymentMethod: true,
                    paymentDate: true,
                    reference: true,
                    customer: {
                        select: {
                            name: true,
                            companyName: true,
                        },
                    },
                    invoice: {
                        select: {
                            invoiceNumber: true,
                        },
                    },
                },
                orderBy: {
                    paymentDate: "desc",
                },
                take: 10,
            }),
        ]);

        // --------------------------------
        // ORDER METRICS
        // --------------------------------

        const activeOrders = orders.filter(
            (order) => order.status !== "CANCELLED"
        );

        const totalSales = activeOrders.reduce(
            (sum, order) => sum + Number(order.total || 0),
            0
        );

        const totalOrders = activeOrders.length;

        // --------------------------------
        // PAYMENT METRICS
        // --------------------------------

        const totalCollected =Number(paymentTotal._sum.amount || 0);

        // --------------------------------
        // RECEIVABLES
        // --------------------------------

        const totalInvoiced = invoices.reduce(
            (sum, invoice) =>
                sum + Number(invoice.total || 0),
            0
        );

        const outstanding = Math.max(
            totalInvoiced - Number(totalCollected),
            0
        );

        // --------------------------------
        // LOW STOCK
        // --------------------------------

        const lowStockProducts = products.filter(
            (product) =>
                Number(product.currentStock || 0) <= 10
        );

        // --------------------------------
        // ORDER STATUS
        // --------------------------------

        const orderStatus = orders.reduce<
            Record<string, number>
        >((result, order) => {
            result[order.status] =
                (result[order.status] || 0) + 1;

            return result;
        }, {});

        // --------------------------------
        // LAST 7 DAYS REVENUE
        // --------------------------------

        const today = new Date();

        const revenueTrend = Array.from(
            { length: 7 },
            (_, index) => {
                const date = new Date(today);

                date.setHours(0, 0, 0, 0);
                date.setDate(
                    today.getDate() - (6 - index)
                );

                const nextDate = new Date(date);
                nextDate.setDate(date.getDate() + 1);

                const dayOrders = activeOrders.filter(
                    (order) =>
                        new Date(order.createdAt) >= date &&
                        new Date(order.createdAt) < nextDate
                );

                const revenue = dayOrders.reduce(
                    (sum, order) =>
                        sum + Number(order.total || 0),
                    0
                );

                return {
                    date: date.toISOString(),
                    revenue,
                    orders: dayOrders.length,
                };
            }
        );

        // --------------------------------
        // RESPONSE
        // --------------------------------

        return res.status(200).json({
            success: true,

            data: {
                metrics: {
                    totalSales,
                    totalCollected: Number(totalCollected),
                    outstanding,
                    totalOrders,
                    totalCustomers: customers.length,
                    totalProducts: products.length,
                    lowStockCount: lowStockProducts.length,
                },

                orderStatus,

                revenueTrend,

                lowStockProducts: lowStockProducts
                    .slice(0, 10)
                    .map((product) => ({
                        id: product.id,
                        name: product.name,
                        currentStock: product.currentStock,
                    })),

                recentPayments: payments,
            },
        });
    } catch (error) {
        console.error(
            "GET ANALYTICS SUMMARY ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load analytics",
        });
    }
}