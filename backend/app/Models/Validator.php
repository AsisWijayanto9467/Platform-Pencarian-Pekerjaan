<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Validator extends Model
{
    protected $table = "validators";

    protected $fillable = [
        "user_id",
        "regional_id",
        "role",
        "name",
        "employee_id",
        "phone",
        "is_active"
    ];

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function regional() {
        return $this->belongsTo(Regional::class);
    }

    public function Validations() {
        return $this->hasMany(Validation::class);
    }
}
