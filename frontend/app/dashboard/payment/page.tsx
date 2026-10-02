"use client";

import { useEffect, useMemo, useState } from "react";
import { getPayments } from "@/lib/api";

type Payment = {
    id: number;
    paymentNumber: string;
    customerId: number;
    invoiceId: number;
    amount: number;
    paymentMethod: string;
    reference?: string | null;
    notes?: string | null;
    paymentDate: string;
    createdAt: string;

    customer?: {
        id: number;
        name: string;
        companyName?: string | null;
    };

    invoice?: {
        id: number;
        invoiceNumber: string;
        total: number;
    };
};

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [methodFilter, setMethodFilter] = useState("ALL");

    const [selectedPayment, setSelectedPayment] =
        useState<Payment | null>(null);

    async function loadPayments() {
        try {
            setLoading(true);
            setError("");

            const response = await getPayments();

            setPayments(response.data || []);
        } catch (error) {
        //    console.error("LOAD PAYMENTS ERROR:", error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to load payments"
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadPayments();
    }, []);

    const paymentMethods = useMemo(() => {
        const methods = payments
            .map((payment) => payment.paymentMethod)
            .filter(Boolean);

        return Array.from(new Set(methods));
    }, [payments]);

    const filteredPayments = useMemo(() => {
        const searchTerm = search.toLowerCase().trim();

        return payments.filter((payment) => {
            const customerName =
                payment.customer?.name?.toLowerCase() || "";

            const companyName =
                payment.customer?.companyName?.toLowerCase() || "";

            const invoiceNumber =
                payment.invoice?.invoiceNumber?.toLowerCase() || "";

            const paymentNumber =
                payment.paymentNumber?.toLowerCase() || "";

            const reference =
                payment.reference?.toLowerCase() || "";

            const matchesSearch =
                !searchTerm ||
                paymentNumber.includes(searchTerm) ||
                customerName.includes(searchTerm) ||
                companyName.includes(searchTerm) ||
                invoiceNumber.includes(searchTerm) ||
                reference.includes(searchTerm);

            const matchesMethod =
                methodFilter === "ALL" ||
                payment.paymentMethod === methodFilter;

            return matchesSearch && matchesMethod;
        });
    }, [payments, search, methodFilter]);

    const totalReceived = useMemo(() => {
        return filteredPayments.reduce(
            (sum, payment) => sum + Number(payment.amount || 0),
            0
        );
    }, [filteredPayments]);

    const formatCurrency = (amount: number) => {
        return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatMethod = (method: string) => {
        return method
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    return (
        <div className="space-y-6">
            {/* PAGE HEADER */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm text-slate-400">
                        Finance
                    </p>

                    <h1 className="mt-1 text-3xl font-bold text-white">
                        Payments
                    </h1>

                    <p className="mt-2 text-slate-400">
                        Track all payments received from customers.
                    </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                        Total Received
                    </p>

                    <p className="mt-1 text-2xl font-semibold text-green-400">
                        {formatCurrency(totalReceived)}
                    </p>
                </div>
            </div>

            {/* SEARCH + FILTERS */}
            <div className="flex flex-col gap-3 lg:flex-row">
                <div className="flex-1">
                    <input
                        type="text"
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                        placeholder="Search payment, invoice, customer or reference..."
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                    />
                </div>

                <select
                    value={methodFilter}
                    onChange={(event) =>
                        setMethodFilter(event.target.value)
                    }
                    className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                >
                    <option value="ALL">
                        All Payment Methods
                    </option>

                    {paymentMethods.map((method) => (
                        <option key={method} value={method}>
                            {formatMethod(method)}
                        </option>
                    ))}
                </select>
            </div>

            {/* ERROR */}
            {error && (
                <div className="rounded-lg border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-400">
                    {error}
                </div>
            )}

            {/* SUMMARY */}
            {!loading && (
                <div className="text-sm text-slate-500">
                    Showing {filteredPayments.length} of{" "}
                    {payments.length} payments
                </div>
            )}

            {/* TABLE */}
            {loading ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-sm text-slate-400">
                    Loading payments...
                </div>
            ) : filteredPayments.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
                    <h2 className="text-lg font-semibold text-white">
                        No payments found
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                        Payments will appear here once they are recorded.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[950px] text-left">
                            <thead className="border-b border-slate-800 bg-slate-950">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Payment
                                    </th>

                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Invoice
                                    </th>

                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Customer
                                    </th>

                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Method
                                    </th>

                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Date
                                    </th>

                                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Amount
                                    </th>

                                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800">
                                {filteredPayments.map((payment) => (
                                    <tr
                                        key={payment.id}
                                        className="transition hover:bg-slate-800/40"
                                    >
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-white">
                                                {payment.paymentNumber}
                                            </p>

                                            {payment.reference && (
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Ref: {payment.reference}
                                                </p>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-sm font-medium text-blue-400">
                                            {payment.invoice?.invoiceNumber ||
                                                `Invoice #${payment.invoiceId}`}
                                        </td>

                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-white">
                                                {payment.customer?.name ||
                                                    "Unknown Customer"}
                                            </p>

                                            {payment.customer?.companyName && (
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {
                                                        payment.customer
                                                            .companyName
                                                    }
                                                </p>
                                            )}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
                                                {formatMethod(
                                                    payment.paymentMethod
                                                )}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-sm text-slate-400">
                                            {formatDate(
                                                payment.paymentDate
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-right text-sm font-semibold text-green-400">
                                            {formatCurrency(
                                                payment.amount
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSelectedPayment(
                                                        payment
                                                    )
                                                }
                                                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* PAYMENT DETAILS MODAL */}
            {selectedPayment && (
                <PaymentDetailsModal
                    payment={selectedPayment}
                    onClose={() => setSelectedPayment(null)}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                    formatMethod={formatMethod}
                />
            )}
        </div>
    );
}

interface PaymentDetailsModalProps {
    payment: Payment;
    onClose: () => void;
    formatCurrency: (amount: number) => string;
    formatDate: (date: string) => string;
    formatMethod: (method: string) => string;
}

function PaymentDetailsModal({
    payment,
    onClose,
    formatCurrency,
    formatDate,
    formatMethod,
}: PaymentDetailsModalProps) {
    return (
        <div className="fixed inset-0 z-50 bg-black/70 p-4 sm:p-6">
            <div className="flex h-full w-full items-center justify-center">
                <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">

                    {/* HEADER */}
                    <div className="flex items-start justify-between border-b border-slate-800 p-5 sm:p-6">
                        <div>
                            <p className="text-xs uppercase tracking-wider text-blue-400">
                                Payment Details
                            </p>

                            <h2 className="mt-1 text-xl font-semibold text-white">
                                {payment.paymentNumber}
                            </h2>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg p-1 text-2xl leading-none text-slate-500 transition hover:bg-slate-800 hover:text-white"
                            aria-label="Close payment details"
                        >
                            ×
                        </button>
                    </div>

                    {/* CONTENT */}
                    <div className="space-y-6 p-5 sm:p-6">

                        {/* AMOUNT */}
                        <div className="rounded-xl border border-green-900/50 bg-green-950/20 p-5">
                            <p className="text-xs uppercase tracking-wider text-green-500">
                                Amount Received
                            </p>

                            <p className="mt-2 text-3xl font-semibold text-green-400">
                                {formatCurrency(payment.amount)}
                            </p>
                        </div>

                        {/* PAYMENT INFO */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <DetailItem
                                label="Payment Number"
                                value={payment.paymentNumber}
                            />

                            <DetailItem
                                label="Payment Method"
                                value={formatMethod(
                                    payment.paymentMethod
                                )}
                            />

                            <DetailItem
                                label="Payment Date"
                                value={formatDate(
                                    payment.paymentDate
                                )}
                            />

                            <DetailItem
                                label="Invoice"
                                value={
                                    payment.invoice?.invoiceNumber ||
                                    `Invoice #${payment.invoiceId}`
                                }
                            />

                            <DetailItem
                                label="Customer"
                                value={
                                    payment.customer?.companyName ||
                                    payment.customer?.name ||
                                    "Unknown Customer"
                                }
                            />

                            <DetailItem
                                label="Reference"
                                value={payment.reference || "-"}
                            />
                        </div>

                        {/* NOTES */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                            <p className="text-xs uppercase tracking-wider text-slate-500">
                                Notes
                            </p>

                            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">
                                {payment.notes || "No notes added."}
                            </p>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="flex justify-end border-t border-slate-800 p-5 sm:p-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailItem({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs text-slate-500">
                {label}
            </p>

            <p className="mt-2 break-words text-sm font-medium text-white">
                {value}
            </p>
        </div>
    );
}