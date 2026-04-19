<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('gallery:cleanup-originals')->daily();
Schedule::command('pulse:check')->everyMinute()->withoutOverlapping();
Schedule::command('pulse:work --stop-when-empty')->everyMinute()->withoutOverlapping();
Schedule::command('gemini:backfill-usage-records')->daily()->withoutOverlapping();

if (filter_var(env('HORIZON_ENABLED', false), FILTER_VALIDATE_BOOL)) {
    Schedule::command('horizon:snapshot')->everyFiveMinutes()->withoutOverlapping();
}
