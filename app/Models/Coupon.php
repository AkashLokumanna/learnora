<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Coupon extends Model
{
    use HasFactory;

    const TYPE_PERCENTAGE = 'percentage';
    const TYPE_FIXED      = 'fixed';

        protected $fillable = [
        'created_by',
        'code',
        'type',
        'value',
        'min_booking_amount',
        'max_uses',
        'used_count',
        'expires_at',
        'is_active',
    ];

        protected function casts(): array
    {
        return [
            'value'              => 'decimal:2',
            'min_booking_amount' => 'decimal:2',
            'max_uses'           => 'integer',
            'used_count'         => 'integer',
            'expires_at'         => 'datetime',
            'is_active'          => 'boolean',
        ];
    }

        public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

        public function usages(): HasMany
    {
        return $this->hasMany(CouponUsage::class);
    }
}
