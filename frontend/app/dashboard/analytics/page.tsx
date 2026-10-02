"use client";

import { useEffect, useState } from "react";
import { getAnalyticsSummary } from "@/lib/api";

type AnalyticsData = {
    metrics: {
        totalSales: number;
        totalCollected: number;
        outstanding: number;
        totalOrders: number;
        totalCustomers: number;
        totalProducts: number;
        lowStockCount: number;
    };

    orderStatus: Record<string, number>;

    revenueTrend: {
        date: string;
        revenue: number;
        orders: number;
    }[];

    lowStockProducts: {
        id: number;
        name: string;
        currentStock: number;
    }[];

    recentPayments: {
        id: number;
        paymentNumber: string;
        amount: number;
        paymentMethod: string;
        paymentDate: string;
        reference?: string | null;
        customer?: {
            name: string;
            companyName?: string | null;
        };
        invoice?: {
            invoiceNumber: string;
        };
    }[];
};

export default function DashboardPage() {
    const [data, setData] =   useState<AnalyticsData | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadAnalytics() {

        console.log("🔥 LOAD ANALYTICS FUNCTION RAN");
        try {
            setLoading(true);
            setError("");

            const response = await getAnalyticsSummary();
            const payload = response.data?.data || response.data || response;

        if (payload?.metrics) {
            setData(payload);
        } else {
            throw new Error("Invalid analytics data structure received");
        }
        } catch (error) {
         //   console.error(error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to load analytics"
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAnalytics();
    }, []);

    const currency = (value: number) =>
        `₹${Number(value || 0).toLocaleString("en-IN")}`;

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
        });

    if (loading) {
        return (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
                Loading analytics...
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-400">
                {error || "Failed to load analytics"}
            </div>
        );
    }


    return (
        <div className="space-y-6">

            {/* HEADER */}

            <div>
                <p className="text-sm text-slate-400">
                    Business Overview
                </p>

                <h1 className="mt-1 text-3xl font-bold text-white">
                    Analytics
                </h1>

                <p className="mt-2 text-slate-400">
                    Monitor sales, collections, orders and inventory.
                </p>
            </div>

            {/* KPI CARDS */}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <MetricCard
                    label="Total Sales"
                    value={currency(data.metrics.totalSales)}
                />

                <MetricCard
                    label="Total Collected"
                    value={currency(data.metrics.totalCollected)}
                />

                <MetricCard
                    label="Outstanding"
                    value={currency(data.metrics.outstanding)}
                />

                <MetricCard
                    label="Total Orders"
                    value={data.metrics.totalOrders.toLocaleString("en-IN")}
                />

                <MetricCard
                    label="Customers"
                    value={data.metrics.totalCustomers.toLocaleString("en-IN")}
                />

                <MetricCard
                    label="Products"
                    value={data.metrics.totalProducts.toLocaleString("en-IN")}
                />

                <MetricCard
                    label="Low Stock"
                    value={data.metrics.lowStockCount.toLocaleString("en-IN")}
                />
            </div>

            {/* REVENUE TREND */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="mb-5">
                    <h2 className="text-lg font-semibold text-white">
                        Revenue Trend
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Sales generated over the last 7 days.
                    </p>
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {data.revenueTrend.map((day) => {
                        const maxRevenue = Math.max(
                            ...data.revenueTrend.map(
                                (item) => item.revenue
                            ),
                            1
                        );

                        const height =
                            (day.revenue / maxRevenue) * 100;

                        return (
                            <div
                                key={day.date}
                                className="flex min-w-0 flex-col items-center"
                            >
                                <div className="flex h-48 w-full items-end justify-center rounded-lg bg-slate-950 p-2">
                                    <div
                                        className="w-full rounded-md bg-blue-600 transition-all"
                                        style={{
                                            height: `${Math.max(
                                                height,
                                                day.revenue > 0
                                                    ? 8
                                                    : 2
                                            )}%`,
                                        }}
                                        title={currency(day.revenue)}
                                    />
                                </div>

                                <p className="mt-2 text-xs text-slate-500">
                                    {formatDate(day.date)}
                                </p>

                                <p className="mt-1 truncate text-xs font-medium text-white">
                                    {currency(day.revenue)}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* LOWER GRID */}

            <div className="grid gap-6 lg:grid-cols-2">

                {/* ORDER STATUS */}

                <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                    <h2 className="text-lg font-semibold text-white">
                        Order Status
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Current order distribution.
                    </p>

                    <div className="mt-5 space-y-3">
                        {Object.entries(
                            data.orderStatus
                        ).map(([status, count]) => (
                            <div
                                key={status}
                                className="flex items-center justify-between rounded-lg bg-slate-950 px-4 py-3"
                            >
                                <span className="text-sm text-slate-300">
                                    {status}
                                </span>

                                <span className="font-semibold text-white">
                                    {count}
                                </span>
                            </div>
                        ))}

                        {Object.keys(data.orderStatus)
                            .length === 0 && (
                                <p className="py-6 text-center text-sm text-slate-500">
                                    No orders yet.
                                </p>
                            )}
                    </div>
                </section>

                {/* LOW STOCK */}

                <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                    <h2 className="text-lg font-semibold text-white">
                        Low Stock
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Products with stock of 10 units or less.
                    </p>

                    <div className="mt-5 space-y-3">
                        {data.lowStockProducts.map(
                            (product) => (
                                <div
                                    key={product.id}
                                    className="flex items-center justify-between rounded-lg bg-slate-950 px-4 py-3"
                                >
                                    <span className="text-sm text-slate-300">
                                        {product.name}
                                    </span>

                                    <span className="font-semibold text-red-400">
                                        {product.currentStock}
                                    </span>
                                </div>
                            )
                        )}

                        {data.lowStockProducts.length ===
                            0 && (
                                <p className="py-6 text-center text-sm text-slate-500">
                                    No low-stock products.
                                </p>
                            )}
                    </div>
                </section>
            </div>

            {/* RECENT PAYMENTS */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900">
                <div className="border-b border-slate-800 p-5">
                    <h2 className="text-lg font-semibold text-white">
                        Recent Payments
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Latest payments received.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px] text-left">
                        <thead className="border-b border-slate-800 bg-slate-950">
                            <tr>
                                <th className="px-5 py-3 text-xs uppercase tracking-wider text-slate-500">
                                    Payment
                                </th>

                                <th className="px-5 py-3 text-xs uppercase tracking-wider text-slate-500">
                                    Customer
                                </th>

                                <th className="px-5 py-3 text-xs uppercase tracking-wider text-slate-500">
                                    Method
                                </th>

                                <th className="px-5 py-3 text-xs uppercase tracking-wider text-slate-500">
                                    Date
                                </th>

                                <th className="px-5 py-3 text-right text-xs uppercase tracking-wider text-slate-500">
                                    Amount
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-800">
                            {data.recentPayments.map(
                                (payment) => (
                                    <tr
                                        key={payment.id}
                                        className="hover:bg-slate-800/40"
                                    >
                                        <td className="px-5 py-4 text-sm font-medium text-white">
                                            {payment.paymentNumber}
                                        </td>

                                        <td className="px-5 py-4 text-sm text-slate-300">
                                            {payment.customer
                                                ?.companyName ||
                                                payment.customer
                                                    ?.name ||
                                                "Unknown"}
                                        </td>

                                        <td className="px-5 py-4 text-sm text-slate-400">
                                            {payment.paymentMethod.replace(
                                                /_/g,
                                                " "
                                            )}
                                        </td>

                                        <td className="px-5 py-4 text-sm text-slate-400">
                                            {formatDate(
                                                payment.paymentDate
                                            )}
                                        </td>

                                        <td className="px-5 py-4 text-right text-sm font-semibold text-green-400">
                                            {currency(
                                                payment.amount
                                            )}
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function MetricCard({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500">
                {label}
            </p>

            <p className="mt-2 text-2xl font-semibold text-white">
                {value}
            </p>
        </div>
    );
}