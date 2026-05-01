<?php

namespace App\Http\Controllers\Api;

use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubjectController extends ApiController
{

        public function index(): JsonResponse
    {
        $subjects = Subject::active()
            ->withCount([
                
                'tutorProfiles as tutor_count' => function ($query) {
                    $query->where('is_verified', true)
                          ->where('availability_status', 'available');
                },
            ])
            ->orderBy('name')
            ->get()
            ->map(fn (Subject $subject) => $this->formatSubject($subject));

        return $this->ok('Subjects retrieved successfully.', [
            'subjects' => $subjects,
            'total'    => $subjects->count(),
        ]);
    }

        public function show(Subject $subject): JsonResponse
    {
        
        if (! $subject->is_active) {
            return $this->notFound('Subject not found.');
        }

        $subject->load([
            'tutorProfiles' => function ($query) {
                $query->where('is_verified', true)
                      ->where('availability_status', 'available')
                      ->with('user')
                      ->orderByDesc('avg_rating');
            },
        ]);

        $tutors = $subject->tutorProfiles->map(fn ($profile) => [
            'id'                  => $profile->id,
            'name'                => $profile->user->name,
            'avatar'              => $profile->user->avatar,
            'headline'            => $profile->headline,
            'hourly_rate'         => $profile->hourly_rate,
            'avg_rating'          => $profile->avg_rating,
            'total_reviews'       => $profile->total_reviews,
            'teaching_method'     => $profile->teaching_method,
            'availability_status' => $profile->availability_status,
            'experience_years'    => $profile->experience_years,
        ]);

        return $this->ok('Subject retrieved successfully.', [
            'subject' => $this->formatSubject($subject),
            'tutors'  => $tutors,
            'total'   => $tutors->count(),
        ]);
    }

        private function formatSubject(Subject $subject): array
    {
        return [
            'id'          => $subject->id,
            'name'        => $subject->name,
            'slug'        => $subject->slug,
            'icon'        => $subject->icon,
            'color'       => $subject->color,
            'is_active'   => $subject->is_active,
            'tutor_count' => $subject->tutor_count ?? null,
        ];
    }
}
