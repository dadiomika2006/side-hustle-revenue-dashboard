# Side Hustle Revenue Dashboard - Comprehensive Technical Documentation

Welcome to the **Side Hustle Revenue Dashboard** project documentation. This guide details the software architecture, database schemas, frontend views, backend routes, packages, and custom functions that power the application.

---

## 📁 1. Project Directory Structure

```
side-hustle-revenue-dashboard/
├── backend/
│   ├── controllers/         # Request handling & database aggregation logic
│   ├── middleware/          # Authentication & file-upload filters
│   ├── models/              # Mongoose DB schema definitions
│   ├── routes/              # Express API endpoints
│   ├── scheduler/           # Daily repeating job & Sunday cron alert worker
│   ├── utils/               # Helper utilities (notifications, email, SMS)
│   ├── validators/          # Input schema sanitization
│   ├── server.js            # Entry point for backend Express server
│   └── package.json         # Backend node packages list
└── frontend/
    ├── src/
    │   ├── components/      # Common components (Navbar, Layout, ProtectedRoute)
    │   ├── context/         # AuthContext state hook provider
    │   ├── pages/           # Premium glassmorphic page views
    │   ├── services/        # Axios API handlers
    │   ├── utils/           # Money formatting & PDF invoice generation helpers
    │   ├── App.jsx          # Route manager & top-level layout
    │   ├── main.jsx         # App mounting point
    │   └── index.css        # Premium Global CSS styling engine (dark-mode theme)
    ├── index.html           # HTML template container
    ├── vite.config.js       # Vite build configurations
    └── package.json         # Frontend node packages list
```

---

## 🛠️ 2. Package & Dependency Matrix

The application leverages standard industry libraries to handle security, database connection, PDF generation, charting, and alert scheduling.

### Backend Dependencies (`backend/package.json`)
* **`express` & `@express/validator`**: Handles routing, controllers, and strict input body validation.
* **`mongoose`**: Maps MongoDB documents to strict JavaScript models with schema validation rules.
* **`bcryptjs` & `jsonwebtoken` (JWT)**: Secures authentication flow (passwords hashing and session state validation).
* **`cors` & `morgan`**: Enables cross-origin request policies and outputs HTTP request logs to terminal.
* **`multer`**: Manages file-uploads (storing PDF invoices and JPEG/PNG receipts securely).
* **`node-cron`**: Implements time-based background tasks (runs daily checks and weekly Sunday alerts).
* **`nodemailer` & `twilio`**: Sends email and SMS updates for reminders, alerts, and registration steps.

### Frontend Dependencies (`frontend/package.json`)
* **`react` & `react-dom`**: Frontend framework.
* **`react-router-dom`**: Manages routing paths, layout wraps, and auth state redirects.
* **`recharts`**: Handles high-performance charting (renders the dashboard side-hustle revenue distribution chart).
* **`jspdf`**: Compiles dynamic invoice data structures into downloadable PDFs.
* **`react-icons`**: Imports clean, consistent icons (Material Design group) for buttons and tabs.
* **`axios`**: Sends structured HTTP requests (handling token injection headers automatically).

---

## 🗄️ 3. Database Schemas (Models)

### `User.js`
Tracks registered freelancer details, company branding, and configurations.
* `name`, `email`, `password` (hashed)
* `role` (default: `'user'`, admin rights: `'admin'`)
* `businessName` (shown on generated PDF invoices)
* `currency` (default: `'USD'`, determines base symbol mapping)

### `IncomeStream.js`
Represents custom side hustles or gig streams (e.g., Fiverr, Etsy, Uber).
* `name`: Display label.
* `color`: HSL or hex color code for chart mapping.
* `url`: Web link to the platform dashboard.
* `description`

### `Transaction.js`
Holds financial records (revenue and business expenses).
* `user`: References `User`.
* `client` (optional): References `Client` (for freelance gigs).
* `incomeStream` (optional): References `IncomeStream` (for side hustles).
* `receipt` (optional): References `Receipt` image/PDF file link.
* `type`: `'income'` or `'expense'`.
* `amount`: Numeric value.
* `currency`: Transaction-specific currency symbol.
* `taxCategory` (optional): Schedule C category mapping for expenses.
* `hours` (optional): Freelance hours spent.

### `RecurringTransaction.js`
Template to automate future logging.
* `frequency`: `'daily'`, `'weekly'`, `'monthly'`, or `'yearly'`.
* `nextRunDate` & `endDate` (optional).
* Clones original configurations (`amount`, `type`, `client`, `user`) on trigger.

### `Invoice.js`
Organizes client billing templates.
* `invoiceNumber`: Automatically generated alphanumeric sequence.
* `client`: References `Client`.
* `items`: Array of line items (`description`, `quantity`, `price`).
* `subtotal`, `tax` (10%), `total`.
* `status`: `'pending'`, `'paid'`, `'overdue'`, or `'cancelled'`.

---

## ⚡ 4. Custom Helper Functions & Aggregation Logic

### A. Profit Margin per Side Hustle (`dashboardController.js`)
Aggregates transactions grouped by side hustle to calculate profit margin:
$$\text{Profit Margin} = \left( \frac{\text{Total Income} - \text{Total Expenses}}{\text{Total Income}} \right) \times 100$$
If a side hustle has no income, it sets the profit margin to $0\%$ or displays an appropriate warning tier in the UI.

### B. Daily Recurring Scheduler (`recurringJob.js`)
Runs daily at 12:05 AM (`5 0 * * *`):
1. Finds all documents in `RecurringTransaction` where `enabled === true` and `nextRunDate <= now`.
2. Clones the properties to create a new `Transaction` record.
3. Advances the `nextRunDate` by the rule interval (`daily`, `weekly`, `monthly`, `yearly`).

### C. Sunday Logging Reminders (`recurringJob.js`)
Runs every Sunday at 6:00 PM (`0 18 * * 0`):
1. Loops through all system users.
2. Checks if a weekly reminder was already created for today.
3. If not, pushes a new `Reminder` entry reminding the user to log their side hustle earnings.

### D. jsPDF Invoice Generator (`generateInvoicePDF.js`)
Builds printable PDF documents inside the client browser:
1. Calculates page dimensions to lay out clean header sections.
2. Formats table columns (`Description`, `Qty`, `Unit Price`, `Amount`) programmatically.
3. Adds subtotal, 10% VAT, and company metadata before prompting browser download.

---

## 🖥️ 5. Key Frontend View Pages

1. **Dashboard (`Dashboard.jsx`)**: The unified hub. Renders stats cards, the Side Hustle Revenue Share pie chart, quick transactions forms, and the active in-app reminders alert box.
2. **Transactions (`AddTransaction.jsx`)**: Allows logging new income or expenses. Features an **Audit History** tab with custom filters to search, filter by type, filter by client, filter by side hustle, download receipts, or delete records. Includes a **Recurring Rules** tab to manage repeating templates.
3. **Analytics (`Analytics.jsx`)**: Displays cashflow trend lines, hourly rate averages, and the per-side-hustle Profit Margin Tracker.
4. **Income Streams (`IncomeStreams.jsx`)**: Card deck to add, edit, or delete customizable side hustle streams, complete with custom hex color selections.
5. **Mileage Log (`Mileage.jsx`)**: Tracks travel dates, distance in miles, and auto-calculates IRS travel tax deductions.
6. **Invoices (`Invoices.jsx` & `CreateInvoice.jsx`)**: Interactive invoice line-item builder with status filter metrics and PDF output trigger.
7. **Receipts Vault (`Receipts.jsx`)**: File manager supporting PDF/image receipt upload with association keys.
8. **Export Center (`Export.jsx`)**: Generates CSV records and Schedule C tax logs filtered by tax years.
9. **Admin Panel (`AdminOverview.jsx`)**: Directory displaying system-wide usage metrics and user controls (restricted to `'admin'` role).
