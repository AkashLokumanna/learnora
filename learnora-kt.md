# Learnora - Project Knowledge Transfer (KT)

## 1. Project Overview
**Learnora** is a dual-sided SaaS educational marketplace built for a final-year BSc Computing dissertation. The platform connects Students with expert Tutors. It handles user authentication, profile discovery, real-time booking, secure payment processing (PayHere Sri Lanka), a review system, and an administrative oversight dashboard.

## 2. Tech Stack & Architecture
This is a decoupled Single Page Application (SPA). 
* **Frontend:** React (JSX), Tailwind CSS, React Router DOM, Vite, Axios, Recharts (for admin analytics).
* **Backend:** Laravel 11 (API-only architecture), PHP.
* **Authentication:** Laravel Sanctum (Token-based SPA Auth).
* **Database:** MySQL (Local via Laragon).
* **Third-Party Integrations:** PayHere (Payments SDK & Webhooks).

## 3. Strict Rules for AI Assistant (Cursor)
* **Architecture:** DO NOT suggest server-side rendering (Blade views) for the UI. We are strictly adhering to the React SPA architecture communicating with Laravel API endpoints (`routes/api.php`).
* **Pathing:** Avoid deep, hallucinated import paths in React components. Stick to local relative paths (e.g., `import axios from '../lib/axios';`).
* **Form Handling:** Always use React controlled components (`useState`) and `e.preventDefault()` on form submissions. Do not use native HTML form actions that cause page reloads.

## 4. Completed Milestones (What Works)
* **Authentication:** Dual-role registration (Student/Tutor) and login via Sanctum.
* **Tutor Supply Side:** Tutors can create profiles, list subjects from a catalogue, and set weekly availability schedules.
* **Student Demand Side:** Students can view a discovery grid of tutors and access public tutor profiles.
* **Booking Engine:** End-to-end booking loop saving sessions to the `bookings` table. Bookings appear on both Student and Tutor dashboards.
* **Monetization:** PayHere integration is complete. Backend generates MD5 security hashes, React handles the JS SDK modal, and a public webhook confirms payments.
* **Trust Engine:** Students can leave 1-5 star reviews on paid bookings, which calculate into an average rating on the tutor's profile.
* **Asynchronous Notifications:** Laravel Jobs/Queues send `BookingCreatedNotification` and `PaymentReceiptNotification` emails.
* **Admin Analytics:** Super Admin dashboard built with `recharts`, displaying total revenue, user counts, and booking volume graphs.

## 5. Current Pending Bugs (Immediate Next Steps)
We were in the middle of executing two specific bug fixes. Cursor AI needs to prioritize these immediately:

**Bug 1: The Global Search Pipeline (`TutorSearchController` & `FindTutors.jsx`)**
* *Issue:* The student homepage search bar successfully redirects to `/student/find-tutors?search=Term`, but the results do not filter. 
* *Required Fix:* `FindTutors.jsx` needs `useSearchParams` to extract the query and pass it to `axios`. The `TutorSearchController@index` needs to use a proper nested closure for fuzzy searching:
  ```php
  // Required logic structure for the backend:
  $query->where(function ($q) use ($search) {
      $q->where('name', 'LIKE', "%{$search}%")
        ->orWhereHas('tutorProfile', function ($q2) use ($search) {
            $q2->where('headline', 'LIKE', "%{$search}%");
        })
        ->orWhereHas('subjects', function ($q3) use ($search) {
            $q3->where('name', 'LIKE', "%{$search}%");
        });
  });