<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\TutorProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends ApiController
{

        public function dashboard(): JsonResponse
    {
        
        $userStats = User::selectRaw("
            COUNT(*)                                          AS total,
            SUM(role = 'student')                             AS students,
            SUM(role = 'tutor')                               AS tutors,
            SUM(role = 'admin')                               AS admins,
            SUM(status = 'active')                            AS active,
            SUM(status = 'pending')                           AS pending,
            SUM(status = 'suspended')                         AS suspended
        ")->first();

        $pendingVerifications = TutorProfile::where('is_verified', false)
            ->whereHas('user', fn ($q) => $q->where('status', User::STATUS_PENDING))
            ->count();

        $bookingStats = Booking::selectRaw("
            COUNT(*)                                          AS total,
            SUM(status = 'pending')                           AS pending,
            SUM(status = 'confirmed')                         AS confirmed,
            SUM(status = 'completed')                         AS completed,
            SUM(status = 'cancelled')                         AS cancelled,
            SUM(status = 'no_show')                           AS no_show
        ")->first();

        $revenueStats = Payment::where('status', Payment::STATUS_SUCCESS)
            ->selectRaw("
                SUM(amount)                                   AS total_lkr,
                SUM(CASE WHEN MONTH(paid_at) = MONTH(NOW())
                         AND YEAR(paid_at)  = YEAR(NOW())
                         THEN amount ELSE 0 END)              AS this_month_lkr,
                COUNT(*)                                      AS total_transactions
            ")->first();

        $recentBookings = Booking::with([
            'student:id,name,avatar',
            'tutor:id,name,avatar',
            'subject:id,name,slug',
        ])
        ->orderByDesc('created_at')
        ->limit(5)
        ->get()
        ->map(fn ($b) => [
            'id'           => $b->id,
            'student'      => $b->student?->only(['id', 'name', 'avatar']),
            'tutor'        => $b->tutor?->only(['id', 'name', 'avatar']),
            'subject'      => $b->subject?->only(['id', 'name']),
            'session_date' => $b->session_date?->toDateString(),
            'amount'       => $b->amount,
            'status'       => $b->status,
            'payment_status' => $b->payment_status,
        ]);

        $recentPayments = Payment::with(['user:id,name', 'booking:id,session_date'])
            ->where('status', Payment::STATUS_SUCCESS)
            ->orderByDesc('paid_at')
            ->limit(5)
            ->get()
            ->map(fn ($p) => [
                'id'                     => $p->id,
                'booking_id'             => $p->booking_id,
                'student_name'           => $p->user?->name,
                'amount'                 => $p->amount,
                'currency'               => $p->currency,
                'gateway_transaction_id' => $p->gateway_transaction_id,
                'paid_at'                => $p->paid_at?->toISOString(),
            ]);

        return $this->ok('Dashboard data retrieved.', [
            'users' => [
                'total'     => (int) $userStats->total,
                'students'  => (int) $userStats->students,
                'tutors'    => (int) $userStats->tutors,
                'admins'    => (int) $userStats->admins,
                'active'    => (int) $userStats->active,
                'pending'   => (int) $userStats->pending,
                'suspended' => (int) $userStats->suspended,
            ],
            'pending_verifications' => $pendingVerifications,
            'bookings' => [
                'total'     => (int) $bookingStats->total,
                'pending'   => (int) $bookingStats->pending,
                'confirmed' => (int) $bookingStats->confirmed,
                'completed' => (int) $bookingStats->completed,
                'cancelled' => (int) $bookingStats->cancelled,
                'no_show'   => (int) $bookingStats->no_show,
            ],
            'revenue' => [
                'total_lkr'          => (float) ($revenueStats->total_lkr ?? 0),
                'this_month_lkr'     => (float) ($revenueStats->this_month_lkr ?? 0),
                'total_transactions' => (int) ($revenueStats->total_transactions ?? 0),
            ],
            'recent_bookings' => $recentBookings,
            'recent_payments' => $recentPayments,
        ]);
    }

        public function tutors(Request $request): JsonResponse
    {
        $query = User::where('role', User::ROLE_TUTOR)
            ->with(['tutorProfile.subjects:id,name,slug'])
            ->orderByRaw("FIELD(status, 'pending', 'active', 'suspended')")
            ->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('is_verified')) {
            $isVerified = filter_var($request->is_verified, FILTER_VALIDATE_BOOLEAN);
            $query->whereHas('tutorProfile', fn ($q) => $q->where('is_verified', $isVerified));
        }

        if ($request->filled('search')) {
            $search = '%' . $request->search . '%';
            $query->where(fn ($q) => $q
                ->where('name', 'like', $search)
                ->orWhere('email', 'like', $search)
            );
        }

        $paginated = $query->paginate(15);

        $tutors = collect($paginated->items())->map(fn (User $user) => [
            'id'            => $user->id,
            'name'          => $user->name,
            'email'         => $user->email,
            'avatar'        => $user->avatar,
            'phone'         => $user->phone,
            'status'        => $user->status,
            'created_at'    => $user->created_at->toISOString(),
            'tutor_profile' => $user->tutorProfile ? [
                'id'                  => $user->tutorProfile->id,
                'headline'            => $user->tutorProfile->headline,
                'hourly_rate'         => $user->tutorProfile->hourly_rate,
                'experience_years'    => $user->tutorProfile->experience_years,
                'teaching_method'     => $user->tutorProfile->teaching_method,
                'availability_status' => $user->tutorProfile->availability_status,
                'avg_rating'          => $user->tutorProfile->avg_rating,
                'total_reviews'       => $user->tutorProfile->total_reviews,
                'is_verified'         => $user->tutorProfile->is_verified,
                'subjects'            => $user->tutorProfile->subjects->map(fn ($s) => ['id' => $s->id, 'name' => $s->name]),
            ] : null,
        ]);

        return $this->ok('Tutors retrieved successfully.', [
            'tutors'     => $tutors,
            'pagination' => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
            ],
        ]);
    }

        public function verifyTutor(User $tutor): JsonResponse
    {
        if (! $tutor->isTutor()) {
            return $this->unprocessable('The specified user is not a tutor.');
        }

        if (! $tutor->tutorProfile) {
            return $this->notFound('This tutor does not have a profile yet.');
        }

        if ($tutor->tutorProfile->is_verified && $tutor->status === User::STATUS_ACTIVE) {
            return $this->unprocessable('This tutor is already verified and active.');
        }

        $tutor->update(['status' => User::STATUS_ACTIVE]);
        $tutor->tutorProfile->update([
            'is_verified'         => true,
            'availability_status' => 'available',
        ]);

        return $this->ok('Tutor verified and activated successfully.', [
            'tutor' => [
                'id'         => $tutor->id,
                'name'       => $tutor->name,
                'email'      => $tutor->email,
                'status'     => User::STATUS_ACTIVE,
                'is_verified'=> true,
            ],
        ]);
    }

        public function suspendTutor(User $tutor): JsonResponse
    {
        if (! $tutor->isTutor()) {
            return $this->unprocessable('The specified user is not a tutor.');
        }

        if ($tutor->status === User::STATUS_SUSPENDED) {
            return $this->unprocessable('This tutor account is already suspended.');
        }

        $tutor->update(['status' => User::STATUS_SUSPENDED]);

        $tutor->tutorProfile?->update(['availability_status' => 'paused']);

        $tutor->tokens()->delete();

        return $this->ok('Tutor account suspended successfully.', [
            'tutor' => [
                'id'     => $tutor->id,
                'name'   => $tutor->name,
                'email'  => $tutor->email,
                'status' => User::STATUS_SUSPENDED,
            ],
        ]);
    }

        public function bookings(Request $request): JsonResponse
    {
        $query = Booking::with([
            'student:id,name,email,avatar',
            'tutor:id,name,email,avatar',
            'subject:id,name,slug',
        ])
        ->orderByDesc('session_date')
        ->orderByDesc('time_from');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }
        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }
        if ($request->filled('tutor_id')) {
            $query->where('tutor_id', $request->tutor_id);
        }
        if ($request->filled('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }
        if ($request->filled('from_date')) {
            $query->whereDate('session_date', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->whereDate('session_date', '<=', $request->to_date);
        }

        $paginated = $query->paginate(15);

        $bookings = collect($paginated->items())->map(fn (Booking $b) => [
            'id'             => $b->id,
            'student'        => $b->student?->only(['id', 'name', 'email', 'avatar']),
            'tutor'          => $b->tutor?->only(['id', 'name', 'email', 'avatar']),
            'subject'        => $b->subject?->only(['id', 'name', 'slug']),
            'session_date'   => $b->session_date?->toDateString(),
            'time_from'      => $b->time_from,
            'time_to'        => $b->time_to,
            'amount'         => $b->amount,
            'discount_amount'=> $b->discount_amount,
            'net_amount'     => $b->netAmount(),
            'meeting_type'   => $b->meeting_type,
            'status'         => $b->status,
            'payment_status' => $b->payment_status,
            'created_at'     => $b->created_at->toISOString(),
        ]);

        return $this->ok('Bookings retrieved successfully.', [
            'bookings'   => $bookings,
            'pagination' => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
            ],
        ]);
    }

        public function payments(Request $request): JsonResponse
    {
        $query = Payment::with([
            'user:id,name,email',
            'booking:id,session_date,status,student_id,tutor_id',
        ])->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('gateway')) {
            $query->where('gateway', $request->gateway);
        }
        if ($request->filled('from_date')) {
            $query->whereDate('paid_at', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->whereDate('paid_at', '<=', $request->to_date);
        }

        $summary = (clone $query)->selectRaw("
            SUM(CASE WHEN status = 'success'  THEN amount ELSE 0 END) AS total_revenue,
            SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END) AS total_refunded,
            SUM(status = 'success')                                    AS successful,
            SUM(status = 'failed')                                     AS failed,
            SUM(status = 'pending')                                    AS pending,
            SUM(status = 'refunded')                                   AS refunded
        ")->first();

        $paginated = $query->paginate(15);

        $payments = collect($paginated->items())->map(fn (Payment $p) => [
            'id'                     => $p->id,
            'booking_id'             => $p->booking_id,
            'student'                => $p->user?->only(['id', 'name', 'email']),
            'session_date'           => $p->booking?->session_date?->toDateString(),
            'amount'                 => $p->amount,
            'currency'               => $p->currency,
            'gateway'                => $p->gateway,
            'gateway_order_id'       => $p->gateway_order_id,
            'gateway_transaction_id' => $p->gateway_transaction_id,
            'status'                 => $p->status,
            'paid_at'                => $p->paid_at?->toISOString(),
            'created_at'             => $p->created_at->toISOString(),
        ]);

        return $this->ok('Payments retrieved successfully.', [
            'summary'    => [
                'total_revenue'   => (float) ($summary->total_revenue  ?? 0),
                'total_refunded'  => (float) ($summary->total_refunded ?? 0),
                'successful'      => (int)   ($summary->successful     ?? 0),
                'failed'          => (int)   ($summary->failed         ?? 0),
                'pending'         => (int)   ($summary->pending        ?? 0),
                'refunded'        => (int)   ($summary->refunded       ?? 0),
            ],
            'payments'   => $payments,
            'pagination' => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
            ],
        ]);
    }
}
