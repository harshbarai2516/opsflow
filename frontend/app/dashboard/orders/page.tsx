"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createOrder,
  getCustomers,
  getOrders,
  getProducts,
  updateOrderStatus,
  type Customer,
  type Order,
  type Product,
} from "@/lib/api";
import { useToast } from "@/components/ui/ToastProvider";

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "DISPATCHED"
  | "DELIVERED"
  | "CANCELLED";

interface OrderFormItem {
  productId: number;
  quantity: number;
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  DISPATCHED: "bg-purple-50 text-purple-700 border-purple-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getStatusLabel(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}



export default function OrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [customerId, setCustomerId] = useState("");
  const [formItems, setFormItems] = useState<OrderFormItem[]>([
    {
      productId: 0,
      quantity: 1,
    },
  ]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");


  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [ordersData, customersData, productsData] =
        await Promise.all([
          getOrders(),
          getCustomers(),
          getProducts(),
        ]);

      setOrders(ordersData.orders || ordersData.data || []);
      setCustomers(customersData.customers || customersData.data || []);
      setProducts(productsData.products || productsData.data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load orders"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchText) ||
        order.customer?.name
          ?.toLowerCase()
          .includes(searchText) ||
        order.customer?.companyName
          ?.toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "ALL" ||
        order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter(
        (order) => order.status === "PENDING"
      ).length,
      confirmed: orders.filter(
        (order) => order.status === "CONFIRMED"
      ).length,
      delivered: orders.filter(
        (order) => order.status === "DELIVERED"
      ).length,
    };
  }, [orders]);

  const selectedFormItems = useMemo(() => {
    return formItems.map((item) => {
      const product = products.find(
        (product) => product.id === item.productId
      );

      return {
        ...item,
        product,
        total: product
          ? product.sellingPrice * item.quantity
          : 0,
      };
    });
  }, [formItems, products]);

  const subtotal = selectedFormItems.reduce(
    (sum, item) => sum + item.total,
    0
  );

  const total = Math.max(subtotal - Number(discount || 0), 0);

  function resetForm() {
    setCustomerId("");
    setFormItems([
      {
        productId: 0,
        quantity: 1,
      },
    ]);
    setDiscount(0);
    setNotes("");
  }

  function addProductRow() {
    setFormItems((current) => [
      ...current,
      {
        productId: 0,
        quantity: 1,
      },
    ]);
  }

  function removeProductRow(index: number) {
    setFormItems((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  function updateProductRow(
    index: number,
    field: "productId" | "quantity",
    value: number
  ) {
    setFormItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
            ...item,
            [field]: value,
          }
          : item
      )
    );
  }

  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      if (!customerId) {
        throw new Error("Please select a customer.");
      }

      const validItems = formItems.filter(
        (item) => item.productId > 0 && item.quantity > 0
      );

      if (validItems.length === 0) {
        throw new Error("Add at least one product.");
      }

      const uniqueProductIds = new Set(
        validItems.map((item) => item.productId)
      );

      if (uniqueProductIds.size !== validItems.length) {
        throw new Error(
          "The same product cannot be added twice."
        );
      }

      if (discount < 0) {
        throw new Error("Discount cannot be negative.");
      }

      if (discount > subtotal) {
        throw new Error(
          "Discount cannot be greater than subtotal."
        );
      }

      await createOrder({
        customerId: Number(customerId),
        items: validItems.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
        })),
        discount: Number(discount),
        notes: notes.trim() || undefined,
      });

      resetForm();
      setShowCreateModal(false);

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create order"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(
    order: Order,
    nextStatus: OrderStatus
  ) {
    try {
      setActionLoading(order.id);
      setError("");

      await updateOrderStatus(order.id, nextStatus);

      const refreshedOrders = await getOrders();

      setOrders(
        refreshedOrders.orders ||
        refreshedOrders.data ||
        []
      );

      if (selectedOrder?.id === order.id) {
        const refreshedOrder = await getOrderByIdSafe(order.id);
        setSelectedOrder(refreshedOrder);

        if (nextStatus === "CANCELLED") {
          setShowDetailsModal(false);
          setSelectedOrder(null);
        }
      }


    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update order status"
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function getOrderByIdSafe(id: number) {
    const { getOrderById } = await import("@/lib/api");
    const response = await getOrderById(id);

    return response.order || response.data || response;
  }

  function hasInsufficientStock(order: Order) {
    return (
      order.items?.some(
        (item) =>
          item.quantity > Number(item.product?.currentStock ?? 0)
      ) ?? false
    );
  }

  async function openOrderDetails(order: Order) {
    try {
      const freshOrder = await getOrderByIdSafe(order.id);

      setSelectedOrder(freshOrder);
      setShowDetailsModal(true);
    } catch (err) {
      showToast({
        type: "error",
        title: "Unable to load order",
        message:
          err instanceof Error
            ? err.message
            : "Failed to load the latest order details.",
      });
    }
  }
  function getNextAction(order: Order) {
    if (order.status === "PENDING") {
      return {
        label: "Confirm",
        status: "CONFIRMED" as OrderStatus,
      };
    }

    if (order.status === "CONFIRMED") {
      return {
        label: "Dispatch",
        status: "DISPATCHED" as OrderStatus,
      };
    }

    if (order.status === "DISPATCHED") {
      return {
        label: "Deliver",
        status: "DELIVERED" as OrderStatus,
      };
    }

    return null;
  }

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-zinc-900">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Operations / Orders
            </p>

            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
              Orders
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Manage customer orders, fulfillment and delivery.
            </p>
          </div>

          <button
            onClick={() => {
              setError("");
              setShowCreateModal(true);
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
          >
            <span className="text-lg leading-none">+</span>
            New Order
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              onClick={() => setError("")}
              className="ml-4 text-red-400 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Total Orders"
            value={stats.total}
            description="All orders"
          />

          <StatCard
            label="Pending"
            value={stats.pending}
            description="Awaiting confirmation"
          />

          <StatCard
            label="Confirmed"
            value={stats.confirmed}
            description="Ready for dispatch"
          />

          <StatCard
            label="Delivered"
            value={stats.delivered}
            description="Completed orders"
          />
        </div>

        {/* Main Card */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order or customer..."
                className="h-10 w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-zinc-400"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <div className="hidden rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-500 sm:block">
                {filteredOrders.length} orders
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/70">
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    Order
                  </th>

                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    Customer
                  </th>

                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    Items
                  </th>

                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    Total
                  </th>

                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    Status
                  </th>

                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    Date
                  </th>

                  <th className="sticky right-0 bg-zinc-50/95 px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <LoadingRows />
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400">
                          <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          >
                            <path d="M6 2h12v20H6z" />
                            <path d="M9 6h6M9 10h6M9 14h4" />
                          </svg>
                        </div>

                        <p className="text-sm font-medium text-zinc-700">
                          No orders found
                        </p>

                        <p className="mt-1 text-xs text-zinc-400">
                          Create your first order to get started.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const nextAction = getNextAction(order);

                    return (
                      <tr
                        key={order.id}
                        className="group border-b border-zinc-100 transition hover:bg-zinc-50/70"
                      >
                        <td className="px-5 py-4">
                          <button
                            onClick={() =>
                              openOrderDetails(order)
                            }
                            className="text-left"
                          >
                            <p className="text-sm font-semibold text-zinc-900 hover:text-zinc-600">
                              {order.orderNumber}
                            </p>

                            <p className="mt-0.5 text-[11px] text-zinc-400">
                              #{order.id}
                            </p>
                          </button>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-zinc-800">
                            {order.customer?.companyName ||
                              order.customer?.name ||
                              "Unknown"}
                          </p>

                          {order.customer?.companyName && (
                            <p className="mt-0.5 text-xs text-zinc-400">
                              {order.customer.name}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm text-zinc-600">
                            {order.items?.length || 0}
                          </span>

                          <span className="ml-1 text-xs text-zinc-400">
                            product
                            {(order.items?.length || 0) !== 1
                              ? "s"
                              : ""}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm font-semibold text-zinc-900">
                            {formatCurrency(order.total)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={order.status} />
                        </td>

                        <td className="px-5 py-4 text-sm text-zinc-500">
                          {formatDate(order.createdAt)}
                        </td>

                        <td className="sticky right-0 bg-white px-5 py-4 text-right group-hover:bg-zinc-50">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() =>
                                openOrderDetails(order)
                              }
                              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-300 hover:bg-white hover:text-zinc-900"
                            >
                              View
                            </button>

                            {nextAction && (
                              <button
                                disabled={
                                  actionLoading === order.id ||
                                  (
                                    nextAction.status === "CONFIRMED" &&
                                    hasInsufficientStock(order)
                                  )
                                }
                                onClick={() => {
                                  if (
                                    nextAction.status === "CONFIRMED" &&
                                    hasInsufficientStock(order)
                                  ) {
                                    showToast({
                                      type: "error",
                                      title: "Insufficient inventory",
                                      message:
                                        "This order cannot be confirmed because one or more products do not have enough stock.",
                                    });

                                    return;
                                  }

                                  handleStatusChange(
                                    order,
                                    nextAction.status
                                  );
                                }}
                                className="rounded-lg bg-zinc-950 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {actionLoading === order.id
                                  ? "..."
                                  : nextAction.label}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Order Modal */}
      {showCreateModal && (
        <Modal
          title="Create new order"
          description="Create an order for a customer."
          onClose={() => {
            if (!submitting) {
              resetForm();
              setShowCreateModal(false);
            }
          }}
          wide
        >
          <form onSubmit={handleCreateOrder}>
            <div className="space-y-5">
              {/* Customer */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700">
                  Customer
                </label>

                <select
                  required
                  value={customerId}
                  onChange={(e) =>
                    setCustomerId(e.target.value)
                  }
                  className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
                >
                  <option value="">
                    Select customer
                  </option>

                  {customers
                    .filter(
                      (customer) =>
                        customer.status === "ACTIVE"
                    )
                    .map((customer) => (
                      <option
                        key={customer.id}
                        value={customer.id}
                      >
                        {customer.companyName
                          ? `${customer.companyName} · ${customer.name}`
                          : customer.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Products */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-700">
                    Products
                  </label>

                  <button
                    type="button"
                    onClick={addProductRow}
                    className="text-xs font-semibold text-zinc-700 hover:text-zinc-950"
                  >
                    + Add product
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedFormItems.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[1fr_100px_120px_32px] gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2"
                    >
                      <select
                        value={item.productId}
                        onChange={(e) =>
                          updateProductRow(
                            index,
                            "productId",
                            Number(e.target.value)
                          )
                        }
                        className="h-10 rounded-md border border-zinc-200 bg-white px-2 text-sm outline-none focus:border-zinc-400"
                      >
                        <option value={0}>
                          Select product
                        </option>

                        {products
                          .filter(
                            (product) =>
                              product.status === "ACTIVE"
                          )
                          .map((product) => (
                            <option
                              key={product.id}
                              value={product.id}
                            >
                              {product.name} ·{" "}
                              {formatCurrency(
                                product.sellingPrice
                              )}
                              /{product.unit}
                            </option>
                          ))}
                      </select>

                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) =>
                          updateProductRow(
                            index,
                            "quantity",
                            Number(e.target.value)
                          )
                        }
                        className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
                        placeholder="Qty"
                      />

                      <div className="flex h-10 items-center justify-end rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700">
                        {formatCurrency(item.total)}
                      </div>

                      <button
                        type="button"
                        disabled={formItems.length === 1}
                        onClick={() =>
                          removeProductRow(index)
                        }
                        className="flex h-10 items-center justify-center rounded-md text-zinc-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="ml-auto max-w-sm rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex justify-between text-sm text-zinc-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-4 text-sm text-zinc-500">
                  <span>Discount</span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) =>
                      setDiscount(Number(e.target.value))
                    }
                    className="h-9 w-28 rounded-md border border-zinc-200 bg-white px-2 text-right text-sm outline-none focus:border-zinc-400"
                  />
                </div>

                <div className="my-4 border-t border-zinc-200" />

                <div className="flex justify-between text-base font-semibold text-zinc-950">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700">
                  Notes
                </label>

                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Delivery instructions, site details, etc."
                  className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(false);
                  }}
                  className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Creating..."
                    : "Create Order"}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <Modal
          title={selectedOrder.orderNumber}
          description={`Created ${formatDate(
            selectedOrder.createdAt
          )}`}
          onClose={() => setShowDetailsModal(false)}
          wide
        >
          <div className="space-y-5">
            {/* Customer */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Customer
                </p>

                <p className="mt-2 text-sm font-semibold text-zinc-900">
                  {selectedOrder.customer?.companyName ||
                    selectedOrder.customer?.name ||
                    "Unknown"}
                </p>

                {selectedOrder.customer?.companyName && (
                  <p className="mt-1 text-xs text-zinc-500">
                    {selectedOrder.customer.name}
                  </p>
                )}

                {selectedOrder.customer?.phone && (
                  <p className="mt-1 text-xs text-zinc-500">
                    {selectedOrder.customer.phone}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Status
                </p>

                <div className="mt-2">
                  <StatusBadge
                    status={selectedOrder.status}
                  />
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <p className="mb-2 text-xs font-semibold text-zinc-700">
                Order items
              </p>

              <div className="overflow-hidden rounded-xl border border-zinc-200">
                <table className="w-full text-left">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        Product
                      </th>
                      <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        Required
                      </th>

                      <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        Available
                      </th>

                      <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        Price
                      </th>

                      <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedOrder.items?.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-zinc-100"
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-zinc-800">
                            {item.product?.name ||
                              `Product #${item.productId}`}
                          </p>

                          {item.product?.sku && (
                            <p className="text-[11px] text-zinc-400">
                              {item.product.sku}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right text-sm text-zinc-600">
                          {item.quantity}{" "}
                          {item.product?.unit || ""}
                        </td>

                        <td
                          className={`px-4 py-3 text-right text-sm font-medium ${item.quantity >
                            Number(item.product?.currentStock ?? 0)
                            ? "text-red-600"
                            : "text-emerald-600"
                            }`}
                        >
                          {item.product?.currentStock ?? 0}{" "}
                          {item.product?.unit || ""}
                        </td>

                        <td className="px-4 py-3 text-right text-sm text-zinc-600">
                          {formatCurrency(item.unitPrice)}
                        </td>

                        <td className="px-4 py-3 text-right text-sm font-medium text-zinc-800">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="ml-auto max-w-sm space-y-2">
              <div className="flex justify-between text-sm text-zinc-500">
                <span>Subtotal</span>
                <span>
                  {formatCurrency(selectedOrder.subtotal)}
                </span>
              </div>

              <div className="flex justify-between text-sm text-zinc-500">
                <span>Discount</span>
                <span>
                  - {formatCurrency(selectedOrder.discount)}
                </span>
              </div>

              <div className="border-t border-zinc-200 pt-3">
                <div className="flex justify-between text-base font-semibold text-zinc-950">
                  <span>Total</span>
                  <span>
                    {formatCurrency(selectedOrder.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedOrder.notes && (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Notes
                </p>

                <p className="mt-2 text-sm text-zinc-600">
                  {selectedOrder.notes}
                </p>
              </div>
            )}

            {/* Actions */}
            {hasInsufficientStock(selectedOrder) && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-700">
                  Insufficient inventory
                </p>

                <p className="mt-1 text-xs leading-5 text-red-600">
                  One or more products do not have enough stock
                  to confirm this order.
                </p>
              </div>
            )}
            <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-4">
              {selectedOrder.status === "PENDING" && (
                <button
                  disabled={actionLoading === selectedOrder.id}
                  onClick={() =>
                    handleStatusChange(
                      selectedOrder,
                      "CANCELLED"
                    )
                  }
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Cancel Order
                </button>
              )}

              {getNextAction(selectedOrder) && (
                <button
                  disabled={
                    actionLoading === selectedOrder.id ||
                    (
                      selectedOrder.status === "PENDING" &&
                      hasInsufficientStock(selectedOrder)
                    )
                  }
                  onClick={() => {
                    const nextAction =
                      getNextAction(selectedOrder);

                    if (nextAction) {
                      handleStatusChange(
                        selectedOrder,
                        nextAction.status
                      );
                    }
                  }}
                  className="rounded-lg bg-zinc-950 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {actionLoading === selectedOrder.id
                    ? "Updating..."
                    : getNextAction(selectedOrder)?.label}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* =========================
   COMPONENTS
========================= */

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
        {label}
      </p>

      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-2xl font-semibold tracking-tight text-zinc-950">
          {value}
        </p>

        <div className="hidden h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 sm:flex">
          <span className="text-xs">↗</span>
        </div>
      </div>

      <p className="mt-1 text-xs text-zinc-400">
        {description}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusStyles[status] ||
        "border-zinc-200 bg-zinc-50 text-zinc-600"
        }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {getStatusLabel(status)}
    </span>
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <tr
          key={index}
          className="border-b border-zinc-100"
        >
          {Array.from({ length: 7 }).map(
            (_, cellIndex) => (
              <td
                key={cellIndex}
                className="px-5 py-5"
              >
                <div className="h-4 w-24 animate-pulse rounded bg-zinc-100" />
              </td>
            )
          )}
        </tr>
      ))}
    </>
  );
}

function Modal({
  title,
  description,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
      <div
        className={`max-h-[92vh] w-full overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-2xl ${wide ? "max-w-4xl" : "max-w-lg"
          }`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-zinc-100 bg-white px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-950">
              {title}
            </h2>

            {description && (
              <p className="mt-1 text-xs text-zinc-400">
                {description}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            ×
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
