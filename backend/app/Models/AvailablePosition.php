<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AvailablePosition extends Model
{
    protected $table = "available_positions";

    protected $fillable = [
        "job_vacancy_id",
        "position",
        "capacity",
        "apply_capacity"
    ];

    public function JobVacancy() {
        return $this->belongsTo(JobVacancy::class);
    }

    public function JobApplyPositions() {
        return $this->hasMany(JobApplyPosition::class, "position_id");
    }
}
