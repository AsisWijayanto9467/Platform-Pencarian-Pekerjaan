<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobCategory extends Model
{
    protected $table = "job_categories";

    protected $fillable = [
        "job_category",
        "description",
        "is_active"
    ];

    public function Validations() {
        return $this->hasMany(Validation::class);
    }
}
