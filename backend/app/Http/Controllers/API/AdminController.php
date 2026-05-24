<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\AvailablePosition;
use App\Models\JobApplyPosition;
use App\Models\JobApplySociety;
use App\Models\JobCategory;
use App\Models\JobVacancy;
use App\Models\Notification;
use App\Models\Regional;
use App\Models\Society;
use App\Models\User;
use App\Models\Validation;
use App\Models\Validator;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;


class AdminController extends Controller
{

    public function dashboard()
    {
        $stats = [
            'total_societies' => Society::count(),
            'total_validators' => Validator::where('role', 'validator')->count(),
            'total_officers' => Validator::where('role', 'officer')->count(),
            'total_job_categories' => JobCategory::where('is_active', true)->count(),
            'total_regionals' => Regional::count(),
            'total_job_vacancies' => JobVacancy::count(),
            'total_applications' => JobApplySociety::count(),
            'pending_validations' => Validation::where('status', 'pending')->count(),
            'pending_applications' => JobApplyPosition::where('status', 'pending')->count(),
            'recent_validations' => Validation::with(['society:id,name', 'validator:id,name'])
                ->latest()
                ->take(5)
                ->get(),
            'recent_applications' => JobApplySociety::with(['society:id,name', 'jobVacancy:id,company'])
                ->latest()
                ->take(5)
                ->get(),
        ];

        return response()->json([
            'message' => 'Dashboard data retrieved successfully',
            'data' => $stats
        ], 200);
    }

    public function getStatistics()
    {
        $statistics = [
            'validation_stats' => [
                'total' => Validation::count(),
                'pending' => Validation::where('status', 'pending')->count(),
                'accepted' => Validation::where('status', 'accepted')->count(),
                'declined' => Validation::where('status', 'declined')->count(),
                'by_category' => Validation::select('job_category_id', DB::raw('count(*) as total'))
                    ->with('jobCategory:id,job_category')
                    ->groupBy('job_category_id')
                    ->get()
            ],

            'application_stats' => [
                'total' => JobApplyPosition::count(),
                'pending' => JobApplyPosition::where('status', 'pending')->count(),
                'accepted' => JobApplyPosition::where('status', 'accepted')->count(),
                'rejected' => JobApplyPosition::where('status', 'rejected')->count(),
            ],

            'user_stats' => [
                'new_societies_this_month' => Society::whereMonth('created_at', Carbon::now()->month)
                    ->whereYear('created_at', Carbon::now()->year)
                    ->count(),
                'active_validators' => Validator::where('is_active', true)->count(),
                'total_users' => User::count(),
                'active_users' => User::where('is_active', true)->count(),
            ],

            'vacancy_stats' => [
                'total' => JobVacancy::count(),
                'by_category' => JobVacancy::select('job_category_id', DB::raw('count(*) as total'))
                    ->with('jobCategory:id,job_category')
                    ->groupBy('job_category_id')
                    ->get(),
                'most_applied' => JobVacancy::withCount('jobApplySocieties')
                    ->orderBy('job_apply_societies_count', 'desc')
                    ->take(5)
                    ->get(['id', 'company', 'job_apply_societies_count'])
            ],

            'monthly_stats' => [
                'applications_per_month' => JobApplySociety::select(
                        DB::raw('MONTH(date) as month'),
                        DB::raw('YEAR(date) as year'),
                        DB::raw('count(*) as total')
                    )
                    ->groupBy('year', 'month')
                    ->orderBy('year', 'desc')
                    ->orderBy('month', 'desc')
                    ->take(12)
                    ->get(),

                'validations_per_month' => Validation::select(
                        DB::raw('MONTH(created_at) as month'),
                        DB::raw('YEAR(created_at) as year'),
                        DB::raw('count(*) as total')
                    )
                    ->groupBy('year', 'month')
                    ->orderBy('year', 'desc')
                    ->orderBy('month', 'desc')
                    ->take(12)
                    ->get(),
            ]
        ];

        return response()->json([
            'message' => 'Statistics retrieved successfully',
            'data' => $statistics
        ], 200);
    }

    public function createValidator(Request $request)
    {
        $request->validate([
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'name' => 'required|string|max:255',
            'employee_id' => 'required|string|unique:validators,employee_id',
            'phone' => 'nullable|string|max:20',
            'regional_id' => 'required|exists:regionals,id',
        ]);

        try {
            DB::beginTransaction();

            // Buat user dulu
            $user = User::create([
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'validator',
                'userable_type' => 'App\Models\Validator',
                'userable_id' => 0,
                'is_active' => true,
            ]);

            $validator = Validator::create([
                'user_id' => $user->id,
                'regional_id' => $request->regional_id,
                'role' => 'validator',
                'name' => $request->name,
                'employee_id' => $request->employee_id,
                'phone' => $request->phone,
                'is_active' => true,
            ]);

            $user->update(['userable_id' => $validator->id]);

            Notification::create([
                'user_id' => $user->id,
                'title' => 'Account Created',
                'message' => 'Your validator account has been created successfully.',
                'type' => 'system',
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Validator created successfully',
                'data' => [
                    'id' => $validator->id,
                    'name' => $validator->name,
                    'email' => $user->email,
                    'employee_id' => $validator->employee_id,
                    'phone' => $validator->phone,
                    'role' => $validator->role,
                    'regional' => $validator->regional,
                    'is_active' => $validator->is_active,
                    'created_at' => $validator->created_at,
                ]
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create validator',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getAllValidators()
    {
        $validators = Validator::with(['user:id,email,is_active', 'regional:id,province,district'])
            ->where('role', 'validator')
            ->get()
            ->map(function ($validator) {
                return [
                    'id' => $validator->id,
                    'name' => $validator->name,
                    'email' => $validator->user->email ?? null,
                    'employee_id' => $validator->employee_id,
                    'phone' => $validator->phone,
                    'role' => $validator->role,
                    'is_active' => $validator->is_active,
                    'regional' => $validator->regional,
                    'total_validations' => Validation::where('validator_id', $validator->id)->count(),
                    'created_at' => $validator->created_at,
                ];
            });

        return response()->json([
            'message' => 'Validators retrieved successfully',
            'data' => $validators
        ], 200);
    }

    public function getValidatorById($id)
    {
        $validator = Validator::with(['user:id,email,is_active,last_login_at', 'regional'])
            ->where('role', 'validator')
            ->findOrFail($id);

        $data = [
            'id' => $validator->id,
            'name' => $validator->name,
            'email' => $validator->user->email ?? null,
            'employee_id' => $validator->employee_id,
            'phone' => $validator->phone,
            'role' => $validator->role,
            'is_active' => $validator->is_active,
            'regional' => $validator->regional,
            'last_login' => $validator->user->last_login_at ?? null,
            'validation_stats' => [
                'total' => Validation::where('validator_id', $validator->id)->count(),
                'accepted' => Validation::where('validator_id', $validator->id)->where('status', 'accepted')->count(),
                'declined' => Validation::where('validator_id', $validator->id)->where('status', 'declined')->count(),
                'pending' => Validation::where('validator_id', $validator->id)->where('status', 'pending')->count(),
            ],
            'recent_validations' => Validation::where('validator_id', $validator->id)
                ->with(['society:id,name', 'jobCategory:id,job_category'])
                ->latest()
                ->take(10)
                ->get(),
            'created_at' => $validator->created_at,
            'updated_at' => $validator->updated_at,
        ];

        return response()->json([
            'message' => 'Validator retrieved successfully',
            'data' => $data
        ], 200);
    }

    public function updateValidator(Request $request, $id)
    {
        $validator = Validator::where('role', 'validator')->findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|nullable|string|max:20',
            'regional_id' => 'sometimes|exists:regionals,id',
            'employee_id' => 'sometimes|string|unique:validators,employee_id,' . $id,
            'is_active' => 'sometimes|boolean',
        ]);

        $validator->update($request->only([
            'name', 'phone', 'regional_id', 'employee_id', 'is_active'
        ]));

        if ($request->has('is_active')) {
            $validator->user()->update(['is_active' => $request->is_active]);
        }

        return response()->json([
            'message' => 'Validator updated successfully',
            'data' => $validator->fresh()->load('user:id,email,is_active', 'regional')
        ], 200);
    }

    public function deleteValidator($id)
    {
        $validator = Validator::where('role', 'validator')->findOrFail($id);

        try {
            DB::beginTransaction();
            Validation::where('validator_id', $validator->id)
                ->update(['validator_id' => null]);

            $validator->user()->delete();

            $validator->delete();

            DB::commit();

            return response()->json([
                'message' => 'Validator deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete validator',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function toggleValidatorStatus($id)
    {
        $validator = Validator::where('role', 'validator')->findOrFail($id);

        $newStatus = !$validator->is_active;

        $validator->update(['is_active' => $newStatus]);
        $validator->user()->update(['is_active' => $newStatus]);

        return response()->json([
            'message' => 'Validator status ' . ($newStatus ? 'activated' : 'deactivated') . ' successfully',
            'data' => [
                'id' => $validator->id,
                'name' => $validator->name,
                'is_active' => $newStatus
            ]
        ], 200);
    }

    public function createOfficer(Request $request)
    {
        $request->validate([
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'name' => 'required|string|max:255',
            'employee_id' => 'required|string|unique:validators,employee_id',
            'phone' => 'nullable|string|max:20',
            'regional_id' => 'required|exists:regionals,id',
        ]);

        try {
            DB::beginTransaction();

            $user = User::create([
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'officer',
                'userable_type' => 'App\Models\Validator',
                'userable_id' => 0,
                'is_active' => true,
            ]);

            $officer = Validator::create([
                'user_id' => $user->id,
                'regional_id' => $request->regional_id,
                'role' => 'officer',
                'name' => $request->name,
                'employee_id' => $request->employee_id,
                'phone' => $request->phone,
                'is_active' => true,
            ]);

            $user->update(['userable_id' => $officer->id]);

            Notification::create([
                'user_id' => $user->id,
                'title' => 'Account Created',
                'message' => 'Your officer account has been created successfully.',
                'type' => 'system',
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Officer created successfully',
                'data' => [
                    'id' => $officer->id,
                    'name' => $officer->name,
                    'email' => $user->email,
                    'employee_id' => $officer->employee_id,
                    'phone' => $officer->phone,
                    'role' => $officer->role,
                    'regional' => $officer->regional,
                    'is_active' => $officer->is_active,
                    'created_at' => $officer->created_at,
                ]
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create officer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getAllOfficers()
    {
        $officers = Validator::with(['user:id,email,is_active', 'regional:id,province,district'])
            ->where('role', 'officer')
            ->get()
            ->map(function ($officer) {
                return [
                    'id' => $officer->id,
                    'name' => $officer->name,
                    'email' => $officer->user->email ?? null,
                    'employee_id' => $officer->employee_id,
                    'phone' => $officer->phone,
                    'role' => $officer->role,
                    'is_active' => $officer->is_active,
                    'regional' => $officer->regional,
                    'total_validations' => Validation::where('validator_id', $officer->id)->count(),
                    'created_at' => $officer->created_at,
                ];
            });

        return response()->json([
            'message' => 'Officers retrieved successfully',
            'data' => $officers
        ], 200);
    }

    public function getOfficerById($id)
    {
        $officer = Validator::with(['user:id,email,is_active,last_login_at', 'regional'])
            ->where('role', 'officer')
            ->findOrFail($id);

        $data = [
            'id' => $officer->id,
            'name' => $officer->name,
            'email' => $officer->user->email ?? null,
            'employee_id' => $officer->employee_id,
            'phone' => $officer->phone,
            'role' => $officer->role,
            'is_active' => $officer->is_active,
            'regional' => $officer->regional,
            'last_login' => $officer->user->last_login_at ?? null,
            'validation_stats' => [
                'total' => Validation::where('validator_id', $officer->id)->count(),
                'accepted' => Validation::where('validator_id', $officer->id)->where('status', 'accepted')->count(),
                'declined' => Validation::where('validator_id', $officer->id)->where('status', 'declined')->count(),
                'pending' => Validation::where('validator_id', $officer->id)->where('status', 'pending')->count(),
            ],
            'recent_validations' => Validation::where('validator_id', $officer->id)
                ->with(['society:id,name', 'jobCategory:id,job_category'])
                ->latest()
                ->take(10)
                ->get(),
            'created_at' => $officer->created_at,
            'updated_at' => $officer->updated_at,
        ];

        return response()->json([
            'message' => 'Officer retrieved successfully',
            'data' => $data
        ], 200);
    }

    public function updateOfficer(Request $request, $id)
    {
        $officer = Validator::where('role', 'officer')->findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|nullable|string|max:20',
            'regional_id' => 'sometimes|exists:regionals,id',
            'employee_id' => 'sometimes|string|unique:validators,employee_id,' . $id,
            'is_active' => 'sometimes|boolean',
        ]);

        $officer->update($request->only([
            'name', 'phone', 'regional_id', 'employee_id', 'is_active'
        ]));

        if ($request->has('is_active')) {
            $officer->user()->update(['is_active' => $request->is_active]);
        }

        return response()->json([
            'message' => 'Officer updated successfully',
            'data' => $officer->fresh()->load('user:id,email,is_active', 'regional')
        ], 200);
    }

    public function deleteOfficer($id)
    {
        $officer = Validator::where('role', 'officer')->findOrFail($id);

        try {
            DB::beginTransaction();

            Validation::where('validator_id', $officer->id)
                ->update(['validator_id' => null]);

            $officer->user()->delete();
            $officer->delete();

            DB::commit();

            return response()->json([
                'message' => 'Officer deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete officer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function toggleOfficerStatus($id)
    {
        $officer = Validator::where('role', 'officer')->findOrFail($id);

        $newStatus = !$officer->is_active;

        $officer->update(['is_active' => $newStatus]);
        $officer->user()->update(['is_active' => $newStatus]);

        return response()->json([
            'message' => 'Officer status ' . ($newStatus ? 'activated' : 'deactivated') . ' successfully',
            'data' => [
                'id' => $officer->id,
                'name' => $officer->name,
                'is_active' => $newStatus
            ]
        ], 200);
    }

    public function createJobCategory(Request $request)
    {
        $request->validate([
            'job_category' => 'required|string|max:255|unique:job_categories,job_category',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $category = JobCategory::create([
            'job_category' => $request->job_category,
            'description' => $request->description,
            'is_active' => $request->is_active ?? true
        ]);

        return response()->json([
            'message' => 'Job category created successfully',
            'data' => $category
        ], 201);
    }

    public function getAllJobCategories()
    {
        $categories = JobCategory::withCount(['validations', 'jobVacancies'])
            ->get()
            ->map(function ($category) {
                return [
                    'id' => $category->id,
                    'job_category' => $category->job_category,
                    'description' => $category->description,
                    'is_active' => $category->is_active,
                    'total_validations' => $category->validations_count,
                    'total_vacancies' => $category->job_vacancies_count,
                    'created_at' => $category->created_at,
                ];
            });

        return response()->json([
            'message' => 'Job categories retrieved successfully',
            'data' => $categories
        ], 200);
    }

    public function getJobCategoryById($id)
    {
        $category = JobCategory::withCount(['validations', 'jobVacancies'])->findOrFail($id);

        $data = [
            'id' => $category->id,
            'job_category' => $category->job_category,
            'description' => $category->description,
            'is_active' => $category->is_active,
            'total_validations' => $category->validations_count,
            'total_vacancies' => $category->job_vacancies_count,
            'recent_validations' => Validation::where('job_category_id', $id)
                ->with(['society:id,name', 'validator:id,name'])
                ->latest()
                ->take(10)
                ->get(),
            'active_vacancies' => JobVacancy::where('job_category_id', $id)
                ->withCount('jobApplySocieties')
                ->latest()
                ->take(10)
                ->get(),
            'created_at' => $category->created_at,
            'updated_at' => $category->updated_at,
        ];

        return response()->json([
            'message' => 'Job category retrieved successfully',
            'data' => $data
        ], 200);
    }

    public function updateJobCategory(Request $request, $id)
    {
        $category = JobCategory::findOrFail($id);

        $request->validate([
            'job_category' => 'sometimes|string|max:255|unique:job_categories,job_category,' . $id,
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean'
        ]);

        $category->update($request->all());

        return response()->json([
            'message' => 'Job category updated successfully',
            'data' => $category->fresh()
        ], 200);
    }

    public function deleteJobCategory($id)
    {
        $category = JobCategory::findOrFail($id);

        $validationCount = Validation::where('job_category_id', $id)->count();
        $vacancyCount = JobVacancy::where('job_category_id', $id)->count();

        if ($validationCount > 0 || $vacancyCount > 0) {
            $category->update(['is_active' => false]);

            return response()->json([
                'message' => 'Job category deactivated because it is still in use',
                'data' => [
                    'category' => $category,
                    'validations_using' => $validationCount,
                    'vacancies_using' => $vacancyCount
                ]
            ], 200);
        }

        $category->delete();

        return response()->json([
            'message' => 'Job category deleted successfully'
        ], 200);
    }

    public function createRegional(Request $request)
    {
        $request->validate([
            'province' => 'required|string|max:255',
            'district' => 'required|string|max:255',
        ]);

        // Cek duplikat
        $exists = Regional::where('province', $request->province)
            ->where('district', $request->district)
            ->first();

        if ($exists) {
            return response()->json([
                'message' => 'Regional already exists',
                'data' => $exists
            ], 400);
        }

        $regional = Regional::create($request->all());

        return response()->json([
            'message' => 'Regional created successfully',
            'data' => $regional
        ], 201);
    }

    public function getAllRegionals()
    {
        $regionals = Regional::withCount(['societies', 'validators'])
            ->get()
            ->map(function ($regional) {
                return [
                    'id' => $regional->id,
                    'province' => $regional->province,
                    'district' => $regional->district,
                    'total_societies' => $regional->societies_count,
                    'total_validators' => $regional->validators_count,
                    'created_at' => $regional->created_at,
                ];
            });

        return response()->json([
            'message' => 'Regionals retrieved successfully',
            'data' => $regionals
        ], 200);
    }

    public function getRegionalById($id)
    {
        $regional = Regional::withCount(['societies', 'validators'])->findOrFail($id);

        $data = [
            'id' => $regional->id,
            'province' => $regional->province,
            'district' => $regional->district,
            'total_societies' => $regional->societies_count,
            'total_validators' => $regional->validators_count,
            'societies' => Society::where('regional_id', $id)
                ->select('id', 'name', 'id_card_number', 'gender')
                ->take(20)
                ->get(),
            'validators' => Validator::where('regional_id', $id)
                ->with('user:id,email')
                ->select('id', 'user_id', 'name', 'role', 'employee_id')
                ->take(20)
                ->get(),
            'created_at' => $regional->created_at,
            'updated_at' => $regional->updated_at,
        ];

        return response()->json([
            'message' => 'Regional retrieved successfully',
            'data' => $data
        ], 200);
    }

    public function updateRegional(Request $request, $id)
    {
        $regional = Regional::findOrFail($id);

        $request->validate([
            'province' => 'sometimes|string|max:255',
            'district' => 'sometimes|string|max:255',
        ]);

        $regional->update($request->all());

        return response()->json([
            'message' => 'Regional updated successfully',
            'data' => $regional->fresh()->loadCount(['societies', 'validators'])
        ], 200);
    }

    public function deleteRegional($id)
    {
        $regional = Regional::findOrFail($id);

        $societyCount = Society::where('regional_id', $id)->count();
        $validatorCount = Validator::where('regional_id', $id)->count();

        if ($societyCount > 0 || $validatorCount > 0) {
            return response()->json([
                'message' => 'Cannot delete regional. It is still being used.',
                'data' => [
                    'societies_using' => $societyCount,
                    'validators_using' => $validatorCount
                ]
            ], 400);
        }

        $regional->delete();

        return response()->json([
            'message' => 'Regional deleted successfully'
        ], 200);
    }

    // ============= SOCIETY MANAGEMENT =============

    public function getAllSocieties(Request $request)
    {
        $query = Society::with(['regional:id,province,district', 'user:id,email,is_active,last_login_at']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('id_card_number', 'like', "%{$search}%");
            });
        }

        if ($request->has('regional_id')) {
            $query->where('regional_id', $request->regional_id);
        }

        if ($request->has('gender')) {
            $query->where('gender', $request->gender);
        }

        $perPage = $request->per_page ?? 15;
        $societies = $query->latest()->paginate($perPage);

        $societies->getCollection()->transform(function ($society) {
            return [
                'id' => $society->id,
                'id_card_number' => $society->id_card_number,
                'name' => $society->name,
                'email' => $society->user->email ?? null,
                'born_date' => $society->born_date,
                'gender' => $society->gender,
                'address' => $society->address,
                'regional' => $society->regional,
                'is_active' => $society->user->is_active ?? false,
                'last_login' => $society->user->last_login_at ?? null,
                'total_applications' => JobApplySociety::where('society_id', $society->id)->count(),
                'total_validations' => Validation::where('society_id', $society->id)->count(),
                'created_at' => $society->created_at,
            ];
        });

        return response()->json([
            'message' => 'Societies retrieved successfully',
            'data' => $societies
        ], 200);
    }

    public function getSocietyById($id)
    {
        $society = Society::with(['regional', 'user:id,email,is_active,last_login_at'])->findOrFail($id);

        $data = [
            'id' => $society->id,
            'id_card_number' => $society->id_card_number,
            'name' => $society->name,
            'email' => $society->user->email ?? null,
            'born_date' => $society->born_date,
            'gender' => $society->gender,
            'address' => $society->address,
            'regional' => $society->regional,
            'is_active' => $society->user->is_active ?? false,
            'last_login' => $society->user->last_login_at ?? null,
            'applications' => JobApplySociety::where('society_id', $id)
                ->with(['jobVacancy:id,company,address', 'jobApplyPositions'])
                ->latest()
                ->get(),
            'validations' => Validation::where('society_id', $id)
                ->with(['jobCategory:id,job_category', 'validator:id,name'])
                ->latest()
                ->get(),
            'created_at' => $society->created_at,
            'updated_at' => $society->updated_at,
        ];

        return response()->json([
            'message' => 'Society retrieved successfully',
            'data' => $data
        ], 200);
    }

    public function updateSociety(Request $request, $id)
    {
        $society = Society::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'born_date' => 'sometimes|date',
            'gender' => 'sometimes|in:male,female',
            'address' => 'sometimes|string',
            'regional_id' => 'sometimes|exists:regionals,id',
        ]);

        $society->update($request->only([
            'name', 'born_date', 'gender', 'address', 'regional_id'
        ]));

        return response()->json([
            'message' => 'Society updated successfully',
            'data' => $society->fresh()->load('regional')
        ], 200);
    }

    public function deleteSociety($id)
    {
        $society = Society::findOrFail($id);

        try {
            DB::beginTransaction();

            JobApplyPosition::where('society_id', $id)->delete();
            JobApplySociety::where('society_id', $id)->delete();
            Validation::where('society_id', $id)->delete();

            if ($society->user) {
                Notification::where('user_id', $society->user->id)->delete();
                $society->user()->delete();
            }

            $society->delete();

            DB::commit();

            return response()->json([
                'message' => 'Society deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete society',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function deactivateSociety($id)
    {
        $society = Society::findOrFail($id);

        if ($society->user) {
            $society->user->update(['is_active' => false]);

            Notification::create([
                'user_id' => $society->user->id,
                'title' => 'Account Deactivated',
                'message' => 'Your account has been deactivated by admin.',
                'type' => 'system',
            ]);
        }

        return response()->json([
            'message' => 'Society deactivated successfully',
            'data' => ['id' => $society->id, 'is_active' => false]
        ], 200);
    }

    public function activateSociety($id)
    {
        $society = Society::findOrFail($id);

        if ($society->user) {
            $society->user->update(['is_active' => true]);

            Notification::create([
                'user_id' => $society->user->id,
                'title' => 'Account Activated',
                'message' => 'Your account has been activated by admin.',
                'type' => 'system',
            ]);
        }

        return response()->json([
            'message' => 'Society activated successfully',
            'data' => ['id' => $society->id, 'is_active' => true]
        ], 200);
    }

    public function getAllValidations(Request $request)
    {
        $query = Validation::with([
            'society:id,name,id_card_number',
            'validator:id,name',
            'jobCategory:id,job_category'
        ]);

        // Filter
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('validator_id')) {
            $query->where('validator_id', $request->validator_id);
        }

        if ($request->has('society_id')) {
            $query->where('society_id', $request->society_id);
        }

        if ($request->has('job_category_id')) {
            $query->where('job_category_id', $request->job_category_id);
        }

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $sortBy = $request->sort_by ?? 'created_at';
        $sortOrder = $request->sort_order ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        $perPage = $request->per_page ?? 20;
        $validations = $query->paginate($perPage);

        return response()->json([
            'message' => 'Validations retrieved successfully',
            'data' => $validations
        ], 200);
    }

    public function getValidationById($id)
    {
        $validation = Validation::with([
            'society:id,name,id_card_number,gender,address',
            'validator:id,name,employee_id',
            'jobCategory:id,job_category'
        ])->findOrFail($id);

        return response()->json([
            'message' => 'Validation retrieved successfully',
            'data' => $validation
        ], 200);
    }

    public function getValidationStats()
    {
        $stats = [
            'total' => Validation::count(),
            'by_status' => [
                'pending' => Validation::where('status', 'pending')->count(),
                'accepted' => Validation::where('status', 'accepted')->count(),
                'declined' => Validation::where('status', 'declined')->count(),
            ],
            'by_category' => Validation::select('job_category_id', DB::raw('count(*) as total'))
                ->groupBy('job_category_id')
                ->with('jobCategory:id,job_category')
                ->get(),
            'by_validator' => Validation::select('validator_id', DB::raw('count(*) as total'))
                ->whereNotNull('validator_id')
                ->groupBy('validator_id')
                ->with('validator:id,name')
                ->orderBy('total', 'desc')
                ->take(10)
                ->get(),
            'daily_stats' => Validation::select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('count(*) as total'),
                    DB::raw('SUM(CASE WHEN status = "accepted" THEN 1 ELSE 0 END) as accepted'),
                    DB::raw('SUM(CASE WHEN status = "declined" THEN 1 ELSE 0 END) as declined'),
                    DB::raw('SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending')
                )
                ->groupBy('date')
                ->orderBy('date', 'desc')
                ->take(30)
                ->get()
        ];

        return response()->json([
            'message' => 'Validation statistics retrieved successfully',
            'data' => $stats
        ], 200);
    }

    public function getAllJobVacancies(Request $request)
    {
        $query = JobVacancy::with(['jobCategory:id,job_category', 'availablePositions'])
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

        $perPage = $request->per_page ?? 20;
        $vacancies = $query->latest()->paginate($perPage);

        return response()->json([
            'message' => 'Job vacancies retrieved successfully',
            'data' => $vacancies
        ], 200);
    }

    public function getJobVacancyById($id)
    {
        $vacancy = JobVacancy::with([
            'jobCategory:id,job_category',
            'availablePositions',
            'jobApplySocieties' => function($query) {
                $query->with(['society:id,name,id_card_number', 'jobApplyPositions'])
                    ->latest()
                    ->take(20);
            }
        ])
        ->withCount(['jobApplySocieties', 'availablePositions'])
        ->findOrFail($id);

        return response()->json([
            'message' => 'Job vacancy retrieved successfully',
            'data' => $vacancy
        ], 200);
    }

    public function createJobVacancy(Request $request)
    {
        $request->validate([
            'job_category_id' => 'required|exists:job_categories,id',
            'company' => 'required|string|max:255',
            'address' => 'required|string',
            'description' => 'required|string',
            'positions' => 'required|array|min:1',
            'positions.*.position' => 'required|string|max:255',
            'positions.*.capacity' => 'required|integer|min:1',
            'positions.*.apply_capacity' => 'required|integer|min:0',
        ]);

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

            DB::commit();

            return response()->json([
                'message' => 'Job vacancy created successfully',
                'data' => $vacancy->load('availablePositions')
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
        $vacancy = JobVacancy::findOrFail($id);

        $request->validate([
            'job_category_id' => 'sometimes|exists:job_categories,id',
            'company' => 'sometimes|string|max:255',
            'address' => 'sometimes|string',
            'description' => 'sometimes|string',
        ]);

        $vacancy->update($request->only([
            'job_category_id', 'company', 'address', 'description'
        ]));

        return response()->json([
            'message' => 'Job vacancy updated successfully',
            'data' => $vacancy->fresh()->load('availablePositions')
        ], 200);
    }

    public function deleteJobVacancy($id)
    {
        $vacancy = JobVacancy::findOrFail($id);

        try {
            DB::beginTransaction();

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

    public function getJobVacancyStats()
    {
        $stats = [
            'total_vacancies' => JobVacancy::count(),
            'total_positions' => AvailablePosition::count(),
            'total_applications' => JobApplySociety::count(),
            'by_category' => JobVacancy::select('job_category_id', DB::raw('count(*) as total'))
                ->groupBy('job_category_id')
                ->with('jobCategory:id,job_category')
                ->get(),
            'most_applied' => JobVacancy::withCount('jobApplySocieties')
                ->orderBy('job_apply_societies_count', 'desc')
                ->take(10)
                ->get(['id', 'company', 'job_apply_societies_count']),
            'applications_by_status' => [
                'pending' => JobApplyPosition::where('status', 'pending')->count(),
                'accepted' => JobApplyPosition::where('status', 'accepted')->count(),
                'rejected' => JobApplyPosition::where('status', 'rejected')->count(),
            ]
        ];

        return response()->json([
            'message' => 'Job vacancy statistics retrieved successfully',
            'data' => $stats
        ], 200);
    }

    public function generateReport(Request $request)
    {
        $request->validate([
            'type' => 'required|in:daily,weekly,monthly,yearly',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'format' => 'nullable|in:json,pdf',
        ]);

        // Tentukan periode berdasarkan type
        $dateFrom = $request->date_from ? Carbon::parse($request->date_from) : $this->getDefaultDateFrom($request->type);
        $dateTo = $request->date_to ? Carbon::parse($request->date_to) : Carbon::now();

        $report = [
            'report_type' => $request->type,
            'period' => [
                'from' => $dateFrom->toDateString(),
                'to' => $dateTo->toDateString(),
            ],
            'generated_at' => Carbon::now()->toDateTimeString(),
            'generated_by' => $request->user()->email ?? 'System',
            'summary' => [
                'new_societies' => Society::whereBetween('created_at', [$dateFrom, $dateTo])->count(),
                'total_societies' => Society::count(),
                'new_validations' => Validation::whereBetween('created_at', [$dateFrom, $dateTo])->count(),
                'validations_completed' => Validation::whereBetween('created_at', [$dateFrom, $dateTo])
                    ->whereIn('status', ['accepted', 'declined'])
                    ->count(),
                'validations_pending' => Validation::where('status', 'pending')->count(),
                'validation_acceptance_rate' => $this->calculateAcceptanceRate($dateFrom, $dateTo),
                'new_applications' => JobApplySociety::whereBetween('date', [$dateFrom, $dateTo])->count(),
                'applications_accepted' => JobApplyPosition::whereBetween('created_at', [$dateFrom, $dateTo])
                    ->where('status', 'accepted')
                    ->count(),
                'applications_rejected' => JobApplyPosition::whereBetween('created_at', [$dateFrom, $dateTo])
                    ->where('status', 'rejected')
                    ->count(),
                'applications_pending' => JobApplyPosition::where('status', 'pending')->count(),
                'new_job_vacancies' => JobVacancy::whereBetween('created_at', [$dateFrom, $dateTo])->count(),
                'active_job_vacancies' => JobVacancy::count(),
            ],
            'details' => [
                'validations_by_status' => $this->getValidationsByStatus($dateFrom, $dateTo),
                'applications_by_status' => $this->getApplicationsByStatus($dateFrom, $dateTo),
                'top_job_categories' => $this->getTopJobCategories($dateFrom, $dateTo),
                'top_companies' => $this->getTopCompanies($dateFrom, $dateTo),
                'new_societies_list' => Society::whereBetween('created_at', [$dateFrom, $dateTo])
                    ->select('id', 'name', 'id_card_number', 'gender', 'created_at')
                    ->with('regional:id,province,district')
                    ->latest()
                    ->get(),
            ]
        ];

        // Jika request format PDF
        if ($request->format === 'pdf') {
            return $this->generatePDFReport($report);
        }

        // Default return JSON
        return response()->json([
            'message' => 'Report generated successfully',
            'data' => $report
        ], 200);
    }

    public function exportData(Request $request)
    {
        $request->validate([
            'type' => 'required|in:societies,validators,officers,validations,applications,vacancies,full_report',
            'format' => 'required|in:json,csv,pdf',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
        ]);

        // Jika full_report, gunakan generateReport
        if ($request->type === 'full_report') {
            return $this->generateReport($request);
        }

        $dateFrom = $request->date_from ? Carbon::parse($request->date_from) : Carbon::now()->subMonth();
        $dateTo = $request->date_to ? Carbon::parse($request->date_to) : Carbon::now();

        $data = [];
        $title = '';

        switch ($request->type) {
            case 'societies':
                $title = 'Societies Data Export';
                $data = Society::with('regional')
                    ->whereBetween('created_at', [$dateFrom, $dateTo])
                    ->get()
                    ->map(function($item) {
                        return [
                            'ID Card Number' => $item->id_card_number,
                            'Name' => $item->name,
                            'Gender' => $item->gender,
                            'Born Date' => $item->born_date,
                            'Address' => $item->address,
                            'Province' => $item->regional->province ?? '',
                            'District' => $item->regional->district ?? '',
                            'Registered At' => $item->created_at->format('Y-m-d H:i:s'),
                        ];
                    });
                break;

            case 'validators':
                $title = 'Validators Data Export';
                $data = Validator::where('role', 'validator')
                    ->with(['user', 'regional'])
                    ->whereBetween('created_at', [$dateFrom, $dateTo])
                    ->get()
                    ->map(function($item) {
                        return [
                            'Employee ID' => $item->employee_id,
                            'Name' => $item->name,
                            'Email' => $item->user->email ?? '',
                            'Phone' => $item->phone,
                            'Province' => $item->regional->province ?? '',
                            'District' => $item->regional->district ?? '',
                            'Status' => $item->is_active ? 'Active' : 'Inactive',
                            'Registered At' => $item->created_at->format('Y-m-d H:i:s'),
                        ];
                    });
                break;

            case 'officers':
                $title = 'Officers Data Export';
                $data = Validator::where('role', 'officer')
                    ->with(['user', 'regional'])
                    ->whereBetween('created_at', [$dateFrom, $dateTo])
                    ->get()
                    ->map(function($item) {
                        return [
                            'Employee ID' => $item->employee_id,
                            'Name' => $item->name,
                            'Email' => $item->user->email ?? '',
                            'Phone' => $item->phone,
                            'Province' => $item->regional->province ?? '',
                            'District' => $item->regional->district ?? '',
                            'Status' => $item->is_active ? 'Active' : 'Inactive',
                            'Registered At' => $item->created_at->format('Y-m-d H:i:s'),
                        ];
                    });
                break;

            case 'validations':
                $title = 'Validations Data Export';
                $data = Validation::with(['society', 'validator', 'jobCategory'])
                    ->whereBetween('created_at', [$dateFrom, $dateTo])
                    ->get()
                    ->map(function($item) {
                        return [
                            'ID' => $item->id,
                            'Society' => $item->society->name ?? '',
                            'Job Category' => $item->jobCategory->job_category ?? '',
                            'Job Position' => $item->job_position,
                            'Validator' => $item->validator->name ?? 'Unassigned',
                            'Status' => ucfirst($item->status),
                            'Notes' => $item->validator_notes,
                            'Created At' => $item->created_at->format('Y-m-d H:i:s'),
                        ];
                    });
                break;

            case 'applications':
                $title = 'Applications Data Export';
                $data = JobApplySociety::with(['society', 'jobVacancy'])
                    ->whereBetween('date', [$dateFrom, $dateTo])
                    ->get()
                    ->map(function($item) {
                        return [
                            'ID' => $item->id,
                            'Applicant' => $item->society->name ?? '',
                            'Company' => $item->jobVacancy->company ?? '',
                            'Position' => $item->jobApplyPositions->first()->position->position ?? '',
                            'Status' => $item->jobApplyPositions->first()->status ?? 'pending',
                            'Date' => $item->date,
                            'Notes' => $item->notes,
                        ];
                    });
                break;

            case 'vacancies':
                $title = 'Job Vacancies Data Export';
                $data = JobVacancy::with(['jobCategory', 'availablePositions'])
                    ->whereBetween('created_at', [$dateFrom, $dateTo])
                    ->get()
                    ->map(function($item) {
                        return [
                            'ID' => $item->id,
                            'Company' => $item->company,
                            'Category' => $item->jobCategory->job_category ?? '',
                            'Address' => $item->address,
                            'Total Positions' => $item->availablePositions->count(),
                            'Total Capacity' => $item->availablePositions->sum('capacity'),
                            'Total Applicants' => $item->jobApplySocieties->count(),
                            'Created At' => $item->created_at->format('Y-m-d H:i:s'),
                        ];
                    });
                break;
        }

        // Generate sesuai format
        if ($request->format === 'pdf') {
            $exportData = [
                'title' => $title,
                'period' => [
                    'from' => $dateFrom->toDateString(),
                    'to' => $dateTo->toDateString(),
                ],
                'generated_at' => Carbon::now()->toDateTimeString(),
                'total_records' => count($data),
                'data' => $data,
            ];

            return $this->generateExportPDF($exportData);
        }

        if ($request->format === 'csv') {
            return $this->generateCSV($data, Str::slug($title));
        }

        return response()->json([
            'message' => 'Data exported successfully',
            'type' => $request->type,
            'format' => $request->format,
            'total_records' => count($data),
            'data' => $data
        ], 200);
    }

    // ============= PRIVATE HELPER METHODS FOR REPORT =============

    private function getDefaultDateFrom($type)
    {
        switch ($type) {
            case 'daily':
                return Carbon::now()->startOfDay();
            case 'weekly':
                return Carbon::now()->startOfWeek();
            case 'monthly':
                return Carbon::now()->startOfMonth();
            case 'yearly':
                return Carbon::now()->startOfYear();
            default:
                return Carbon::now()->startOfMonth();
        }
    }

    private function calculateAcceptanceRate($dateFrom, $dateTo)
    {
        $total = Validation::whereBetween('created_at', [$dateFrom, $dateTo])
            ->whereIn('status', ['accepted', 'declined'])
            ->count();

        if ($total === 0) return 0;

        $accepted = Validation::whereBetween('created_at', [$dateFrom, $dateTo])
            ->where('status', 'accepted')
            ->count();

        return round(($accepted / $total) * 100, 2) . '%';
    }

    private function getValidationsByStatus($dateFrom, $dateTo)
    {
        return [
            'pending' => Validation::where('status', 'pending')->count(),
            'accepted' => Validation::whereBetween('created_at', [$dateFrom, $dateTo])
                ->where('status', 'accepted')
                ->count(),
            'declined' => Validation::whereBetween('created_at', [$dateFrom, $dateTo])
                ->where('status', 'declined')
                ->count(),
        ];
    }

    private function getApplicationsByStatus($dateFrom, $dateTo)
    {
        return [
            'pending' => JobApplyPosition::where('status', 'pending')->count(),
            'accepted' => JobApplyPosition::whereBetween('created_at', [$dateFrom, $dateTo])
                ->where('status', 'accepted')
                ->count(),
            'rejected' => JobApplyPosition::whereBetween('created_at', [$dateFrom, $dateTo])
                ->where('status', 'rejected')
                ->count(),
        ];
    }

    private function getTopJobCategories($dateFrom, $dateTo, $limit = 5)
    {
        return JobCategory::whereHas('validations', function($query) use ($dateFrom, $dateTo) {
                $query->whereBetween('created_at', [$dateFrom, $dateTo]);
            })
            ->withCount(['validations' => function($query) use ($dateFrom, $dateTo) {
                $query->whereBetween('created_at', [$dateFrom, $dateTo]);
            }])
            ->orderBy('validations_count', 'desc')
            ->take($limit)
            ->get(['id', 'job_category', 'validations_count']);
    }

    private function getTopCompanies($dateFrom, $dateTo, $limit = 5)
    {
        return JobVacancy::whereHas('jobApplySocieties', function($query) use ($dateFrom, $dateTo) {
                $query->whereBetween('date', [$dateFrom, $dateTo]);
            })
            ->withCount(['jobApplySocieties' => function($query) use ($dateFrom, $dateTo) {
                $query->whereBetween('date', [$dateFrom, $dateTo]);
            }])
            ->orderBy('job_apply_societies_count', 'desc')
            ->take($limit)
            ->get(['id', 'company', 'job_apply_societies_count']);
    }

    // ============= PDF GENERATION =============

    private function generatePDFReport($report)
    {
        $pdf = PDF::loadView('pdf.report', compact('report'));

        $filename = 'report_' . $report['report_type'] . '_' .
                    $report['period']['from'] . '_to_' .
                    $report['period']['to'] . '.pdf';

        return $pdf->download($filename);
    }

    private function generateExportPDF($exportData)
    {
        $pdf = PDF::loadView('pdf.export', compact('exportData'));

        $filename = Str::slug($exportData['title']) . '_' .
                    Carbon::now()->format('Y-m-d_His') . '.pdf';

        return $pdf->download($filename);
    }

    private function generateCSV($data, $filename)
    {
        if (empty($data)) {
            return response()->json(['message' => 'No data to export'], 404);
        }

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0'
        ];

        $callback = function() use ($data) {
            $file = fopen('php://output', 'w');

            // Header
            fputcsv($file, array_keys($data[0]));

            // Data
            foreach ($data as $row) {
                fputcsv($file, $row);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    // ============= SYSTEM LOGS =============

    public function getSystemLogs(Request $request)
    {
        $query = Notification::with('user:id,email,role');

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('is_read')) {
            $query->where('is_read', $request->is_read);
        }

        $perPage = $request->per_page ?? 50;
        $logs = $query->latest()->paginate($perPage);

        return response()->json([
            'message' => 'System logs retrieved successfully',
            'data' => $logs
        ], 200);
    }
}
