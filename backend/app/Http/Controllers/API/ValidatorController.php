<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AvailablePosition;
use App\Models\JobApplyPosition;
use App\Models\JobApplySociety;
use App\Models\JobVacancy;
use App\Models\Notification;
use App\Models\Society;
use App\Models\Validation;
use App\Models\Validator as ValidatorModel;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class ValidatorController extends Controller
{
    /**
     * Get authenticated validator/officer from token
     */
    private function getAuthenticatedValidator(Request $request)
    {
        $token = $request->bearerToken() ?? $request->query("token");

        if (!$token) {
            return null;
        }

        $user = \App\Models\User::where("login_tokens", $token)->first();

        if (!$user || !in_array($user->role, ['validator', 'officer'])) {
            return null;
        }

        return ValidatorModel::with('regional', 'user')->where('user_id', $user->id)->first();
    }

    // ============= DASHBOARD =============

    public function dashboard(Request $request)
    {
        $validator = $this->getAuthenticatedValidator($request);

        if (!$validator) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $dashboard = [
            'profile' => [
                'id' => $validator->id,
                'name' => $validator->name,
                'employee_id' => $validator->employee_id,
                'role' => $validator->role,
                'regional' => $validator->regional ? [
                    'province' => $validator->regional->province,
                    'district' => $validator->regional->district,
                ] : null,
            ],
            'validation_stats' => [
                'total_handled' => Validation::where('validator_id', $validator->id)->count(),
                'pending' => Validation::where('validator_id', $validator->id)->where('status', 'pending')->count(),
                'accepted' => Validation::where('validator_id', $validator->id)->where('status', 'accepted')->count(),
                'declined' => Validation::where('validator_id', $validator->id)->where('status', 'declined')->count(),
                'total_pending_all' => Validation::where('status', 'pending')->count(),
            ],
            'recent_validations' => Validation::with(['society:id,name,id_card_number', 'jobCategory:id,job_category'])
                ->where('validator_id', $validator->id)
                ->latest()
                ->take(5)
                ->get(),
            'unassigned_validations' => Validation::with(['society:id,name,id_card_number', 'jobCategory:id,job_category'])
                ->whereNull('validator_id')
                ->where('status', 'pending')
                ->count(),
        ];

        // Jika officer, tambahkan statistik job vacancy
        if ($validator->role === 'officer') {
            $dashboard['job_vacancy_stats'] = [
                'total_vacancies' => JobVacancy::count(),
                'my_vacancies' => JobVacancy::count(), // Bisa difilter jika ada relasi
                'total_applications' => JobApplySociety::count(),
                'pending_applications' => JobApplyPosition::where('status', 'pending')->count(),
            ];

            $dashboard['recent_applications'] = JobApplySociety::with(['society:id,name', 'jobVacancy:id,company'])
                ->latest()
                ->take(5)
                ->get();
        }

        return response()->json([
            'message' => 'Dashboard retrieved successfully',
            'data' => $dashboard
        ], 200);
    }

    public function getMyStats(Request $request)
    {
        $validator = $this->getAuthenticatedValidator($request);

        if (!$validator) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $stats = [
            'period' => [
                'today' => Carbon::today()->toDateString(),
                'this_month' => Carbon::now()->format('F Y'),
            ],
            'validations_today' => Validation::where('validator_id', $validator->id)
                ->whereDate('updated_at', Carbon::today())
                ->count(),
            'validations_this_month' => Validation::where('validator_id', $validator->id)
                ->whereMonth('updated_at', Carbon::now()->month)
                ->whereYear('updated_at', Carbon::now()->year)
                ->count(),
            'acceptance_rate' => $this->calculateMyAcceptanceRate($validator->id),
            'average_response_time' => $this->getAverageResponseTime($validator->id),
            'by_category' => Validation::where('validator_id', $validator->id)
                ->select('job_category_id', DB::raw('count(*) as total'))
                ->groupBy('job_category_id')
                ->with('jobCategory:id,job_category')
                ->get(),
            'daily_stats' => Validation::where('validator_id', $validator->id)
                ->select(
                    DB::raw('DATE(updated_at) as date'),
                    DB::raw('count(*) as total'),
                    DB::raw('SUM(CASE WHEN status = "accepted" THEN 1 ELSE 0 END) as accepted'),
                    DB::raw('SUM(CASE WHEN status = "declined" THEN 1 ELSE 0 END) as declined')
                )
                ->groupBy('date')
                ->orderBy('date', 'desc')
                ->take(14)
                ->get(),
        ];

        return response()->json([
            'message' => 'Stats retrieved successfully',
            'data' => $stats
        ], 200);
    }

    private function calculateMyAcceptanceRate($validatorId)
    {
        $total = Validation::where('validator_id', $validatorId)
            ->whereIn('status', ['accepted', 'declined'])
            ->count();

        if ($total === 0) return '0%';

        $accepted = Validation::where('validator_id', $validatorId)
            ->where('status', 'accepted')
            ->count();

        return round(($accepted / $total) * 100, 2) . '%';
    }

    private function getAverageResponseTime($validatorId)
    {
        $avg = Validation::where('validator_id', $validatorId)
            ->whereNotNull('updated_at')
            ->select(DB::raw('AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) as avg_hours'))
            ->first();

        if ($avg && $avg->avg_hours) {
            $hours = round($avg->avg_hours);
            if ($hours < 24) return $hours . ' hours';
            return round($hours / 24, 1) . ' days';
        }

        return 'N/A';
    }

    // ============= VALIDATION REQUESTS =============

    public function getPendingValidations(Request $request)
    {
        $validator = $this->getAuthenticatedValidator($request);

        if (!$validator) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $query = Validation::with(['society:id,name,id_card_number,gender,address', 'jobCategory:id,job_category'])
            ->where('status', 'pending');

        // Bisa filter yang belum di-assign atau yang sudah di-assign ke validator ini
        if ($request->has('assigned') && $request->assigned === 'me') {
            $query->where('validator_id', $validator->id);
        } elseif ($request->has('assigned') && $request->assigned === 'unassigned') {
            $query->whereNull('validator_id');
        }

        if ($request->has('job_category_id')) {
            $query->where('job_category_id', $request->job_category_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('society', function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('id_card_number', 'like', "%{$search}%");
            });
        }

        $perPage = $request->per_page ?? 15;
        $validations = $query->latest()->paginate($perPage);

        return response()->json([
            'message' => 'Pending validations retrieved successfully',
            'total_pending' => Validation::where('status', 'pending')->count(),
            'data' => $validations
        ], 200);
    }

    public function getValidationHistory(Request $request)
    {
        $validator = $this->getAuthenticatedValidator($request);

        if (!$validator) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $query = Validation::with(['society:id,name,id_card_number', 'jobCategory:id,job_category'])
            ->where('validator_id', $validator->id)
            ->whereIn('status', ['accepted', 'declined']);

        // Filter
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('date_from')) {
            $query->whereDate('updated_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('updated_at', '<=', $request->date_to);
        }

        $perPage = $request->per_page ?? 15;
        $history = $query->latest('updated_at')->paginate($perPage);

        return response()->json([
            'message' => 'Validation history retrieved successfully',
            'data' => $history
        ], 200);
    }

    public function getValidationDetail(Request $request, $id)
    {
        $validator = $this->getAuthenticatedValidator($request);

        if (!$validator) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $validation = Validation::with([
            'society:id,name,id_card_number,gender,address,born_date',
            'society.regional:id,province,district',
            'jobCategory:id,job_category,description',
            'validator:id,name,employee_id'
        ])->findOrFail($id);

        // Jika officer/validator mengakses, auto-assign jika belum di-assign
        if (!$validation->validator_id && $validation->status === 'pending') {
            $validation->update(['validator_id' => $validator->id]);
            $validation->refresh()->load('validator');
        }

        return response()->json([
            'message' => 'Validation detail retrieved successfully',
            'data' => $validation
        ], 200);
    }

    // ============= PROCESS VALIDATION =============

    public function approveValidation(Request $request, $id)
    {
        $validator = $this->getAuthenticatedValidator($request);

        if (!$validator) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $validation = Validation::findOrFail($id);

        if ($validation->status !== 'pending') {
            return response()->json([
                "message" => "Validation has already been " . $validation->status
            ], 400);
        }

        $request->validate([
            'validator_notes' => 'nullable|string|max:500'
        ]);

        $validation->update([
            'status' => 'accepted',
            'validator_id' => $validator->id,
            'validator_notes' => $request->validator_notes ?? 'Approved by validator',
        ]);

        // Kirim notifikasi ke society
        $society = Society::find($validation->society_id);
        if ($society && $society->user) {
            Notification::create([
                'user_id' => $society->user->id,
                'title' => 'Validation Approved',
                'message' => 'Your validation request has been approved. You can now apply for jobs.',
                'type' => 'validation',
            ]);
        }

        return response()->json([
            'message' => 'Validation approved successfully',
            'data' => $validation->fresh()->load('society')
        ], 200);
    }

    public function declineValidation(Request $request, $id)
    {
        $validator = $this->getAuthenticatedValidator($request);

        if (!$validator) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $validation = Validation::findOrFail($id);

        if ($validation->status !== 'pending') {
            return response()->json([
                "message" => "Validation has already been " . $validation->status
            ], 400);
        }

        $request->validate([
            'validator_notes' => 'required|string|max:500'
        ]);

        $validation->update([
            'status' => 'declined',
            'validator_id' => $validator->id,
            'validator_notes' => $request->validator_notes,
        ]);

        // Kirim notifikasi ke society
        $society = Society::find($validation->society_id);
        if ($society && $society->user) {
            Notification::create([
                'user_id' => $society->user->id,
                'title' => 'Validation Declined',
                'message' => 'Your validation request has been declined. Reason: ' . $request->validator_notes,
                'type' => 'validation',
            ]);
        }

        return response()->json([
            'message' => 'Validation declined successfully',
            'data' => $validation->fresh()->load('society')
        ], 200);
    }

    public function addValidatorNotes(Request $request, $id)
    {
        $validator = $this->getAuthenticatedValidator($request);

        if (!$validator) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $validation = Validation::findOrFail($id);

        $request->validate([
            'validator_notes' => 'required|string|max:500'
        ]);

        $validation->update([
            'validator_notes' => $request->validator_notes,
            'validator_id' => $validator->id,
        ]);

        return response()->json([
            'message' => 'Validator notes added successfully',
            'data' => $validation->fresh()
        ], 200);
    }

    // ============= JOB POSTING MANAGEMENT (Officer Role) =============

    public function createJobVacancy(Request $request)
    {
        $validator = $this->getAuthenticatedValidator($request);

        if (!$validator || $validator->role !== 'officer') {
            return response()->json(["message" => "Unauthorized. Only officers can manage job vacancies."], 403);
        }

        $valid = Validator::make($request->all(), [
            'job_category_id' => 'required|exists:job_categories,id',
            'company' => 'required|string|max:255',
            'address' => 'required|string',
            'description' => 'required|string',
            'positions' => 'required|array|min:1',
            'positions.*.position' => 'required|string|max:255',
            'positions.*.capacity' => 'required|integer|min:1',
            'positions.*.apply_capacity' => 'required|integer|min:0',
        ]);

        if ($valid->fails()) {
            return response()->json([
                "message" => "Invalid field",
                "errors" => $valid->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $vacancy = JobVacancy::create([
                'job_category_id' => $request->job_category_id,
                'company' => $request->company,
                'address' => $request->address,
                'description' => $request->description,
            ]);

            foreach ($request->positions as $position) {
                AvailablePosition::create([
                    'job_vacancy_id' => $vacancy->id,
                    'position' => $position['position'],
                    'capacity' => $position['capacity'],
                    'apply_capacity' => $position['apply_capacity'],
                ]);
            }

            // Notifikasi ke officer
            if ($validator->user) {
                Notification::create([
                    'user_id' => $validator->user->id,
                    'title' => 'Job Vacancy Created',
                    'message' => "You've created a new job vacancy at {$request->company}.",
                    'type' => 'job',
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Job vacancy created successfully',
                'data' => $vacancy->load('availablePositions', 'jobCategory')
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create job vacancy',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateJobVacancy(Request $request, $id)
    {
        $validator = $this->getAuthenticatedValidator($request);

        if (!$validator || $validator->role !== 'officer') {
            return response()->json(["message" => "Unauthorized. Only officers can manage job vacancies."], 403);
        }

        $vacancy = JobVacancy::findOrFail($id);

        $valid = Validator::make($request->all(), [
            'job_category_id' => 'sometimes|exists:job_categories,id',
            'company' => 'sometimes|string|max:255',
            'address' => 'sometimes|string',
            'description' => 'sometimes|string',
        ]);

        if ($valid->fails()) {
            return response()->json([
                "message" => "Invalid field",
                "errors" => $valid->errors()
            ], 422);
        }

        $vacancy->update($request->only(['job_category_id', 'company', 'address', 'description']));

        return response()->json([
            'message' => 'Job vacancy updated successfully',
            'data' => $vacancy->fresh()->load('availablePositions', 'jobCategory')
        ], 200);
    }

    public function deleteJobVacancy(Request $request, $id)
    {
        $validator = $this->getAuthenticatedValidator($request);

        if (!$validator || $validator->role !== 'officer') {
            return response()->json(["message" => "Unauthorized. Only officers can manage job vacancies."], 403);
        }

        $vacancy = JobVacancy::findOrFail($id);

        try {
            DB::beginTransaction();

            // Hapus terkait
            $positionIds = AvailablePosition::where('job_vacancy_id', $id)->pluck('id');
            JobApplyPosition::whereIn('position_id', $positionIds)->delete();
            JobApplyPosition::where('job_vacancy_id', $id)->delete();
            AvailablePosition::where('job_vacancy_id', $id)->delete();
            JobApplySociety::where('job_vacancy_id', $id)->delete();

            $vacancy->delete();

            DB::commit();

            return response()->json([
                'message' => 'Job vacancy deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete job vacancy',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function officerDashboard(Request $request)
    {
        $validator = $this->getAuthenticatedValidator($request);

        if (!$validator) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        // Base dashboard data untuk semua role
        $dashboard = [
            'profile' => [
                'id' => $validator->id,
                'name' => $validator->name,
                'employee_id' => $validator->employee_id,
                'role' => $validator->role,
                'regional' => $validator->regional ? [
                    'province' => $validator->regional->province,
                    'district' => $validator->regional->district,
                ] : null,
            ],
            'validation_stats' => [
                'total_handled' => Validation::where('validator_id', $validator->id)->count(),
                'pending' => Validation::where('validator_id', $validator->id)->where('status', 'pending')->count(),
                'accepted' => Validation::where('validator_id', $validator->id)->where('status', 'accepted')->count(),
                'declined' => Validation::where('validator_id', $validator->id)->where('status', 'declined')->count(),
                'total_pending_all' => Validation::where('status', 'pending')->count(),
            ],
            'recent_validations' => Validation::with(['society:id,name,id_card_number', 'jobCategory:id,job_category'])
                ->where('validator_id', $validator->id)
                ->latest()
                ->take(5)
                ->get(),
            'unassigned_validations' => Validation::with(['society:id,name,id_card_number', 'jobCategory:id,job_category'])
                ->whereNull('validator_id')
                ->where('status', 'pending')
                ->count(),
        ];

        // Jika OFFICER, tambahkan data spesifik officer
        if ($validator->role === 'officer') {
            // Job Vacancy Stats
            $totalVacancies = JobVacancy::count();
            $vacanciesThisMonth = JobVacancy::whereMonth('created_at', Carbon::now()->month)
                ->whereYear('created_at', Carbon::now()->year)
                ->count();
            $vacanciesByCategory = JobVacancy::select('job_category_id', DB::raw('count(*) as total'))
                ->with('jobCategory:id,job_category')
                ->groupBy('job_category_id')
                ->get();
            $recentVacancies = JobVacancy::with(['jobCategory:id,job_category', 'availablePositions'])
                ->withCount('jobApplySocieties')
                ->latest()
                ->take(5)
                ->get();

            $dashboard['job_vacancy_stats'] = [
                'total_vacancies' => $totalVacancies,
                'vacancies_this_month' => $vacanciesThisMonth,
                'total_positions' => AvailablePosition::count(),
                'vacancies_by_category' => $vacanciesByCategory,
                'recent_vacancies' => $recentVacancies,
            ];

            // Application Stats
            $totalApplications = JobApplyPosition::count();
            $pendingApplications = JobApplyPosition::where('status', 'pending')->count();
            $acceptedApplications = JobApplyPosition::where('status', 'accepted')->count();
            $rejectedApplications = JobApplyPosition::where('status', 'rejected')->count();

            $applicationsThisMonth = JobApplyPosition::whereMonth('created_at', Carbon::now()->month)
                ->whereYear('created_at', Carbon::now()->year)
                ->count();

            $applicationsByVacancy = JobApplyPosition::select('job_vacancy_id', DB::raw('count(*) as total'))
                ->with('jobVacancy:id,company')
                ->groupBy('job_vacancy_id')
                ->orderBy('total', 'desc')
                ->take(5)
                ->get();

            $recentApplications = JobApplyPosition::with([
                    'society:id,name,id_card_number',
                    'jobVacancy:id,company',
                    'availablePosition:id,position'
                ])
                ->latest()
                ->take(10)
                ->get();

            $dashboard['application_stats'] = [
                'total' => $totalApplications,
                'pending' => $pendingApplications,
                'accepted' => $acceptedApplications,
                'rejected' => $rejectedApplications,
                'this_month' => $applicationsThisMonth,
                'by_vacancy' => $applicationsByVacancy,
                'recent_applications' => $recentApplications,
            ];

            // Application Status Distribution
            $applicationStatusDistribution = [
                ['status' => 'pending', 'total' => $pendingApplications, 'color' => '#f39c12', 'label' => 'Pending'],
                ['status' => 'accepted', 'total' => $acceptedApplications, 'color' => '#2ecc71', 'label' => 'Accepted'],
                ['status' => 'rejected', 'total' => $rejectedApplications, 'color' => '#e74c3c', 'label' => 'Rejected'],
            ];

            $dashboard['application_status_distribution'] = $applicationStatusDistribution;

            // Vacancy Stats Detail
            $topVacancies = JobVacancy::withCount('jobApplySocieties')
                ->with(['jobCategory:id,job_category'])
                ->orderBy('job_apply_societies_count', 'desc')
                ->take(10)
                ->get()
                ->map(function($vacancy) {
                    return [
                        'id' => $vacancy->id,
                        'company' => $vacancy->company,
                        'category' => $vacancy->jobCategory->job_category ?? '-',
                        'total_positions' => $vacancy->availablePositions->count(),
                        'total_applicants' => $vacancy->job_apply_societies_count,
                        'created_at' => $vacancy->created_at->toDateString(),
                    ];
                });

            $dashboard['top_vacancies'] = $topVacancies;

            // Today's Summary
            $dashboard['today_summary'] = [
                'new_applications_today' => JobApplyPosition::whereDate('created_at', Carbon::today())->count(),
                'processed_today' => JobApplyPosition::whereDate('updated_at', Carbon::today())
                    ->whereIn('status', ['accepted', 'rejected'])
                    ->count(),
                'validations_today' => Validation::where('validator_id', $validator->id)
                    ->whereDate('updated_at', Carbon::today())
                    ->count(),
                'vacancies_created_today' => JobVacancy::whereDate('created_at', Carbon::today())->count(),
            ];

            // Monthly Trends (6 bulan terakhir)
            $monthlyTrends = [];
            for ($i = 5; $i >= 0; $i--) {
                $month = Carbon::now()->subMonths($i);
                $monthlyTrends[] = [
                    'month' => $month->format('M Y'),
                    'month_num' => $month->month,
                    'year' => $month->year,
                    'applications' => JobApplyPosition::whereMonth('created_at', $month->month)
                        ->whereYear('created_at', $month->year)
                        ->count(),
                    'vacancies' => JobVacancy::whereMonth('created_at', $month->month)
                        ->whereYear('created_at', $month->year)
                        ->count(),
                    'validations' => Validation::where('validator_id', $validator->id)
                        ->whereMonth('updated_at', $month->month)
                        ->whereYear('updated_at', $month->year)
                        ->count(),
                ];
            }

            $dashboard['monthly_trends'] = $monthlyTrends;

            // Quick Stats for Cards
            $dashboard['quick_stats'] = [
                [
                    'title' => 'Total Lowongan',
                    'value' => $totalVacancies,
                    'icon' => 'fas fa-briefcase',
                    'bgColor' => '#e74c3c',
                    'subtitle' => 'Lowongan Aktif',
                    'link' => '/officer/vacancies',
                ],
                [
                    'title' => 'Total Lamaran',
                    'value' => $totalApplications,
                    'icon' => 'fas fa-file-alt',
                    'bgColor' => '#3498db',
                    'subtitle' => 'Lamaran Masuk',
                    'link' => '/officer/applications',
                ],
                [
                    'title' => 'Lamaran Pending',
                    'value' => $pendingApplications,
                    'icon' => 'fas fa-clock',
                    'bgColor' => '#f39c12',
                    'subtitle' => 'Perlu Diproses',
                    'link' => '/officer/applications?status=pending',
                ],
                [
                    'title' => 'Lamaran Diterima',
                    'value' => $acceptedApplications,
                    'icon' => 'fas fa-check-circle',
                    'bgColor' => '#2ecc71',
                    'subtitle' => 'Disetujui',
                ],
                [
                    'title' => 'Lamaran Ditolak',
                    'value' => $rejectedApplications,
                    'icon' => 'fas fa-times-circle',
                    'bgColor' => '#e74c3c',
                    'subtitle' => 'Dikembalikan',
                ],
                [
                    'title' => 'Validasi Tertunda',
                    'value' => $dashboard['validation_stats']['pending'],
                    'icon' => 'fas fa-hourglass-half',
                    'bgColor' => '#9b59b6',
                    'subtitle' => 'Milik Saya',
                ],
                [
                    'title' => 'Total Posisi',
                    'value' => AvailablePosition::count(),
                    'icon' => 'fas fa-list-ol',
                    'bgColor' => '#1abc9c',
                    'subtitle' => 'Posisi Tersedia',
                ],
                [
                    'title' => 'Lowongan Bulan Ini',
                    'value' => $vacanciesThisMonth,
                    'icon' => 'fas fa-calendar-alt',
                    'bgColor' => '#e67e22',
                    'subtitle' => Carbon::now()->format('F Y'),
                ],
            ];

            // Pending applications that need attention (older than 7 days)
            $oldPendingApplications = JobApplyPosition::with(['society:id,name', 'jobVacancy:id,company'])
                ->where('status', 'pending')
                ->where('created_at', '<', Carbon::now()->subDays(7))
                ->count();

            $dashboard['attention_needed'] = [
                'old_pending_applications' => $oldPendingApplications,
                'unassigned_validations' => $dashboard['unassigned_validations'],
                'urgent_notifications' => Notification::where('user_id', $validator->user->id ?? 0)
                    ->where('created_at', '>=', Carbon::now()->subDays(7))
                    ->count(),
            ];
        }

        return response()->json([
            'message' => 'Dashboard retrieved successfully',
            'data' => $dashboard
        ], 200);
    }

    public function getMyJobVacancies(Request $request)
    {
        $validator = $this->getAuthenticatedValidator($request);

        if (!$validator || $validator->role !== 'officer') {
            return response()->json(["message" => "Unauthorized. Only officers can view job vacancies."], 403);
        }

        $query = JobVacancy::with(['jobCategory', 'availablePositions'])
            ->withCount(['jobApplySocieties', 'availablePositions']);

        if ($request->has('category_id')) {
            $query->where('job_category_id', $request->category_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('company', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $perPage = $request->per_page ?? 15;
        $vacancies = $query->latest()->paginate($perPage);

        return response()->json([
            'message' => 'Job vacancies retrieved successfully',
            'data' => $vacancies
        ], 200);
    }

    // ============= AVAILABLE POSITIONS MANAGEMENT =============

    public function addAvailablePosition(Request $request, $vacancyId)
    {
        $validator = $this->getAuthenticatedValidator($request);

        if (!$validator || $validator->role !== 'officer') {
            return response()->json(["message" => "Unauthorized. Only officers can manage positions."], 403);
        }

        $vacancy = JobVacancy::findOrFail($vacancyId);

        $valid = Validator::make($request->all(), [
            'position' => 'required|string|max:255',
            'capacity' => 'required|integer|min:1',
            'apply_capacity' => 'required|integer|min:0',
        ]);

        if ($valid->fails()) {
            return response()->json([
                "message" => "Invalid field",
                "errors" => $valid->errors()
            ], 422);
        }

        $position = AvailablePosition::create([
            'job_vacancy_id' => $vacancyId,
            'position' => $request->position,
            'capacity' => $request->capacity,
            'apply_capacity' => $request->apply_capacity,
        ]);

        return response()->json([
            'message' => 'Position added successfully',
            'data' => $position
        ], 201);
    }

    public function updateAvailablePosition(Request $request, $id)
    {
        $validator = $this->getAuthenticatedValidator($request);

        if (!$validator || $validator->role !== 'officer') {
            return response()->json(["message" => "Unauthorized. Only officers can manage positions."], 403);
        }

        $position = AvailablePosition::findOrFail($id);

        $valid = Validator::make($request->all(), [
            'position' => 'sometimes|string|max:255',
            'capacity' => 'sometimes|integer|min:1',
            'apply_capacity' => 'sometimes|integer|min:0',
        ]);

        if ($valid->fails()) {
            return response()->json([
                "message" => "Invalid field",
                "errors" => $valid->errors()
            ], 422);
        }

        $position->update($request->only(['position', 'capacity', 'apply_capacity']));

        return response()->json([
            'message' => 'Position updated successfully',
            'data' => $position->fresh()
        ], 200);
    }

    public function deleteAvailablePosition(Request $request, $id)
    {
        $validator = $this->getAuthenticatedValidator($request);

        if (!$validator || $validator->role !== 'officer') {
            return response()->json(["message" => "Unauthorized. Only officers can manage positions."], 403);
        }

        $position = AvailablePosition::findOrFail($id);

        // Cek apakah ada aplikasi di posisi ini
        $applicationCount = JobApplyPosition::where('position_id', $id)->count();

        if ($applicationCount > 0) {
            return response()->json([
                "message" => "Cannot delete position with active applications",
                "total_applications" => $applicationCount
            ], 400);
        }

        $position->delete();

        return response()->json([
            'message' => 'Position deleted successfully'
        ], 200);
    }

    // ============= APPLICATION MANAGEMENT =============

    public function getJobApplications(Request $request)
    {
        $validator = $this->getAuthenticatedValidator($request);

        if (!$validator || $validator->role !== 'officer') {
            return response()->json(["message" => "Unauthorized. Only officers can manage applications."], 403);
        }

        $query = JobApplyPosition::with([
            'society:id,name,id_card_number',
            'jobVacancy:id,company',
            'availablePosition:id,position'
        ]);

        // Filter
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('vacancy_id')) {
            $query->where('job_vacancy_id', $request->vacancy_id);
        }

        if ($request->has('position_id')) {
            $query->where('position_id', $request->position_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('society', function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('id_card_number', 'like', "%{$search}%");
            });
        }

        $perPage = $request->per_page ?? 20;
        $applications = $query->latest()->paginate($perPage);

        return response()->json([
            'message' => 'Applications retrieved successfully',
            'data' => $applications
        ], 200);
    }

    public function processApplication(Request $request, $id)
    {
        $validator = $this->getAuthenticatedValidator($request);

        if (!$validator || $validator->role !== 'officer') {
            return response()->json(["message" => "Unauthorized. Only officers can process applications."], 403);
        }

        $application = JobApplyPosition::findOrFail($id);

        if ($application->status !== 'pending') {
            return response()->json([
                "message" => "Application has already been " . $application->status
            ], 400);
        }

        $valid = Validator::make($request->all(), [
            'status' => 'required|in:accepted,rejected',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($valid->fails()) {
            return response()->json([
                "message" => "Invalid field",
                "errors" => $valid->errors()
            ], 422);
        }

        $application->update(['status' => $request->status]);

        // Kirim notifikasi ke society
        $society = Society::find($application->society_id);
        if ($society && $society->user) {
            $statusText = $request->status === 'accepted' ? 'accepted' : 'rejected';
            $notesText = $request->notes ? ". Notes: " . $request->notes : '';

            Notification::create([
                'user_id' => $society->user->id,
                'title' => 'Application ' . ucfirst($statusText),
                'message' => 'Your job application has been ' . $statusText . $notesText,
                'type' => 'application',
            ]);
        }

        return response()->json([
            'message' => 'Application processed successfully',
            'data' => $application->fresh()->load('society', 'availablePosition')
        ], 200);
    }

    public function bulkProcessApplications(Request $request)
    {
        $validator = $this->getAuthenticatedValidator($request);

        if (!$validator || $validator->role !== 'officer') {
            return response()->json(["message" => "Unauthorized. Only officers can process applications."], 403);
        }

        $valid = Validator::make($request->all(), [
            'application_ids' => 'required|array|min:1',
            'application_ids.*' => 'exists:job_apply_positions,id',
            'status' => 'required|in:accepted,rejected',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($valid->fails()) {
            return response()->json([
                "message" => "Invalid field",
                "errors" => $valid->errors()
            ], 422);
        }

        $applications = JobApplyPosition::whereIn('id', $request->application_ids)
            ->where('status', 'pending')
            ->get();

        $processed = 0;
        foreach ($applications as $application) {
            $application->update(['status' => $request->status]);
            $processed++;

            // Notifikasi ke society
            $society = Society::find($application->society_id);
            if ($society && $society->user) {
                Notification::create([
                    'user_id' => $society->user->id,
                    'title' => 'Application ' . ucfirst($request->status),
                    'message' => 'Your job application has been ' . $request->status . '.',
                    'type' => 'application',
                ]);
            }
        }

        return response()->json([
            'message' => 'Bulk processing completed',
            'data' => [
                'total_selected' => count($request->application_ids),
                'total_processed' => $processed,
                'status' => $request->status,
            ]
        ], 200);
    }

    // ============= REPORTS =============

    public function generateMyReport(Request $request)
    {
        $validator = $this->getAuthenticatedValidator($request);

        if (!$validator) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
        ]);

        $dateFrom = $request->date_from ? Carbon::parse($request->date_from) : Carbon::now()->startOfMonth();
        $dateTo = $request->date_to ? Carbon::parse($request->date_to) : Carbon::now();

        $report = [
            'generated_at' => Carbon::now()->toDateTimeString(),
            'generated_by' => $validator->name,
            'role' => $validator->role,
            'period' => [
                'from' => $dateFrom->toDateString(),
                'to' => $dateTo->toDateString(),
            ],
            'summary' => [
                'total_validations_processed' => Validation::where('validator_id', $validator->id)
                    ->whereBetween('updated_at', [$dateFrom, $dateTo])
                    ->whereIn('status', ['accepted', 'declined'])
                    ->count(),
                'validations_accepted' => Validation::where('validator_id', $validator->id)
                    ->whereBetween('updated_at', [$dateFrom, $dateTo])
                    ->where('status', 'accepted')
                    ->count(),
                'validations_declined' => Validation::where('validator_id', $validator->id)
                    ->whereBetween('updated_at', [$dateFrom, $dateTo])
                    ->where('status', 'declined')
                    ->count(),
            ],
            'validations' => Validation::where('validator_id', $validator->id)
                ->whereBetween('updated_at', [$dateFrom, $dateTo])
                ->with(['society:id,name', 'jobCategory:id,job_category'])
                ->latest()
                ->get(),
        ];

        // Tambahan untuk officer
        if ($validator->role === 'officer') {
            $report['application_summary'] = [
                'total_processed' => JobApplyPosition::whereBetween('updated_at', [$dateFrom, $dateTo])
                    ->whereIn('status', ['accepted', 'rejected'])
                    ->count(),
                'accepted' => JobApplyPosition::whereBetween('updated_at', [$dateFrom, $dateTo])
                    ->where('status', 'accepted')
                    ->count(),
                'rejected' => JobApplyPosition::whereBetween('updated_at', [$dateFrom, $dateTo])
                    ->where('status', 'rejected')
                    ->count(),
            ];
        }

        return response()->json([
            'message' => 'Report generated successfully',
            'data' => $report
        ], 200);
    }

    // ============= PROFILE =============

    public function getMyProfile(Request $request)
    {
        $validator = $this->getAuthenticatedValidator($request);

        if (!$validator) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $profile = [
            'id' => $validator->id,
            'name' => $validator->name,
            'email' => $validator->user->email ?? null,
            'employee_id' => $validator->employee_id,
            'phone' => $validator->phone,
            'role' => $validator->role,
            'is_active' => $validator->is_active,
            'regional' => $validator->regional ? [
                'id' => $validator->regional->id,
                'province' => $validator->regional->province,
                'district' => $validator->regional->district,
            ] : null,
            'last_login' => $validator->user->last_login_at ?? null,
            'created_at' => $validator->created_at,
        ];

        return response()->json([
            'message' => 'Profile retrieved successfully',
            'data' => $profile
        ], 200);
    }

    public function updateMyProfile(Request $request)
    {
        $validator = $this->getAuthenticatedValidator($request);

        if (!$validator) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $valid = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|nullable|string|max:20',
            'regional_id' => 'sometimes|exists:regionals,id',
        ]);

        if ($valid->fails()) {
            return response()->json([
                "message" => "Invalid field",
                "errors" => $valid->errors()
            ], 422);
        }

        $validator->update($request->only(['name', 'phone', 'regional_id']));

        return response()->json([
            'message' => 'Profile updated successfully',
            'data' => $validator->fresh()->load('regional', 'user')
        ], 200);
    }

    public function getJobCategories(Request $request)
    {
        $validator = $this->getAuthenticatedValidator($request);

        if (!$validator) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $categories = \App\Models\JobCategory::all();

        return response()->json([
            'message' => 'Job categories retrieved successfully',
            'data' => $categories
        ], 200);
    }

    public function getMyJobVacancyDetail(Request $request, $id)
    {
        $validator = $this->getAuthenticatedValidator($request);

        if (!$validator || $validator->role !== 'officer') {
            return response()->json(["message" => "Unauthorized"], 403);
        }

        $vacancy = JobVacancy::with(['jobCategory', 'availablePositions'])
            ->withCount(['jobApplySocieties'])
            ->findOrFail($id);

        return response()->json([
            'message' => 'Vacancy detail retrieved successfully',
            'data' => $vacancy
        ], 200);
    }
}
