<?php

namespace Database\Seeders;

use App\Models\JobVacancy;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class JobVacancySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $vacancies = [
            [
                "job_category_id" => 1,
                "company" => "PT. Maju Mundur Sejahtera",
                "address" => "Jl. Gotong Royong No. 12",
                "description" => "Lowongan pekerjaan untuk beberapa posisi IT dan pengembangan sistem."
            ],
            [
                "job_category_id" => 2,
                "company" => "CV. Teknologi Nusantara",
                "address" => "Jl. Merdeka Barat No. 45",
                "description" => "Perusahaan startup yang bergerak di bidang teknologi digital."
            ],
            [
                "job_category_id" => 3,
                "company" => "PT. Kreatif Media Indonesia",
                "address" => "Jl. Sudirman No. 101",
                "description" => "Membuka peluang bagi tenaga kreatif dan desain."
            ],
            [
                "job_category_id" => 4,
                "company" => "PT. Industri Jaya Abadi",
                "address" => "Kawasan Industri Blok C-3",
                "description" => "Perusahaan manufaktur berskala nasional."
            ],
            [
                "job_category_id" => 5,
                "company" => "PT. Solusi Bisnis Global",
                "address" => "Jl. Ahmad Yani No. 88",
                "description" => "Perusahaan konsultan dan layanan bisnis."
            ],
        ];

        foreach ($vacancies as $vacancy) {
            JobVacancy::create($vacancy);
        }
    }
}
