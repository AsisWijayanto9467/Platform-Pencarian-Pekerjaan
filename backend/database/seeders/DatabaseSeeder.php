<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Job Categories
        $jobCategories = [
            [
                'job_category' => 'Teknologi Informasi',
                'description' => 'Bidang pekerjaan terkait teknologi informasi dan komputer',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'job_category' => 'Pendidikan',
                'description' => 'Bidang pekerjaan terkait pendidikan dan pengajaran',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'job_category' => 'Kesehatan',
                'description' => 'Bidang pekerjaan terkait kesehatan dan medis',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'job_category' => 'Keuangan',
                'description' => 'Bidang pekerjaan terkait keuangan dan akuntansi',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'job_category' => 'Pemasaran',
                'description' => 'Bidang pekerjaan terkait pemasaran dan penjualan',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];
        DB::table('job_categories')->insert($jobCategories);

        // 2. Regionals
        $regionals = [
            [
                'id' => 1,
                'province' => 'Jawa Barat',
                'district' => 'Kota Bandung',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 2,
                'province' => 'DKI Jakarta',
                'district' => 'Jakarta Pusat',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 3,
                'province' => 'Jawa Timur',
                'district' => 'Kota Surabaya',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];
        DB::table('regionals')->insert($regionals);

        // 3. Admin
        $adminId = DB::table('admins')->insertGetId([
            'name' => 'Admin Utama',
            'email' => 'admin@jobportal.com',
            'password' => Hash::make('password123'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Admin User
        $adminUserId = DB::table('users')->insertGetId([
            'email' => 'admin@jobportal.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'userable_type' => 'App\Models\Admin',
            'userable_id' => $adminId,
            'login_tokens' => null,
            'last_login_at' => now(),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 4. Officer - BUAT USER DULU, BARU VALIDATOR
        $officerUserId = DB::table('users')->insertGetId([
            'email' => 'officer@jobportal.com',
            'password' => Hash::make('password123'),
            'role' => 'officer',
            'userable_type' => 'App\Models\Validator',
            'userable_id' => 0, // Akan diupdate nanti
            'login_tokens' => null,
            'last_login_at' => now(),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $officerId = DB::table('validators')->insertGetId([
            'user_id' => $officerUserId, // Langsung pakai ID user yang sudah ada
            'regional_id' => 1,
            'role' => 'officer',
            'name' => 'Budi Officer',
            'employee_id' => 'EMP001',
            'phone' => '081234567890',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Update userable_id di users
        DB::table('users')
            ->where('id', $officerUserId)
            ->update(['userable_id' => $officerId]);

        // 5. Validator - BUAT USER DULU, BARU VALIDATOR
        $validatorUserId = DB::table('users')->insertGetId([
            'email' => 'validator@jobportal.com',
            'password' => Hash::make('password123'),
            'role' => 'validator',
            'userable_type' => 'App\Models\Validator',
            'userable_id' => 0, // Akan diupdate nanti
            'login_tokens' => null,
            'last_login_at' => now(),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $validatorId = DB::table('validators')->insertGetId([
            'user_id' => $validatorUserId, // Langsung pakai ID user yang sudah ada
            'regional_id' => 1,
            'role' => 'validator',
            'name' => 'Ani Validator',
            'employee_id' => 'EMP002',
            'phone' => '081234567891',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Update userable_id di users
        DB::table('users')
            ->where('id', $validatorUserId)
            ->update(['userable_id' => $validatorId]);

        // 6. Society Users (beberapa untuk testing)
        $societyUsers = [];
        for ($i = 1; $i <= 5; $i++) {
            $societyId = DB::table('societies')->insertGetId([
                'id_card_number' => sprintf('ID%06d', $i),
                'password' => Hash::make('password123'),
                'name' => "Masyarakat $i",
                'born_date' => Carbon::create(1990 + $i, rand(1, 12), rand(1, 28)),
                'gender' => $i % 2 == 0 ? 'female' : 'male',
                'address' => "Jl. Contoh No. $i, Kota Bandung",
                'regional_id' => rand(1, 3),
                'login_tokens' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $userId = DB::table('users')->insertGetId([
                'email' => "society$i@jobportal.com",
                'password' => Hash::make('password123'),
                'role' => 'society',
                'userable_type' => 'App\Models\Society',
                'userable_id' => $societyId,
                'login_tokens' => null,
                'last_login_at' => null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $societyUsers[] = ['society_id' => $societyId, 'user_id' => $userId];
        }

        // 7. Validations
        $validationStatuses = ['accepted', 'declined', 'pending'];
        foreach ($societyUsers as $index => $society) {
            DB::table('validations')->insert([
                'job_category_id' => rand(1, 5),
                'society_id' => $society['society_id'],
                'validator_id' => $index < 3 ? $validatorId : null,
                'status' => $validationStatuses[array_rand($validationStatuses)],
                'work_experience' => "Pengalaman kerja {$index} tahun di bidang terkait",
                'job_position' => "Staff " . $jobCategories[$index % 5]['job_category'],
                'reason_accepted' => $index < 3 ? 'Dokumen lengkap dan memenuhi syarat' : null,
                'validator_notes' => $index < 3 ? 'Semua berkas sudah diverifikasi' : null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 8. Job Vacancies
        $jobVacancies = [];
        $companies = [
            ['company' => 'PT Teknologi Maju', 'address' => 'Jl. Teknologi No. 1, Bandung'],
            ['company' => 'PT Pendidikan Bangsa', 'address' => 'Jl. Pendidikan No. 2, Jakarta'],
            ['company' => 'PT Sehat Selalu', 'address' => 'Jl. Kesehatan No. 3, Surabaya'],
            ['company' => 'PT Finansial Ku', 'address' => 'Jl. Keuangan No. 4, Bandung'],
            ['company' => 'PT Marketing Hebat', 'address' => 'Jl. Pemasaran No. 5, Jakarta'],
        ];

        for ($i = 0; $i < 5; $i++) {
            $vacancyId = DB::table('job_vacancies')->insertGetId([
                'job_category_id' => $i + 1,
                'company' => $companies[$i]['company'],
                'address' => $companies[$i]['address'],
                'description' => "Lowongan pekerjaan di {$companies[$i]['company']} untuk berbagai posisi",
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Available Positions untuk setiap vacancy
            $positions = [
                ['position' => 'Junior Staff', 'capacity' => 5, 'apply_capacity' => 3],
                ['position' => 'Senior Staff', 'capacity' => 3, 'apply_capacity' => 1],
                ['position' => 'Manager', 'capacity' => 1, 'apply_capacity' => 0],
            ];

            $vacancyPositions = [];
            foreach ($positions as $position) {
                $positionId = DB::table('available_positions')->insertGetId([
                    'job_vacancy_id' => $vacancyId,
                    'position' => $position['position'],
                    'capacity' => $position['capacity'],
                    'apply_capacity' => $position['apply_capacity'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $vacancyPositions[] = $positionId;
            }

            $jobVacancies[] = [
                'vacancy_id' => $vacancyId,
                'positions' => $vacancyPositions,
            ];
        }

        // 9. Job Apply Societies
        foreach ($societyUsers as $index => $society) {
            $vacancyIndex = $index % count($jobVacancies);
            $vacancy = $jobVacancies[$vacancyIndex];

            $jobApplyId = DB::table('job_apply_societies')->insertGetId([
                'notes' => "Saya tertarik melamar di perusahaan ini",
                'date' => now()->subDays(rand(1, 30)),
                'society_id' => $society['society_id'],
                'job_vacancy_id' => $vacancy['vacancy_id'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Job Apply Positions
            $positionId = $vacancy['positions'][$index % 3];
            $statuses = ['pending', 'accepted', 'rejected'];

            DB::table('job_apply_positions')->insert([
                'date' => now()->subDays(rand(1, 30)),
                'society_id' => $society['society_id'],
                'job_vacancy_id' => $vacancy['vacancy_id'],
                'position_id' => $positionId,
                'job_apply_societies_id' => $jobApplyId,
                'status' => $statuses[array_rand($statuses)],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 10. Notifications untuk semua user
        $notificationTypes = ['validation', 'application', 'job', 'system'];
        $allUserIds = array_merge(
            [$adminUserId, $officerUserId, $validatorUserId],
            array_column($societyUsers, 'user_id')
        );

        foreach ($allUserIds as $userId) {
            for ($i = 0; $i < 3; $i++) {
                DB::table('notifications')->insert([
                    'user_id' => $userId,
                    'title' => "Notifikasi " . ($i + 1),
                    'message' => "Ini adalah pesan notifikasi contoh untuk user ID: $userId",
                    'type' => $notificationTypes[array_rand($notificationTypes)],
                    'is_read' => $i % 2 == 0,
                    'created_at' => now()->subDays(rand(0, 7)),
                    'updated_at' => now(),
                ]);
            }
        }

        echo "Seeder selesai dijalankan!\n";
        echo "Akun Testing:\n";
        echo "1. Admin     : admin@jobportal.com / password123\n";
        echo "2. Officer   : officer@jobportal.com / password123\n";
        echo "3. Validator : validator@jobportal.com / password123\n";
        echo "4. Society   : society1@jobportal.com / password123\n";
        echo "5. Society   : society2@jobportal.com / password123\n";
        echo "6. Society   : society3@jobportal.com / password123\n";
        echo "7. Society   : society4@jobportal.com / password123\n";
        echo "8. Society   : society5@jobportal.com / password123\n";
    }
}
