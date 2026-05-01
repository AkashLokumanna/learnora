<?php

namespace App\Http\Controllers\Api;

use App\Models\Booking;
use App\Models\Review;
use App\Models\TutorProfile;
use App\Models\TutorAvailability;
use Illuminate\Support\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TutorProfileController extends ApiController
{

        public function index(Request $request): JsonResponse
    {
        $query = TutorProfile::query()
            ->where('is_verified', true)
            ->where('availability_status', '!=', 'paused')
            ->with(['user:id,name,avatar,bio', 'subjects:id,name,slug,icon,color'])
            ->withCount('bookings');

        if ($request->filled('subject_id')) {
            $query->whereHas('subjects', fn ($q) => $q->where('subjects.id', $request->subject_id));
        }

        if ($request->filled('teaching_method')) {
            $query->where(function ($q) use ($request) {
                $q->where('teaching_method', $request->teaching_method)
                  ->orWhere('teaching_method', 'both');
            });
        }

        if ($request->filled('search')) {
            $search = '%' . $request->search . '%';
            $query->whereHas('user', fn ($q) => $q->where('name', 'like', $search));
        }

        if ($request->filled('min_rate')) {
            $query->where('hourly_rate', '>=', $request->min_rate);
        }
        if ($request->filled('max_rate')) {
            $query->where('hourly_rate', '<=', $request->max_rate);
        }

        $query->orderByDesc('avg_rating')->orderByDesc('total_reviews');

        $paginated = $query->paginate(12);

        $tutors = collect($paginated->items())->map(fn (TutorProfile $p) => $this->formatPublicProfile($p));

        return $this->ok('Tutors retrieved successfully.', [
            'tutors'       => $tutors,
            'pagination'   => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'next_page_url'=> $paginated->nextPageUrl(),
                'prev_page_url'=> $paginated->previousPageUrl(),
            ],
        ]);
    }

        public function show(TutorProfile $tutor): JsonResponse
    {
        if (! $tutor->is_verified || $tutor->availability_status === 'paused') {
            return $this->notFound('Tutor profile not found.');
        }

        $tutor->load([
            'user:id,name,avatar,bio,email',
            'subjects:id,name,slug,icon,color',
        ]);

        $reviews = Review::query()
            ->where('tutor_id', $tutor->user_id)
            ->with('student:id,name')
            ->latest()
            ->get();

        $availableDays = TutorAvailability::query()
            ->where('tutor_id', $tutor->user_id)
            ->where('is_active', true)
            ->pluck('day_of_week')
            ->unique()
            ->values()
            ->map(fn ($day) => ucfirst((string) $day));

        return $this->ok('Tutor profile retrieved successfully.', [
            'tutor' => [
                'id' => $tutor->id,
                'user' => [
                    'id' => $tutor->user?->id,
                    'name' => $tutor->user?->name,
                    'avatar' => $tutor->user?->avatar,
                    'bio' => $tutor->user?->bio,
                    'email' => $tutor->user?->email,
                ],
                'tutor_profile' => [
                    'id' => $tutor->id,
                    'headline' => $tutor->headline,
                    'about' => $tutor->about,
                    'hourly_rate' => $tutor->hourly_rate,
                    'avg_rating' => $tutor->avg_rating,
                    'total_reviews' => $tutor->total_reviews,
                    'experience_years' => $tutor->experience_years,
                    'teaching_method' => $tutor->teaching_method,
                    'availability_status' => $tutor->availability_status,
                    'is_verified' => $tutor->is_verified,
                    'languages' => $tutor->languages ?? [],
                    'certifications' => $tutor->certifications ?? [],
                    'available_days' => $availableDays,
                ],
                'subjects' => $tutor->subjects->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'slug' => $s->slug,
                    'icon' => $s->icon,
                    'color' => $s->color,
                ]),
                'reviews' => $reviews->map(fn ($review) => [
                    'id' => $review->id,
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'created_at' => $review->created_at?->toISOString(),
                    'reviewer' => [
                        'id' => $review->student?->id,
                        'name' => $review->student?->name,
                    ],
                ]),
            ],
        ]);
    }

        public function availability(Request $request, TutorProfile $tutor): JsonResponse
    {
        if (! $tutor->is_verified || $tutor->availability_status === 'paused') {
            return $this->notFound('Tutor profile not found.');
        }

        $validated = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
        ]);

        $requestedDate = Carbon::parse($validated['date']);
        $dayName = strtolower($requestedDate->format('l'));

        $slots = TutorAvailability::query()
            ->where('tutor_id', $tutor->user_id)
            ->active()
            ->where('day_of_week', $dayName)
            ->where(function ($q) use ($requestedDate) {
                $q->whereNull('valid_from')
                    ->orWhereDate('valid_from', '<=', $requestedDate->toDateString());
            })
            ->where(function ($q) use ($requestedDate) {
                $q->whereNull('valid_until')
                    ->orWhereDate('valid_until', '>=', $requestedDate->toDateString());
            })
            ->orderBy('start_time')
            ->get();

        $bookedAvailabilityIds = Booking::query()
            ->where('tutor_id', $tutor->user_id)
            ->whereDate('session_date', $requestedDate->toDateString())
            ->whereNotIn('status', [Booking::STATUS_CANCELLED])
            ->pluck('availability_id')
            ->filter()
            ->unique()
            ->values();

        $availableSlots = $slots
            ->reject(fn ($slot) => $bookedAvailabilityIds->contains($slot->id))
            ->values()
            ->map(fn ($slot) => [
                'availability_id' => $slot->id,
                'day_of_week' => $slot->day_of_week,
                'start_time' => $slot->start_time,
                'end_time' => $slot->end_time,
                'duration_minutes' => $slot->duration_minutes,
                'meeting_type' => $slot->meeting_type,
                'cost' => $slot->cost,
            ]);

        return $this->ok('Availability retrieved successfully.', [
            'date' => $requestedDate->toDateString(),
            'slots' => $availableSlots,
        ]);
    }

        public function myProfile(Request $request): JsonResponse
    {
        if (! $request->user()->isTutor()) {
            return $this->forbidden('Only tutor accounts can access this endpoint.');
        }

        $profile = $request->user()
            ->tutorProfile
            ?->load(['subjects', 'availabilities']);

        if (! $profile) {
            return $this->notFound('Tutor profile not found.');
        }

        return $this->ok('Profile retrieved successfully.', [
            'profile' => $this->formatOwnProfile($profile),
        ]);
    }

        public function updateMyProfile(Request $request): JsonResponse
    {
        if (! $request->user()->isTutor()) {
            return $this->forbidden('Only tutor accounts can access this endpoint.');
        }

        $profile = $request->user()->tutorProfile;

        if (! $profile) {
            return $this->notFound('Tutor profile not found.');
        }

        $validated = $request->validate([
            'headline'            => ['nullable', 'string', 'max:255'],
            'about'               => ['nullable', 'string', 'max:5000'],
            'hourly_rate'         => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'experience_years'    => ['nullable', 'integer', 'min:0', 'max:60'],
            'teaching_method'     => ['nullable', Rule::in(['online', 'in_person', 'both'])],
            'availability_status' => ['nullable', Rule::in(['available', 'busy', 'paused'])],
            'certifications'      => ['nullable', 'array'],
            'certifications.*.title'  => ['required_with:certifications', 'string', 'max:255'],
            'certifications.*.issuer' => ['nullable', 'string', 'max:255'],
            'certifications.*.year'   => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'languages'           => ['nullable', 'array'],
            'languages.*'         => ['string', 'max:50'],
            
            'subject_ids'         => ['nullable', 'array'],
            'subject_ids.*'       => ['integer', 'exists:subjects,id'],
        ]);

        $subjectIds = $validated['subject_ids'] ?? null;
        unset($validated['subject_ids']);

        $profile->update($validated);

        if (! is_null($subjectIds)) {
            $profile->subjects()->sync($subjectIds);
        }

        $profile->load(['subjects', 'availabilities']);

        return $this->ok('Profile updated successfully.', [
            'profile' => $this->formatOwnProfile($profile),
        ]);
    }

        private function formatPublicProfile(TutorProfile $profile, bool $detailed = false): array
    {
        $data = [
            'id'                  => $profile->id,
            'name'                => $profile->user?->name,
            'avatar'              => $profile->user?->avatar,
            'headline'            => $profile->headline,
            'hourly_rate'         => $profile->hourly_rate,
            'avg_rating'          => $profile->avg_rating,
            'total_reviews'       => $profile->total_reviews,
            'teaching_method'     => $profile->teaching_method,
            'availability_status' => $profile->availability_status,
            'experience_years'    => $profile->experience_years,
            'is_verified'         => $profile->is_verified,
            'subjects'            => $profile->relationLoaded('subjects')
                ? $profile->subjects->map(fn ($s) => [
                    'id'    => $s->id,
                    'name'  => $s->name,
                    'slug'  => $s->slug,
                    'icon'  => $s->icon,
                    'color' => $s->color,
                  ])
                : [],
        ];

        if ($detailed) {
            $data['about']          = $profile->about;
            $data['bio']            = $profile->user?->bio;
            $data['languages']      = $profile->languages ?? [];
            $data['certifications'] = $profile->certifications ?? [];

            if ($profile->relationLoaded('availabilities')) {
                $data['availabilities'] = $profile->availabilities->map(fn ($a) => [
                    'id'               => $a->id,
                    'day_of_week'      => $a->day_of_week,
                    'start_time'       => $a->start_time,
                    'end_time'         => $a->end_time,
                    'duration_minutes' => $a->duration_minutes,
                    'cost'             => $a->cost,
                    'meeting_type'     => $a->meeting_type,
                ]);
            }
        }

        return $data;
    }

        private function formatOwnProfile(TutorProfile $profile): array
    {
        return [
            'id'                  => $profile->id,
            'user_id'             => $profile->user_id,
            'headline'            => $profile->headline,
            'about'               => $profile->about,
            'hourly_rate'         => $profile->hourly_rate,
            'experience_years'    => $profile->experience_years,
            'teaching_method'     => $profile->teaching_method,
            'availability_status' => $profile->availability_status,
            'avg_rating'          => $profile->avg_rating,
            'total_reviews'       => $profile->total_reviews,
            'is_verified'         => $profile->is_verified,
            'certifications'      => $profile->certifications ?? [],
            'languages'           => $profile->languages ?? [],
            'subjects'            => $profile->relationLoaded('subjects')
                ? $profile->subjects->map(fn ($s) => ['id' => $s->id, 'name' => $s->name, 'slug' => $s->slug])
                : [],
            'availabilities'      => $profile->relationLoaded('availabilities')
                ? $profile->availabilities->map(fn ($a) => [
                    'id'               => $a->id,
                    'day_of_week'      => $a->day_of_week,
                    'start_time'       => $a->start_time,
                    'end_time'         => $a->end_time,
                    'duration_minutes' => $a->duration_minutes,
                    'cost'             => $a->cost,
                    'meeting_type'     => $a->meeting_type,
                    'is_active'        => $a->is_active,
                  ])
                : [],
            'updated_at'          => $profile->updated_at->toISOString(),
        ];
    }
}
