"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getInvoices,
  getInvoiceById,
  createPayment,
} from "@/lib/api";

type Customer = {
  id: number;
  name: string;
  companyName?: string | null;
  phone: string;
};

type Payment = {
  id: number;
  paymentNumber: string;
  amount: number;
  paymentMethod: string;
  reference?: string | null;
  notes?: string | null;
  paymentDate: string;
};

type Invoice = {
  id: number;
  invoiceNumber: string;
  customerId: number;
  orderId: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: string;
  dueDate?: string | null;
  createdAt: string;
  customer: Customer;
  payments?: Payment[];
  paidAmount?: number;
  outstanding?: number;
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedInvoice, setSelectedInvoice] =
    useState<Invoice | null>(null);

  const [detailsLoading, setDetailsLoading] = useState(false);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      if (paymentModalOpen && !paymentLoading) {
        closePaymentModal();
        return;
      }

      if (selectedInvoice && !detailsLoading) {
        closeInvoiceModal();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [
    paymentModalOpen,
    paymentLoading,
    selectedInvoice,
    detailsLoading,
  ]);

  async function loadInvoices() {
  try {
    setLoading(true);
    setError("");

    const response = await getInvoices();

    setInvoices(response.data || []);
  } catch (error) {
   // console.error("LOAD INVOICES ERROR:", error);

    if (error instanceof Error) {
      setError(error.message);
    } else {
      setError("Failed to load invoices");
    }
  } finally {
    setLoading(false);
  }
}

  async function handleViewInvoice(id: number) {
    try {
      setDetailsLoading(true);
      setError("");
      setSelectedInvoice(null);
      setPaymentModalOpen(false);

      const response = await getInvoiceById(id);

      setSelectedInvoice(response.data);
    } catch (error) {
   //   console.error(error);
      setError("Failed to load invoice details");
    } finally {
      setDetailsLoading(false);
    }
  }

  function closeInvoiceModal() {
    if (paymentLoading || detailsLoading) return;

    setPaymentModalOpen(false);
    setPaymentError("");
    setSelectedInvoice(null);
  }

  function closePaymentModal() {
    if (paymentLoading) return;

    setPaymentModalOpen(false);
    setPaymentError("");
    setPaymentAmount("");
    setPaymentReference("");
    setPaymentNotes("");
    setPaymentMethod("CASH");
  }

  function getPaidAmount(invoice: Invoice) {
    if (typeof invoice.paidAmount === "number") {
      return Math.max(invoice.paidAmount, 0);
    }

    if (invoice.payments?.length) {
      return invoice.payments.reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0
      );
    }

    return 0;
  }

  function getOutstandingAmount(invoice: Invoice) {
    if (typeof invoice.outstanding === "number") {
      return Math.max(invoice.outstanding, 0);
    }

    return Math.max(
      Number(invoice.total || 0) - getPaidAmount(invoice),
      0
    );
  }

  async function handleCreatePayment() {
    if (!selectedInvoice) return;

    setPaymentError("");

    const amount = Number(paymentAmount);
    const outstanding = getOutstandingAmount(selectedInvoice);

    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError("Enter a valid payment amount.");
      return;
    }

    if (amount > outstanding) {
      setPaymentError(
        `Payment cannot exceed the outstanding amount of ${formatCurrency(
          outstanding
        )}.`
      );
      return;
    }

    try {
      setPaymentLoading(true);

      await createPayment({
        invoiceId: selectedInvoice.id,
        customerId: selectedInvoice.customerId,
        amount,
        paymentMethod,
        reference: paymentReference.trim() || undefined,
        notes: paymentNotes.trim() || undefined,
      });

      const response = await getInvoiceById(selectedInvoice.id);

      setSelectedInvoice(response.data);

      setPaymentAmount("");
      setPaymentReference("");
      setPaymentNotes("");
      setPaymentMethod("CASH");
      setPaymentError("");
      setPaymentModalOpen(false);

      await loadInvoices();
    } catch (error) {
     // console.error(error);

      setPaymentError(
        error instanceof Error
          ? error.message
          : "Failed to create payment."
      );
    } finally {
      setPaymentLoading(false);
    }
  }

  const filteredInvoices = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const invoiceNumber =
        invoice.invoiceNumber?.toLowerCase() || "";

      const customerName =
        invoice.customer?.name?.toLowerCase() || "";

      const companyName =
        invoice.customer?.companyName?.toLowerCase() || "";

      const matchesSearch =
        !normalizedSearch ||
        invoiceNumber.includes(normalizedSearch) ||
        customerName.includes(normalizedSearch) ||
        companyName.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" ||
        invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  }

  function formatDate(value?: string | null) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatStatus(status: string) {
    return status
      .toLowerCase()
      .replaceAll("_", " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  function formatPaymentMethod(method: string) {
    return method
      .toLowerCase()
      .replaceAll("_", " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  function getStatusClass(status: string) {
    switch (status) {
      case "PAID":
        return "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

      case "PARTIALLY_PAID":
        return "border border-amber-500/20 bg-amber-500/10 text-amber-400";

      case "UNPAID":
        return "border border-red-500/20 bg-red-500/10 text-red-400";

      default:
        return "border border-slate-700 bg-slate-800 text-slate-400";
    }
  }

  const selectedPaidAmount = selectedInvoice
    ? getPaidAmount(selectedInvoice)
    : 0;

  const selectedOutstanding = selectedInvoice
    ? getOutstandingAmount(selectedInvoice)
    : 0;

  return (
    <div className="min-h-full space-y-6 bg-slate-950 text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
              <span className="text-lg text-blue-400">₹</span>
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Invoices
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Manage invoices, payments and outstanding balances.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Showing
          </p>

          <p className="mt-1 text-sm font-semibold text-white">
            {filteredInvoices.length}{" "}
            {filteredInvoices.length === 1 ? "invoice" : "invoices"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search invoice, customer or company..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>

          {/* Status */}
          <div className="w-full lg:w-52">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            >
              <option value="ALL">All Status</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIALLY_PAID">
                Partially Paid
              </option>
              <option value="PAID">Paid</option>
            </select>
          </div>

          {/* Clear */}
          {(search || statusFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
              }}
              className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <div>
            <p className="font-semibold">Something went wrong</p>
            <p className="mt-1 text-red-400/80">{error}</p>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="shrink-0 rounded-lg px-2 py-1 text-red-400 transition hover:bg-red-500/10"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Invoice Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-sm">
        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center p-10">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />

              <p className="text-sm text-slate-400">
                Loading invoices...
              </p>
            </div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center p-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950">
              <span className="text-xl text-slate-600">₹</span>
            </div>

            <p className="mt-4 font-semibold text-white">
              No invoices found
            </p>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Try changing your search or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full">
              <thead className="border-b border-slate-800 bg-slate-950/50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Invoice
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Customer
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Paid
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Outstanding
                  </th>

                  <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {filteredInvoices.map((invoice) => {
                  const paidAmount = getPaidAmount(invoice);
                  const outstanding = getOutstandingAmount(invoice);

                  return (
                    <tr
                      key={invoice.id}
                      className="transition hover:bg-slate-800/30"
                    >
                      {/* Invoice */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">
                          {invoice.invoiceNumber}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          Order #{invoice.orderId}
                        </div>

                        <div className="mt-1 text-xs text-slate-600">
                          {formatDate(invoice.createdAt)}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-200">
                          {invoice.customer?.name || "Unknown Customer"}
                        </div>

                        {invoice.customer?.companyName && (
                          <div className="mt-1 text-xs text-slate-500">
                            {invoice.customer.companyName}
                          </div>
                        )}

                        {invoice.customer?.phone && (
                          <div className="mt-1 text-xs text-slate-600">
                            {invoice.customer.phone}
                          </div>
                        )}
                      </td>

                      {/* Total */}
                      <td className="px-5 py-4 text-right">
                        <span className="font-semibold text-slate-200">
                          {formatCurrency(invoice.total)}
                        </span>
                      </td>

                      {/* Paid */}
                      <td className="px-5 py-4 text-right">
                        <span className="font-semibold text-emerald-400">
                          {formatCurrency(paidAmount)}
                        </span>
                      </td>

                      {/* Outstanding */}
                      <td className="px-5 py-4 text-right">
                        <span
                          className={
                            outstanding > 0
                              ? "font-semibold text-red-400"
                              : "font-semibold text-slate-500"
                          }
                        >
                          {formatCurrency(outstanding)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            invoice.status
                          )}`}
                        >
                          {formatStatus(invoice.status)}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            handleViewInvoice(invoice.id)
                          }
                          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-400"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeInvoiceModal();
            }
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400">
                    ₹
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-white sm:text-xl">
                      Invoice Details
                    </h2>

                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      {selectedInvoice.invoiceNumber}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={closeInvoiceModal}
                disabled={paymentLoading}
                className="ml-4 shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close invoice details"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-6 p-5 sm:p-6">
                {/* Customer */}
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Customer
                    </h3>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-white">
                          {selectedInvoice.customer?.name ||
                            "Unknown Customer"}
                        </p>

                        {selectedInvoice.customer?.companyName && (
                          <p className="mt-1 text-sm text-slate-400">
                            {selectedInvoice.customer.companyName}
                          </p>
                        )}
                      </div>

                      {selectedInvoice.customer?.phone && (
                        <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                          <p className="text-xs text-slate-600">
                            Phone
                          </p>

                          <p className="mt-0.5 text-sm font-medium text-slate-300">
                            {selectedInvoice.customer.phone}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* Payment Summary */}
                <section>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Payment Summary
                  </h3>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-xs font-medium text-slate-500">
                        Invoice Total
                      </p>

                      <p className="mt-2 text-lg font-bold text-white">
                        {formatCurrency(selectedInvoice.total)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                      <p className="text-xs font-medium text-emerald-400">
                        Paid
                      </p>

                      <p className="mt-2 text-lg font-bold text-emerald-400">
                        {formatCurrency(selectedPaidAmount)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                      <p className="text-xs font-medium text-red-400">
                        Outstanding
                      </p>

                      <p className="mt-2 text-lg font-bold text-red-400">
                        {formatCurrency(selectedOutstanding)}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Payment History */}
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Payment History
                    </h3>

                    <span className="text-xs text-slate-600">
                      {selectedInvoice.payments?.length ?? 0}{" "}
                      {(
                        selectedInvoice.payments?.length ?? 0
                      ) === 1
                        ? "payment"
                        : "payments"}
                    </span>
                  </div>

                  {!selectedInvoice.payments ||
                  selectedInvoice.payments.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950 p-8 text-center">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-slate-600">
                        ₹
                      </div>

                      <p className="mt-3 text-sm font-medium text-slate-300">
                        No payments recorded
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Payments made against this invoice will
                        appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                      <div className="divide-y divide-slate-800">
                        {selectedInvoice.payments.map((payment) => (
                          <div
                            key={payment.id}
                            className="p-4 transition hover:bg-slate-900"
                          >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-semibold text-emerald-400">
                                    {formatCurrency(payment.amount)}
                                  </span>

                                  <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-400">
                                    {formatPaymentMethod(
                                      payment.paymentMethod
                                    )}
                                  </span>
                                </div>

                                <p className="mt-2 text-xs text-slate-600">
                                  {payment.paymentNumber}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {formatDate(payment.paymentDate)}
                                </p>
                              </div>

                              <div className="sm:text-right">
                                <p className="text-xs text-slate-600">
                                  Reference
                                </p>

                                <p className="mt-1 break-all text-sm font-medium text-slate-300">
                                  {payment.reference || "—"}
                                </p>
                              </div>
                            </div>

                            {payment.notes && (
                              <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5">
                                <p className="text-xs font-medium text-slate-600">
                                  Note
                                </p>

                                <p className="mt-1 text-sm text-slate-400">
                                  {payment.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900 px-4 py-3">
                        <span className="text-sm font-semibold text-slate-400">
                          Total Paid
                        </span>

                        <span className="text-sm font-bold text-emerald-400">
                          {formatCurrency(selectedPaidAmount)}
                        </span>
                      </div>
                    </div>
                  )}
                </section>

                {/* Invoice Status */}
                <section>
                  <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-300">
                        Invoice Status
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Current payment status
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                        selectedInvoice.status
                      )}`}
                    >
                      {formatStatus(selectedInvoice.status)}
                    </span>
                  </div>
                </section>

                {/* Order & Amount Breakdown */}
                <section>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Invoice Breakdown
                  </h3>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">
                        Order
                      </span>

                      <span className="text-sm font-medium text-slate-300">
                        #{selectedInvoice.orderId}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm text-slate-500">
                        Subtotal
                      </span>

                      <span className="text-sm font-medium text-slate-300">
                        {formatCurrency(selectedInvoice.subtotal)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm text-slate-500">
                        Discount
                      </span>

                      <span className="text-sm font-medium text-slate-300">
                        {formatCurrency(selectedInvoice.discount)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm text-slate-500">
                        Tax
                      </span>

                      <span className="text-sm font-medium text-slate-300">
                        {formatCurrency(selectedInvoice.tax)}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
                      <span className="font-semibold text-white">
                        Total
                      </span>

                      <span className="text-lg font-bold text-white">
                        {formatCurrency(selectedInvoice.total)}
                      </span>
                    </div>

                    {selectedInvoice.dueDate && (
                      <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs text-slate-600">
                            Due Date
                          </span>

                          <span className="text-sm font-medium text-slate-300">
                            {formatDate(selectedInvoice.dueDate)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-800 bg-slate-900 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                {selectedOutstanding > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentError("");
                      setPaymentAmount("");
                      setPaymentReference("");
                      setPaymentNotes("");
                      setPaymentMethod("CASH");
                      setPaymentModalOpen(true);
                    }}
                    className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 sm:w-auto"
                  >
                    Record Payment
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={closeInvoiceModal}
                disabled={paymentLoading}
                className="w-full rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentModalOpen && selectedInvoice && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !paymentLoading
            ) {
              closePaymentModal();
            }
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            {/* Payment Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Record Payment
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedInvoice.invoiceNumber}
                </p>
              </div>

              <button
                type="button"
                onClick={closePaymentModal}
                disabled={paymentLoading}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close payment modal"
              >
                ✕
              </button>
            </div>

            {/* Payment Body */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-5 p-5 sm:p-6">
                {/* Outstanding */}
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-red-400">
                    Outstanding Amount
                  </p>

                  <p className="mt-2 text-2xl font-bold text-red-400">
                    {formatCurrency(selectedOutstanding)}
                  </p>
                </div>

                {/* Payment Error */}
                {paymentError && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                    <p className="text-sm font-medium text-red-400">
                      {paymentError}
                    </p>
                  </div>
                )}

                {/* Amount */}
                <div>
                  <label
                    htmlFor="payment-amount"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Payment Amount
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                      ₹
                    </span>

                    <input
                      id="payment-amount"
                      type="number"
                      min="0.01"
                      max={selectedOutstanding}
                      step="0.01"
                      value={paymentAmount}
                      onChange={(event) =>
                        setPaymentAmount(event.target.value)
                      }
                      placeholder="Enter amount"
                      disabled={paymentLoading}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-9 pr-4 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label
                    htmlFor="payment-method"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Payment Method
                  </label>

                  <select
                    id="payment-method"
                    value={paymentMethod}
                    onChange={(event) =>
                      setPaymentMethod(event.target.value)
                    }
                    disabled={paymentLoading}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">
                      Bank Transfer
                    </option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>

                {/* Reference */}
                <div>
                  <label
                    htmlFor="payment-reference"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Reference
                    <span className="ml-1 text-xs font-normal text-slate-600">
                      optional
                    </span>
                  </label>

                  <input
                    id="payment-reference"
                    type="text"
                    value={paymentReference}
                    onChange={(event) =>
                      setPaymentReference(event.target.value)
                    }
                    placeholder="Transaction / cheque reference"
                    disabled={paymentLoading}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label
                    htmlFor="payment-notes"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Notes
                    <span className="ml-1 text-xs font-normal text-slate-600">
                      optional
                    </span>
                  </label>

                  <textarea
                    id="payment-notes"
                    value={paymentNotes}
                    onChange={(event) =>
                      setPaymentNotes(event.target.value)
                    }
                    placeholder="Add any relevant payment notes..."
                    rows={3}
                    disabled={paymentLoading}
                    className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>
            </div>

            {/* Payment Footer */}
            <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-800 bg-slate-900 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={closePaymentModal}
                disabled={paymentLoading}
                className="w-full rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreatePayment}
                disabled={
                  paymentLoading ||
                  !paymentAmount ||
                  selectedOutstanding <= 0
                }
                className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {paymentLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Recording...
                  </span>
                ) : (
                  "Record Payment"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Details Loading */}
      {detailsLoading && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-5 py-4 shadow-2xl">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />

            <span className="text-sm font-medium text-slate-300">
              Loading invoice...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}