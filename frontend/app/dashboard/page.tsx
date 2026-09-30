"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
} from "@/lib/api";

interface User {
  id: number;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await getCurrentUser();

        setUser(response.data);
      } catch (error) {
        console.error("AUTH CHECK FAILED:", error);

        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-slate-400">
          Loading dashboard...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <p className="text-sm text-slate-400">
          Overview
        </p>

        <h1 className="mt-1 text-3xl font-bold">
          Good morning
        </h1>

        <p className="mt-2 text-slate-400">
          {user.email} · {user.role}
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Employees"
          value="42"
          description="Active employees"
        />

        <StatCard
          title="Orders"
          value="184"
          description="This month"
        />

        <StatCard
          title="Revenue"
          value="₹8.4L"
          description="This month"
        />

        <StatCard
          title="Low Stock"
          value="17"
          description="Products need attention"
        />
      </div>

      {/* Dashboard Sections */}
      <div className="mt-6 grid gap-6 xl:grid-cols-2">

        {/* Recent Orders */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">
              Recent Orders
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Latest orders across your business.
            </p>
          </div>

          <div className="space-y-3">
            <OrderRow
              id="#1001"
              customer="Rahul Sharma"
              amount="₹12,500"
              status="Pending"
            />

            <OrderRow
              id="#1002"
              customer="Priya Shah"
              amount="₹8,200"
              status="Shipped"
            />

            <OrderRow
              id="#1003"
              customer="Amit Patel"
              amount="₹21,000"
              status="Completed"
            />
          </div>
        </section>

        {/* Low Stock */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">
              Low Stock
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Products that need attention.
            </p>
          </div>

          <div className="space-y-3">
            <StockRow
              product="Keyboard"
              stock="3 units"
            />

            <StockRow
              product="Wireless Mouse"
              stock="7 units"
            />

            <StockRow
              product="Monitor"
              stock="2 units"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------------- STAT CARD ---------------- */

interface StatCardProps {
  title: string;
  value: string;
  description: string;
}

function StatCard({
  title,
  value,
  description,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

/* ---------------- ORDER ROW ---------------- */

interface OrderRowProps {
  id: string;
  customer: string;
  amount: string;
  status: string;
}

function OrderRow({
  id,
  customer,
  amount,
  status,
}: OrderRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-800/60 p-4">
      <div>
        <p className="text-sm font-medium">
          {id}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {customer}
        </p>
      </div>

      <div className="text-right">
        <p className="text-sm font-medium">
          {amount}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {status}
        </p>
      </div>
    </div>
  );
}

/* ---------------- STOCK ROW ---------------- */

interface StockRowProps {
  product: string;
  stock: string;
}

function StockRow({
  product,
  stock,
}: StockRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-800/60 p-4">
      <p className="text-sm font-medium">
        {product}
      </p>

      <span className="rounded-full bg-red-950 px-3 py-1 text-xs text-red-400">
        {stock}
      </span>
    </div>
  );
}