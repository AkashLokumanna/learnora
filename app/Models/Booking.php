<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Booking extends Model
{
    use HasFactory, SoftDeletes;

    const STATUS_PENDING   = 'pending';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_NO_SHOW   = 'no_show';

    const PAYMENT_UNPAID   = 'unpaid';
    const PAYMENT_PAID     = 'paid';
    const PAYMENT_REFUNDED = 'refunded';

    const MEETING_ONLINE    = 'online';
    const MEETING_IN_PERSON = 'in_person';

        protected $fillable = [
        'student_id',
        'tutor_id',
        'availability_id',
        'subject_id',
        'coupon_id',
        'session_date',
        'time_from',
        'time_to',
        'amount',
        'discount_amount',
        'meeting_type',
        'meeting_link',
        'status',
        'payment_status',
        'notes',
    ];

        protected function casts(): array
    {
        return [
            'session_date'    => 'date:Y-m-d',
            'time_from'       => 'string',
            'time_to'         => 'string',
            'amount'          => 'decimal:2',
            'discount_amount' => 'decimal:2',
        ];
    }

        public function isPaid(): bool
    {
        return $this->payment_status === self::PAYMENT_PAID;
    }

        public function isConfirmed(): bool
    {
        return $this->status === self::STATUS_CONFIRMED;
    }

        public function netAmount(): string
    {
        return number_format((float) $this->amount - (float) $this->discount_amount, 2);
    }

        public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

        public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }

        public function availability(): BelongsTo
    {
        return $this->belongsTo(TutorAvailability::class, 'availability_id');
    }

        public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

        public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

        public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }
}
