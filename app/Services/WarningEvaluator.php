<?php

namespace App\Services;

use App\Models\FormField;
use Carbon\Carbon;

/**
 * Evaluates warning_rules JSON against a submitted value.
 *
 * Supported rule shapes (semua optional, bisa digabung):
 *   { "warning_below": <number> }                       → numeric < threshold
 *   { "warning_above": <number> }                       → numeric > threshold
 *   { "warning_if_value": <bool|string> }               → exact match
 *   { "warning_if_value_in": [<value>, ...] }           → value in array
 *   { "warning_if_value_not_in": [<value>, ...] }       → value not in array
 *   { "warning_if_empty": true }                        → empty/null
 *   { "warning_if_past_due": true }                     → date < today
 *   { "warning_message": "<string>" }                   → custom message
 */
class WarningEvaluator
{
    /**
     * @param mixed $value The submitted value (already type-cast by FieldType valueColumn).
     * @return array{has_warning: bool, message: ?string}
     */
    public function evaluate(FormField $field, mixed $value): array
    {
        $rules = $field->warning_rules ?? [];
        if (empty($rules)) {
            return ['has_warning' => false, 'message' => null];
        }

        $triggered = false;
        $reasons = [];

        // 1) Numeric thresholds
        if (isset($rules['warning_below']) && is_numeric($value)) {
            if ((float) $value < (float) $rules['warning_below']) {
                $triggered = true;
                $reasons[] = "Nilai di bawah batas minimum ({$rules['warning_below']})";
            }
        }

        if (isset($rules['warning_above']) && is_numeric($value)) {
            if ((float) $value > (float) $rules['warning_above']) {
                $triggered = true;
                $reasons[] = "Nilai di atas batas maksimum ({$rules['warning_above']})";
            }
        }

        // 2) Exact-match
        if (array_key_exists('warning_if_value', $rules)) {
            if ($this->valuesEqual($value, $rules['warning_if_value'])) {
                $triggered = true;
                $reasons[] = 'Nilai memicu peringatan';
            }
        }

        // 3) Value in set
        if (isset($rules['warning_if_value_in']) && is_array($rules['warning_if_value_in'])) {
            if ($this->valueInSet($value, $rules['warning_if_value_in'])) {
                $triggered = true;
                $reasons[] = 'Pilihan memicu peringatan';
            }
        }

        if (isset($rules['warning_if_value_not_in']) && is_array($rules['warning_if_value_not_in'])) {
            if (! $this->valueInSet($value, $rules['warning_if_value_not_in'])) {
                $triggered = true;
                $reasons[] = 'Nilai tidak termasuk dalam pilihan yang diharapkan';
            }
        }

        // 4) Empty
        if (! empty($rules['warning_if_empty']) && $this->isEmpty($value)) {
            $triggered = true;
            $reasons[] = 'Wajib diisi';
        }

        // 5) Date past due
        if (! empty($rules['warning_if_past_due']) && $value) {
            try {
                $d = $value instanceof Carbon ? $value : Carbon::parse((string) $value);
                if ($d->isPast()) {
                    $triggered = true;
                    $reasons[] = 'Tanggal sudah lewat dari hari ini';
                }
            } catch (\Throwable $e) {
                // ignore parse failure
            }
        }

        if (! $triggered) {
            return ['has_warning' => false, 'message' => null];
        }

        $message = $rules['warning_message'] ?? implode('; ', $reasons);
        return ['has_warning' => true, 'message' => $message];
    }

    private function valuesEqual(mixed $a, mixed $b): bool
    {
        if (is_bool($b) || is_bool($a)) {
            return (bool) $a === (bool) $b;
        }
        return (string) $a === (string) $b;
    }

    private function valueInSet(mixed $value, array $set): bool
    {
        $stringSet = array_map(fn ($v) => is_bool($v) ? ($v ? 'true' : 'false') : (string) $v, $set);
        $needle = is_bool($value) ? ($value ? 'true' : 'false') : (string) $value;
        return in_array($needle, $stringSet, true);
    }

    private function isEmpty(mixed $value): bool
    {
        if ($value === null || $value === '' || $value === []) {
            return true;
        }
        return false;
    }
}
