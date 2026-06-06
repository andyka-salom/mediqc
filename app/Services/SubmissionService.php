<?php

namespace App\Services;

use App\Enums\FieldType;
use App\Enums\SubmissionStatus;
use App\Models\AuditLog;
use App\Models\FormField;
use App\Models\FormTemplate;
use App\Models\QcAnswer;
use App\Models\QcSchedule;
use App\Models\QcSubmission;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SubmissionService
{
    public function __construct(
        protected WarningEvaluator    $warningEvaluator,
        protected ConditionalEvaluator $conditionalEvaluator,
    ) {}

    /**
     * Create a submission with its answers.
     *
     * @param array $payload {
     *   form_template_id: int,
     *   equipment_unit_id: int,
     *   qc_schedule_id: ?int,
     *   qc_type: string,
     *   submission_date: string,
     *   period_label: ?string,
     *   answers: array<int, mixed>  // keyed by form_field_id
     *   catatan_masalah: ?string,
     *   submit: bool   // false = save draft, true = final submit
     * }
     */
    public function submit(User $user, array $payload): QcSubmission
    {
        return DB::transaction(function () use ($user, $payload) {
            $template = FormTemplate::with('fields')->findOrFail($payload['form_template_id']);

            $isFinalSubmit = (bool) ($payload['submit'] ?? false);
            $status        = $isFinalSubmit
                ? SubmissionStatus::SUBMITTED->value
                : SubmissionStatus::DRAFT->value;

            $submission = QcSubmission::create([
                'form_template_id' => $template->id,
                'equipment_unit_id' => $payload['equipment_unit_id'],
                'qc_schedule_id'   => $payload['qc_schedule_id'] ?? null,
                'qc_type'          => $payload['qc_type'],
                'submitted_by'     => $user->id,
                'submission_date'  => $payload['submission_date'],
                'period_label'     => $payload['period_label'] ?? null,
                'overall_status'   => $status,
                'warning_count'    => 0,
                'catatan_masalah'  => $payload['catatan_masalah'] ?? null,
                'is_complete'      => $isFinalSubmit,
                'submitted_at'     => $isFinalSubmit ? now() : null,
            ]);

            $warningCount = $this->saveAnswers($submission, $template->fields, $payload['answers'] ?? []);

            $submission->update([
                'warning_count'  => $warningCount,
                'overall_status' => $this->computeOverallStatus($status, $warningCount),
            ]);



            AuditLog::record($isFinalSubmit ? 'submitted' : 'saved_draft', $submission, [
                'warning_count' => $warningCount,
            ]);

            return $submission->fresh(['answers', 'formTemplate', 'equipmentUnit']);
        });
    }

    /**
     * Update an existing submission.
     */
    public function updateSubmission(QcSubmission $submission, array $payload, User $user): QcSubmission
    {
        return DB::transaction(function () use ($submission, $payload, $user) {
            $template = FormTemplate::with('fields')->findOrFail($submission->form_template_id);

            $isFinalSubmit = (bool) ($payload['submit'] ?? false);
            $status        = $isFinalSubmit
                ? SubmissionStatus::SUBMITTED->value
                : SubmissionStatus::DRAFT->value;

            // Update basic submission data
            $submission->update([
                'overall_status'  => $status,
                'catatan_masalah' => $payload['catatan_masalah'] ?? $submission->catatan_masalah,
                'is_complete'     => $isFinalSubmit,
                'submitted_at'    => $isFinalSubmit && !$submission->submitted_at ? now() : $submission->submitted_at,
            ]);

            // Delete old answers
            $submission->answers()->delete();

            // Re-save new answers
            $warningCount = $this->saveAnswers($submission, $template->fields, $payload['answers'] ?? []);

            $submission->update([
                'warning_count'  => $warningCount,
                'overall_status' => $this->computeOverallStatus($status, $warningCount),
            ]);

            AuditLog::record('updated', $submission, [
                'warning_count' => $warningCount,
                'is_final' => $isFinalSubmit,
            ]);

            return $submission->fresh(['answers', 'formTemplate', 'equipmentUnit']);
        });
    }

    /** @return int jumlah jawaban yang memicu warning */
    protected function saveAnswers(QcSubmission $submission, $fields, array $answers): int
    {
        $warningCount  = 0;
        $valuesByField = $answers; // [field_id => value]

        foreach ($fields as $field) {
            if (! $field->typeEnum()->isAnswerable()) {
                continue; // section_header / info_text — skip
            }

            // Skip conditional children jika parent tidak memicu show_when
            if ($field->parent_field_id) {
                $parentValue = $valuesByField[$field->parent_field_id] ?? null;
                if (! $this->conditionalEvaluator->shouldShow($field, $parentValue)) {
                    continue;
                }
            }

            $rawValue   = $valuesByField[$field->id] ?? null;
            $valueColumn = $field->typeEnum()->valueColumn();

            $answer = new QcAnswer([
                'submission_id'        => $submission->id,
                'form_field_id'        => $field->id,
                'field_snapshot_label' => $field->label,
                'field_snapshot_unit'  => $field->unit,
                'field_snapshot_type'  => $field->field_type,
            ]);

            $this->assignValue($answer, $field, $rawValue, $valueColumn);

            $eval = $this->warningEvaluator->evaluate($field, $rawValue);
            $answer->has_warning     = $eval['has_warning'];
            $answer->warning_message = $eval['message'];

            $answer->save();

            if ($eval['has_warning']) {
                $warningCount++;
            }
        }

        return $warningCount;
    }

    protected function assignValue(QcAnswer $answer, FormField $field, mixed $rawValue, string $column): void
    {
        if ($rawValue === null || $rawValue === '') {
            return;
        }

        switch ($column) {
            case 'value_numeric':
                $answer->value_numeric = is_numeric($rawValue) ? (float) $rawValue : null;
                break;
            case 'value_boolean':
                $answer->value_boolean = filter_var($rawValue, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                break;
            case 'value_date':
                $answer->value_date = $rawValue;
                break;
            case 'value_time':
                $answer->value_time = $rawValue;
                break;
            case 'value_json':
                $answer->value_json = is_array($rawValue) ? $rawValue : json_decode((string) $rawValue, true);
                break;
            case 'file_path':
                $answer->file_path = (string) $rawValue;
                break;
            default:
                $answer->value_text = (string) $rawValue;
        }
    }

    protected function computeOverallStatus(string $base, int $warningCount): string
    {
        if ($base === SubmissionStatus::DRAFT->value) {
            return SubmissionStatus::DRAFT->value;
        }
        return $warningCount > 0
            ? SubmissionStatus::NEEDS_ACTION->value
            : SubmissionStatus::SUBMITTED->value;
    }
}
