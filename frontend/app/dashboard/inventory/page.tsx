"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createInventoryTransaction,
  getInventoryTransactions,
  getProducts,
  type InventoryTransaction,
  type Product,
} from "@/lib/api";
import { useToast } from "@/components/ui/ToastProvider";

type TransactionType =
  | "PURCHASE"
  | "SALE"
  | "DAMAGE"
  | "RETURN"
  | "ADJUSTMENT";

const transactionTypes: TransactionType[] = [
  "PURCHASE",
  "SALE",
  "DAMAGE",
  "RETURN",
  "ADJUSTMENT",
];

export default function InventoryPage() {

  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<
    InventoryTransaction[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const [productId, setProductId] = useState("");
  const [type, setType] =
    useState<TransactionType>("PURCHASE");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] =
    useState<"ALL" | TransactionType>("ALL");

  // =============================
  // Load data
  // =============================

  async function loadData() {
    try {
      setLoading(true);

      const [productsResponse, transactionsResponse] =
        await Promise.all([
          getProducts(),
          getInventoryTransactions(),
        ]);

      setProducts(productsResponse.data || []);
      setTransactions(
        transactionsResponse.data || []
      );
    } catch (error) {
      // console.error(
      //   "Failed to load inventory:",
      //   error
      // );

      showToast({
        type: "warning",
        title: "Failed to load inventory",
        message: "Quantity must be greater than zero.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // =============================
  // Stats
  // =============================

  const lowStockProducts = useMemo(() => {
    return products.filter(
      (product) =>
        product.currentStock <= product.minimumStock
    );
  }, [products]);

  const totalStockUnits = useMemo(() => {
    return products.reduce(
      (total, product) =>
        total + product.currentStock,
      0
    );
  }, [products]);

  const incomingMovements = useMemo(() => {
    return transactions.filter(
      (transaction) =>
        transaction.type === "PURCHASE" ||
        transaction.type === "RETURN"
    ).length;
  }, [transactions]);

  const outgoingMovements = useMemo(() => {
    return transactions.filter(
      (transaction) =>
        transaction.type === "SALE" ||
        transaction.type === "DAMAGE"
    ).length;
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const productName =
        transaction.product?.name?.toLowerCase() || "";

      const sku =
        transaction.product?.sku?.toLowerCase() || "";

      const matchesSearch =
        !query ||
        productName.includes(query) ||
        sku.includes(query);

      const matchesType =
        typeFilter === "ALL" ||
        transaction.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [transactions, search, typeFilter]);

  // =============================
  // Create transaction
  // =============================

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();


    if (!productId) {
      showToast({
        type: "warning",
        title: "Product required",
        message: "Please select a product before saving the movement.",
      });
      return;
    }

    const parsedQuantity = Number(quantity);

    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      showToast({
        type: "warning",
        title: "Invalid quantity",
        message: "Quantity must be greater than zero.",
      });
      return;
    }

    try {
      setSubmitting(true);

      await createInventoryTransaction({
        productId: Number(productId),
        type,
        quantity: parsedQuantity,
        note: note.trim() || undefined,
      });

      setProductId("");
      setType("PURCHASE");
      setQuantity("");
      setNote("");
      setShowModal(false);

      await loadData();
    } catch (error) {
      // console.error(
      //   "Failed to create transaction:",
      //   error
      // );

      showToast({
        type: "error",
        title: "Unable to update inventory",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong while updating inventory.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // =============================
  // Helpers
  // =============================

  function formatDate(date: string) {
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getTransactionLabel(
    transactionType: TransactionType
  ) {
    const labels: Record<
      TransactionType,
      string
    > = {
      PURCHASE: "Purchase",
      SALE: "Sale",
      DAMAGE: "Damage",
      RETURN: "Return",
      ADJUSTMENT: "Adjustment",
    };

    return labels[transactionType];
  }

  function getTransactionStyle(
    transactionType: TransactionType
  ) {
    if (
      transactionType === "PURCHASE" ||
      transactionType === "RETURN"
    ) {
      return {
        badge:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        icon: "+",
        quantity: "text-emerald-600",
      };
    }

    if (
      transactionType === "SALE" ||
      transactionType === "DAMAGE"
    ) {
      return {
        badge:
          "border-rose-200 bg-rose-50 text-rose-700",
        icon: "−",
        quantity: "text-rose-600",
      };
    }

    return {
      badge:
        "border-slate-200 bg-slate-50 text-slate-700",
      icon: "↕",
      quantity: "text-slate-700",
    };
  }

  // =============================
  // Loading
  // =============================

  if (loading) {
    return (
      <div className="min-h-full bg-[#f7f7f8] p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1600px]">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 rounded-lg bg-gray-200" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-32 rounded-2xl border border-gray-200 bg-white"
                />
              ))}
            </div>
            
            <div className="h-[500px] rounded-2xl border border-gray-200 bg-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f7f7f8]">
      <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">

        {/* =====================================
            PAGE HEADER
        ===================================== */}

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-gray-400">
              <span>Operations</span>
              <span>/</span>
              <span className="text-gray-600">
                Inventory
              </span>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-gray-950">
              Inventory
            </h1>

            <p className="mt-1.5 max-w-xl text-sm text-gray-500">
              Monitor stock levels, record movements,
              and keep your inventory history clean.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 active:scale-[0.98]"
          >
            <span className="text-lg leading-none">
              +
            </span>
            Record movement
          </button>
        </div>

        {/* =====================================
            KPI CARDS
        ===================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* Products */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Products
                </p>

                <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">
                  {products.length}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                <span className="text-lg">▦</span>
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-400">
              Active products in inventory
            </p>
          </div>

          {/* Stock */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Stock on hand
                </p>

                <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">
                  {totalStockUnits.toLocaleString(
                    "en-IN"
                  )}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                <span className="text-lg">◫</span>
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-400">
              Combined quantity across products
            </p>
          </div>

          {/* Low stock */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Low stock
                </p>

                <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">
                  {lowStockProducts.length}
                </p>
              </div>

              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${lowStockProducts.length > 0
                  ? "bg-amber-50 text-amber-600"
                  : "bg-emerald-50 text-emerald-600"
                  }`}
              >
                <span className="text-lg">!</span>
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-400">
              {lowStockProducts.length > 0
                ? "Products need attention"
                : "Stock levels look healthy"}
            </p>
          </div>

          {/* Movements */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Movements
                </p>

                <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">
                  {transactions.length}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                <span className="text-lg">↕</span>
              </div>
            </div>

            <div className="mt-4 flex gap-3 text-xs">
              <span className="text-emerald-600">
                ↑ {incomingMovements} incoming
              </span>

              <span className="text-rose-600">
                ↓ {outgoingMovements} outgoing
              </span>
            </div>
          </div>
        </div>

        {/* =====================================
            LOW STOCK PANEL
        ===================================== */}

        {lowStockProducts.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white">
            <div className="flex flex-col gap-4 border-b border-amber-100 bg-amber-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 font-bold text-amber-700">
                  !
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Stock attention required
                  </h2>

                  <p className="mt-0.5 text-xs text-gray-500">
                    {lowStockProducts.length}{" "}
                    {lowStockProducts.length === 1
                      ? "product is"
                      : "products are"}{" "}
                    at or below minimum stock.
                  </p>
                </div>
              </div>

              <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                Needs attention
              </span>
            </div>

            <div className="flex gap-3 overflow-x-auto p-4">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="min-w-[220px] rounded-xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {product.name}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {product.sku}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-lg bg-white px-2 py-1 text-xs font-medium text-gray-600">
                      {product.unit}
                    </span>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-gray-400">
                        Current
                      </p>

                      <p className="mt-1 text-lg font-semibold text-amber-600">
                        {product.currentStock}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-wide text-gray-400">
                        Minimum
                      </p>

                      <p className="mt-1 text-sm font-medium text-gray-700">
                        {product.minimumStock}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================
            TRANSACTIONS
        ===================================== */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">

          {/* Toolbar */}

          <div className="border-b border-gray-100 px-5 py-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

              <div>
                <h2 className="text-base font-semibold text-gray-950">
                  Stock movements
                </h2>

                <p className="mt-1 text-xs text-gray-400">
                  Complete inventory activity and audit history
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">

                {/* Search */}

                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    ⌕
                  </span>

                  <input
                    type="text"
                    placeholder="Search product or SKU"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white sm:w-[250px]"
                  />
                </div>

                {/* Filter */}

                <select
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(
                      event.target.value as
                      | "ALL"
                      | TransactionType
                    )
                  }
                  className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-gray-400 focus:bg-white"
                >
                  <option value="ALL">
                    All movements
                  </option>

                  {transactionTypes.map(
                    (transactionType) => (
                      <option
                        key={transactionType}
                        value={transactionType}
                      >
                        {getTransactionLabel(
                          transactionType
                        )}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Date
                  </th>

                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Product
                  </th>

                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Type
                  </th>

                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Quantity
                  </th>

                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Note
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-20 text-center"
                    >
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl text-gray-400">
                          ↕
                        </div>

                        <h3 className="mt-4 text-sm font-semibold text-gray-900">
                          No movements found
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-gray-400">
                          {search || typeFilter !== "ALL"
                            ? "Try changing your search or filter."
                            : "Record your first stock movement to see it here."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map(
                    (transaction) => {
                      const style =
                        getTransactionStyle(
                          transaction.type
                        );

                      return (
                        <tr
                          key={transaction.id}
                          className="group transition hover:bg-gray-50/80"
                        >
                          <td className="whitespace-nowrap px-5 py-4">
                            <p className="text-sm font-medium text-gray-700">
                              {formatDate(
                                transaction.createdAt
                              )}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xs font-semibold text-gray-600">
                                {transaction.product?.name
                                  ?.charAt(0)
                                  .toUpperCase() || "P"}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-gray-900">
                                  {
                                    transaction.product
                                      ?.name
                                  }
                                </p>

                                <p className="mt-0.5 text-xs text-gray-400">
                                  {
                                    transaction.product
                                      ?.sku
                                  }
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${style.badge}`}
                            >
                              <span>
                                {style.icon}
                              </span>

                              {getTransactionLabel(
                                transaction.type
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div
                              className={`text-sm font-semibold ${style.quantity}`}
                            >
                              {transaction.quantity > 0
                                ? "+"
                                : ""}
                              {transaction.quantity}
                              <span className="ml-1 text-xs font-normal text-gray-400">
                                {
                                  transaction.product
                                    ?.unit
                                }
                              </span>
                            </div>
                          </td>

                          <td className="max-w-[300px] px-5 py-4">
                            <p className="truncate text-sm text-gray-500">
                              {transaction.note || "No note"}
                            </p>
                          </td>
                        </tr>
                      );
                    }
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}

          {filteredTransactions.length > 0 && (
            <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3">
              <p className="text-xs text-gray-400">
                Showing{" "}
                <span className="font-medium text-gray-600">
                  {filteredTransactions.length}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-600">
                  {transactions.length}
                </span>{" "}
                inventory movements
              </p>
            </div>
          )}
        </div>
      </div>

      {/* =====================================
          CREATE MOVEMENT MODAL
      ===================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4 backdrop-blur-[2px]">

          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">

            {/* Modal header */}

            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                    Inventory
                  </p>

                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-gray-950">
                    Record stock movement
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Update stock and create an audit record.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowModal(false)
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              {/* Product */}

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Product
                </label>

                <select
                  value={productId}
                  onChange={(event) =>
                    setProductId(
                      event.target.value
                    )
                  }
                  required
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:bg-white"
                >
                  <option value="">
                    Select a product
                  </option>

                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name} · {product.sku} ·{" "}
                      {product.currentStock}{" "}
                      {product.unit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Movement type */}

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Movement type
                </label>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {transactionTypes.map(
                    (transactionType) => {
                      const selected =
                        type === transactionType;

                      const positive =
                        transactionType ===
                        "PURCHASE" ||
                        transactionType ===
                        "RETURN";

                      const negative =
                        transactionType ===
                        "SALE" ||
                        transactionType ===
                        "DAMAGE";

                      return (
                        <button
                          key={transactionType}
                          type="button"
                          onClick={() =>
                            setType(
                              transactionType
                            )
                          }
                          className={`rounded-xl border px-2 py-3 text-xs font-semibold transition ${selected
                            ? positive
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : negative
                                ? "border-rose-300 bg-rose-50 text-rose-700"
                                : "border-gray-400 bg-gray-100 text-gray-800"
                            : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                        >
                          {getTransactionLabel(
                            transactionType
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Quantity */}

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Quantity
                </label>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      event.target.value
                    )
                  }
                  placeholder="0.00"
                  required
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:bg-white"
                />

                <p className="mt-1.5 text-xs text-gray-400">
                  Enter a positive quantity. OpsFlow
                  automatically determines whether stock
                  increases or decreases.
                </p>
              </div>

              {/* Note */}

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Note
                  <span className="ml-1 font-normal normal-case tracking-normal text-gray-400">
                    optional
                  </span>
                </label>

                <textarea
                  value={note}
                  onChange={(event) =>
                    setNote(event.target.value)
                  }
                  placeholder="e.g. Received 10mm TMT from supplier..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
                />
              </div>

              {/* Footer */}

              <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setShowModal(false)
                  }
                  className="h-11 rounded-xl border border-gray-200 px-5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="h-11 rounded-xl bg-gray-950 px-5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Recording..."
                    : "Record movement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
