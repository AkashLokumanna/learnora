<?php

namespace App\Http\Controllers\Api;

use App\Models\Booking;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Notifications\PaymentReceiptNotification;

class PaymentController extends ApiController
{

        public function initiate(Request $request): JsonResponse
    {
        if (! $request->user()->isStudent()) {
            return $this->forbidden('Only student accounts can initiate payments.');
        }

        $validated = $request->validate([
            'booking_id' => ['required', 'integer', 'exists:bookings,id'],
        ]);

                $booking = Booking::with(['subject', 'availability'])->findOrFail($validated['booking_id']);

        if ($booking->student_id !== $request->user()->id) {
            return $this->forbidden('You can only initiate payment for your own bookings.');
        }

        if (! in_array($booking->status, [Booking::STATUS_PENDING, Booking::STATUS_CONFIRMED])) {
            return $this->unprocessable(
                "Payment cannot be initiated for a booking with status '{$booking->status}'."
            );
        }

        if ($booking->payment_status === Booking::PAYMENT_PAID) {
            return $this->unprocessable('This booking has already been paid for.');
        }

        $netAmount = number_format(
            (float) $booking->amount - (float) $booking->discount_amount,
            2, '.', ''          // e.g. "2500.00" — PayHere requires 2dp, no thousands separator
        );

        $merchantId     = config('services.payhere.merchant_id');
        $merchantSecret = config('services.payhere.merchant_secret');
        $currency       = 'LKR';
        $orderId        = 'LRN-' . $booking->id;

        $hash = strtoupper(
            md5(
                $merchantId .
                $orderId .
                $netAmount .
                $currency .
                strtoupper(md5($merchantSecret))
            )
        );

        $payment = Payment::updateOrCreate(
            ['booking_id' => $booking->id],
            [
                'user_id'          => $request->user()->id,
                'amount'           => $netAmount,
                'currency'         => $currency,
                'gateway'          => Payment::GATEWAY_PAYHERE,
                'gateway_order_id' => $orderId,
                'status'           => Payment::STATUS_PENDING,
                'paid_at'          => null,  
            ]
        );

        $student   = $request->user();
        $nameParts = explode(' ', trim($student->name), 2);
        $firstName = $nameParts[0];
        $lastName  = $nameParts[1] ?? '-';

        $isSandbox   = config('services.payhere.sandbox', true);
        $checkoutUrl = $isSandbox
            ? 'https://sandbox.payhere.lk/pay/checkout'
            : 'https://www.payhere.lk/pay/checkout';

        $frontendUrl = rtrim(config('services.payhere.frontend_url', config('app.url')), '/');

        return $this->ok('Payment session created. Submit checkout_params to PayHere.', [
            'payment_id'      => $payment->id,
            'order_id'        => $orderId,
            'net_amount'      => $netAmount,
            'currency'        => $currency,
            'checkout_url'    => $checkoutUrl,
            
            'checkout_params' => [
                'merchant_id' => $merchantId,
                'return_url'  => $frontendUrl . '/bookings/' . $booking->id . '?payment=success',
                'cancel_url'  => $frontendUrl . '/bookings/' . $booking->id . '?payment=cancelled',
                'notify_url'  => url('api/v1/payments/webhook'),
                'order_id'    => $orderId,
                'items'       => ($booking->subject?->name ?? 'Tutoring') . ' session — ' . $booking->session_date?->toDateString(),
                'currency'    => $currency,
                'amount'      => $netAmount,
                'first_name'  => $firstName,
                'last_name'   => $lastName,
                'email'       => $student->email,
                'phone'       => $student->phone ?? '0000000000',
                'address'     => 'N/A',
                'city'        => 'Colombo',
                'country'     => 'Sri Lanka',
                'hash'        => $hash,
            ],
        ]);
    }

        public function webhook(Request $request): JsonResponse
    {
        
        Log::info('[PayHere IPN] Received', ['payload' => $request->all()]);

        $merchantId      = $request->input('merchant_id');
        $orderId         = $request->input('order_id');
        $payhereAmount   = $request->input('payhere_amount');
        $payhereCurrency = $request->input('payhere_currency');
        $statusCode      = (int) $request->input('status_code');
        $md5sig          = strtoupper($request->input('md5sig', ''));

        // -- 1. Verify MD5 signature ----------------------------------------
        $merchantSecret = config('services.payhere.merchant_secret');

        $expectedSig = strtoupper(
            md5(
                $merchantId .
                $orderId .
                $payhereAmount .
                $payhereCurrency .
                $statusCode .
                strtoupper(md5($merchantSecret))
            )
        );

        if ($expectedSig !== $md5sig) {
            Log::warning('[PayHere IPN] Invalid MD5 signature', ['order_id' => $orderId, 'received' => $md5sig, 'expected' => $expectedSig]);
            return $this->badRequest('Invalid payment signature.');
        }

        $payment = Payment::where('gateway_order_id', $orderId)->first();

        if (! $payment) {
            Log::error('[PayHere IPN] Payment record not found', ['order_id' => $orderId]);
            
            return $this->ok('Order not found — acknowledged.');
        }

        if ($payment->status === Payment::STATUS_SUCCESS) {
            Log::info('[PayHere IPN] Duplicate IPN for already-successful payment', ['order_id' => $orderId]);
            return $this->ok('Payment already processed.');
        }

        $newStatus = match ($statusCode) {
             2       => Payment::STATUS_SUCCESS,
             0       => Payment::STATUS_PENDING,
            -1, -2   => Payment::STATUS_FAILED,
            -3       => Payment::STATUS_REFUNDED,
            default  => Payment::STATUS_FAILED,
        };

        $payment->update([
            'gateway_transaction_id' => $request->input('payment_id'),
            'gateway_status'         => $request->input('status_message'),
            'gateway_response'       => $request->all(),   
            'status'                 => $newStatus,
            'paid_at'                => $newStatus === Payment::STATUS_SUCCESS ? Carbon::now() : null,
        ]);

        Log::info('[PayHere IPN] Payment updated', ['order_id' => $orderId, 'status' => $newStatus]);

        if ($newStatus === Payment::STATUS_SUCCESS) {
            DB::transaction(function () use ($payment): void {

                                $booking = Booking::find($payment->booking_id);

                if (! $booking) {
                    Log::error('[PayHere IPN] Booking not found for successful payment', ['payment_id' => $payment->id]);
                    return;
                }

                $booking->update([
                    'status'         => Booking::STATUS_CONFIRMED,
                    'payment_status' => Booking::PAYMENT_PAID,
                ]);

                Log::info('[PayHere IPN] Booking confirmed', ['booking_id' => $booking->id]);

                if ($booking->coupon_id) {
                    
                    CouponUsage::firstOrCreate(
                        ['coupon_id' => $booking->coupon_id, 'user_id' => $payment->user_id],
                        ['booking_id' => $booking->id]
                    );

                    Coupon::where('id', $booking->coupon_id)->increment('used_count');

                    Log::info('[PayHere IPN] Coupon usage recorded', ['coupon_id' => $booking->coupon_id]);
                }

                if ($booking->student) {
                    $booking->student->notify(new PaymentReceiptNotification($booking));
                }
            });
        }

        return $this->ok('IPN received and processed.');
    }

        public function show(Request $request, Payment $payment): JsonResponse
    {
        $user = $request->user();

        if (! $user->isAdmin() && $payment->user_id !== $user->id) {
            return $this->forbidden('You do not have permission to view this payment.');
        }

        $payment->load('booking:id,status,session_date,time_from,time_to,subject_id');

        return $this->ok('Payment retrieved successfully.', [
            'payment' => $this->formatPayment($payment, detailed: true),
        ]);
    }

        private function formatPayment(Payment $payment, bool $detailed = false): array
    {
        $data = [
            'id'                     => $payment->id,
            'booking_id'             => $payment->booking_id,
            'user_id'                => $payment->user_id,
            'amount'                 => $payment->amount,
            'currency'               => $payment->currency,
            'gateway'                => $payment->gateway,
            'gateway_order_id'       => $payment->gateway_order_id,
            'gateway_transaction_id' => $payment->gateway_transaction_id,
            'gateway_status'         => $payment->gateway_status,
            'status'                 => $payment->status,
            'paid_at'                => $payment->paid_at?->toISOString(),
            'created_at'             => $payment->created_at->toISOString(),
            'updated_at'             => $payment->updated_at->toISOString(),
        ];

        if ($detailed && $payment->relationLoaded('booking') && $payment->booking) {
            $data['booking'] = [
                'id'           => $payment->booking->id,
                'status'       => $payment->booking->status,
                'session_date' => $payment->booking->session_date?->toDateString(),
                'time_from'    => $payment->booking->time_from,
                'time_to'      => $payment->booking->time_to,
            ];
        }

        return $data;
    }
}
