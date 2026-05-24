<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        "email",
        "password",
        "role",
        "unreadable_type",
        "userable_id",
        "login_tokens",
        "last_login_at",
        "is_active"
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    public function validators() {
        return $this->hasMany(Validator::class);
    }

    public function userable()
    {
        return $this->morphTo();
    }

    public function admin()
    {
        return $this->belongsTo(Admin::class, 'userable_id')
                    ->where('userable_type', 'App\Models\Admin');
    }

    public function society()
    {
        return $this->belongsTo(Society::class, 'userable_id')
                    ->where('userable_type', 'App\Models\Society');
    }

    public function validator()
    {
        return $this->belongsTo(Validator::class, 'userable_id')
                    ->where('userable_type', 'App\Models\Validator');
    }

    public function notifications() {
        return $this->hasMany(Notification::class);
    }
}
