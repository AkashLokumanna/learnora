<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Subject extends Model
{
    use HasFactory;

        protected $fillable = [
        'name',
        'slug',
        'icon',
        'color',
        'is_active',
    ];

        protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

        public function tutorProfiles(): BelongsToMany
    {
        return $this->belongsToMany(
            TutorProfile::class,
            'tutor_subjects',         
            'subject_id',             
            'tutor_profile_id'        
        );
    }

        public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
