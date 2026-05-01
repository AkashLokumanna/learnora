<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminSubjectController extends ApiController
{

        public function index(): JsonResponse
    {
        $subjects = Subject::withCount('tutorProfiles')
            ->orderBy('is_active', 'desc')   
            ->orderBy('name')
            ->get()
            ->map(fn (Subject $s) => $this->formatSubject($s));

        return $this->ok('Subjects retrieved successfully.', [
            'subjects' => $subjects,
            'total'    => $subjects->count(),
        ]);
    }

        public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'      => ['required', 'string', 'max:100', 'unique:subjects,name'],
            'slug'      => ['nullable', 'string', 'max:120', 'unique:subjects,slug', 'regex:/^[a-z0-9\-]+$/'],
            'icon'      => ['nullable', 'string', 'max:100'],
            'color'     => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6})$/'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $slug = $validated['slug'] ?? $this->generateUniqueSlug($validated['name']);

        $subject = Subject::create([
            'name'      => $validated['name'],
            'slug'      => $slug,
            'icon'      => $validated['icon']      ?? null,
            'color'     => $validated['color']     ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return $this->created('Subject created successfully.', [
            'subject' => $this->formatSubject($subject),
        ]);
    }

        public function show(Subject $subject): JsonResponse
    {
        $subject->loadCount('tutorProfiles')
                ->load('tutorProfiles.user:id,name,email,avatar');

        $tutors = $subject->tutorProfiles->map(fn ($p) => [
            'id'          => $p->id,
            'name'        => $p->user?->name,
            'email'       => $p->user?->email,
            'is_verified' => $p->is_verified,
        ]);

        return $this->ok('Subject retrieved successfully.', [
            'subject' => $this->formatSubject($subject),
            'tutors'  => $tutors,
        ]);
    }

        public function update(Request $request, Subject $subject): JsonResponse
    {
        $validated = $request->validate([
            'name'      => ['sometimes', 'string', 'max:100', Rule::unique('subjects', 'name')->ignore($subject->id)],
            'icon'      => ['sometimes', 'nullable', 'string', 'max:100'],
            'color'     => ['sometimes', 'nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6})$/'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $subject->update($validated);

        return $this->ok('Subject updated successfully.', [
            'subject' => $this->formatSubject($subject->fresh()),
        ]);
    }

        public function destroy(Subject $subject): JsonResponse
    {
        $linkedTutors = $subject->tutorProfiles()->count();

        if ($linkedTutors > 0) {
            
            $subject->update(['is_active' => false]);

            return $this->ok("Subject deactivated. It is linked to {$linkedTutors} tutor(s) so it was not permanently deleted.", [
                'action'     => 'deactivated',
                'subject_id' => $subject->id,
            ]);
        }

        $subject->delete();

        return $this->ok('Subject permanently deleted.', [
            'action'     => 'deleted',
            'subject_id' => $subject->id,
        ]);
    }

        private function generateUniqueSlug(string $name): string
    {
        $base   = Str::slug($name);
        $slug   = $base;
        $suffix = 2;

        while (Subject::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $suffix;
            $suffix++;
        }

        return $slug;
    }

        private function formatSubject(Subject $subject): array
    {
        return [
            'id'            => $subject->id,
            'name'          => $subject->name,
            'slug'          => $subject->slug,
            'icon'          => $subject->icon,
            'color'         => $subject->color,
            'is_active'     => $subject->is_active,
            'tutor_count'   => $subject->tutor_profiles_count ?? null,
            'created_at'    => $subject->created_at->toISOString(),
            'updated_at'    => $subject->updated_at->toISOString(),
        ];
    }
}
