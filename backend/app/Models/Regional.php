<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Regional extends Model
{
    protected $table  ="regionals";

    protected $fillable = [
        "province",
        "district"
    ];

    public function societies() {
        return $this->hasMany(Society::class);
    }

    public function validators() {
        return $this->hasMany(Validator::class);
    }
}
