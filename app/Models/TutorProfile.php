<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TutorProfile extends Model
{
    use HasFactory;

    const METHOD_ONLINE    = 'online';
    const METHOD_IN_PERSON = 'in_person';
    const METHOD_BOTH      = 'both';

    const AVAIL_AVAILABLE = 'available';
    const AVAIL_BUSY      = 'busy';
    const AVAIL_PAUSED    = 'paused';

        protected $fillable = [
        'user_id',
        'headline',
        'about',
        'hourly_rate',
        'experience_years',
        'certifications',
        'languages',
        'teaching_method',
        'availability_status',
        'avg_rating',
        'total_reviews',
        'is_verified',
    ];

        protected function casts(): array
    {
        return [
            'certifications'      => 'array',   
            'languages'           => 'array',   
            'hourly_rate'         => 'decimal:2',
            'avg_rating'          => 'float',
            'experience_years'    => 'integer',
            'total_reviews'       => 'integer',
            'is_verified'         => 'boolean',
        ];
    }

        public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

        public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(
            Subject::class,
            'tutor_subjects',         
            'tutor_profile_id',       
            'subject_id'              
        );
    }

        public function availabilities(): HasMany
    {
        return $this->hasMany(TutorAvailability::class);
    }

        public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'tutor_id', 'user_id');
    }
}
