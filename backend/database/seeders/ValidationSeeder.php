<?php

namespace Database\Seeders;

use App\Models\Validation;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ValidationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Validation::create([
            "society_id" => 3,
            "job_category_id" => 1,
            "status" => "accepted",
            "work_experience" => "3 years experience",
            "job_position" => "Web Developer",
            "reason_accepted" => "Qualified",
            "validator_notes" => "Approved",
            "validator_id" => 2
        ]);
    }
}
