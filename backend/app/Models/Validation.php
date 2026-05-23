<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Validation extends Model
{
    protected $table = "validations";

    protected $fillable = [
        "job_category_id",
        "society_id",
        "validator_id",
        "status",
        "work_experience",
        "job_position",
        "reason_accepted",
        "validator_notes"
    ];

    public function JobCategory() {
        return $this->belongsTo(JobCategory::class);
    }
    public function Society() {
        return $this->belongsTo(Society::class);
    }
    public function Validator() {
        return $this->belongsTo(Validator::class);
    }
}
