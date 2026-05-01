<?php

namespace App\Http\Controllers\Api;

use App\Models\TutorAvailability;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TutorAvailabilityController extends ApiController
{

        public function index(Request $request): JsonResponse
    {
        if (! $request->user()->isTutor()) {
            return $this->forbidden('Only tutor accounts can manage availability.');
        }

        $query = TutorAvailability::where('tutor_id', $request->user()->id)
            ->orderByRaw("FIELD(day_of_week, 'monday','tuesday','wednesday','thursday','friday','saturday','sunday')")
            ->orderBy('start_time');

        if ($request->filled('day_of_week')) {
            $query->where('day_of_week', $request->day_of_week);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        $slots = $query->get()->map(fn ($slot) => $this->formatSlot($slot));

        return $this->ok('Availability slots retrieved successfully.', [
            'slots' => $slots,
            'total' => $slots->count(),
        ]);
    }

        public function store(Request $request): JsonResponse
    {
        if (! $request->user()->isTutor()) {
            return $this->forbidden('Only tutor accounts can create availability slots.');
        }

        $validated = $request->validate([
            'day_of_week'      => ['required', Rule::in(TutorAvailability::DAYS)],
            'start_time'       => ['required', 'date_format:H:i'],
            'end_time'         => ['required', 'date_format:H:i', 'after:start_time'],
            'duration_minutes' => ['nullable', 'integer', 'min:15', 'max:480'],
            'cost'             => ['required', 'numeric', 'min:0', 'max:999999.99'],
            'meeting_type'     => ['required', Rule::in([TutorAvailability::MEETING_ONLINE, TutorAvailability::MEETING_IN_PERSON, TutorAvailability::MEETING_BOTH])],
            'is_active'        => ['nullable', 'boolean'],
            'valid_from'       => ['nullable', 'date', 'after_or_equal:today'],
            'valid_until'      => ['nullable', 'date', 'after:valid_from'],
        ]);

        $slot = TutorAvailability::create([
            'tutor_id'         => $request->user()->id,
            'day_of_week'      => $validated['day_of_week'],
            'start_time'       => $validated['start_time'],
            'end_time'         => $validated['end_time'],
            'duration_minutes' => $validated['duration_minutes'] ?? 60,
            'cost'             => $validated['cost'],
            'meeting_type'     => $validated['meeting_type'],
            'is_active'        => $validated['is_active'] ?? true,
            'valid_from'       => $validated['valid_from'] ?? null,
            'valid_until'      => $validated['valid_until'] ?? null,
        ]);

        return $this->created('Availability slot created successfully.', [
            'slot' => $this->formatSlot($slot),
        ]);
    }

        public function show(Request $request, TutorAvailability $slot): JsonResponse
    {
        if (! $this->ownsSlot($slot, $request->user()->id)) {
            return $this->forbidden('You do not have permission to view this slot.');
        }

        return $this->ok('Availability slot retrieved successfully.', [
            'slot' => $this->formatSlot($slot),
        ]);
    }

        public function update(Request $request, TutorAvailability $slot): JsonResponse
    {
        if (! $this->ownsSlot($slot, $request->user()->id)) {
            return $this->forbidden('You do not have permission to update this slot.');
        }

        $validated = $request->validate([
            'day_of_week'      => ['sometimes', Rule::in(TutorAvailability::DAYS)],
            'start_time'       => ['sometimes', 'date_format:H:i'],
            'end_time'         => ['sometimes', 'date_format:H:i', 'after:start_time'],
            'duration_minutes' => ['sometimes', 'integer', 'min:15', 'max:480'],
            'cost'             => ['sometimes', 'numeric', 'min:0', 'max:999999.99'],
            'meeting_type'     => ['sometimes', Rule::in([TutorAvailability::MEETING_ONLINE, TutorAvailability::MEETING_IN_PERSON, TutorAvailability::MEETING_BOTH])],
            'is_active'        => ['sometimes', 'boolean'],
            'valid_from'       => ['sometimes', 'nullable', 'date'],
            'valid_until'      => ['sometimes', 'nullable', 'date', 'after:valid_from'],
        ]);

        $slot->update($validated);

        return $this->ok('Availability slot updated successfully.', [
            'slot' => $this->formatSlot($slot->fresh()),
        ]);
    }

        public function destroy(Request $request, TutorAvailability $slot): JsonResponse
    {
        if (! $this->ownsSlot($slot, $request->user()->id)) {
            return $this->forbidden('You do not have permission to delete this slot.');
        }

        $futureBookings = $slot->bookings()
            ->whereDate('session_date', '>=', now()->toDateString())
            ->whereIn('status', ['pending', 'confirmed'])
            ->count();

        if ($futureBookings > 0) {
            return $this->unprocessable(
                "Cannot delete this slot — it has {$futureBookings} upcoming booking(s). " .
                'Cancel those bookings before deleting the slot.'
            );
        }

        $slot->delete();

        return $this->ok('Availability slot deleted successfully.');
    }

        public function bulkSync(Request $request): JsonResponse
    {
        if (! $request->user()->isTutor()) {
            return $this->forbidden('Only tutor accounts can manage availability.');
        }

        $validated = $request->validate([
            'slots'                    => ['present', 'array'],
            'slots.*.day_of_week'      => ['required', Rule::in(TutorAvailability::DAYS)],
            'slots.*.start_time'       => ['required', 'date_format:H:i'],
            'slots.*.end_time'         => ['required', 'date_format:H:i', 'after:slots.*.start_time'],
        ]);

        $tutorId = $request->user()->id;
        $profile = $request->user()->tutorProfile;
        $defaultCost = $profile ? $profile->hourly_rate : 0;
        $defaultMethod = $profile ? $profile->teaching_method : 'online';

        $submittedDays = collect($validated['slots'])->pluck('day_of_week')->toArray();

        TutorAvailability::where('tutor_id', $tutorId)
            ->whereNotIn('day_of_week', $submittedDays)
            ->delete();

        foreach ($validated['slots'] as $slotData) {
            TutorAvailability::updateOrCreate(
                [
                    'tutor_id' => $tutorId,
                    'day_of_week' => $slotData['day_of_week'],
                ],
                [
                    'start_time' => $slotData['start_time'],
                    'end_time' => $slotData['end_time'],
                    'duration_minutes' => 60,
                    'cost' => $defaultCost,
                    'meeting_type' => $defaultMethod,
                    'is_active' => true,
                ]
            );
        }

        return $this->ok('Availability schedule synced successfully.');
    }

        private function ownsSlot(TutorAvailability $slot, int $userId): bool
    {
        return $slot->tutor_id === $userId;
    }

        private function formatSlot(TutorAvailability $slot): array
    {
        return [
            'id'               => $slot->id,
            'tutor_id'         => $slot->tutor_id,
            'day_of_week'      => $slot->day_of_week,
            'start_time'       => $slot->start_time,
            'end_time'         => $slot->end_time,
            'duration_minutes' => $slot->duration_minutes,
            'cost'             => $slot->cost,
            'meeting_type'     => $slot->meeting_type,
            'is_active'        => $slot->is_active,
            'valid_from'       => $slot->valid_from?->toDateString(),
            'valid_until'      => $slot->valid_until?->toDateString(),
            'created_at'       => $slot->created_at->toISOString(),
            'updated_at'       => $slot->updated_at->toISOString(),
        ];
    }
}
