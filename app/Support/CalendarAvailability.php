<?php

namespace App\Support;

use App\Models\Event;
use App\Models\Setting;
use Carbon\Carbon;

class CalendarAvailability
{
    public static function busyEvents(): array
    {
        return Event::query()
            ->whereIn('status', ['confirmed', 'paid', 'blocked'])
            ->orderBy('start')
            ->get()
            ->map(fn (Event $event) => [
                'id' => $event->id,
                'start' => optional($event->start)?->toIso8601String(),
                'end' => optional($event->end)?->toIso8601String(),
                'status' => $event->status,
                'type' => $event->type,
                'title' => $event->title,
            ])
            ->values()
            ->all();
    }

    public static function settings(): array
    {
        return [
            'enforce_schedule' => filter_var(Setting::get('lead_schedule_blocks_hours', '1'), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? true,
            'parallel_limit' => max(1, (int) Setting::get('lead_parallel_capacity', '1')),
        ];
    }

    public static function businessHours(): array
    {
        return [
            'start' => '09:00',
            'end' => '18:00',
            'slot_minutes' => 60,
        ];
    }

    public static function availableSlotsForDate(string $date): array
    {
        $businessHours = static::businessHours();
        $settings = static::settings();

        [$year, $month, $day] = array_map('intval', explode('-', $date));
        [$startHour, $startMinute] = array_map('intval', explode(':', $businessHours['start']));
        [$endHour, $endMinute] = array_map('intval', explode(':', $businessHours['end']));
        $slotMinutes = (int) ($businessHours['slot_minutes'] ?? 60);

        $startOfDay = Carbon::create($year, $month, $day, 0, 0, 0);
        $endOfDay = (clone $startOfDay)->endOfDay();

        $overlaps = Event::query()
            ->whereIn('status', ['confirmed', 'paid', 'blocked'])
            ->where('start', '<=', $endOfDay)
            ->where('end', '>=', $startOfDay)
            ->orderBy('start')
            ->get();

        $slots = [];
        $cursor = Carbon::create($year, $month, $day, $startHour, $startMinute, 0);
        $closing = Carbon::create($year, $month, $day, $endHour, $endMinute, 0);

        while ($cursor->lt($closing)) {
            $slotStart = $cursor->copy();
            $slotEnd = $cursor->copy()->addMinutes($slotMinutes);

            $overlappingCount = $overlaps->filter(function (Event $event) use ($slotStart, $slotEnd) {
                return $slotStart->lt($event->end) && $slotEnd->gt($event->start);
            })->count();

            $isBusy = $settings['enforce_schedule'] && $overlappingCount >= $settings['parallel_limit'];

            if (!$isBusy && $slotEnd->lte($closing)) {
                $slots[] = $slotStart->format('H:i');
            }

            $cursor->addMinutes($slotMinutes);
        }

        return $slots;
    }
}
