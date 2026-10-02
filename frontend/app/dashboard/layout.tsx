"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/lib/api";
import ToastTest from "@/components/ui/ToastTest";
import Link from "next/link";
import { usePathname } from "next/navigation";



interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const router = useRouter();

  const pathname = usePathname();

  const navigation = [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Employees",
      href: "/dashboard/employees",
    },
    {
      label: "Customers",
      href: "/dashboard/customers",
    },
    {
      label: "Products",
      href: "/dashboard/products",
    },
    {
      label: "Inventory",
      href: "/dashboard/inventory",
    },
    {
      label: "Orders",
      href: "/dashboard/orders",
    },
    {
      label: "Invoices",
      href: "/dashboard/invoices",
    },
    {
      label: "Payments",
      href: "/dashboard/payment",
    },
    {
      label: "Analytics",
      href: "/dashboard/analytics",
    },
  ];

  const systemNavigation = [
    {
      label: "Settings",
      href: "/dashboard/settings",
    },
  ];

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
        <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-900 md:flex md:flex-col">
          {/* BRAND */}
          <div className="shrink-0 border-b border-slate-800 px-6 py-5">
            <Link
              href="/dashboard"
              className="block"
            >
              <h1 className="text-xl font-bold tracking-wide text-white">
                OPSFLOW
              </h1>

              <p className="mt-1 text-xs text-slate-500">
                Operations platform
              </p>
            </Link>
          </div>

          {/* NAVIGATION */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* WORKSPACE */}
            <div>
              <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Workspace
              </p>

              <nav className="space-y-1">
                {navigation.map((item) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname === item.href ||
                      pathname.startsWith(
                        `${item.href}/`
                      );

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive
                        ? "bg-blue-600/15 text-blue-400 ring-1 ring-inset ring-blue-500/20"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        }`}
                    >
                      <span
                        className={`mr-3 h-1.5 w-1.5 rounded-full transition ${isActive
                          ? "bg-blue-400"
                          : "bg-slate-700 group-hover:bg-slate-500"
                          }`}
                      />

                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* SYSTEM */}
            <div className="mt-8">
              <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                System
              </p>

              <nav className="space-y-1">
                {systemNavigation.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(
                      `${item.href}/`
                    );

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive
                        ? "bg-blue-600/15 text-blue-400 ring-1 ring-inset ring-blue-500/20"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        }`}
                    >
                      <span
                        className={`mr-3 h-1.5 w-1.5 rounded-full transition ${isActive
                          ? "bg-blue-400"
                          : "bg-slate-700 group-hover:bg-slate-500"
                          }`}
                      />

                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
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