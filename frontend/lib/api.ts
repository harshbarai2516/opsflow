const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

export async function registerUser(
  email: string,
  password: string
) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export async function loginUser(
  email: string,
  password: string
) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export async function logoutUser() {
  return apiRequest("/api/auth/logout", {
    method: "POST",
  });
}

export async function getCurrentUser() {
  return apiRequest("/api/auth/me");
}

/* =========================
   EMPLOYEES
========================= */

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  department: string | null;
  designation: string | null;
  joiningDate: string | null;
  salary: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department?: string;
  designation?: string;
  joiningDate?: string;
  salary?: number;
  status?: string;
}

export async function getEmployees() {
  return apiRequest("/api/employees");
}

export async function createEmployee(
  employee: CreateEmployeeData
) {
  return apiRequest("/api/employees", {
    method: "POST",
    body: JSON.stringify(employee),
  });
}

export async function getEmployeeById(
  id: number
) {
  return apiRequest(`/api/employees/${id}`);
}

export async function updateEmployee(
  id: number,
  employee: Partial<CreateEmployeeData>
) {
  return apiRequest(`/api/employees/${id}`, {
    method: "PATCH",
    body: JSON.stringify(employee),
  });
}

export async function deleteEmployee(
  id: number
) {
  return apiRequest(`/api/employees/${id}`, {
    method: "DELETE",
  });
}

/* =========================
   CUSTOMERS
========================= */

export interface Customer {
  id: number;
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string;
  gstin: string | null;
  address: string | null;
  city: string | null;
  creditLimit: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerData {
  name: string;
  companyName?: string;
  email?: string;
  phone: string;
  gstin?: string;
  address?: string;
  city?: string;
  creditLimit?: number;
  status?: string;
}

export async function getCustomers() {
  return apiRequest("/api/customers");
}

export async function createCustomer(
  customer: CreateCustomerData
) {
  return apiRequest("/api/customers", {
    method: "POST",
    body: JSON.stringify(customer),
  });
}

export async function getCustomerById(
  id: number
) {
  return apiRequest(`/api/customers/${id}`);
}

export async function updateCustomer(
  id: number,
  customer: Partial<CreateCustomerData>
) {
  return apiRequest(`/api/customers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(customer),
  });
}

export async function deleteCustomer(
  id: number
) {
  return apiRequest(`/api/customers/${id}`, {
    method: "DELETE",
  });
}

/* =========================
   PRODUCTS
========================= */

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  brand: string | null;
  unit: string;
  purchasePrice: number | null;
  sellingPrice: number;
  currentStock: number;
  minimumStock: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  name: string;
  sku: string;
  category: string;
  brand?: string;
  unit: string;
  purchasePrice?: number;
  sellingPrice: number;
  currentStock?: number;
  minimumStock?: number;
  status?: string;
}

export async function getProducts() {
  return apiRequest("/api/products");
}

export async function createProduct(
  product: CreateProductData
) {
  return apiRequest("/api/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
}

export async function getProductById(
  id: number
) {
  return apiRequest(`/api/products/${id}`);
}

export async function updateProduct(
  id: number,
  product: Partial<CreateProductData>
) {
  return apiRequest(`/api/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(product),
  });
}

export async function deleteProduct(
  id: number
) {
  return apiRequest(`/api/products/${id}`, {
    method: "DELETE",
  });
}

// =============================
// Inventory
// =============================

export interface InventoryTransaction {
  id: number;
  productId: number;
  type:
    | "PURCHASE"
    | "SALE"
    | "DAMAGE"
    | "RETURN"
    | "ADJUSTMENT";
  quantity: number;
  note: string | null;
  createdAt: string;
  product?: {
    id: number;
    name: string;
    sku: string;
    unit: string;
  };
}

export interface CreateInventoryTransactionData {
  productId: number;
  type:
    | "PURCHASE"
    | "SALE"
    | "DAMAGE"
    | "RETURN"
    | "ADJUSTMENT";
  quantity: number;
  note?: string;
}

export async function getInventoryTransactions() {
  return apiRequest("/api/inventory");
}

export async function createInventoryTransaction(
  transaction: CreateInventoryTransactionData
) {
  return apiRequest("/api/inventory", {
    method: "POST",
    body: JSON.stringify(transaction),
  });
}

export async function getProductInventoryHistory(
  productId: number
) {
  return apiRequest(
    `/api/inventory/product/${productId}`
  );
}

// =========================
// ORDERS
// =========================

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt: string;

  product?: {
    id: number;
    name: string;
    sku: string;
    unit: string;
    currentStock: true;
  };
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;

  customer?: {
    id: number;
    name: string;
    companyName: string | null;
    phone: string;
  };

  items: OrderItem[];
}

export interface CreateOrderItemData {
  productId: number;
  quantity: number;
}

export interface CreateOrderData {
  customerId: number;
  items: CreateOrderItemData[];
  discount?: number;
  notes?: string;
}

export async function getOrders() {
  return apiRequest("/api/orders");
}

export async function createOrder(order: CreateOrderData) {
  return apiRequest("/api/orders", {
    method: "POST",
    body: JSON.stringify(order),
  });
}

export async function getOrderById(id: number) {
  return apiRequest(`/api/orders/${id}`);
}

export async function updateOrderStatus(
  id: number,
  status: string
) {
  return apiRequest(`/api/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}