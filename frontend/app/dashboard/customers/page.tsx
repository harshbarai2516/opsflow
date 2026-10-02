"use client";

import { FormEvent, useEffect, useState } from "react";
import {
    createCustomer,
    Customer,
    deleteCustomer,
    getCustomerById,
    getCustomers,
    updateCustomer,
    getCurrentUser,
    type Order,
} from "@/lib/api";
import { useToast } from "@/components/ui/ToastProvider";

type CustomerPayment = {
    id: number;
    paymentNumber: string;
    amount: number;
    paymentMethod: string;
    reference?: string | null;
    notes?: string | null;
    paymentDate: string;
};

type CustomerInvoice = {
    id: number;
    invoiceNumber: string;
    orderId: number;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    status: string;
    dueDate?: string | null;
    createdAt: string;
    payments: CustomerPayment[];
};

type CustomerSummary = {
    totalOrders: number;
    deliveredOrders: number;
    totalOrderValue: number;
    totalInvoices: number;
    totalInvoiced: number;
    totalPaid: number;
    outstandingBalance: number;
    creditLimit: number;
    availableCredit: number;
};

type Customer360 = Customer & {
    summary: CustomerSummary;
    orders: Order[];
    invoices: CustomerInvoice[];
    payments: CustomerPayment[];
};


export default function CustomersPage() {

    const { showToast } = useToast();

    const [user, setUser] = useState<any>(null);

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);

    const [editingCustomer, setEditingCustomer] =
        useState<Customer | null>(null);

    const [showCustomerView, setShowCustomerView] =
        useState(false);

    const [selectedCustomer, setSelectedCustomer] =
        useState<Customer360 | null>(null);

    const [customerViewLoading, setCustomerViewLoading] =
        useState(false);

    const [error, setError] = useState("");

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);

                const userResponse = await getCurrentUser();

                setUser(userResponse.data);
            } catch (error) {
                showToast({
                    title: "Error",
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to load products.",
                    type: "error",
                });
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    async function loadCustomers() {
        try {
            setLoading(true);
            setError("");

            const response = await getCustomers();

            setCustomers(response.data);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to load customers"
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadCustomers();
    }, []);

    function handleAdd() {
        setEditingCustomer(null);
        setShowForm(true);
    }

    function handleEdit(customer: Customer) {
        if (
            user?.role !== "ADMIN" &&
            user?.role !== "MANAGER"
        ) {
            showToast({
                title: "Permission Denied",
                message: "You do not have permission to edit customers.",
                type: "warning",
            });

            return;
        }

        setEditingCustomer(customer);
        setShowForm(true);
    }

    async function handleViewCustomer(
        customer: Customer
    ) {
        try {
            setSelectedCustomer(null);
            setShowCustomerView(true);
            setCustomerViewLoading(true);
            setError("");

            const response = await getCustomerById(
                customer.id
            );

            setSelectedCustomer(response.data);
        } catch (error) {

            showToast({
                title: "Error",
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to delete customer",
                type: "warning",
            });
            setShowCustomerView(false);
        } finally {
            setCustomerViewLoading(false);
        }
    }

    function handleClose() {
        setShowForm(false);
        setEditingCustomer(null);
    }

    async function handleSuccess() {
        setShowForm(false);
        setEditingCustomer(null);

        await loadCustomers();
    }

    async function handleDelete(id: number) {


        try {
            await deleteCustomer(id);

            const confirmed = window.confirm(
                "Are you sure you want to delete this customer?"
            );

            if (!confirmed) {
                return;
            }

            showToast({
                title: "Customer Deleted",
                message: "Customer deleted successfully",
                type: "success",
            });

            await loadCustomers();
        } catch (error) {
            console.error("DELETE CUSTOMER ERROR:", error);

            showToast({
                title: "Delete Failed",
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to delete customer",
                type: "error",
            });
        }
    }

    const filteredCustomers = customers.filter((customer) => {
        const searchTerm = search.toLowerCase().trim();

        const matchesSearch =
            customer.name.toLowerCase().includes(searchTerm) ||
            customer.companyName
                ?.toLowerCase()
                .includes(searchTerm) ||
            customer.phone.includes(searchTerm) ||
            customer.gstin
                ?.toLowerCase()
                .includes(searchTerm);

        const matchesStatus =
            statusFilter === "ALL" ||
            customer.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div>
            {/* PAGE HEADER */}

            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-slate-400">
                        CRM
                    </p>

                    <h1 className="mt-1 text-3xl font-bold text-white">
                        Customers
                    </h1>

                    <p className="mt-2 text-slate-400">
                        Manage your customers and business relationships.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleAdd}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
                >
                    + Add Customer
                </button>
            </div>

            {/* Search Bar */}

            <div className="mb-6 flex flex-col gap-3 lg:flex-row">
                <div className="flex-1">
                    <input
                        type="text"
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                        placeholder="Search by name, company, phone or GSTIN..."
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(event) =>
                        setStatusFilter(event.target.value)
                    }
                    className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                >
                    <option value="ALL">
                        All Status
                    </option>

                    <option value="ACTIVE">
                        Active
                    </option>

                    <option value="INACTIVE">
                        Inactive
                    </option>
                </select>
            </div>

            {/* ERROR */}

            {error && (
                <div className="mb-6 rounded-lg border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-400">
                    {error}
                </div>
            )}

            {/* CUSTOMER TABLE */}

            {loading ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
                    Loading customers...
                </div>
            ) : (
                <>
                    <div className="mb-3 text-sm text-slate-500">
                        Showing {filteredCustomers.length} of{" "}
                        {customers.length} customers
                    </div>

                    <CustomerTable
                        customers={filteredCustomers}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onView={handleViewCustomer}
                    />

                </>
            )}

            {/* CUSTOMER FORM */}

            {showForm && (
                <CustomerForm
                    customer={editingCustomer}
                    onClose={handleClose}
                    onSuccess={handleSuccess}
                />
            )}

            {showCustomerView && selectedCustomer && (
                <CustomerView
                    customer={selectedCustomer}
                    loading={customerViewLoading}
                    onClose={() => {
                        setShowCustomerView(false);
                        setSelectedCustomer(null);
                    }}
                />
            )}
        </div>
    );
}

/* =====================================================
   CUSTOMER TABLE
===================================================== */

interface CustomerTableProps {
    customers: Customer[];
    onEdit: (customer: Customer) => void;
    onDelete: (id: number) => void;
    onView: (customer: Customer) => void;
}

function CustomerTable({
    customers,
    onEdit,
    onDelete,
    onView
}: CustomerTableProps) {
    if (customers.length === 0) {
        return (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
                <h2 className="text-lg font-semibold text-white">
                    No customers yet
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                    Add your first customer to get started.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left">

                    <thead className="border-b border-slate-800">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Customer
                            </th>

                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Phone
                            </th>

                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                GSTIN
                            </th>

                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                City
                            </th>

                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Credit Limit
                            </th>

                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Status
                            </th>

                            <th className="sticky right-0 bg-slate-900 px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-800">

                        {customers.map((customer) => (
                            <tr
                                key={customer.id}
                                className="transition hover:bg-slate-800/40"
                            >

                                <td className="px-6 py-4">
                                    <div>
                                        <p className="font-medium text-white">
                                            {customer.name}
                                        </p>

                                        <p className="mt-1 text-sm text-slate-500">
                                            {customer.companyName ||
                                                customer.email ||
                                                "-"}
                                        </p>
                                    </div>
                                </td>

                                <td className="px-6 py-4 text-sm text-slate-300">
                                    {customer.phone}
                                </td>

                                <td className="px-6 py-4 text-sm text-slate-300">
                                    {customer.gstin || "-"}
                                </td>

                                <td className="px-6 py-4 text-sm text-slate-300">
                                    {customer.city || "-"}
                                </td>

                                <td className="px-6 py-4 text-sm text-slate-300">
                                    {customer.creditLimit !== null
                                        ? `₹${customer.creditLimit.toLocaleString(
                                            "en-IN"
                                        )}`
                                        : "-"}
                                </td>

                                <td className="px-6 py-4">
                                    <StatusBadge
                                        status={customer.status}
                                    />
                                </td>

                                <td className="sticky right-0 bg-slate-900 px-6 py-4">
                                    <div className="flex justify-end gap-2">

                                        <button
                                            type="button"
                                            onClick={() => onView(customer)}
                                            className="rounded-lg border border-blue-900 px-3 py-1.5 text-xs font-medium text-blue-400 transition hover:bg-blue-950 hover:text-blue-300"
                                        >
                                            View
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onEdit(customer)}
                                            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                                        >
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                onDelete(customer.id)
                                            }
                                            className="rounded-lg border border-red-900 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-950"
                                        >
                                            Delete
                                        </button>

                                    </div>
                                </td>

                            </tr>
                        ))}

                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* =====================================================
   STATUS BADGE
===================================================== */

interface CustomerViewProps {
    customer: Customer360;
    loading: boolean;
    onClose: () => void;
}

function CustomerView({
    customer,
    loading,
    onClose,
}: CustomerViewProps) {


    return (
        <div className="fixed inset-0 z-50 bg-black/70 p-4 sm:p-6">
            <div className="flex h-full w-full items-center justify-center">
                <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">

                    {/* Header */}
                    <div className="flex shrink-0 items-start justify-between border-b border-slate-800 bg-slate-900 p-5 sm:p-6">
                        <div className="min-w-0 pr-4">
                            <p className="text-xs uppercase tracking-wider text-blue-400">
                                Customer Profile
                            </p>

                            <h2 className="mt-1 truncate text-xl font-semibold text-white sm:text-2xl">
                                {customer.companyName || customer.name}
                            </h2>

                            {customer.companyName && (
                                <p className="mt-1 text-sm text-slate-400">
                                    {customer.name}
                                </p>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="shrink-0 rounded-lg p-1 text-2xl leading-none text-slate-500 transition hover:bg-slate-800 hover:text-white"
                            aria-label="Close customer profile"
                        >
                            ×
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                        <div className="space-y-6 p-6">

                            {/* Customer Information */}
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                                    <p className="text-xs text-slate-500">
                                        Phone
                                    </p>

                                    <p className="mt-2 text-sm font-medium text-white">
                                        {customer.phone || "-"}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                                    <p className="text-xs text-slate-500">
                                        GSTIN
                                    </p>

                                    <p className="mt-2 text-sm font-medium text-white">
                                        {customer.gstin || "-"}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                                    <p className="text-xs text-slate-500">
                                        Credit Limit
                                    </p>

                                    <p className="mt-2 text-sm font-medium text-white">
                                        {customer.creditLimit !== null
                                            ? `₹${customer.creditLimit.toLocaleString(
                                                "en-IN"
                                            )}`
                                            : "-"}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                                    <p className="text-xs text-slate-500">
                                        Status
                                    </p>

                                    <div className="mt-2">
                                        <StatusBadge
                                            status={customer.status}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Financial & Order Statistics */}
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                                    <p className="text-xs text-slate-500">
                                        Total Orders
                                    </p>

                                    <p className="mt-2 text-2xl font-semibold text-white">
                                        {customer.summary.totalOrders}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                                    <p className="text-xs text-slate-500">
                                        Delivered Orders
                                    </p>

                                    <p className="mt-2 text-2xl font-semibold text-white">
                                        {customer.summary.deliveredOrders}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                                    <p className="text-xs text-slate-500">
                                        Total Order Value
                                    </p>

                                    <p className="mt-2 text-2xl font-semibold text-white">
                                        ₹{customer.summary.totalOrderValue.toLocaleString(
                                            "en-IN"
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                                    <p className="text-xs text-slate-500">
                                        Total Invoiced
                                    </p>

                                    <p className="mt-2 text-2xl font-semibold text-white">
                                        ₹{customer.summary.totalInvoiced.toLocaleString(
                                            "en-IN"
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                                    <p className="text-xs text-green-400">
                                        Total Paid
                                    </p>

                                    <p className="mt-2 text-2xl font-semibold text-green-400">
                                        ₹{customer.summary.totalPaid.toLocaleString(
                                            "en-IN"
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                                    <p className="text-xs text-red-400">
                                        Outstanding
                                    </p>

                                    <p className="mt-2 text-2xl font-semibold text-red-400">
                                        ₹{customer.summary.outstandingBalance.toLocaleString(
                                            "en-IN"
                                        )}
                                    </p>
                                </div>

                            </div>

                            {/* Credit Summary */}
                            <div className="grid gap-4 md:grid-cols-2">

                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                                    <p className="text-xs text-slate-500">
                                        Credit Limit
                                    </p>

                                    <p className="mt-2 text-2xl font-semibold text-white">
                                        ₹{customer.summary.creditLimit.toLocaleString(
                                            "en-IN"
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-blue-900 bg-blue-950/20 p-5">
                                    <p className="text-xs text-blue-400">
                                        Available Credit
                                    </p>

                                    <p className="mt-2 text-2xl font-semibold text-blue-400">
                                        ₹{customer.summary.availableCredit.toLocaleString(
                                            "en-IN"
                                        )}
                                    </p>
                                </div>

                            </div>

                            {/* Order History */}
                            <div>
                                <div className="mb-3">
                                    <h3 className="text-sm font-semibold text-white">
                                        Order History
                                    </h3>

                                    <p className="mt-1 text-xs text-slate-500">
                                        All orders placed by this customer.
                                    </p>
                                </div>

                                {loading ? (
                                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-8 text-center text-sm text-slate-500">
                                        Loading customer history...
                                    </div>
                                ) : customer.orders.length === 0 ? (
                                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-8 text-center">
                                        <p className="text-sm font-medium text-slate-300">
                                            No orders yet
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            This customer has not placed any orders.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                                        <table className="w-full min-w-[720px] text-left">
                                            <thead className="border-b border-slate-800 bg-slate-950">
                                                <tr>
                                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Order
                                                    </th>

                                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Date
                                                    </th>

                                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Status
                                                    </th>

                                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Total
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-slate-800">
                                                {customer.orders.map((order) => (
                                                    <tr
                                                        key={order.id}
                                                        className="transition hover:bg-slate-800/40"
                                                    >
                                                        <td className="px-4 py-4 text-sm font-medium text-white">
                                                            {order.orderNumber}
                                                        </td>

                                                        <td className="px-4 py-4 text-sm text-slate-400">
                                                            {new Date(
                                                                order.createdAt
                                                            ).toLocaleDateString(
                                                                "en-IN"
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <StatusBadge
                                                                status={order.status}
                                                            />
                                                        </td>

                                                        <td className="px-4 py-4 text-right text-sm font-medium text-white">
                                                            ₹
                                                            {Number(
                                                                order.total || 0
                                                            ).toLocaleString(
                                                                "en-IN"
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Invoice History */}
                            <div>
                                <div className="mb-3">
                                    <h3 className="text-sm font-semibold text-white">
                                        Invoice History
                                    </h3>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Invoices generated for this customer.
                                    </p>
                                </div>

                                {customer.invoices.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-center text-sm text-slate-500">
                                        No invoices found.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                                        <table className="w-full min-w-[850px] text-left">
                                            <thead className="border-b border-slate-800 bg-slate-950">
                                                <tr>
                                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Invoice
                                                    </th>

                                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Date
                                                    </th>

                                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Total
                                                    </th>

                                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Paid
                                                    </th>

                                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Outstanding
                                                    </th>

                                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Status
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-slate-800">
                                                {customer.invoices.map((invoice) => {
                                                    const paid = invoice.payments.reduce(
                                                        (sum, payment) =>
                                                            sum + Number(payment.amount),
                                                        0
                                                    );

                                                    const outstanding = Math.max(
                                                        Number(invoice.total) - paid,
                                                        0
                                                    );

                                                    return (
                                                        <tr
                                                            key={invoice.id}
                                                            className="transition hover:bg-slate-800/40"
                                                        >
                                                            <td className="px-4 py-4 text-sm font-medium text-white">
                                                                {invoice.invoiceNumber}
                                                            </td>

                                                            <td className="px-4 py-4 text-sm text-slate-400">
                                                                {new Date(
                                                                    invoice.createdAt
                                                                ).toLocaleDateString("en-IN")}
                                                            </td>

                                                            <td className="px-4 py-4 text-right text-sm text-white">
                                                                ₹
                                                                {Number(
                                                                    invoice.total
                                                                ).toLocaleString("en-IN")}
                                                            </td>

                                                            <td className="px-4 py-4 text-right text-sm text-green-400">
                                                                ₹
                                                                {paid.toLocaleString("en-IN")}
                                                            </td>

                                                            <td className="px-4 py-4 text-right text-sm text-red-400">
                                                                ₹
                                                                {outstanding.toLocaleString(
                                                                    "en-IN"
                                                                )}
                                                            </td>

                                                            <td className="px-4 py-4 text-center">
                                                                <StatusBadge
                                                                    status={invoice.status}
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Payment History */}
                            <div>
                                <div className="mb-3">
                                    <h3 className="text-sm font-semibold text-white">
                                        Payment History
                                    </h3>

                                    <p className="mt-1 text-xs text-slate-500">
                                        All payments received from this customer.
                                    </p>
                                </div>

                                {customer.payments.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-center text-sm text-slate-500">
                                        No payments recorded.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                                        <table className="w-full min-w-[750px] text-left">
                                            <thead className="border-b border-slate-800 bg-slate-950">
                                                <tr>
                                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Payment
                                                    </th>

                                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Date
                                                    </th>

                                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Method
                                                    </th>

                                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Reference
                                                    </th>

                                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Amount
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-slate-800">
                                                {customer.payments.map((payment) => (
                                                    <tr
                                                        key={payment.id}
                                                        className="transition hover:bg-slate-800/40"
                                                    >
                                                        <td className="px-4 py-4 text-sm font-medium text-white">
                                                            {payment.paymentNumber}
                                                        </td>

                                                        <td className="px-4 py-4 text-sm text-slate-400">
                                                            {new Date(
                                                                payment.paymentDate
                                                            ).toLocaleDateString("en-IN")}
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
                                                                {payment.paymentMethod.replace(
                                                                    "_",
                                                                    " "
                                                                )}
                                                            </span>
                                                        </td>

                                                        <td className="px-4 py-4 text-sm text-slate-400">
                                                            {payment.reference || "-"}
                                                        </td>

                                                        <td className="px-4 py-4 text-right text-sm font-semibold text-green-400">
                                                            ₹
                                                            {Number(
                                                                payment.amount
                                                            ).toLocaleString("en-IN")}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end border-t border-slate-800 p-6">
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

function StatusBadge({
    status,
}: {
    status: string;
}) {
    const isActive = status === "ACTIVE";

    return (
        <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${isActive
                ? "bg-green-950 text-green-400"
                : "bg-slate-800 text-slate-400"
                }`}
        >
            {status}
        </span>
    );
}

/* =====================================================
   CUSTOMER FORM
===================================================== */

interface CustomerFormProps {
    customer: Customer | null;
    onClose: () => void;
    onSuccess: () => void;
}

function CustomerForm({
    customer,
    onClose,
    onSuccess,
}: CustomerFormProps) {
    const isEditing = customer !== null;

    const [name, setName] = useState(
        customer?.name || ""
    );

    const [companyName, setCompanyName] = useState(
        customer?.companyName || ""
    );

    const [phone, setPhone] = useState(
        customer?.phone || ""
    );

    const [email, setEmail] = useState(
        customer?.email || ""
    );

    const [gstin, setGstin] = useState(
        customer?.gstin || ""
    );

    const [address, setAddress] = useState(
        customer?.address || ""
    );

    const [city, setCity] = useState(
        customer?.city || ""
    );

    const [creditLimit, setCreditLimit] =
        useState(
            customer?.creditLimit?.toString() || ""
        );

    const [status, setStatus] = useState(
        customer?.status || "ACTIVE"
    );

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            const customerData = {
                name,
                companyName: companyName || undefined,
                phone,
                email: email || undefined,
                gstin: gstin || undefined,
                address: address || undefined,
                city: city || undefined,
                creditLimit: creditLimit
                    ? Number(creditLimit)
                    : undefined,
                status,
            };

            if (isEditing) {
                await updateCustomer(
                    customer.id,
                    customerData
                );
            } else {
                await createCustomer(customerData);
            }

            onSuccess();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : isEditing
                        ? "Failed to update customer"
                        : "Failed to create customer"
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 px-4 py-8">

            <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">

                {/* HEADER */}

                <div className="mb-6 flex items-start justify-between">

                    <div>
                        <h2 className="text-xl font-semibold text-white">
                            {isEditing
                                ? "Edit Customer"
                                : "Add Customer"}
                        </h2>

                        <p className="mt-1 text-sm text-slate-400">
                            {isEditing
                                ? "Update customer information."
                                : "Add a new customer to your business."}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-2xl text-slate-500 hover:text-white"
                    >
                        ×
                    </button>

                </div>

                {/* FORM */}

                <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                        <Input
                            label="Customer Name"
                            value={name}
                            onChange={setName}
                            required
                        />

                        <Input
                            label="Company Name"
                            value={companyName}
                            onChange={setCompanyName}
                        />

                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                        <Input
                            label="Phone"
                            value={phone}
                            onChange={setPhone}
                            required
                        />

                        <Input
                            label="Email"
                            type="email"
                            value={email}
                            onChange={setEmail}
                        />

                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                        <Input
                            label="GSTIN"
                            value={gstin}
                            onChange={setGstin}
                            placeholder="22AAAAA0000A1Z5"
                        />

                        <Input
                            label="City"
                            value={city}
                            onChange={setCity}
                            placeholder="Nagpur"
                        />

                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                            Address
                        </label>

                        <textarea
                            value={address}
                            onChange={(event) =>
                                setAddress(event.target.value)
                            }
                            rows={3}
                            placeholder="Customer billing address"
                            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                        <Input
                            label="Credit Limit"
                            type="number"
                            value={creditLimit}
                            onChange={setCreditLimit}
                            placeholder="500000"
                        />

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                Status
                            </label>

                            <select
                                value={status}
                                onChange={(event) =>
                                    setStatus(event.target.value)
                                }
                                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white outline-none focus:border-blue-500"
                            >
                                <option value="ACTIVE">
                                    Active
                                </option>

                                <option value="INACTIVE">
                                    Inactive
                                </option>
                            </select>
                        </div>

                    </div>

                    {error && (
                        <div className="rounded-lg border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-3">

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading
                                ? isEditing
                                    ? "Saving..."
                                    : "Creating..."
                                : isEditing
                                    ? "Save Changes"
                                    : "Create Customer"}
                        </button>

                    </div>

                </form>
            </div>
        </div>
    );
}

/* =====================================================
   INPUT
===================================================== */

interface InputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
    required?: boolean;
}

function Input({
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    required = false,
}: InputProps) {
    return (
        <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
                {label}
            </label>

            <input
                type={type}
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                placeholder={placeholder}
                required={required}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
            />
        </div>
    );
}