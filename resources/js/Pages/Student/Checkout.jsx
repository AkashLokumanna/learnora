import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';

export default function Checkout() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPayingId, setIsPayingId] = useState(null);
    const [couponCode, setCouponCode] = useState('');
    const [couponMessage, setCouponMessage] = useState('');
    const [couponError, setCouponError] = useState('');

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

    const selectedBooking = useMemo(() => bookings[0] || null, [bookings]);
    const baseAmount = Number(selectedBooking?.amount || 0);
    const discountAmount = Number(selectedBooking?.discount_amount || 0);
    const totalAmount = Math.max(baseAmount - discountAmount, 0);

    const applyCoupon = async () => {
        if (!selectedBooking) return;
        if (!couponCode.trim()) {
            setCouponError('Please enter a coupon code.');
            setCouponMessage('');
            return;
        }

        try {
            const res = await axios.post('/api/v1/checkout/apply-coupon', {
                booking_id: selectedBooking.id,
                coupon_code: couponCode.trim(),
            });

            const pricing = res.data?.data?.pricing;
            setBookings((prev) =>
                prev.map((booking) =>
                    booking.id === selectedBooking.id
                        ? {
                              ...booking,
                              discount_amount: Number(pricing?.discount_amount || booking.discount_amount || 0),
                          }
                        : booking
                )
            );
            setCouponMessage('Coupon applied successfully.');
            setCouponError('');
        } catch (error) {
            setCouponError(error.response?.data?.message || 'Failed to apply coupon.');
            setCouponMessage('');
        }
    };

    const handlePayment = async (bookingId) => {
        setIsPayingId(bookingId);
        try {
            const res = await axios.post('/api/v1/payments/initiate', { booking_id: bookingId });
            const checkoutParams = res.data.data.checkout_params;

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
            <p className="mt-1 text-sm text-gray-600">Review your pending session and complete secure payment.</p>

            {isLoading ? (
                <div className="mt-6 rounded-lg bg-white p-6 text-gray-500 shadow">Loading checkout data...</div>
            ) : !selectedBooking ? (
                <div className="mt-6 rounded-lg bg-white p-6 text-gray-500 shadow">
                    No unpaid or pending bookings found.
                </div>
            ) : (
                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <section className="space-y-6 lg:col-span-2">
                        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900">Booking Details</h2>
                            <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-700 sm:grid-cols-2">
                                <p><span className="font-medium">Subject:</span> {selectedBooking.subject?.name}</p>
                                <p><span className="font-medium">Tutor:</span> {selectedBooking.tutor?.name}</p>
                                <p><span className="font-medium">Date:</span> {selectedBooking.session_date}</p>
                                <p><span className="font-medium">Time:</span> {selectedBooking.time_from?.substring(0, 5)} - {selectedBooking.time_to?.substring(0, 5)}</p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900">Apply Coupon</h2>
                            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                <input
                                    type="text"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                    placeholder="Enter coupon code"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                />
                                <button
                                    type="button"
                                    onClick={applyCoupon}
                                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                >
                                    Apply
                                </button>
                            </div>
                            {couponMessage && <p className="mt-2 text-sm text-green-600">{couponMessage}</p>}
                            {couponError && <p className="mt-2 text-sm text-red-600">{couponError}</p>}
                        </div>
                    </section>

                    <aside>
                        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900">Payment Summary</h2>
                            <div className="mt-4 space-y-2 text-sm text-gray-700">
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
                                onClick={() => handlePayment(selectedBooking.id)}
                                disabled={isPayingId === selectedBooking.id}
                                className="mt-5 w-full rounded-md bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-green-400"
                            >
                                {isPayingId === selectedBooking.id ? 'Processing...' : 'Pay with PayHere'}
                            </button>
                        </div>
                    </aside>
                </div>
            )}
        </main>
    );
}
