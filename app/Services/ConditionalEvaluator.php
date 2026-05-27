<?php

namespace App\Services;

use App\Models\FormField;

class ConditionalEvaluator
{
    /**
     * Tentukan apakah field $child harus ditampilkan berdasarkan nilai parent.
     *
     * show_when format: { "operator": "equals|not_equals|in|not_in|truthy|falsy", "value": ... }
     */
    public function shouldShow(FormField $child, mixed $parentValue): bool
    {
        $showWhen = $child->show_when;

        if (empty($showWhen)) {
            return true; // Tidak ada kondisi, selalu tampil
        }

        $operator = $showWhen['operator'] ?? 'equals';
        $expected = $showWhen['value'] ?? null;

        return match ($operator) {
            'equals'     => $parentValue == $expected,
            'not_equals' => $parentValue != $expected,
            'in'         => is_array($expected) && in_array($parentValue, $expected, false),
            'not_in'     => is_array($expected) && !in_array($parentValue, $expected, false),
            'truthy'     => filter_var($parentValue, FILTER_VALIDATE_BOOLEAN),
            'falsy'      => !filter_var($parentValue, FILTER_VALIDATE_BOOLEAN),
            'gte'        => is_numeric($parentValue) && (float) $parentValue >= (float) $expected,
            'lte'        => is_numeric($parentValue) && (float) $parentValue <= (float) $expected,
            'gt'         => is_numeric($parentValue) && (float) $parentValue > (float) $expected,
            'lt'         => is_numeric($parentValue) && (float) $parentValue < (float) $expected,
            default      => true,
        };
    }
}
