<?php

namespace App\Http\Controllers\Api;

use App\Models\Booking;
use App\Models\Review;
use App\Models\TutorProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReviewController extends ApiController
{
        public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->isStudent()) {
            return $this->forbidden('Only students can leave reviews.');
        }

        $validated = $request->validate([
            'booking_id' => ['required', 'integer', 'exists:bookings,id'],
            'rating'     => ['required', 'integer', 'min:1', 'max:5'],
            'comment'    => ['nullable', 'string', 'max:1000'],
        ]);

                $booking = Booking::findOrFail($validated['booking_id']);

        if ($booking->student_id !== $user->id) {
            return $this->forbidden('You can only review your own bookings.');
        }

        if ($booking->payment_status !== Booking::PAYMENT_PAID && $booking->status !== Booking::STATUS_COMPLETED) {
            return $this->unprocessable('You can only review bookings that have been paid for or completed.');
        }

        $alreadyReviewed = Review::where('booking_id', $booking->id)->exists();
        if ($alreadyReviewed) {
            return $this->unprocessable('You have already left a review for this booking.');
        }

        DB::transaction(function () use ($validated, $booking, $user) {
            
            $review = Review::create([
                'booking_id' => $booking->id,
                'student_id' => $user->id,
                'tutor_id'   => $booking->tutor_id,
                'rating'     => $validated['rating'],
                'comment'    => $validated['comment'] ?? null,
            ]);

            $tutorId = $booking->tutor_id;
            
            $aggregates = Review::where('tutor_id', $tutorId)
                ->selectRaw('COUNT(*) as total_reviews, AVG(rating) as avg_rating')
                ->first();

            TutorProfile::where('user_id', $tutorId)->update([
                'total_reviews' => $aggregates->total_reviews ?? 0,
                'avg_rating'    => round($aggregates->avg_rating ?? 0, 1),
            ]);
        });

        return $this->created('Review submitted successfully.');
    }
}
