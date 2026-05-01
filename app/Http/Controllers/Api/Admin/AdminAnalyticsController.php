<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class AdminAnalyticsController extends ApiController
{
        public function index(): JsonResponse
    {
        
        $totalTutors = User::where('role', 'tutor')->count();
        $totalStudents = User::where('role', 'student')->count();

        $totalRevenue = Payment::where('status', Payment::STATUS_SUCCESS)->sum('amount');

        $totalBookings = Booking::count();

        $sixMonthsAgo = Carbon::now()->subMonths(5)->startOfMonth();
        
        $bookingsChartData = Booking::where('created_at', '>=', $sixMonthsAgo)
            ->selectRaw('DATE_FORMAT(created_at, "%b %Y") as month_name, MONTH(created_at) as month, YEAR(created_at) as year, COUNT(*) as count')
            ->groupBy('year', 'month', 'month_name')
            ->orderBy('year', 'asc')
            ->orderBy('month', 'asc')
            ->get();

        $chartData = $bookingsChartData->map(function ($data) {
            return [
                'name' => $data->month_name,
                'bookings' => $data->count,
            ];
        });

        $filledChartData = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i)->format('M Y');
            $existing = $chartData->firstWhere('name', $month);
            $filledChartData[] = [
                'name' => $month,
                'bookings' => $existing ? $existing['bookings'] : 0,
            ];
        }

        return $this->ok('Admin Analytics retrieved.', [
            'total_tutors' => $totalTutors,
            'total_students' => $totalStudents,
            'total_revenue' => (float) $totalRevenue,
            'total_bookings' => $totalBookings,
            'chart_data' => $filledChartData,
        ]);
    }
}
