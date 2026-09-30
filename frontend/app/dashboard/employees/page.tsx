"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  updateEmployee,
  Employee,
} from "@/lib/api";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] =
    useState<Employee | null>(null);

  const [error, setError] = useState("");

  async function loadEmployees() {
    try {
      setLoading(true);
      setError("");

      const response = await getEmployees();

      setEmployees(response.data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load employees"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this employee?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteEmployee(id);

      await loadEmployees();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete employee"
      );
    }
  }

  function handleEdit(employee: Employee) {
    setEditingEmployee(employee);
    setShowForm(true);
  }

  function handleAdd() {
    setEditingEmployee(null);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingEmployee(null);
  }

  async function handleFormSuccess() {
    setShowForm(false);
    setEditingEmployee(null);

    await loadEmployees();
  }

  return (
    <div>
      {/* PAGE HEADER */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-400">
            Workforce
          </p>

          <h1 className="mt-1 text-3xl font-bold text-white">
            Employees
          </h1>

          <p className="mt-2 text-slate-400">
            Manage your employees and workforce.
          </p>
        </div>

        <button
          onClick={handleAdd}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
        >
          + Add Employee
        </button>
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
          Loading employees...
        </div>
      ) : (
        <EmployeeTable
          employees={employees}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* FORM */}

      {showForm && (
        <EmployeeForm
          employee={editingEmployee}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

/* =====================================================
   EMPLOYEE TABLE
===================================================== */

interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (id: number) => void;
}

function EmployeeTable({
  employees,
  onEdit,
  onDelete,
}: EmployeeTableProps) {
  if (employees.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
        <h2 className="text-lg font-semibold text-white">
          No employees yet
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Add your first employee to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left">

          <thead className="border-b border-slate-800">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Employee
              </th>

              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Department
              </th>

              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Designation
              </th>

              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Phone
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

            {employees.map((employee) => (
              <tr
                key={employee.id}
                className="transition hover:bg-slate-800/40"
              >

                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-white">
                      {employee.firstName}{" "}
                      {employee.lastName}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {employee.email}
                    </p>
                  </div>
                </td>

                <td className="px-6 py-4 text-sm text-slate-300">
                  {employee.department || "-"}
                </td>

                <td className="px-6 py-4 text-sm text-slate-300">
                  {employee.designation || "-"}
                </td>

                <td className="px-6 py-4 text-sm text-slate-300">
                  {employee.phone || "-"}
                </td>

                <td className="px-6 py-4">
                  <StatusBadge
                    status={employee.status}
                  />
                </td>

                <td className="sticky right-0 bg-slate-900 px-6 py-4">
                  <div className="flex justify-end gap-2">

                    <button
                      type="button"
                      onClick={() => onEdit(employee)}
                      className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(employee.id)}
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
   EMPLOYEE FORM
===================================================== */

interface EmployeeFormProps {
  employee: Employee | null;
  onClose: () => void;
  onSuccess: () => void;
}

function EmployeeForm({
  employee,
  onClose,
  onSuccess,
}: EmployeeFormProps) {
  const isEditing = employee !== null;

  const [firstName, setFirstName] = useState(
    employee?.firstName || ""
  );

  const [lastName, setLastName] = useState(
    employee?.lastName || ""
  );

  const [email, setEmail] = useState(
    employee?.email || ""
  );

  const [phone, setPhone] = useState(
    employee?.phone || ""
  );

  const [department, setDepartment] = useState(
    employee?.department || ""
  );

  const [designation, setDesignation] = useState(
    employee?.designation || ""
  );

  const [salary, setSalary] = useState(
    employee?.salary?.toString() || ""
  );

  const [status, setStatus] = useState(
    employee?.status || "ACTIVE"
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
      const employeeData = {
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        department: department || undefined,
        designation: designation || undefined,
        salary: salary
          ? Number(salary)
          : undefined,
        status,
      };

      if (isEditing) {
        await updateEmployee(
          employee.id,
          employeeData
        );
      } else {
        await createEmployee(employeeData);
      }

      onSuccess();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : isEditing
            ? "Failed to update employee"
            : "Failed to create employee"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">

      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">

        {/* MODAL HEADER */}

        <div className="mb-6 flex items-start justify-between">

          <div>
            <h2 className="text-xl font-semibold text-white">
              {isEditing
                ? "Edit Employee"
                : "Add Employee"}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {isEditing
                ? "Update employee information."
                : "Add a new employee to your organization."}
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
              label="First Name"
              value={firstName}
              onChange={setFirstName}
              required
            />

            <Input
              label="Last Name"
              value={lastName}
              onChange={setLastName}
              required
            />

          </div>

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            required
          />

          <Input
            label="Phone"
            value={phone}
            onChange={setPhone}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <Input
              label="Department"
              value={department}
              onChange={setDepartment}
            />

            <Input
              label="Designation"
              value={designation}
              onChange={setDesignation}
            />

          </div>

          <Input
            label="Salary"
            type="number"
            value={salary}
            onChange={setSalary}
          />

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
                  : "Create Employee"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}

/* =====================================================
   INPUT COMPONENT
===================================================== */

interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}

function Input({
  label,
  value,
  onChange,
  type = "text",
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
        required={required}
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
      />
    </div>
  );
}