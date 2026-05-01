<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    const ROLE_STUDENT = 'student';
    const ROLE_TUTOR   = 'tutor';
    const ROLE_ADMIN   = 'admin';

    const STATUS_ACTIVE    = 'active';
    const STATUS_PENDING   = 'pending';
    const STATUS_SUSPENDED = 'suspended';

        protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'status',
        'avatar',
        'phone',
        'bio',
    ];

        protected $hidden = [
        'password',
        'remember_token',
    ];

        protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

        public function isTutor(): bool
    {
        return $this->role === self::ROLE_TUTOR;
    }

        public function isStudent(): bool
    {
        return $this->role === self::ROLE_STUDENT;
    }

        public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

        public function tutorProfile(): HasOne
    {
        return $this->hasOne(TutorProfile::class);
    }

        public function bookingsAsStudent(): HasMany
    {
        return $this->hasMany(Booking::class, 'student_id');
    }

        public function bookingsAsTutor(): HasMany
    {
        return $this->hasMany(Booking::class, 'tutor_id');
    }

        public function appNotifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }
}
