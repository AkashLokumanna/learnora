# Learnora

A web-based tutor and student booking platform.

**Author:** Akash Lokumanna
**Student Number** S25021210
**Programme:** BSc (Hons) Computing — Final Year Project
**Repository:** Learnora MVP

## 1. Project Overview

Learnora is a two-sided online marketplace that connects students with private tutors. The platform automates the work that is normally done over phone calls and spreadsheets in tuition centres: discovering a tutor, checking their availability, booking a session, paying for it, and leaving a review afterwards. An administrator dashboard supervises the whole platform and manages discount coupons.

The application is delivered as a decoupled single-page application — a React frontend talking to a Laravel REST API over Sanctum-authenticated tokens. It is the practical artefact submitted in support of my final-year dissertation.

## 2. Core Features

### Student
- Register, log in and manage a personal account.
- Search and filter tutors by subject, name and rate.
- View a public tutor profile with reviews, subjects and availability.
- Book a session against a tutor's published time slot.
- Apply discount coupons at checkout (per-booking).
- Pay for a session through PayHere; bookings whose total becomes zero after a coupon are auto-settled without going through the gateway.
- View upcoming sessions, contact the tutor (email and phone), and leave a 1–5 star review after a paid session.

### Tutor
- Register as a tutor and complete a public profile (headline, biography, hourly rate, languages, certifications).
- Choose teachable subjects from a curated catalogue.
- Publish a weekly availability schedule with per-slot pricing.
- See incoming bookings and confirm or complete sessions.

### Administrator
- Read-only analytics dashboard (total revenue, total bookings, registered tutors and students, monthly booking volume).
- Manage subjects, tutors (verify or suspend), and bookings.
- Create, list and toggle discount coupons (percentage or fixed amount, with optional expiry).

## 3. Technology Stack

| Layer            | Technology                                        |
| ---------------- | ------------------------------------------------- |
| Frontend         | React 18, React Router, Tailwind CSS, Recharts    |
| Build tool       | Vite                                              |
| Backend          | Laravel 13 (API only)                             |
| Authentication   | Laravel Sanctum (token-based SPA auth)            |
| Database         | MySQL 8 (run locally via Laragon)                 |
| Queue / Mail     | Laravel queues with database driver               |
| Payment Gateway  | PayHere (Sri Lanka), with sandbox configuration   |
| Language version | PHP 8.3                                           |

## 4. System Architecture

The codebase is split into two halves that communicate over JSON:

- `app/Http/Controllers/Api/` — versioned REST endpoints under `/api/v1/...`. Each controller extends a small `ApiController` that provides consistent `ok / created / unprocessable / forbidden` responses.
- `resources/js/` — a single React application that is mounted into a Blade shell. Routes live in `resources/js/app.jsx`; pages are grouped under `Pages/{Auth,Dashboard,Student,Admin}`. A shared `DashboardLayout` provides the navigation bar that is role-aware.

Authentication is handled by Sanctum personal access tokens. After a successful login the React app stores the token in memory and attaches it to every Axios request via the wrapper in `resources/js/lib/axios.js`.

## 5. Local Installation

These instructions assume a Windows machine running Laragon (which provides Apache, MySQL and the matching PHP version). The same steps work on Linux/macOS with any local PHP and MySQL.

### 5.1 Prerequisites
- PHP 8.3 or newer
- Composer 2.x
- Node.js 18+ and npm
- MySQL 8.x
- Laragon (recommended on Windows for the `learnora.test` virtual host)

### 5.2 Clone and install dependencies
```
git clone <repository-url> learnora
cd learnora

composer install
npm install
```

### 5.3 Configure environment
```
cp .env.example .env
php artisan key:generate
```
Open `.env` and update at minimum:
```
APP_URL=http://learnora.test

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=learnora
DB_USERNAME=root
DB_PASSWORD=

PAYHERE_MERCHANT_ID=
PAYHERE_MERCHANT_SECRET=
PAYHERE_SANDBOX=true
```

### 5.4 Create the database and seed it
Create an empty MySQL database called `learnora`, then run:
```
php artisan migrate --seed
```
This creates all tables and loads the demo dataset (admin account, three tutors, five students, three subjects and a set of weekly availability slots).

### 5.5 Build the frontend and start the server
For development with hot module reload:
```
npm run dev
php artisan serve
```
For a production-style build:
```
npm run build
```
The application will be available at `http://learnora.test` (or `http://127.0.0.1:8000` if `php artisan serve` is used directly).

## 6. Demo Accounts

After running the seeder, the following accounts are available:

| Role    | Email                  | Password    |
| ------- | ---------------------- | ----------- |
| Admin   | admin@learnora.local   | password    |
| Tutor   | tutor@learnora.local   | password    |
| Tutor   | alan@learnora.local    | password123 |
| Tutor   | marie@learnora.local   | password123 |
| Tutor   | william@learnora.local | password123 |
| Student | alice@student.local    | password123 |
| Student | bob@student.local      | password123 |

## Testing the Application

Use the credentials below to sign in and exercise the three role-specific dashboards. The student and admin accounts were created specifically for end-to-end testing; the tutor account is the seeded test tutor that ships with `php artisan migrate --seed`.

| Role    | Email                 | Password    |
| ------- | --------------------- | ----------- |
| Student | student@gmail.com     | Student123  |
| Tutor   | tutor@learnora.local  | password    |
| Admin   | admin2@learnora.local | admin123    |

Sign in at `http://learnora.test/login` (or `http://127.0.0.1:8000/login` if you are running `php artisan serve` directly). Each account is redirected to its respective dashboard on login.

## 7. Folder Structure (selected)

```
app/
  Http/Controllers/Api/        REST controllers (Auth, Bookings, Checkout,
                               Payments, Reviews, Subjects, Tutors, Admin)
  Models/                      Eloquent models (User, TutorProfile, Booking,
                               Coupon, Payment, Review, ...)
  Notifications/               Booking and payment receipt notifications
database/
  migrations/                  Schema migrations including the coupon
                               alignment migration
  seeders/DatabaseSeeder.php   Demo data
resources/
  js/
    Pages/Auth/                Login and registration screens
    Pages/Dashboard/           Role-specific dashboards
    Pages/Student/             Tutor discovery, public profile, checkout
    Pages/Admin/               Coupon management
    Components/                Reusable UI (modals, availability widgets, etc.)
    Layouts/DashboardLayout.jsx Shared role-aware navigation shell
routes/
  api.php                      All HTTP endpoints, grouped under /api/v1
```

## 8. API Surface (high level)

All routes are prefixed with `/api/v1`.

- `auth/{register, login, logout, me}`
- `subjects`, `tutors`, `tutors/{id}/availability`
- `availability`, `availability/bulk-sync` (tutor only)
- `bookings`, `bookings/{id}/{cancel,confirm,complete}`
- `checkout/apply-coupon`
- `payments/initiate`, `payments/{id}`, `payments/webhook`
- `reviews`
- `admin/{analytics, dashboard, tutors, subjects, bookings, payments, coupons}`

## 9. Notes and Limitations

- Payments use the PayHere sandbox by default. A booking whose discounted total reaches zero (for example after a 100% coupon) is settled directly by the backend and does not call PayHere.
- The IPN webhook endpoint must be reachable from the public internet for real PayHere callbacks to land. During local development the sandbox simulator can be used.
- Email delivery uses Laravel's `log` mailer by default; configure SMTP in `.env` to send real notifications.
- The frontend assumes the API is served on the same origin as the SPA. Cross-origin deployments will need CORS configuration in `config/cors.php`.

## 10. Licence

This repository was produced for academic submission. The Laravel framework and other third-party packages retain their original licences as declared in `composer.json` and `package.json`.
