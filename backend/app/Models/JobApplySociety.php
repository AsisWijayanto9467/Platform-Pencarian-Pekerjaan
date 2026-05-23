<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobApplySociety extends Model
{
    protected $table = "job_apply_societies";

    protected $fillable = [
        "notes",
        "date",
        "society_id",
        "job_vacancy_id"
    ];

    protected $casts = [
        "date" => "datetime"
    ];

    public function Society() {
        return $this->belongsTo(Society::class);
    }

    public function JobVacancy() {
        return $this->belongsTo(JobVacancy::class);
    }

    public function JobApplyPositions() {
        return $this->hasMany(JobApplyPosition::class,
        'job_apply_societies_id' );
    }
}
