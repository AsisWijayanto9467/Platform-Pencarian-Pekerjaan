<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobVacancy extends Model
{
    protected $table ="job_vacancies";

    protected $fillable = [
        "job_category_id",
        "company",
        "address",
        "description"
    ];

    public function JobCategory() {
        return $this->belongsTo(JobCategory::class);
    }

    public function JobApplySocieties() {
        return $this->hasMany(JobApplySociety::class);
    }

    public function AvailablePositions() {
        return $this->hasMany(AvailablePosition::class);
    }

    public function JobApplyPositions() {
        return $this->hasMany(JobApplyPosition::class);
    }
}
