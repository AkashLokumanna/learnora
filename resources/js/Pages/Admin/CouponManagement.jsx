import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';

export default function CouponManagement() {
    const { user } = useAuth();
    const [coupons, setCoupons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('list');
    const [form, setForm] = useState({
        code: '',
        type: 'percentage',
        value: '',
        expires_at: '',
    });
    const [formError, setFormError] = useState('');

    const fetchCoupons = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get('/api/v1/admin/coupons');
            setCoupons(res.data?.data?.coupons ?? []);
        } catch (error) {
            console.error('Failed to fetch coupons', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchCoupons();
        }
    }, [user]);

    const createCoupon = async (e) => {
        e.preventDefault();
        setFormError('');
        try {
            await axios.post('/api/v1/admin/coupons', {
                ...form,
                value: Number(form.value),
                expires_at: form.expires_at || null,
            });
            setForm({ code: '', type: 'percentage', value: '', expires_at: '' });
            setActiveTab('list');
            fetchCoupons();
        } catch (error) {
            setFormError(error.response?.data?.message || 'Failed to create coupon.');
        }
    };

    const toggleCoupon = async (couponId) => {
        try {
            await axios.patch(`/api/v1/admin/coupons/${couponId}/toggle`);
            fetchCoupons();
        } catch (error) {
            console.error('Failed to toggle coupon', error);
        }
    };

    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;

    return (
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900">Coupon Management</h1>
            <p className="mt-1 text-sm text-gray-600">Create and manage checkout discount coupons.</p>

            <div className="mt-6 rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('list')}
                        className={`rounded-md px-4 py-2 text-sm font-medium ${
                            activeTab === 'list' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        Coupons
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('create')}
                        className={`rounded-md px-4 py-2 text-sm font-medium ${
                            activeTab === 'create' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        Create Coupon
                    </button>
                </div>
            </div>

            {activeTab === 'list' && (
                <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                    {isLoading ? (
                        <div className="p-6 text-sm text-gray-500">Loading coupons...</div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Code</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Value</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Expiry</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {coupons.map((coupon) => (
                                    <tr key={coupon.id}>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{coupon.code}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{coupon.type}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{coupon.value}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{coupon.expires_at ? new Date(coupon.expires_at).toLocaleString() : 'No expiry'}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`rounded-full px-2 py-1 text-xs font-medium ${coupon.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {coupon.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <button
                                                type="button"
                                                onClick={() => toggleCoupon(coupon.id)}
                                                className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                                Toggle
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {activeTab === 'create' && (
                <form onSubmit={createCoupon} className="mt-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900">Create New Coupon</h2>
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Code</label>
                            <input
                                type="text"
                                value={form.code}
                                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Type</label>
                            <select
                                value={form.type}
                                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            >
                                <option value="percentage">Percentage</option>
                                <option value="fixed">Fixed</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Value</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.value}
                                onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value }))}
                                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Expiry</label>
                            <input
                                type="datetime-local"
                                value={form.expires_at}
                                onChange={(e) => setForm((prev) => ({ ...prev, expires_at: e.target.value }))}
                                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                    {formError && <p className="mt-3 text-sm text-red-600">{formError}</p>}
                    <button
                        type="submit"
                        className="mt-5 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        Save Coupon
                    </button>
                </form>
            )}
        </main>
    );
}
