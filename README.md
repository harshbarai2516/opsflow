# OpsFlow — Business Operations Platform

**A production-deployed full-stack operations system for small distributors and building-material businesses.**

OpsFlow brings customer management, product catalogues, inventory, sales orders, invoices, payments, and operational analytics into one workflow. It was built around a practical problem: in a small steel, cement, or hardware business, important operational information can end up scattered across spreadsheets, phone calls, paper records, and separate tools. When customer balances, available stock, orders, and collections are tracked separately, it becomes harder to answer simple but important questions: *What is in stock? What did we sell? Who still owes us? Which orders need attention?*

OpsFlow is my attempt to solve that workflow problem with a connected application rather than another isolated CRUD demo. The application is deployed, connects to a production PostgreSQL database, and uses authenticated API requests for its business operations.

> **Live application:** [OpsFlow](https://opsflow-nine-alpha.vercel.app)  
> **Backend health check:** [OpsFlow API](https://opsflow-n4z2.onrender.com/api/health)  
> **Source code:** [GitHub repository](https://github.com/harshbarai2516/opsflow)

---

## The problem I'm solving

Small distributors need to coordinate several related workflows every day:

- Maintain reliable customer and product records.
- Know current stock before confirming an order.
- Connect order line items to products and customers.
- Track invoices and payments instead of treating sales as a single number.
- Understand collections, outstanding amounts, order activity, and low-stock products without manually combining records.
- Give employees access to the operations they need without exposing every administrative action.

These workflows are connected. A product is not useful as an isolated record if the business cannot relate it to inventory movements and orders. An invoice is not useful if payments and outstanding balances are disconnected from it. OpsFlow models these relationships in one application and exposes them through a consistent API.

## What OpsFlow includes

| Area | Capabilities |
|---|---|
| **Authentication** | Registration and login, password hashing, JWT-based sessions using HTTP-only cookies, and logout/current-user flows |
| **Role-based access control** | Server-side authorization for roles such as `ADMIN`, `MANAGER`, `EMPLOYEE`, and `VIEWER` |
| **Employees** | Employee records and management endpoints with role-restricted access |
| **Customers** | Customer profiles including company name, phone, email, GSTIN, address, city, credit limit, and status |
| **Products** | Product catalogue with SKU, category, pricing, and stock-related fields |
| **Inventory** | Stock visibility and inventory transaction records |
| **Orders** | Customer orders, order items, totals, and status workflows |
| **Invoices** | Invoice records associated with customers and orders, including tax, totals, due dates, and payment status |
| **Payments** | Payment records linked to customers and invoices, including method, reference, and payment date |
| **Dashboard and analytics** | Sales and collection metrics, outstanding amount, order status breakdown, revenue trends, low-stock products, and recent payments |
| **User experience** | Responsive Next.js interface, reusable UI components, loading/error states, and toast notifications |

The application is designed as a connected business workflow. For example, orders reference customers and order items; invoices reference orders and customers; payments reference invoices and customers. These relationships are represented in PostgreSQL through Prisma models and foreign-key relations.

## Why this project demonstrates engineering value

I wanted to demonstrate more than the ability to make forms that create, edit, and delete records. The engineering work focused on connecting the parts that real operations depend on:

- **Workflow modelling:** represented customer, product, order, invoice, payment, and inventory concepts as related records instead of disconnected screens.
- **Authorization at the API layer:** protected routes using authentication middleware and role checks, so permissions are enforced by the backend rather than relying only on hiding buttons in the UI.
- **Data integrity:** used relational models and database constraints to connect orders, invoices, payments, and inventory records.
- **Operational visibility:** assembled business records into dashboard metrics and recent-activity views.
- **Production deployment:** deployed the frontend, backend, and PostgreSQL database separately and configured the application to communicate over HTTPS.
- **Production debugging:** worked through real deployment problems including build configuration, database migrations, CORS, environment variables, and cross-origin authentication cookies by using logs and request/response behaviour to isolate the causes.

The result is a working deployed MVP and a foundation that can be validated further with real users. I do not claim measured business savings or production adoption without data; the goal is to show the end-to-end engineering required to turn an operational problem into a usable system.

## Architecture

```text
┌─────────────────────────────┐
│ Browser                     │
│ Next.js + React + Tailwind  │
└──────────────┬──────────────┘
               │ HTTPS / REST API
               ▼
┌─────────────────────────────┐
│ Express + TypeScript        │
│ Auth • RBAC • Controllers   │
└──────────────┬──────────────┘
               │ Prisma ORM
               ▼
┌─────────────────────────────┐
│ PostgreSQL                  │
│ Relational business data    │
└─────────────────────────────┘
```

**Deployment**

- **Frontend:** Vercel
- **Backend API:** Render Web Service
- **Database:** Render PostgreSQL

## Tech stack

**Frontend**

- Next.js
- React
- TypeScript
- Tailwind CSS
- Fetch-based API client with cookie credentials

**Backend**

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT and `bcrypt` for authentication
- `cookie-parser`, `cors`, `helmet`, and `morgan`

**Deployment and tooling**

- Git and GitHub
- Vercel
- Render
- PostgreSQL migrations through Prisma

## Authorization model

OpsFlow uses backend role checks for sensitive actions. The intended permission boundaries include:

| Role | Typical access |
|---|---|
| `ADMIN` | Administrative operations and user/role management |
| `MANAGER` | Day-to-day business management, including customers, employees, orders, invoices, payments, and analytics where permitted |
| `EMPLOYEE` | Operational tasks such as working with customers, inventory, and orders where permitted |
| `VIEWER` | Read-only access to permitted records |

Exact access depends on the route-level authorization rules. The backend remains the enforcement point; frontend navigation is not treated as a security boundary.

## Local development

### Prerequisites

- Node.js and npm
- PostgreSQL
- Git

### 1. Clone the repository

```bash
git clone https://github.com/harshbarai2516/opsflow.git
cd opsflow
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/opsflow_db"
JWT_SECRET="replace-with-a-long-random-secret"
PORT=5000
NODE_ENV=development
```

Use your own local PostgreSQL credentials. Do not commit `.env` or share production credentials.

Generate Prisma Client and apply development migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

Start the API:

```bash
npm run dev
```

The backend should be available at `http://localhost:5000`. The health endpoint is `http://localhost:5000/api/health`.

> If the database has not been created yet, create `opsflow_db` in PostgreSQL before applying migrations. If the repository is missing its migration files, inspect the migration history before running database commands; do not use `migrate reset` on a database with data you need to keep.

### 3. Configure the frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

For local development, ensure the backend CORS configuration allows `http://localhost:3000`. For production, allow the deployed frontend origin (`https://opsflow-nine-alpha.vercel.app`) and keep credentials enabled for cookie-based authentication.

## Production configuration

The frontend and backend are deployed separately.

### Vercel frontend environment variable

```env
NEXT_PUBLIC_API_URL=https://opsflow-n4z2.onrender.com
```

`NEXT_PUBLIC_API_URL` is a public API base URL, not a secret. After changing it, trigger a new frontend deployment because Next.js embeds `NEXT_PUBLIC_*` values at build time.

### Render backend environment variables

```env
DATABASE_URL=<Render PostgreSQL connection URL>
JWT_SECRET=<strong unique production secret>
NODE_ENV=production
```

Keep `DATABASE_URL` and `JWT_SECRET` private and set them only in the backend's environment configuration. Apply committed database migrations during deployment with Prisma's `migrate deploy` command. The production health endpoint is:

```text
https://opsflow-n4z2.onrender.com/api/health
```

It checks the API's database connection. A successful health response does not by itself verify every feature, so authentication and CRUD workflows should also be tested after a deployment.

## API route overview

All routes use the `/api` prefix.

| Resource | Base route |
|---|---|
| Authentication | `/api/auth` |
| Users | `/api/users` |
| Employees | `/api/employees` |
| Customers | `/api/customers` |
| Products | `/api/products` |
| Inventory | `/api/inventory` |
| Orders | `/api/orders` |
| Invoices | `/api/invoices` |
| Payments | `/api/payments` |
| Analytics | `/api/analytics` |
| Health | `/api/health` |

Most business endpoints require authentication. Mutations may also require specific roles. Refer to the route files and middleware for the exact method and permission rules.

## Important design considerations

- **Authentication cookies:** browser requests must include credentials, and production cookie/CORS settings must agree with the deployed frontend and backend origins.
- **Production data is separate:** local PostgreSQL and Render PostgreSQL are different databases. Local users and business records are not copied to production automatically.
- **Migrations change schema, not business data:** Prisma migrations create/update tables and constraints; they do not import local customer or order records.
- **Financial history matters:** customer balances should be derived from valid invoices and payments, not invented from an aggregate spreadsheet value. A future CSV import flow should validate and reconcile historical rows before writing business records.

## Roadmap

Potential next improvements, subject to validation with actual users:

- CSV/Excel imports with column mapping, validation, duplicate detection, preview, and import history
- Better audit trails for sensitive changes and inventory adjustments
- Automated tests for authentication, authorization, order/stock behaviour, invoices, and payments
- Stronger financial modelling and reconciliation rules
- Background jobs and notifications for operational events
- More detailed reporting and export workflows

## About the developer

I'm a full-stack developer interested in building software that solves concrete operational problems. OpsFlow represents my approach: understand a workflow, model its data and relationships, enforce permissions in the backend, expose the workflow through a usable interface, and deploy the complete system so it can be tested outside localhost.

**The goal isn't to collect technologies in a README. It's to show how those technologies work together to support a business process.**

## Feedback

OpsFlow is an evolving MVP. Feedback from distributors, small-business operators, and developers is welcome, especially around inventory accuracy, credit workflows, historical imports, and day-to-day usability.

---

*Built with Next.js, Express, Prisma, and PostgreSQL.*
