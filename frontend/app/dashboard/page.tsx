"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAnalyticsSummary, getCurrentUser } from "@/lib/api";

interface User {
  id: number;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface RevenuePoint {
  date: string;
  revenue: number;
}

interface OrderStatus {
  status: string;
  count: number;
}

interface LowStockProduct {
  id: number;
  name: string;
  currentStock: number;
}

interface RecentPayment {
  id: number;
  paymentNumber: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  customer?: {
    name: string;
    companyName?: string | null;
  };
  invoice?: {
    invoiceNumber: string;
  };
}

interface AnalyticsSummary {
  totalSales: number;
  totalCollected: number;
  outstanding: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  orderStatus: Record<string, number>;
  revenueTrend: RevenuePoint[];
  lowStockProducts: LowStockProduct[];
  recentPayments: RecentPayment[];
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        // -----------------------------------------
        // 1. Load logged-in user
        // -----------------------------------------
        const userResponse = await getCurrentUser();

        const currentUser = userResponse.data;

        if (!currentUser) {
          throw new Error("User information not found");
        }

        setUser(currentUser);

        // -----------------------------------------
        // 2. Analytics is restricted
        // -----------------------------------------
        const canViewAnalytics =
          currentUser.role === "ADMIN" ||
          currentUser.role === "MANAGER";

        // -----------------------------------------
        // 3. Employee / Viewer dashboard
        // -----------------------------------------
        if (!canViewAnalytics) {
          setAnalytics(null);
          return;
        }

        // -----------------------------------------
        // 4. Load analytics for ADMIN / MANAGER
        // -----------------------------------------
        try {
          setAnalyticsLoading(true);

          const analyticsResponse =
            await getAnalyticsSummary();

          if (analyticsResponse?.data?.metrics) {
            const metrics = analyticsResponse.data.metrics;

            setAnalytics({
              ...metrics,
              orderStatus:
                analyticsResponse.data.orderStatus || {},
              revenueTrend:
                analyticsResponse.data.revenueTrend || [],
              lowStockProducts:
                analyticsResponse.data.lowStockProducts || [],
              recentPayments:
                analyticsResponse.data.recentPayments || [],
            });
          } else {
            setAnalytics(null);
          }
        } catch (analyticsError) {
          // console.error(
          //     "DASHBOARD ANALYTICS FAILED:",
          //     analyticsError
          // );

          // Analytics failure must NOT break
          // the entire dashboard.
          setAnalytics(null);
        } finally {
          setAnalyticsLoading(false);
        }
      } catch (error) {
        // console.error(
        //     "DASHBOARD LOAD FAILED:",
        //     error
        // );

        setUser(null);
        setAnalytics(null);
        setError("Failed to load dashboard.");

        // Only redirect when the user itself
        // cannot be loaded/authentication failed.
        router.replace("/login");
      } finally {
        setLoading(false);
        setAnalyticsLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const revenueTotal = useMemo(() => {
    if (!analytics?.revenueTrend?.length) return 0;
    return analytics.revenueTrend.reduce(
      (sum, item) => sum + Number(item.revenue || 0),
      0
    );
  }, [analytics]);

  const collectionRate = useMemo(() => {
    const total = Number(analytics?.totalSales || 0);
    const collected = Number(analytics?.totalCollected || 0);
    if (total <= 0) return 0;

    return Math.min(100, Math.max(0, (collected / total) * 100));
  }, [analytics]);

  const topOrderStatuses = useMemo(() => {
    if (!analytics?.orderStatus) return [];

    return Object.entries(analytics.orderStatus)
      .map(([status, count]) => ({
        status,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [analytics]);

  const canViewAnalytics =
    user?.role === "ADMIN" ||
    user?.role === "MANAGER";

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-cyan-500/5 blur-3xl" />

        <div className="relative flex flex-col gap-5 p-6 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              <span className="text-xs font-medium text-blue-400">
                Operations Overview
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {greeting}
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Here&apos;s what&apos;s happening across your business.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-sm font-bold text-blue-400">
              {user.email.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {user.email}
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                {user.role}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* KPI CARDS */}
      {/* KPI CARDS */}

      {canViewAnalytics ? (
        analyticsLoading ? (
          <KpiSkeleton />
        ) : analytics ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Total Sales"
              value={formatCurrency(analytics.totalSales)}
              description="Order value"
              icon="₹"
              iconClass="bg-blue-500/10 text-blue-400 border-blue-500/20"
            />

            <MetricCard
              title="Collected"
              value={formatCurrency(analytics.totalCollected)}
              description={`${collectionRate.toFixed(0)}% collected`}
              icon="✓"
              iconClass="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            />

            <MetricCard
              title="Outstanding"
              value={formatCurrency(analytics.outstanding)}
              description="Pending collection"
              icon="!"
              iconClass="bg-amber-500/10 text-amber-400 border-amber-500/20"
            />

            <MetricCard
              title="Low Stock"
              value={String(analytics.lowStockCount)}
              description="Products need attention"
              icon="!"
              iconClass="bg-red-500/10 text-red-400 border-red-500/20"
              alert={analytics.lowStockCount > 0}
            />
          </div>
        ) : null
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Role"
            value={user.role}
            description="Your current access level"
            icon="👤"
            iconClass="bg-blue-500/10 text-blue-400 border-blue-500/20"
          />

          <MetricCard
            title="Dashboard"
            value="Active"
            description="Operational dashboard"
            icon="✓"
            iconClass="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          />

          <MetricCard
            title="Access"
            value="Standard"
            description="Operational access"
            icon="→"
            iconClass="bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
          />

          <MetricCard
            title="Analytics"
            value="Restricted"
            description="Management access only"
            icon="!"
            iconClass="bg-amber-500/10 text-amber-400 border-amber-500/20"
          />
        </div>
      )}

      {/* MAIN GRID */}
      {canViewAnalytics ? (
        analyticsLoading ? (
          <MainDashboardSkeleton />
        ) : analytics ? (
          <>
            <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
              {/* Revenue Overview */}
              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Revenue Overview
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Revenue generated over the last 7 days.
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
                    <p className="text-xs text-slate-600">7-day total</p>
                    <p className="mt-0.5 text-sm font-semibold text-white">
                      {formatCurrency(revenueTotal)}
                    </p>
                  </div>
                </div>

                <RevenueChart data={analytics.revenueTrend} />
              </section>

              {/* Business Snapshot */}
              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-white">
                    Business Snapshot
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Current operational volume.
                  </p>
                </div>

                <div className="space-y-3">
                  <SnapshotRow
                    label="Orders"
                    value={analytics.totalOrders}
                    href="/dashboard/orders"
                  />

                  <SnapshotRow
                    label="Customers"
                    value={analytics.totalCustomers}
                    href="/dashboard/customers"
                  />

                  <SnapshotRow
                    label="Products"
                    value={analytics.totalProducts}
                    href="/dashboard/products"
                  />

                  <SnapshotRow
                    label="Outstanding"
                    value={formatCurrency(analytics.outstanding)}
                    href="/dashboard/invoices"
                    danger={analytics.outstanding > 0}
                  />
                </div>

                <div className="mt-5 border-t border-slate-800 pt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                      Collection progress
                    </span>

                    <span className="text-xs font-semibold text-slate-300">
                      {collectionRate.toFixed(0)}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${collectionRate}%` }}
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* OPERATIONS GRID */}
            <div className="grid gap-6 xl:grid-cols-2">
              {/* Order Pipeline */}
              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Order Pipeline
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Current order distribution by status.
                    </p>
                  </div>

                  <Link
                    href="/dashboard/orders"
                    className="shrink-0 text-xs font-medium text-blue-400 transition hover:text-blue-300"
                  >
                    View orders
                  </Link>
                </div>

                {topOrderStatuses.length === 0 ? (
                  <EmptyState text="No order data available." />
                ) : (
                  <div className="space-y-4">
                    {topOrderStatuses.map((item) => {
                      const percentage =
                        analytics.totalOrders > 0
                          ? (item.count / analytics.totalOrders) * 100
                          : 0;

                      return (
                        <div key={item.status}>
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <StatusDot status={item.status} />

                              <span className="text-sm font-medium text-slate-300">
                                {formatStatus(item.status)}
                              </span>
                            </div>

                            <span className="text-sm font-semibold text-white">
                              {item.count}
                            </span>
                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full bg-blue-500 transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Stock Alerts */}
              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Stock Alerts
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Products currently below the stock threshold.
                    </p>
                  </div>

                  <Link
                    href="/dashboard/inventory"
                    className="shrink-0 text-xs font-medium text-blue-400 transition hover:text-blue-300"
                  >
                    View inventory
                  </Link>
                </div>

                {analytics.lowStockProducts.length === 0 ? (
                  <div className="flex min-h-[180px] items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                        ✓
                      </div>

                      <p className="mt-3 text-sm font-medium text-white">
                        Inventory looks healthy
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        No low-stock products detected.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analytics.lowStockProducts
                      .slice(0, 5)
                      .map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-200">
                              {product.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-600">
                              Product #{product.id}
                            </p>
                          </div>

                          <span className="ml-4 shrink-0 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
                            {product.currentStock} units
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </section>
            </div>

            {/* RECENT PAYMENTS */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900">
              <div className="flex flex-col gap-3 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Recent Payments
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Latest payments received across your invoices.
                  </p>
                </div>

                <Link
                  href="/dashboard/payment"
                  className="text-xs font-medium text-blue-400 transition hover:text-blue-300"
                >
                  View payment ledger
                </Link>
              </div>

              {analytics.recentPayments.length === 0 ? (
                <EmptyState text="No recent payments found." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px]">
                    <thead className="border-b border-slate-800 bg-slate-950/40">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">
                          Payment
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Customer
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Method
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Date
                        </th>
                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">
                          Amount
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-800">
                      {analytics.recentPayments
                        .slice(0, 5)
                        .map((payment) => (
                          <tr
                            key={payment.id}
                            className="transition hover:bg-slate-800/30"
                          >
                            <td className="px-5 py-4 sm:px-6">
                              <p className="text-sm font-medium text-white">
                                {payment.paymentNumber}
                              </p>

                              <p className="mt-1 text-xs text-slate-600">
                                {payment.invoice?.invoiceNumber ||
                                  "No invoice"}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <p className="text-sm text-slate-300">
                                {payment.customer?.name ||
                                  "Unknown customer"}
                              </p>

                              {payment.customer?.companyName && (
                                <p className="mt-1 text-xs text-slate-600">
                                  {payment.customer.companyName}
                                </p>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-400">
                                {formatPaymentMethod(
                                  payment.paymentMethod
                                )}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-sm text-slate-500">
                              {formatDate(payment.paymentDate)}
                            </td>

                            <td className="px-5 py-4 text-right sm:px-6">
                              <span className="text-sm font-semibold text-emerald-400">
                                {formatCurrency(payment.amount)}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : null
      ) : (
        <EmployeeDashboard />
      )}
    </div>
  );
}

/* COMPONENTS & HELPERS */

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  icon: string;
  iconClass: string;
  alert?: boolean;
}

function MetricCard({
  title,
  value,
  description,
  icon,
  iconClass,
  alert,
}: MetricCardProps) {
  return (
    <div
      className={`rounded-2xl border bg-slate-900 p-5 transition ${alert ? "border-red-500/20" : "border-slate-800"
        }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-bold ${iconClass}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-600">{description}</p>
    </div>
  );
}

interface SnapshotRowProps {
  label: string;
  value: string | number;
  href: string;
  danger?: boolean;
}

function SnapshotRow({ label, value, href, danger }: SnapshotRowProps) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-4 py-3.5 transition hover:border-slate-700 hover:bg-slate-800/50"
    >
      <span className="text-sm text-slate-500">{label}</span>

      <div className="flex items-center gap-2">
        <span
          className={`text-sm font-semibold ${danger ? "text-red-400" : "text-white"
            }`}
        >
          {value}
        </span>
        <span className="text-slate-700">›</span>
      </div>
    </Link>
  );
}

function RevenueChart({ data }: { data: RevenuePoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex min-h-[260px] items-center justify-center">
        <EmptyState text="No revenue data available." />
      </div>
    );
  }

  const maxRevenue = Math.max(
    ...data.map((item) => Number(item.revenue || 0)),
    1
  );

  return (
    <div className="mt-6">
      <div className="flex h-[260px] items-end gap-2 sm:gap-4">
        {data.map((item, index) => {
          const revenue = Number(item.revenue || 0);
          const height =
            revenue === 0
              ? 4
              : Math.max((revenue / maxRevenue) * 100, 8);

          return (
            <div
              key={`${item.date}-${index}`}
              className="group flex h-full flex-1 flex-col items-center justify-end"
            >
              <div className="relative mb-2 w-full">
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-white shadow-xl group-hover:block">
                  {formatCurrency(revenue)}
                </div>

                <div
                  className="mx-auto w-full max-w-12 rounded-t-lg bg-blue-500/80 transition-all duration-300 group-hover:bg-blue-400"
                  style={{
                    height: `${height}%`,
                    minHeight: "4px",
                  }}
                />
              </div>

              <p className="text-[10px] text-slate-600 sm:text-xs">
                {formatShortDate(item.date)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "DELIVERED"
      ? "bg-emerald-400"
      : status === "CANCELLED"
        ? "bg-red-400"
        : status === "DISPATCHED"
          ? "bg-blue-400"
          : status === "CONFIRMED"
            ? "bg-cyan-400"
            : "bg-amber-400";

  return <span className={`h-2 w-2 rounded-full ${color}`} />;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="p-8 text-center">
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-40 animate-pulse rounded-2xl bg-slate-900" />
      <KpiSkeleton />
      <MainDashboardSkeleton />
    </div>
  );
}

function EmployeeDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Operations */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">
              Daily Operations
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Quick access to the areas you use most.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard/orders"
              className="rounded-xl border border-slate-800 bg-slate-950 p-4 transition hover:border-blue-500/30 hover:bg-slate-800/50"
            >
              <p className="text-sm font-medium text-white">
                Orders
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Create and manage orders
              </p>
            </Link>

            <Link
              href="/dashboard/inventory"
              className="rounded-xl border border-slate-800 bg-slate-950 p-4 transition hover:border-blue-500/30 hover:bg-slate-800/50"
            >
              <p className="text-sm font-medium text-white">
                Inventory
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Check stock and transactions
              </p>
            </Link>

            <Link
              href="/dashboard/customers"
              className="rounded-xl border border-slate-800 bg-slate-950 p-4 transition hover:border-blue-500/30 hover:bg-slate-800/50"
            >
              <p className="text-sm font-medium text-white">
                Customers
              </p>

              <p className="mt-1 text-xs text-slate-500">
                View and manage customers
              </p>
            </Link>

            <Link
              href="/dashboard/products"
              className="rounded-xl border border-slate-800 bg-slate-950 p-4 transition hover:border-blue-500/30 hover:bg-slate-800/50"
            >
              <p className="text-sm font-medium text-white">
                Products
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Browse the product catalogue
              </p>
            </Link>
          </div>
        </section>

        {/* Access Information */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">
              Your Access
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Features available to your role.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <span className="text-sm text-slate-400">
                Orders
              </span>

              <span className="text-xs font-medium text-emerald-400">
                Available
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <span className="text-sm text-slate-400">
                Inventory
              </span>

              <span className="text-xs font-medium text-emerald-400">
                Available
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <span className="text-sm text-slate-400">
                Customers
              </span>

              <span className="text-xs font-medium text-emerald-400">
                Available
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <span className="text-sm text-slate-400">
                Financial Analytics
              </span>

              <span className="text-xs font-medium text-amber-400">
                Restricted
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-32 animate-pulse rounded-2xl bg-slate-900"
        />
      ))}
    </div>
  );
}

function MainDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="h-[360px] animate-pulse rounded-2xl bg-slate-900" />
        <div className="h-[360px] animate-pulse rounded-2xl bg-slate-900" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-[300px] animate-pulse rounded-2xl bg-slate-900" />
        <div className="h-[300px] animate-pulse rounded-2xl bg-slate-900" />
      </div>

      <div className="h-[350px] animate-pulse rounded-2xl bg-slate-900" />
    </div>
  );
}

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
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatShortDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPaymentMethod(method: string) {
  return method
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}