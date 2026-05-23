<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table("societies")->insert([
            [
                'id_card_number' => '12345678',
                'password' => Hash::make('password123'),
                'name' => 'Doni Rianto',
                'born_date' => '1974-10-22',
                'gender' => 'male',
                'address' => 'Ki. Raya Setiabudhi No. 790',
                'regional_id' => 1,
                'login_tokens' => null
            ],[
                'id_card_number' => '87654321',
                'password' => Hash::make('secret321'),
                'name' => 'Siti Aminah',
                'born_date' => '1985-06-15',
                'gender' => 'female',
                'address' => 'Jl. Merdeka No. 10',
                'regional_id' => 2,
                'login_tokens' => null
            ]
        ]);
    }
}
