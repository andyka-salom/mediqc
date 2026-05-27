<?php

namespace App\Http\Controllers;

use App\Models\QcSubmission;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();
        
        $baseQuery = QcSubmission::query();

        // 1. Total Submissions Overview
        $totalSubmissions = (clone $baseQuery)->count();
        $needsActionCount = (clone $baseQuery)->where('overall_status', 'needs_action')->count();
        $submittedCount = (clone $baseQuery)->where('overall_status', 'submitted')->count();

        // 2. Submissions by Type (Harian, Bulanan, Tahunan)
        $submissionsByType = (clone $baseQuery)
            ->selectRaw('qc_type, count(*) as count')
            ->groupBy('qc_type')
            ->pluck('count', 'qc_type')
            ->toArray();

        // Default missing types to 0
        $byType = [
            'harian' => $submissionsByType['harian'] ?? 0,
            'bulanan' => $submissionsByType['bulanan'] ?? 0,
            'tahunan' => $submissionsByType['tahunan'] ?? 0,
        ];

        // 3. Recent Activity (Latest 5 submissions)
        $recentActivity = (clone $baseQuery)
            ->with(['equipmentUnit', 'submitter'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        // 4. Trend Data: Submissions per day for the last 7 days
        $trendData = [];
        $startDate = Carbon::today()->subDays(6);
        
        // Fetch grouped counts
        $groupedByDate = (clone $baseQuery)
            ->whereDate('submission_date', '>=', $startDate)
            ->selectRaw('submission_date, count(*) as count')
            ->groupBy('submission_date')
            ->pluck('count', 'submission_date')
            ->toArray();

        // Fill in missing days
        for ($i = 0; $i < 7; $i++) {
            $dateString = $startDate->copy()->addDays($i)->format('Y-m-d');
            $trendData[] = [
                'date' => $dateString,
                'count' => $groupedByDate[$dateString] ?? 0,
            ];
        }

        return Inertia::render('Dashboard', [
            'stats' => [
                'total' => $totalSubmissions,
                'needs_action' => $needsActionCount,
                'submitted' => $submittedCount,
            ],
            'byType' => $byType,
            'recentActivity' => $recentActivity,
            'trendData' => $trendData,
        ]);
    }
}
