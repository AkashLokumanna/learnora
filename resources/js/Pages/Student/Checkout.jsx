import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';

export default function Checkout() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPayingId, setIsPayingId] = useState(null);
    const [couponInputs, setCouponInputs] = useState({});
    const [couponMessages, setCouponMessages] = useState({});
    const [couponErrors, setCouponErrors] = useState({});

    useEffect(() => {
        const fetchPendingBookings = async () => {
            setIsLoading(true);
            try {
                const res = await axios.get('/api/v1/bookings');
                const allBookings = res.data?.data?.bookings ?? [];
                const pending = allBookings.filter(
                    (booking) => booking.status === 'pending' || booking.payment_status === 'unpaid'
                );
                setBookings(pending);
            } catch (error) {
                console.error('Failed to load checkout bookings', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user?.role === 'student') {
            fetchPendingBookings();
        }
    }, [user]);

    const setCouponInput = (bookingId, value) =>
        setCouponInputs((prev) => ({ ...prev, [bookingId]: value }));

    const applyCoupon = async (bookingId) => {
        const code = (couponInputs[bookingId] || '').trim();
        if (!code) {
            setCouponErrors((prev) => ({ ...prev, [bookingId]: 'Please enter a coupon code.' }));
            setCouponMessages((prev) => ({ ...prev, [bookingId]: '' }));
            return;
        }

        try {
            const res = await axios.post('/api/v1/checkout/apply-coupon', {
                booking_id: bookingId,
                coupon_code: code,
            });

            const pricing = res.data?.data?.pricing;
            const coupon = res.data?.data?.coupon;
            setBookings((prev) =>
                prev.map((booking) =>
                    booking.id === bookingId
                        ? {
                              ...booking,
                              discount_amount: Number(pricing?.discount_amount || booking.discount_amount || 0),
                              coupon: coupon || booking.coupon,
                              coupon_id: coupon?.id ?? booking.coupon_id,
                          }
                        : booking
                )
            );
            setCouponMessages((prev) => ({
                ...prev,
                [bookingId]: `Coupon "${coupon?.code ?? code.toUpperCase()}" applied successfully.`,
            }));
            setCouponErrors((prev) => ({ ...prev, [bookingId]: '' }));
            setCouponInput(bookingId, '');
        } catch (error) {
            setCouponErrors((prev) => ({
                ...prev,
                [bookingId]: error.response?.data?.message || 'Failed to apply coupon.',
            }));
            setCouponMessages((prev) => ({ ...prev, [bookingId]: '' }));
        }
    };

    const handlePayment = async (bookingId) => {
        setIsPayingId(bookingId);
        try {
            const res = await axios.post('/api/v1/payments/initiate', { booking_id: bookingId });
            const data = res.data?.data ?? {};

            if (data.auto_paid) {
                window.alert(`Booking confirmed — no payment required (Order ${data.order_id}).`);
                window.location.href = '/student/dashboard';
                return;
            }

            const checkoutParams = data.checkout_params;

            if (!window.payhere) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://www.payhere.lk/lib/payhere.js';
                    script.async = true;
                    script.onload = resolve;
                    script.onerror = reject;
                    document.body.appendChild(script);
                });
            }

            window.payhere.onCompleted = function onCompleted(orderId) {
                window.alert(`Payment successful! Order ID: ${orderId}`);
                window.location.href = '/student/dashboard';
            };

            window.payhere.onDismissed = function onDismissed() {
                console.log('Payment dismissed');
            };

            window.payhere.onError = function onError(error) {
                console.error('Payment error:', error);
                window.alert('Payment encountered an error. Please try again.');
            };

            window.payhere.startPayment(checkoutParams);
        } catch (error) {
            console.error('Payment initiation failed:', error);
            window.alert(error.response?.data?.message || 'Failed to initiate payment.');
        } finally {
            setIsPayingId(null);
        }
    };

    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'student') return <Navigate to="/dashboard" replace />;

    return (
        <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
            <p className="mt-1 text-sm text-gray-600">
                Review your pending sessions and complete payment for each booking.
            </p>

            {isLoading ? (
                <div className="mt-6 rounded-lg bg-white p-6 text-gray-500 shadow">Loading checkout data...</div>
            ) : bookings.length === 0 ? (
                <div className="mt-6 rounded-lg bg-white p-6 text-gray-500 shadow">
                    No unpaid or pending bookings found.
                </div>
            ) : (
                <div className="mt-6 space-y-6">
                    {bookings.map((booking) => {
                        const baseAmount = Number(booking.amount || 0);
                        const discountAmount = Number(booking.discount_amount || 0);
                        const totalAmount = Math.max(baseAmount - discountAmount, 0);
                        const appliedCoupon = booking.coupon;
                        const hasCoupon = Boolean(appliedCoupon || booking.coupon_id || discountAmount > 0);

                        return (
                            <div
                                key={booking.id}
                                className="grid grid-cols-1 gap-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm lg:grid-cols-3"
                            >
                                <section className="space-y-5 lg:col-span-2">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">Booking #{booking.id}</h2>
                                        <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-gray-700 sm:grid-cols-2">
                                            <p><span className="font-medium">Subject:</span> {booking.subject?.name}</p>
                                            <p><span className="font-medium">Tutor:</span> {booking.tutor?.name}</p>
                                            <p><span className="font-medium">Date:</span> {booking.session_date}</p>
                                            <p>
                                                <span className="font-medium">Time:</span>{' '}
                                                {booking.time_from?.substring(0, 5)} - {booking.time_to?.substring(0, 5)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-100 pt-4">
                                        <h3 className="text-sm font-semibold text-gray-900">Apply Coupon</h3>

                                        {hasCoupon && (
                                            <div className="mt-3 flex items-start justify-between gap-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                                                <div>
                                                    <span className="font-medium">
                                                        {appliedCoupon?.code ? `Coupon "${appliedCoupon.code}" applied` : 'Coupon applied'}
                                                    </span>
                                                    {appliedCoupon?.type && (
                                                        <span className="ml-1 text-green-700">
                                                            ({appliedCoupon.type === 'percentage'
                                                                ? `${Number(appliedCoupon.value)}% off`
                                                                : `LKR ${Number(appliedCoupon.value).toFixed(2)} off`})
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs font-medium text-green-700">
                                                    -LKR {discountAmount.toFixed(2)}
                                                </span>
                                            </div>
                                        )}

                                        {!hasCoupon && (
                                            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                                                <input
                                                    type="text"
                                                    value={couponInputs[booking.id] || ''}
                                                    onChange={(e) => setCouponInput(booking.id, e.target.value)}
                                                    placeholder="Enter coupon code"
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => applyCoupon(booking.id)}
                                                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                                >
                                                    Apply
                                                </button>
                                            </div>
                                        )}
                                        {couponMessages[booking.id] && (
                                            <p className="mt-2 text-sm text-green-600">{couponMessages[booking.id]}</p>
                                        )}
                                        {couponErrors[booking.id] && (
                                            <p className="mt-2 text-sm text-red-600">{couponErrors[booking.id]}</p>
                                        )}
                                    </div>
                                </section>

                                <aside className="rounded-md bg-gray-50 p-4">
                                    <h3 className="text-sm font-semibold text-gray-900">Payment Summary</h3>
                                    <div className="mt-3 space-y-2 text-sm text-gray-700">
                                        <div className="flex items-center justify-between">
                                            <span>Base Price</span>
                                            <span>LKR {baseAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-green-700">
                                            <span>Discount</span>
                                            <span>- LKR {discountAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="mt-2 border-t border-gray-200 pt-3">
                                            <div className="flex items-center justify-between text-base font-semibold text-gray-900">
                                                <span>Total</span>
                                                <span>LKR {totalAmount.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handlePayment(booking.id)}
                                        disabled={isPayingId === booking.id}
                                        className="mt-5 w-full rounded-md bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-green-400"
                                    >
                                        {isPayingId === booking.id
                                            ? 'Processing...'
                                            : totalAmount <= 0
                                            ? 'Confirm Booking (Free)'
                                            : 'Pay with PayHere'}
                                    </button>
                                </aside>
                            </div>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
