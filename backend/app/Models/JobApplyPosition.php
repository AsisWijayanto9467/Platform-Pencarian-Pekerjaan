<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobApplyPosition extends Model
{
    protected $table = "job_apply_positions";

    protected $fillable = [
        "date",
        "society_id",
        "job_vacancy_id",
        "position_id",
        "job_apply_societies_id",
        "status"
    ];


    public function Society() {
        return $this->belongsTo(Society::class);
    }

    public function JobVacancy() {
        return $this->belongsTo(JobVacancy::class);
    }

    public function AvailablePosition() {
        return $this->belongsTo(AvailablePosition::class, "position_id");
    }

    public function JobApplySociety() {
        return $this->belongsTo(JobApplySociety::class,
        'job_apply_societies_id');
    }
}
