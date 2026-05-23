<?php

namespace Database\Seeders;

use App\Models\AvailablePosition;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AvailablePositionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $positions = [
            // Job Vacancy ID 1
            [
                "job_vacancy_id" => 1,
                "position" => "Web Developer",
                "capacity" => 2,
                "apply_capacity" => 15
            ],
            [
                "job_vacancy_id" => 1,
                "position" => "Backend Developer",
                "capacity" => 1,
                "apply_capacity" => 8
            ],

            // Job Vacancy ID 2
            [
                "job_vacancy_id" => 2,
                "position" => "Mobile Developer",
                "capacity" => 3,
                "apply_capacity" => 20
            ],
            [
                "job_vacancy_id" => 2,
                "position" => "QA Engineer",
                "capacity" => 2,
                "apply_capacity" => 6
            ],

            // Job Vacancy ID 3
            [
                "job_vacancy_id" => 3,
                "position" => "Graphic Designer",
                "capacity" => 2,
                "apply_capacity" => 12
            ],
            [
                "job_vacancy_id" => 3,
                "position" => "UI/UX Designer",
                "capacity" => 1,
                "apply_capacity" => 5
            ],

            // Job Vacancy ID 4
            [
                "job_vacancy_id" => 4,
                "position" => "Production Supervisor",
                "capacity" => 2,
                "apply_capacity" => 7
            ],
            [
                "job_vacancy_id" => 4,
                "position" => "Quality Control",
                "capacity" => 2,
                "apply_capacity" => 4
            ],

            // Job Vacancy ID 5
            [
                "job_vacancy_id" => 5,
                "position" => "Business Analyst",
                "capacity" => 1,
                "apply_capacity" => 9
            ],
            [
                "job_vacancy_id" => 5,
                "position" => "Marketing Executive",
                "capacity" => 2,
                "apply_capacity" => 11
            ],
        ];

        foreach ($positions as $position) {
            AvailablePosition::create($position);
        }
    }
}
