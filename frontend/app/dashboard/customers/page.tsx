"use client";

import { FormEvent, useEffect, useState } from "react";

import {
    createCustomer,
    Customer,
    deleteCustomer,
    getCustomers,
    updateCustomer,
} from "@/lib/api";

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [editingCustomer, setEditingCustomer] =
        useState<Customer | null>(null);

    const [error, setError] = useState("");

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
        setEditingCustomer(customer);
        setShowForm(true);
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
        const confirmed = window.confirm(
            "Are you sure you want to delete this customer?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");

            await deleteCustomer(id);

            await loadCustomers();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to delete customer"
            );
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
}

function CustomerTable({
    customers,
    onEdit,
    onDelete,
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