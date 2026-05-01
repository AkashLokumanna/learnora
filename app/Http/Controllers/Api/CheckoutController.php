<?php

namespace App\Http\Controllers\Api;

use App\Models\Booking;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class CheckoutController extends ApiController
{
        public function applyCoupon(Request $request): JsonResponse
    {
        if (! $request->user()->isStudent()) {
            return $this->forbidden('Only student accounts can apply coupons.');
        }

        $validated = $request->validate([
            'booking_id' => ['required', 'integer', 'exists:bookings,id'],
            'coupon_code' => ['required', 'string', 'max:50'],
        ]);

        $booking = Booking::findOrFail($validated['booking_id']);

        if ($booking->student_id !== $request->user()->id) {
            return $this->forbidden('You can only apply coupons to your own bookings.');
        }

        if ($booking->payment_status !== Booking::PAYMENT_UNPAID) {
            return $this->unprocessable('Coupon can only be applied to unpaid bookings.');
        }

        $coupon = Coupon::query()
            ->where('code', strtoupper(trim($validated['coupon_code'])))
            ->where('is_active', true)
            ->first();

        if (! $coupon) {
            return $this->unprocessable('Invalid or inactive coupon code.');
        }

        if ($coupon->expires_at && Carbon::parse($coupon->expires_at)->isPast()) {
            return $this->unprocessable('This coupon has expired.');
        }

        $baseAmount = (float) $booking->amount;
        $discount = $coupon->type === 'percentage'
            ? round(($baseAmount * (float) $coupon->value) / 100, 2)
            : min((float) $coupon->value, $baseAmount);
        $netAmount = max($baseAmount - $discount, 0);

        $booking->update([
            'coupon_id' => $coupon->id,
            'discount_amount' => $discount,
        ]);

        return $this->ok('Coupon applied successfully.', [
            'booking_id' => $booking->id,
            'coupon' => [
                'id' => $coupon->id,
                'code' => $coupon->code,
                'type' => $coupon->type,
                'value' => $coupon->value,
            ],
            'pricing' => [
                'base_amount' => number_format($baseAmount, 2, '.', ''),
                'discount_amount' => number_format($discount, 2, '.', ''),
                'total_amount' => number_format($netAmount, 2, '.', ''),
            ],
        ]);
    }
}
