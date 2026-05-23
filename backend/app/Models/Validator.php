<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Validator extends Model
{
    protected $table = "validators";

    protected $fillable = [
        "user_id",
        "role",
        "name"
    ];

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function Validations() {
        return $this->hasMany(Validation::class);
    }
}
