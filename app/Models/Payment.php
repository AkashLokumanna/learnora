<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    const STATUS_PENDING  = 'pending';
    const STATUS_SUCCESS  = 'success';
    const STATUS_FAILED   = 'failed';
    const STATUS_REFUNDED = 'refunded';

    const GATEWAY_PAYHERE = 'payhere';
    const GATEWAY_STRIPE  = 'stripe';   

        protected $fillable = [
        'booking_id',
        'user_id',
        'amount',
        'currency',
        'gateway',
        'gateway_order_id',
        'gateway_transaction_id',
        'gateway_status',
        'gateway_response',
        'status',
        'paid_at',
    ];

        protected function casts(): array
    {
        return [
            'amount'           => 'decimal:2',
            'gateway_response' => 'array',     
            'paid_at'          => 'datetime',
        ];
    }

        public function isSuccessful(): bool
    {
        return $this->status === self::STATUS_SUCCESS;
    }

        public function isRefunded(): bool
    {
        return $this->status === self::STATUS_REFUNDED;
    }

        public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

        public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
