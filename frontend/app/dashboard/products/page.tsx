"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  createProduct,
  deleteProduct,
  getProducts,
  Product,
  updateProduct,
} from "@/lib/api";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState("ALL");

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [error, setError] = useState("");

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await getProducts();

      setProducts(response.data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load products"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function handleAdd() {
    setEditingProduct(null);
    setShowForm(true);
  }

  function handleEdit(product: Product) {
    setEditingProduct(product);
    setShowForm(true);
  }

  function handleClose() {
    setShowForm(false);
    setEditingProduct(null);
  }

  async function handleSuccess() {
    setShowForm(false);
    setEditingProduct(null);

    await loadProducts();
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteProduct(id);

      await loadProducts();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete product"
      );
    }
  }

  const categories = Array.from(
    new Set(products.map((product) => product.category))
  );

  const filteredProducts = products.filter(
    (product) => {
      const searchTerm = search
        .toLowerCase()
        .trim();

      const matchesSearch =
        product.name
          .toLowerCase()
          .includes(searchTerm) ||
        product.sku
          .toLowerCase()
          .includes(searchTerm) ||
        product.brand
          ?.toLowerCase()
          .includes(searchTerm);

      const matchesCategory =
        categoryFilter === "ALL" ||
        product.category === categoryFilter;

      return (
        matchesSearch &&
        matchesCategory
      );
    }
  );

  return (
    <div>
      {/* PAGE HEADER */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <p className="text-sm text-slate-400">
            Catalog
          </p>

          <h1 className="mt-1 text-3xl font-bold text-white">
            Products
          </h1>

          <p className="mt-2 text-slate-400">
            Manage products, pricing and stock levels.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
        >
          + Add Product
        </button>

      </div>

      {/* SEARCH / FILTER */}

      <div className="mb-6 flex flex-col gap-3 lg:flex-row">

        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search by product, SKU or brand..."
          className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
        />

        <select
          value={categoryFilter}
          onChange={(event) =>
            setCategoryFilter(event.target.value)
          }
          className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
        >
          <option value="ALL">
            All Categories
          </option>

          {categories.map((category) => (
            <option
              key={category}
              value={category}
            >
              {category}
            </option>
          ))}
        </select>

      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-6 rounded-lg border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* TABLE */}

      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
          Loading products...
        </div>
      ) : (
        <>
          <div className="mb-3 text-sm text-slate-500">
            Showing {filteredProducts.length} of{" "}
            {products.length} products
          </div>

          <ProductTable
            products={filteredProducts}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </>
      )}

      {/* FORM */}

      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}

    </div>
  );
}

/* =====================================================
   PRODUCT TABLE
===================================================== */

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
}

function ProductTable({
  products,
  onEdit,
  onDelete,
}: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">

        <h2 className="text-lg font-semibold text-white">
          No products found
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Add your first product to get started.
        </p>

      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900">

      <div className="overflow-x-auto">

        <table className="w-full min-w-[1100px] text-left">

          <thead className="border-b border-slate-800">
            <tr>

              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Product
              </th>

              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                SKU
              </th>

              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Category
              </th>

              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Brand
              </th>

              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Selling Price
              </th>

              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Stock
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

            {products.map((product) => {

              const lowStock =
                product.currentStock <=
                product.minimumStock;

              return (
                <tr
                  key={product.id}
                  className="transition hover:bg-slate-800/40"
                >

                  <td className="px-6 py-4">

                    <p className="font-medium text-white">
                      {product.name}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {product.unit}
                    </p>

                  </td>

                  <td className="px-6 py-4 text-sm text-slate-300">
                    {product.sku}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-300">
                    {product.category}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-300">
                    {product.brand || "-"}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-300">
                    ₹
                    {product.sellingPrice.toLocaleString(
                      "en-IN"
                    )}
                  </td>

                  <td className="px-6 py-4">

                    <p
                      className={`text-sm font-medium ${
                        lowStock
                          ? "text-red-400"
                          : "text-slate-300"
                      }`}
                    >
                      {product.currentStock}{" "}
                      {product.unit}
                    </p>

                    {lowStock && (
                      <p className="mt-1 text-xs text-red-500">
                        Low stock
                      </p>
                    )}

                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge
                      status={product.status}
                    />
                  </td>

                  <td className="sticky right-0 bg-slate-900 px-6 py-4">

                    <div className="flex justify-end gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          onEdit(product)
                        }
                        className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onDelete(product.id)
                        }
                        className="rounded-lg border border-red-900 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-950"
                      >
                        Delete
                      </button>

                    </div>

                  </td>

                </tr>
              );
            })}

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
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        isActive
          ? "bg-green-950 text-green-400"
          : "bg-slate-800 text-slate-400"
      }`}
    >
      {status}
    </span>
  );
}

/* =====================================================
   PRODUCT FORM
===================================================== */

interface ProductFormProps {
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

function ProductForm({
  product,
  onClose,
  onSuccess,
}: ProductFormProps) {
  const isEditing = product !== null;

  const [name, setName] = useState(
    product?.name || ""
  );

  const [sku, setSku] = useState(
    product?.sku || ""
  );

  const [category, setCategory] = useState(
    product?.category || ""
  );

  const [brand, setBrand] = useState(
    product?.brand || ""
  );

  const [unit, setUnit] = useState(
    product?.unit || "PIECE"
  );

  const [purchasePrice, setPurchasePrice] =
    useState(
      product?.purchasePrice?.toString() || ""
    );

  const [sellingPrice, setSellingPrice] =
    useState(
      product?.sellingPrice?.toString() || ""
    );

  const [currentStock, setCurrentStock] =
    useState(
      product?.currentStock?.toString() || "0"
    );

  const [minimumStock, setMinimumStock] =
    useState(
      product?.minimumStock?.toString() || "0"
    );

  const [status, setStatus] = useState(
    product?.status || "ACTIVE"
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
      const productData = {
        name,
        sku,
        category,
        brand: brand || undefined,
        unit,
        purchasePrice: purchasePrice
          ? Number(purchasePrice)
          : undefined,
        sellingPrice: Number(sellingPrice),
        currentStock: Number(currentStock),
        minimumStock: Number(minimumStock),
        status,
      };

      if (isEditing) {
        await updateProduct(
          product.id,
          productData
        );
      } else {
        await createProduct(productData);
      }

      onSuccess();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : isEditing
            ? "Failed to update product"
            : "Failed to create product"
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
                ? "Edit Product"
                : "Add Product"}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {isEditing
                ? "Update product information."
                : "Add a product to your catalog."}
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

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <Input
              label="Product Name"
              value={name}
              onChange={setName}
              placeholder="TMT Bar 10mm"
              required
            />

            <Input
              label="SKU"
              value={sku}
              onChange={setSku}
              placeholder="TMT-10-JSW"
              required
            />

          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <Input
              label="Category"
              value={category}
              onChange={setCategory}
              placeholder="Steel"
              required
            />

            <Input
              label="Brand"
              value={brand}
              onChange={setBrand}
              placeholder="JSW"
            />

          </div>

          {/* UNIT */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Unit
            </label>

            <select
              value={unit}
              onChange={(event) =>
                setUnit(event.target.value)
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white outline-none focus:border-blue-500"
            >
              <option value="PIECE">
                Piece
              </option>

              <option value="KG">
                Kilogram
              </option>

              <option value="TON">
                Ton
              </option>

              <option value="BAG">
                Bag
              </option>

              <option value="METER">
                Meter
              </option>

              <option value="BOX">
                Box
              </option>

              <option value="LITER">
                Liter
              </option>
            </select>
          </div>

          {/* PRICES */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <Input
              label="Purchase Price"
              type="number"
              value={purchasePrice}
              onChange={setPurchasePrice}
              placeholder="58000"
            />

            <Input
              label="Selling Price"
              type="number"
              value={sellingPrice}
              onChange={setSellingPrice}
              placeholder="61000"
              required
            />

          </div>

          {/* STOCK */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <Input
              label="Current Stock"
              type="number"
              value={currentStock}
              onChange={setCurrentStock}
              placeholder="100"
            />

            <Input
              label="Minimum Stock"
              type="number"
              value={minimumStock}
              onChange={setMinimumStock}
              placeholder="20"
            />

          </div>

          {/* STATUS */}

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

          {/* ERROR */}

          {error && (
            <div className="rounded-lg border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* BUTTONS */}

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
                  : "Create Product"}
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