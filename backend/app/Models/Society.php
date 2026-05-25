<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Society extends Model
{
    protected $table = "societies";

    protected $fillable = [
        "id_card_number",
        "password",
        "name",
        "born_date",
        "gender",
        "address",
        "regional_id",
        "login_tokens"
    ];

    protected $casts = [
        "born_date" => "datetime"
    ];

    protected $hidden = [
        "password",
        "login_tokens"
    ];

    public function regional() {
        return $this->belongsTo(Regional::class);
    }

    public function user() {
        return $this->morphOne(User::class, 'userable');
    }

    public function Validations() {
        return $this->hasMany(Validation::class);
    }

    public function JobApplySocieties() {
        return $this->hasMany(JobApplySociety::class);
    }

    public function JobApplyPositions() {
        return $this->hasMany(JobApplyPosition::class);
    }
}
