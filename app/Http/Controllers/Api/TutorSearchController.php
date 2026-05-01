<?php

namespace App\Http\Controllers\Api;

use App\Models\TutorProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TutorSearchController extends ApiController
{
        public function index(Request $request): JsonResponse
    {
        $query = TutorProfile::query()
            ->where('is_verified', true)
            ->where('availability_status', '!=', 'paused')
            ->with(['user:id,name,avatar', 'subjects:id,name,slug,color']);

        if ($request->filled('subject') || $request->filled('subject_id')) {
            $subject = $request->input('subject') ?? $request->input('subject_id');

            $query->whereHas('subjects', function ($q) use ($subject) {
                $q->where('subjects.id', $subject)
                    ->orWhere('subjects.name', $subject);
            });
        } elseif ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($q1) use ($search) {
                    $q1->where('users.name', 'LIKE', "%{$search}%");
                })->orWhere('tutor_profiles.headline', 'LIKE', "%{$search}%")
                    ->orWhereHas('subjects', function ($q2) use ($search) {
                        $q2->where('subjects.name', 'LIKE', "%{$search}%");
                    });
            });
        }

        $query->orderByDesc('avg_rating')->orderByDesc('total_reviews');

        $paginated = $query->paginate(12);

        $tutors = collect($paginated->items())->map(function (TutorProfile $p) {
            return [
                'id' => $p->id,
                'name' => $p->user?->name,
                'avatar' => $p->user?->avatar,
                'headline' => $p->headline,
                'hourly_rate' => $p->hourly_rate,
                'avg_rating' => $p->avg_rating,
                'total_reviews' => $p->total_reviews,
                'subjects' => $p->subjects->map(function ($s) {
                    return [
                        'id' => $s->id,
                        'name' => $s->name,
                        'color' => $s->color,
                    ];
                }),
            ];
        });

        return $this->ok('Tutors retrieved successfully.', [
            'tutors' => $tutors,
            'pagination' => [
                'total' => $paginated->total(),
                'last_page' => $paginated->lastPage(),
                'current_page' => $paginated->currentPage(),
            ],
        ]);
    }
}
