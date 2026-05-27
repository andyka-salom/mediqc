<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QcSubmissionAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'submission_id',
        'filename',
        'original_filename',
        'mime_type',
        'file_size',
        'disk',
        'path',
        'uploaded_by',
    ];

    public function submission(): BelongsTo
    {
        return $this->belongsTo(QcSubmission::class, 'submission_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getUrlAttribute(): string
    {
        return asset('storage/' . $this->path);
    }
}
