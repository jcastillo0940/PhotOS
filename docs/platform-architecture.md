# PhotOS Platform Architecture Blueprint

## Current stack

- Backend: Laravel 13
- Frontend: React 19 + Inertia.js + Vite
- Storage: Cloudflare R2 through Laravel filesystem
- Session model: Laravel session cookies

This blueprint is tailored to the current codebase and extends the existing `projects`, `photos`, `events`, `invoices`, `users`, `settings`, `contracts`, and `leads` domain.

## 1. Security and authentication

### Recommended auth flow

- Keep Laravel session auth with secure cookies for the admin and studio dashboard.
- Use `HttpOnly`, `Secure`, `SameSite=Lax` or `Strict` cookies.
- Regenerate session after login.
- Return a generic error message such as `Credenciales invalidas`.
- Add rate limiting by email + IP and temporary lockout after 5 failed attempts.
- Store failed login counters in cache or a dedicated table when auditability is needed.

### Backend rules

- Use Eloquent or query builder only through parameterized queries.
- Never reveal whether the email exists.
- Add login audit logging for `success`, `failed`, `locked`.
- Protect gallery unlock and signed download endpoints with throttling too.

### SQL additions for login hardening

```sql
CREATE TABLE login_attempts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    attempts INT UNSIGNED NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMP NULL,
    locked_until TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_login_attempts_email_ip (email, ip_address),
    INDEX idx_login_attempts_locked_until (locked_until)
);
```

Laravel note:

- For the current repo, this maps best to `AuthController@login` plus a dedicated service like `App\Services\Auth\LoginRateLimiter`.

## 2. Database structure

The following SQL is designed to complement the tables already present in the project.

### Users

```sql
ALTER TABLE users
    ADD COLUMN role ENUM('super_admin','studio_admin','photographer','client') NOT NULL DEFAULT 'studio_admin',
    ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1,
    ADD COLUMN last_login_at TIMESTAMP NULL,
    ADD COLUMN client_code VARCHAR(64) NULL,
    ADD UNIQUE KEY uniq_users_client_code (client_code);
```

### Clients

Separate recurring clients and account statements from leads.

```sql
CREATE TABLE clients (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    company_name VARCHAR(255) NULL,
    tax_id VARCHAR(100) NULL,
    billing_address TEXT NULL,
    is_recurring TINYINT(1) NOT NULL DEFAULT 0,
    preferred_currency CHAR(3) NOT NULL DEFAULT 'USD',
    notes TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_clients_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_clients_email (email),
    INDEX idx_clients_recurring (is_recurring)
);
```

### Projects

```sql
ALTER TABLE projects
    ADD COLUMN client_id BIGINT UNSIGNED NULL AFTER lead_id,
    ADD COLUMN slug VARCHAR(180) NULL,
    ADD COLUMN owner_user_id BIGINT UNSIGNED NULL,
    ADD COLUMN gallery_token VARCHAR(120) NULL,
    ADD COLUMN gallery_password VARCHAR(255) NULL,
    ADD COLUMN booking_status ENUM('draft','pending','confirmed','paid','cancelled') NOT NULL DEFAULT 'pending',
    ADD COLUMN session_status ENUM('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
    ADD COLUMN hero_photo_id BIGINT UNSIGNED NULL,
    ADD COLUMN website_category VARCHAR(120) NULL,
    ADD COLUMN website_description TEXT NULL,
    ADD COLUMN gallery_template_code VARCHAR(80) NULL,
    ADD COLUMN itbms_enabled TINYINT(1) NOT NULL DEFAULT 1,
    ADD COLUMN alanube_enabled TINYINT(1) NOT NULL DEFAULT 0,
    ADD UNIQUE KEY uniq_projects_gallery_token (gallery_token),
    ADD KEY idx_projects_client_id (client_id),
    ADD KEY idx_projects_booking_status (booking_status),
    ADD CONSTRAINT fk_projects_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
```

### Photos

Use one flag for client proofing and one distinct flag for public portfolio visibility.

```sql
ALTER TABLE photos
    ADD COLUMN optimized_path VARCHAR(255) NULL,
    ADD COLUMN original_path VARCHAR(255) NULL,
    ADD COLUMN mime_type VARCHAR(100) NULL,
    ADD COLUMN optimized_bytes BIGINT UNSIGNED NULL,
    ADD COLUMN original_bytes BIGINT UNSIGNED NULL,
    ADD COLUMN show_on_website TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN is_public_selected TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN visibility ENUM('private','client','public') NOT NULL DEFAULT 'client',
    ADD COLUMN cursor_token CHAR(36) NULL,
    ADD KEY idx_photos_project_order (project_id, order_index),
    ADD KEY idx_photos_public_selected (project_id, is_public_selected, order_index),
    ADD KEY idx_photos_visibility (project_id, visibility, order_index);
```

Recommended rule:

- Public/front uses `is_public_selected = 1`.
- Client owner gallery uses all photos in the project.
- `is_selected` remains reserved for client favorites.

### Gallery access sessions

```sql
CREATE TABLE gallery_access_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT UNSIGNED NOT NULL,
    token_hash CHAR(64) NOT NULL,
    access_type ENUM('client_gallery','download_original') NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_gallery_access_tokens_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_gallery_access_tokens_project (project_id),
    INDEX idx_gallery_access_tokens_expires (expires_at)
);
```

### Bookings and calendar

Current `events` table works, but needs explicit reservation lifecycle.

```sql
ALTER TABLE events
    ADD COLUMN client_id BIGINT UNSIGNED NULL AFTER project_id,
    ADD COLUMN status ENUM('pending','confirmed','paid','blocked','cancelled') NOT NULL DEFAULT 'pending',
    ADD COLUMN payment_status ENUM('unpaid','partial','paid','waived') NOT NULL DEFAULT 'unpaid',
    ADD COLUMN reserved_until TIMESTAMP NULL,
    ADD COLUMN source ENUM('admin','public_booking','system') NOT NULL DEFAULT 'admin',
    ADD COLUMN timezone VARCHAR(64) NOT NULL DEFAULT 'America/Panama',
    ADD KEY idx_events_status (status),
    ADD KEY idx_events_start_status (start, status),
    ADD CONSTRAINT fk_events_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
```

Business rule:

- A public booking creates an event in `pending`.
- `pending` does not hard-block the slot.
- Only `confirmed`, `paid`, or `blocked` count as unavailable.

### Invoices

```sql
ALTER TABLE invoices
    ADD COLUMN client_id BIGINT UNSIGNED NULL AFTER project_id,
    ADD COLUMN invoice_number VARCHAR(80) NULL,
    ADD COLUMN subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN tax_rate DECIMAL(5,2) NOT NULL DEFAULT 7.00,
    ADD COLUMN tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN itbms_enabled TINYINT(1) NOT NULL DEFAULT 1,
    ADD COLUMN tax_exemption_code VARCHAR(50) NULL,
    ADD COLUMN balance_due DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN alanube_status ENUM('disabled','pending','submitted','accepted','rejected') NOT NULL DEFAULT 'disabled',
    ADD COLUMN alanube_uuid VARCHAR(120) NULL,
    ADD COLUMN issued_at TIMESTAMP NULL,
    ADD UNIQUE KEY uniq_invoices_invoice_number (invoice_number),
    ADD KEY idx_invoices_client_id (client_id),
    ADD KEY idx_invoices_status (status),
    ADD CONSTRAINT fk_invoices_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
```

### Invoice items

```sql
CREATE TABLE invoice_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_id BIGINT UNSIGNED NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    line_subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 7.00,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    line_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_invoice_items_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    INDEX idx_invoice_items_invoice (invoice_id)
);
```

### Account statements

```sql
CREATE TABLE account_statements (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT UNSIGNED NOT NULL,
    project_id BIGINT UNSIGNED NULL,
    invoice_id BIGINT UNSIGNED NULL,
    entry_type ENUM('invoice','payment','credit','debit','adjustment') NOT NULL,
    reference VARCHAR(120) NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    occurred_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_account_statements_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_account_statements_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    CONSTRAINT fk_account_statements_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    INDEX idx_account_statements_client_date (client_id, occurred_at)
);
```

### Global settings

The repo already has a `settings` table. Recommended keys:

```text
tax.itbms_default_enabled=true
tax.itbms_rate=7
einvoice.alanube_enabled=false
einvoice.alanube_environment=sandbox
einvoice.alanube_api_url=
einvoice.alanube_api_key=
gallery.public_title=Selected work: A gallery shaped by emotion, landscape, and movement
portfolio.show_portfolio_button=true
security.login_max_attempts=5
security.login_lock_minutes=15
```

## 3. API and route design

These routes map cleanly to your current Laravel structure.

### Auth

```http
POST /login
POST /logout
POST /api/auth/client-gallery/unlock
```

Controller responsibilities:

- `AuthController@login`: generic message, throttle, secure session regeneration
- `GalleryAccessController@unlock`: validate gallery code without exposing whether the project exists

### Public website and gallery

```http
GET  /gallery/{token}
GET  /api/galleries/{token}
GET  /api/galleries/{token}/photos?cursor=abc123&scope=public
POST /api/galleries/{token}/unlock
POST /api/galleries/photos/{photo}/favorite
POST /api/galleries/photos/{photo}/signed-download
```

Rules:

- Public scope returns only `is_public_selected = true`
- Client scope returns all photos after valid session
- Downloads return a short-lived signed URL, never the raw original path
- Cursor pagination should use `id` or `order_index + id`

### Booking

```http
GET  /api/availability?from=2026-04-01&to=2026-04-30
POST /api/bookings
GET  /api/bookings/{booking}
PATCH /api/bookings/{booking}/confirm
PATCH /api/bookings/{booking}/mark-paid
PATCH /api/bookings/{booking}/cancel
```

Public booking payload:

```json
{
  "client_name": "Ana Perez",
  "client_email": "ana@example.com",
  "client_phone": "+50760000000",
  "date": "2026-05-12",
  "start_time": "14:00",
  "end_time": "15:00",
  "timezone": "America/Panama",
  "notes": "Sesion de pareja"
}
```

Expected behavior:

- Creates `client` if needed
- Creates `project` in draft or pending state when appropriate
- Creates `event` in `pending`
- Does not block calendar availability unless later confirmed

### Client dashboard

```http
GET /client/dashboard
GET /api/client/projects
GET /api/client/invoices
GET /api/client/account-statement
GET /api/client/galleries
```

### Invoicing and accounting

```http
POST   /admin/projects/{project}/invoices
PATCH  /admin/invoices/{invoice}
PATCH  /admin/invoices/{invoice}/pay
POST   /admin/invoices/{invoice}/items
PATCH  /admin/invoices/{invoice}/toggle-tax
POST   /admin/invoices/{invoice}/submit-alanube
GET    /admin/clients
GET    /admin/clients/{client}
GET    /admin/clients/{client}/statement
```

Alanube-specific service boundary:

- `App\Services\Billing\AlanubeService`
- `App\Services\Billing\InvoiceTaxService`
- `App\Services\Billing\AccountStatementService`

When ITBMS is disabled:

- Keep `tax_rate = 0`
- Keep `tax_amount = 0`
- Send the proper exemption code expected by Alanube

## 4. Frontend component map

This project already uses React + Inertia, so the most natural extension is to keep that pattern.

### Auth

Existing:

- `resources/js/Pages/Auth/Login.jsx`

Recommended split:

- `LoginForm`
- `LoginSecurityNotice`
- `LockedOutBanner`

Expected UX:

- One generic error area only
- No hint about whether email or password failed
- Countdown if temporarily locked

### Public gallery

Existing:

- `resources/js/Pages/Public/Gallery.jsx`

Recommended split:

- `GalleryHero`
- `GalleryVisibilityBadge`
- `GalleryFilters`
- `GalleryGrid`
- `GalleryPaginationCursor`
- `GalleryLightbox`
- `GalleryUnlockForm`
- `SignedDownloadButton`

Required behavior:

- Gallery title must be:
  `Selected work: A gallery shaped by emotion, landscape, and movement`
- Public visitor sees only `is_public_selected`
- Authenticated owner or unlocked client sees full gallery and download actions
- Keep `loading="lazy"` and add cursor-based fetch for long galleries

### Booking and calendar

Existing:

- `resources/js/Pages/Admin/Calendar/Index.jsx`

Recommended additions:

- `resources/js/Pages/Public/Booking/Index.jsx`
- `BookingCalendar`
- `TimeSlotPicker`
- `BookingSummaryCard`
- `BookingPendingNotice`
- `AdminBookingDrawer`

Important UX rule:

- Slots chosen on the public side must display as `Pendiente`
- Do not show them as hard-blocked until confirmation or payment

### Client dashboard

New recommended page:

- `resources/js/Pages/Client/Dashboard.jsx`

Suggested widgets:

- `ActiveProjectsCard`
- `ClientInvoicesTable`
- `OutstandingBalanceCard`
- `AccountStatementTimeline`
- `PrivateGalleriesList`
- `DownloadHistoryTable`

### Finance settings

Existing admin settings page:

- `resources/js/Pages/Admin/Settings/Index.jsx`

Recommended additions:

- `TaxSettingsCard`
- `ItbmsToggle`
- `AlanubeToggle`
- `AlanubeCredentialsForm`
- `RecurringClientsTable`

### Portfolio button

Add a prominent CTA in:

- `resources/js/Pages/Public/Home.jsx`

Recommended label:

- `View Portfolio`

Recommended behavior:

- Scroll to portfolio section or route to `/portfolio`
- Keep visual weight above secondary CTAs

## 5. Suggested Laravel controllers and services

### Controllers

- `AuthController`
- `GalleryController`
- `GalleryAccessController`
- `BookingController`
- `ClientDashboardController`
- `ClientInvoiceController`
- `ClientStatementController`
- `InvoiceController`
- `SettingsController`

### Services

- `LoginRateLimiter`
- `GalleryVisibilityService`
- `SignedDownloadService`
- `BookingAvailabilityService`
- `BookingConfirmationService`
- `InvoiceTaxService`
- `AlanubeService`
- `AccountStatementService`

## 6. Priority implementation order

1. Harden login with generic errors, throttle, and secure cookie config.
2. Separate public gallery selection from client favorites by using `is_public_selected`.
3. Move gallery listing to cursor pagination for mobile performance.
4. Introduce booking `pending` status that does not block availability.
5. Expand invoices into subtotal, tax, total, balance, and invoice items.
6. Add global and per-invoice ITBMS toggle.
7. Add optional Alanube integration behind settings.
8. Build private client dashboard and account statement view.

## 7. Direct mapping to the current repo

Files that should be touched first if you implement this incrementally:

- `app/Http/Controllers/AuthController.php`
- `app/Http/Controllers/GalleryController.php`
- `app/Http/Controllers/EventController.php`
- `app/Http/Controllers/InvoiceController.php`
- `app/Models/Photo.php`
- `app/Models/Project.php`
- `app/Models/Invoice.php`
- `routes/web.php`
- `resources/js/Pages/Auth/Login.jsx`
- `resources/js/Pages/Public/Gallery.jsx`
- `resources/js/Pages/Public/Home.jsx`
- `resources/js/Pages/Admin/Calendar/Index.jsx`
- `resources/js/Pages/Admin/Settings/Index.jsx`

## 8. Current gaps identified in this repository

- Login currently returns a field-specific error on `email`; it should be made generic.
- There is no explicit lockout flow after 5 failed attempts.
- Public gallery visibility currently depends on `show_on_website`; that can work, but a dedicated `is_public_selected` flag is cleaner because `is_selected` is already being used for client proofing.
- The calendar currently uses `session`, `blocked`, and `tentative`, but not a payment-aware `pending` lifecycle.
- Invoices currently store only `amount`; they need tax breakdown and invoice lines for accounting.
- Alanube integration is not yet present and should stay optional behind settings.

