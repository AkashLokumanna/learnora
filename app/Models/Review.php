<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'student_id',
        'tutor_id',
        'rating',
        'comment',
    ];

        public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

        public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

        public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }
}
