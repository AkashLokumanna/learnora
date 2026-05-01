<?php

namespace App\Http\Controllers\Api;

use App\Models\Booking;
use App\Models\Coupon;
use App\Models\TutorAvailability;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use App\Notifications\BookingCreatedNotification;

class BookingController extends ApiController
{

        public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = Booking::query()
            ->with(['student:id,name,avatar', 'tutor:id,name,avatar,email,phone', 'subject:id,name,slug,icon,color'])
            ->orderByDesc('session_date')
            ->orderByDesc('time_from');

        if ($user->isStudent()) {
            $query->where('student_id', $user->id);
        } elseif ($user->isTutor()) {
            $query->where('tutor_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('from_date')) {
            $query->whereDate('session_date', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('session_date', '<=', $request->to_date);
        }

        $paginated = $query->paginate(10);

        return $this->ok('Bookings retrieved successfully.', [
            'bookings'   => collect($paginated->items())->map(fn ($b) => $this->formatBooking($b)),
            'pagination' => [
                'total'         => $paginated->total(),
                'per_page'      => $paginated->perPage(),
                'current_page'  => $paginated->currentPage(),
                'last_page'     => $paginated->lastPage(),
                'next_page_url' => $paginated->nextPageUrl(),
                'prev_page_url' => $paginated->previousPageUrl(),
            ],
        ]);
    }

        public function store(Request $request): JsonResponse
    {
        if (! $request->user()->isStudent()) {
            return $this->forbidden('Only student accounts can create bookings.');
        }

        $validated = $request->validate([
            'availability_id' => ['required', 'integer', 'exists:tutor_availabilities,id'],
            'subject_id'      => ['required', 'integer', 'exists:subjects,id'],
            'session_date'    => ['required', 'date', 'after:today'],
            'meeting_type'    => ['required', Rule::in([Booking::MEETING_ONLINE, Booking::MEETING_IN_PERSON])],
            'notes'           => ['nullable', 'string', 'max:1000'],
            'coupon_code'     => ['nullable', 'string', 'max:50'],
        ]);

                $slot = TutorAvailability::with('tutor.tutorProfile.subjects')->findOrFail($validated['availability_id']);

        if (! $slot->is_active) {
            return $this->unprocessable('This availability slot is not currently active.');
        }

        $sessionDate = Carbon::parse($validated['session_date']);
        $dayName     = strtolower($sessionDate->format('l')); 

        if ($dayName !== $slot->day_of_week) {
            return $this->unprocessable(
                "The selected date ({$sessionDate->toDateString()}) does not fall on a {$slot->day_of_week}."
            );
        }

        if ($slot->valid_from && $sessionDate->lt($slot->valid_from)) {
            return $this->unprocessable(
                "This slot is not available until {$slot->valid_from->toDateString()}."
            );
        }

        if ($slot->valid_until && $sessionDate->gt($slot->valid_until)) {
            return $this->unprocessable(
                "This slot expired on {$slot->valid_until->toDateString()}."
            );
        }

        $tutorProfile    = $slot->tutor?->tutorProfile;
        $teachesSubject  = $tutorProfile?->subjects->contains('id', $validated['subject_id']);

        if (! $teachesSubject) {
            return $this->unprocessable('The selected tutor does not teach the selected subject.');
        }

        $alreadyBooked = Booking::where('tutor_id', $slot->tutor_id)
            ->where('session_date', $validated['session_date'])
            ->where('time_from', $slot->start_time)
            ->whereNotIn('status', [Booking::STATUS_CANCELLED])
            ->exists();

        if ($alreadyBooked) {
            return $this->unprocessable(
                'This slot is already booked for the selected date. Please choose a different date.'
            );
        }

        $discountAmount = 0;
        $couponId       = null;

        if (! empty($validated['coupon_code'])) {
            $couponResult = $this->resolveCoupon(
                $validated['coupon_code'],
                $slot->cost,
                $request->user()->id
            );

            if (! $couponResult['valid']) {
                return $this->unprocessable($couponResult['message']);
            }

            $couponId       = $couponResult['coupon']->id;
            $discountAmount = $couponResult['discount'];
        }

        $booking = Booking::create([
            'student_id'      => $request->user()->id,
            'tutor_id'        => $slot->tutor_id,
            'availability_id' => $slot->id,
            'subject_id'      => $validated['subject_id'],
            'coupon_id'       => $couponId,
            'session_date'    => $validated['session_date'],
            'time_from'       => $slot->start_time,
            'time_to'         => $slot->end_time,
            'amount'          => $slot->cost,
            'discount_amount' => $discountAmount,
            'meeting_type'    => $validated['meeting_type'],
            'status'          => Booking::STATUS_PENDING,
            'payment_status'  => Booking::PAYMENT_UNPAID,
            'notes'           => $validated['notes'] ?? null,
        ]);

        $booking->load(['student:id,name,avatar', 'tutor:id,name,avatar', 'subject:id,name,slug']);

        if ($booking->tutor) {
            $booking->tutor->notify(new BookingCreatedNotification($booking));
        }

        return $this->created('Booking created successfully. Proceed to payment to confirm your session.', [
            'booking' => $this->formatBooking($booking),
        ]);
    }

        public function show(Request $request, Booking $booking): JsonResponse
    {
        if (! $this->canAccessBooking($booking, $request->user())) {
            return $this->forbidden('You do not have permission to view this booking.');
        }

        $booking->load([
            'student:id,name,avatar,email',
            'tutor:id,name,avatar,email',
            'subject:id,name,slug,icon,color',
            'availability',
            'payment',
        ]);

        return $this->ok('Booking retrieved successfully.', [
            'booking' => $this->formatBooking($booking, detailed: true),
        ]);
    }

        public function cancel(Request $request, Booking $booking): JsonResponse
    {
        $user = $request->user();

        if (! $this->canAccessBooking($booking, $user)) {
            return $this->forbidden('You do not have permission to cancel this booking.');
        }

        if (
            in_array($booking->status, [Booking::STATUS_COMPLETED, Booking::STATUS_CANCELLED])
            && ! $user->isAdmin()
        ) {
            return $this->unprocessable("A booking with status '{$booking->status}' cannot be cancelled.");
        }

        $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $booking->update(['status' => Booking::STATUS_CANCELLED]);

        return $this->ok('Booking cancelled successfully.', [
            'booking' => $this->formatBooking($booking->fresh()),
        ]);
    }

        public function confirm(Request $request, Booking $booking): JsonResponse
    {
        $user = $request->user();

        if (! ($user->isAdmin() || ($user->isTutor() && $booking->tutor_id === $user->id))) {
            return $this->forbidden('Only the assigned tutor or an admin can confirm this booking.');
        }

        if ($booking->status !== Booking::STATUS_PENDING) {
            return $this->unprocessable("Only pending bookings can be confirmed. Current status: '{$booking->status}'.");
        }

        $booking->update(['status' => Booking::STATUS_CONFIRMED]);

        return $this->ok('Booking confirmed successfully.', [
            'booking' => $this->formatBooking($booking->fresh()),
        ]);
    }

        public function complete(Request $request, Booking $booking): JsonResponse
    {
        $user = $request->user();

        if (! ($user->isAdmin() || ($user->isTutor() && $booking->tutor_id === $user->id))) {
            return $this->forbidden('Only the assigned tutor or an admin can mark a booking as complete.');
        }

        if ($booking->status !== Booking::STATUS_CONFIRMED) {
            return $this->unprocessable("Only confirmed bookings can be marked as complete. Current status: '{$booking->status}'.");
        }

        $booking->update(['status' => Booking::STATUS_COMPLETED]);

        return $this->ok('Session marked as complete.', [
            'booking' => $this->formatBooking($booking->fresh()),
        ]);
    }

        private function canAccessBooking(Booking $booking, $user): bool
    {
        return $user->isAdmin()
            || $booking->student_id === $user->id
            || $booking->tutor_id  === $user->id;
    }

        private function resolveCoupon(string $code, float $bookingAmount, int $userId): array
    {
                $coupon = Coupon::where('code', strtoupper($code))->where('is_active', true)->first();

        if (! $coupon) {
            return ['valid' => false, 'message' => "Coupon code '{$code}' is invalid or inactive.", 'coupon' => null, 'discount' => 0];
        }

        if ($coupon->expires_at && Carbon::parse($coupon->expires_at)->isPast()) {
            return ['valid' => false, 'message' => 'This coupon has expired.', 'coupon' => null, 'discount' => 0];
        }

        if ($coupon->max_uses > 0 && $coupon->used_count >= $coupon->max_uses) {
            return ['valid' => false, 'message' => 'This coupon has reached its usage limit.', 'coupon' => null, 'discount' => 0];
        }

        if ($bookingAmount < $coupon->min_booking_amount) {
            return ['valid' => false, 'message' => "This coupon requires a minimum booking amount of {$coupon->min_booking_amount}.", 'coupon' => null, 'discount' => 0];
        }

        $alreadyUsed = $coupon->usages()->where('user_id', $userId)->exists();
        if ($alreadyUsed) {
            return ['valid' => false, 'message' => 'You have already used this coupon.', 'coupon' => null, 'discount' => 0];
        }

        $discount = in_array($coupon->type, ['percent', 'percentage'], true)
            ? round(($bookingAmount * $coupon->value) / 100, 2)
            : min((float) $coupon->value, $bookingAmount); 

        return ['valid' => true, 'message' => 'Coupon applied.', 'coupon' => $coupon, 'discount' => $discount];
    }

        private function formatBooking(Booking $booking, bool $detailed = false): array
    {
        $data = [
            'id'             => $booking->id,
            'student_id'     => $booking->student_id,
            'tutor_id'       => $booking->tutor_id,
            'subject_id'     => $booking->subject_id,
            'session_date'   => $booking->session_date?->toDateString(),
            'time_from'      => $booking->time_from,
            'time_to'        => $booking->time_to,
            'amount'         => $booking->amount,
            'discount_amount'=> $booking->discount_amount,
            'net_amount'     => $booking->netAmount(),
            'meeting_type'   => $booking->meeting_type,
            'meeting_link'   => $booking->meeting_link,
            'status'         => $booking->status,
            'payment_status' => $booking->payment_status,
            'notes'          => $booking->notes,
            'created_at'     => $booking->created_at->toISOString(),
        ];

        if ($booking->relationLoaded('student') && $booking->student) {
            $data['student'] = ['id' => $booking->student->id, 'name' => $booking->student->name, 'avatar' => $booking->student->avatar];
        }

        if ($booking->relationLoaded('tutor') && $booking->tutor) {
            $data['tutor'] = [
                'id'     => $booking->tutor->id,
                'name'   => $booking->tutor->name,
                'avatar' => $booking->tutor->avatar,
                'email'  => $booking->tutor->email,
                'phone'  => $booking->tutor->phone,
            ];
        }

        if ($booking->relationLoaded('subject') && $booking->subject) {
            $data['subject'] = ['id' => $booking->subject->id, 'name' => $booking->subject->name, 'slug' => $booking->subject->slug, 'icon' => $booking->subject->icon, 'color' => $booking->subject->color];
        }

        if ($detailed) {
            if ($booking->relationLoaded('availability') && $booking->availability) {
                $data['availability'] = [
                    'id'               => $booking->availability->id,
                    'day_of_week'      => $booking->availability->day_of_week,
                    'duration_minutes' => $booking->availability->duration_minutes,
                ];
            }

            if ($booking->relationLoaded('payment') && $booking->payment) {
                $data['payment'] = [
                    'id'             => $booking->payment->id,
                    'status'         => $booking->payment->status,
                    'amount'         => $booking->payment->amount,
                    'currency'       => $booking->payment->currency,
                    'gateway'        => $booking->payment->gateway,
                    'paid_at'        => $booking->payment->paid_at?->toISOString(),
                ];
            }
        }

        return $data;
    }
}
