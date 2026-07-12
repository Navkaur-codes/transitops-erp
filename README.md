# TransitOps ERP

TransitOps is a modern, enterprise-grade Operations Platform and Fleet Resource Planning (ERP) application designed for logistics teams. It features a premium, responsive dark-mode SaaS dashboard crafted with Tailwind CSS v4, built on React 19 + Vite 8, and backed by a Supabase cloud database.

---

## 🚀 Key Modules & Capabilities

### 1. Operations Dashboard
* **Real-Time Telemetry**: Track active fleets at a glance with live counters for Active Trips, Available Vehicles, In-Shop Vehicles, and On-Duty Drivers.
* **Global Filters**: Dynamically filter vehicles and active trips by type (Van, Truck, Semi-Trailer, Box Truck) or status (Available, On Trip, In Shop, Retired).
* **Live Search**: Instant regex-free license plate and asset search.

### 2. Vehicle Registry & Asset Ledger
* **Onboarding & Registration**: Log registration numbers, vehicle names, types, maximum weight limits, odometer baselines, and acquisition costs.
* **Interactive Fleet Directory**: Visually track the status of each fleet asset with dedicated color-coded badges indicating operational states (`Available`, `On Trip`, `In Shop`, `Retired`).

### 3. Driver Directory (Personnel Files)
* **Operator Profiling**: Store operator names, contact details, Commercial Driver's License (CDL) numbers, categories, and expiration dates.
* **Compliance Checks**: Tracks driver safety scores out of 100 and alerts managers when licenses are near expiration or expired.
* **Filter Quick-Toggles**: Instant directory filtering by duty states: `All`, `Available`, `On Trip`, `Off Duty`, `Suspended`, and `Expired`.

### 4. Dispatch Controller & Overloading Protection
* **Interactive Timeline Stepper**: Visual step indicator demonstrating trip states: `Draft` ➔ `Dispatched` ➔ `Completed` / `Cancelled`.
* **Smart Allocation Rules**: Automatically blocks the dispatch of retired or in-shop vehicles, as well as operators with expired/suspended licenses.
* **Overloading Sentinel**: Features a real-time weight calculator. If cargo weight exceeds the vehicle's capacity limits, a high-visibility alert triggers and the dispatch buttons are disabled.
* **Split Dispatch Workflows**: Allows dispatchers to save trips as a **Draft** or commit them as **Dispatched** (which instantly updates driver and vehicle availability to `On Trip`).
* **Closeout Manifests**: Record final odometers and exact fuel consumption to automatically transition trip states.

### 5. Maintenance Workshop Logs
* **Service Tickets**: Open maintenance orders with descriptions, log dates, and repair costs.
* **Automated Shop Status**: Checking an asset in automatically transitions its status to `In Shop`. Settling a ticket transitions it back to `Available` (unless retired).

### 6. Expense & Fuel Manager
* **Operations Ledger**: Log fuel fill-ups (liters, cost, date) and miscellaneous trip expenses (tolls, parking, etc.).
* **Dynamic Currency Support**: Globally switch formatting between USD (`$`) and INR (`₹`) depending on user settings.
* **Auto-Aggregating Balance**: Automatically sums total fuel costs + miscellaneous expenses to output active operational overheads.

### 7. Performance Reports & Analytics
* **Telemetry Matrix**: Instant computational values showing System Fuel Efficiency ($km/l$), Fleet Utilization Rate (%), Cumulative Operational Cost, and Fleet ROI.
* **Cost Progress Visualizers**: Dynamically ranks and renders progress meters showing the highest cost-inducing fleet assets.
* **Data Portability**: Features a one-click CSV matrix downloader that compile per-asset financial ledgers.

---

## 🔐 Role-Based Access Control (RBAC)

TransitOps implements a security governance structure based on `session.user.user_metadata.role`. The app adjusts navigation panels and control forms dynamically based on four predefined organizational roles:

| Access Area | Fleet Manager | Dispatcher / Driver | Safety Officer | Financial Analyst |
| :--- | :---: | :---: | :---: | :---: |
| **Dashboard** | ✓ | ✓ | ✓ | ✓ |
| **Vehicle Registry** | ✓ | View Only | — | View Only |
| **Driver Management** | — | — | ✓ | — |
| **Trip Manager** | — | ✓ | View Only | — |
| **Maintenance Workshop** | ✓ | — | — | — |
| **Fuel & Expenses** | — | — | — | ✓ |
| **Reports & Analytics** | ✓ | — | — | ✓ |
| **Settings & Governance** | ✓ | — | — | — |

---

## 🛠️ Technology Stack

* **Frontend**: React 19 (Hooks, Context, Dynamic States)
* **Build Tool**: Vite 8
* **Styling**: Tailwind CSS v4 & custom glassmorphism utility variables
* **Database & Auth**: Supabase (PostgreSQL client integration & secure registration/login)
* **Icons**: Lucide React & React Icons
* **Export Utilities**: Custom browser CSV parser

---

## 🗄️ Database Schema (Supabase)

To enable database synchronization, ensure the following tables exist in your Supabase database instance:

### 1. `vehicles`
```sql
create table vehicles (
  id uuid default gen_random_uuid() primary key,
  license_plate text unique not null,
  name text not null,
  type text not null check (type in ('Van', 'Truck', 'Semi', 'Box Truck')),
  max_load_kg integer not null,
  odometer numeric default 0,
  acquisition_cost numeric default 0,
  status text default 'Available' check (status in ('Available', 'On Trip', 'In Shop', 'Retired'))
);
```

### 2. `drivers`
```sql
create table drivers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  license_number text unique not null,
  license_category text not null,
  license_expiry_date date not null,
  contact_number text not null,
  safety_score numeric default 100 check (safety_score >= 0 and safety_score <= 100),
  status text default 'Available' check (status in ('Available', 'On Trip', 'Off Duty', 'Suspended'))
);
```

### 3. `trips`
```sql
create table trips (
  id uuid default gen_random_uuid() primary key,
  source text not null,
  destination text not null,
  cargo_weight_kg integer not null,
  planned_distance numeric not null,
  vehicle_id uuid references vehicles(id),
  driver_id uuid references drivers(id),
  status text default 'Draft' check (status in ('Draft', 'Dispatched', 'Completed', 'Cancelled')),
  final_odometer numeric,
  fuel_consumed numeric
);
```

### 4. `maintenance_logs`
```sql
create table maintenance_logs (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references vehicles(id) on delete cascade,
  description text not null,
  cost numeric default 0,
  status text default 'Open' check (status in ('Open', 'Closed')),
  log_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
```

### 5. `fuel_logs`
```sql
create table fuel_logs (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references vehicles(id) on delete cascade,
  trip_id uuid references trips(id) on delete set null,
  liters numeric not null,
  cost numeric not null,
  log_date date not null default current_date
);
```

### 6. `expenses`
```sql
create table expenses (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references vehicles(id) on delete cascade,
  type text not null,
  amount numeric not null,
  log_date date not null default current_date
);
```

---

## ⚙️ Installation & Local Setup

### 1. Clone the repository and navigate to the project directory:
```bash
git clone <repository_url>
cd transitops-erp
```

### 2. Install dependencies:
```bash
npm install
```

### 3. Environment Variables Configuration:
Create a `.env` file in the root directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Start the local Vite development server:
```bash
npm run dev
```

The application will be accessible at `http://localhost:5173`.
