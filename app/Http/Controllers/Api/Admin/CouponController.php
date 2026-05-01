<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CouponController extends ApiController
{
        public function index(): JsonResponse
    {
        $coupons = Coupon::query()
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Coupon $coupon) => $this->formatCoupon($coupon));

        return $this->ok('Coupons retrieved successfully.', [
            'coupons' => $coupons,
        ]);
    }

        public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:coupons,code'],
            'type' => ['required', Rule::in(['fixed', 'percentage'])],
            'value' => ['required', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'expires_at' => ['nullable', 'date'],
        ]);

        $coupon = Coupon::create([
            'created_by' => $request->user()->id,
            'code' => strtoupper(trim($validated['code'])),
            'type' => $validated['type'],
            'value' => $validated['value'],
            'is_active' => $validated['is_active'] ?? true,
            'expires_at' => $validated['expires_at'] ?? null,
        ]);

        return $this->created('Coupon created successfully.', [
            'coupon' => $this->formatCoupon($coupon),
        ]);
    }

        public function update(Request $request, Coupon $coupon): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['sometimes', 'required', 'string', 'max:50', Rule::unique('coupons', 'code')->ignore($coupon->id)],
            'type' => ['sometimes', 'required', Rule::in(['fixed', 'percentage'])],
            'value' => ['sometimes', 'required', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'required', 'boolean'],
            'expires_at' => ['nullable', 'date'],
        ]);

        if (isset($validated['code'])) {
            $validated['code'] = strtoupper(trim($validated['code']));
        }

        $coupon->update($validated);

        return $this->ok('Coupon updated successfully.', [
            'coupon' => $this->formatCoupon($coupon->fresh()),
        ]);
    }

        public function toggle(Coupon $coupon): JsonResponse
    {
        $coupon->update([
            'is_active' => ! $coupon->is_active,
        ]);

        return $this->ok('Coupon status updated successfully.', [
            'coupon' => $this->formatCoupon($coupon->fresh()),
        ]);
    }

        private function formatCoupon(Coupon $coupon): array
    {
        return [
            'id' => $coupon->id,
            'code' => $coupon->code,
            'type' => $coupon->type,
            'value' => $coupon->value,
            'is_active' => $coupon->is_active,
            'expires_at' => $coupon->expires_at?->toISOString(),
            'created_at' => $coupon->created_at?->toISOString(),
        ];
    }
}
