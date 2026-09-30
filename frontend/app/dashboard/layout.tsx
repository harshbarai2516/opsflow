"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/lib/api";
import ToastTest from "@/components/ui/ToastTest";



interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await logoutUser();
      router.replace("/login");
    } catch (error) {
      console.error("LOGOUT FAILED:", error);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 border-r border-slate-800 bg-slate-900 md:block">
          <div className="border-b border-slate-800 px-6 py-5">
            <h1 className="text-xl font-bold tracking-wide">
              OPSFLOW
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              Operations platform
            </p>
          </div>

          <nav className="p-4">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Workspace
            </p>

            <div className="space-y-1">
              <a
                href="/dashboard"
                className="block rounded-lg bg-slate-800 px-3 py-2.5 text-sm font-medium text-white"
              >
                Dashboard
              </a>

              <a
                href="/dashboard/employees"
                className="block rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                Employees
              </a>

              <a
                href="/dashboard/customers"
                className="block rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                Customers
              </a>

              <a
                href="/dashboard/products"
                className="block rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                Products
              </a>

              <a
                href="/dashboard/inventory"
                className="block rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                Inventory
              </a>

              <a
                href="/dashboard/orders"
                className="block rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                Orders
              </a>

              <a
                href="/dashboard/analytics"
                className="block rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                Analytics
              </a>
            </div>

            <div className="mt-8">
              <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                System
              </p>

              <a
                href="/dashboard/settings"
                className="block rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                Settings
              </a>
            </div>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-6">
            <div>
              <p className="text-sm text-slate-400">
                Workspace
              </p>
              <h2 className="font-semibold">
                Operations Dashboard
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
                🔔
              </button>

              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold">
                  H
                </div>

                <span className="hidden text-sm text-slate-300 sm:block">
                  Harsh
                </span>
              </div>

              <div>
                <ToastTest />
              </div>

              <button
                onClick={handleLogout}
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                Logout
              </button>
            </div>
          </header>

          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}