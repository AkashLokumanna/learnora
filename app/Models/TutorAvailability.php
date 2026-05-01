<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TutorAvailability extends Model
{
    use HasFactory;

    const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    const MEETING_ONLINE    = 'online';
    const MEETING_IN_PERSON = 'in_person';
    const MEETING_BOTH      = 'both';

        protected $fillable = [
        'tutor_id',
        'day_of_week',
        'start_time',
        'end_time',
        'duration_minutes',
        'cost',
        'meeting_type',
        'is_active',
        'valid_from',
        'valid_until',
    ];

        protected function casts(): array
    {
        return [
            'start_time'       => 'string',
            'end_time'         => 'string',
            'valid_from'       => 'date:Y-m-d',
            'valid_until'      => 'date:Y-m-d',
            'cost'             => 'decimal:2',
            'duration_minutes' => 'integer',
            'is_active'        => 'boolean',
        ];
    }

        public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }

        public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'availability_id');
    }

        public function exceptions(): HasMany
    {
        return $this->hasMany(AvailabilityException::class, 'availability_id');
    }

        public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
