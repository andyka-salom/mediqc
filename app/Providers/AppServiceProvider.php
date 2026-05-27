<?php

namespace App\Providers;

use App\Services\ConditionalEvaluator;
use App\Services\ScheduleService;
use App\Services\SubmissionService;
use App\Services\WarningEvaluator;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(WarningEvaluator::class);
        $this->app->singleton(ConditionalEvaluator::class);
        $this->app->singleton(SubmissionService::class);
        $this->app->singleton(ScheduleService::class);
    }

    public function boot(): void
    {
        Paginator::useTailwind();
    }
}
