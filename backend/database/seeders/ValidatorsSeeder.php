<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ValidatorsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::where('username', 'admin')->first();
        $validator = User::where('username', 'validator1')->first();

        DB::table('validators')->insert([
            [
                'user_id' => $admin->id,
                'role' => 'officer',
                'name' => 'Admin Officer',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id' => $validator->id,
                'role' => 'validator',
                'name' => 'Main Validator',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
