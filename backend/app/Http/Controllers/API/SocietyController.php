<?php

namespace App\Http\Controllers\API\Society;

use App\Http\Controllers\Controller;
use App\Models\AvailablePosition;
use App\Models\Bookmark;
use App\Models\JobApplyPosition;
use App\Models\JobApplySociety;
use App\Models\JobCategory;
use App\Models\JobVacancy;
use App\Models\Notification;
use App\Models\Society;
use App\Models\Validation;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class SocietyController extends Controller
{
    /**
     * Get authenticated society from token
     */
    private function getAuthenticatedSociety(Request $request)
    {
        $token = $request->bearerToken() ?? $request->query("token");

        if (!$token) {
            return null;
        }

        return Society::where("login_tokens", $token)->first();
    }

    // ============= DASHBOARD =============

    public function dashboard(Request $request)
    {
        $society = $this->getAuthenticatedSociety($request);

        if (!$society) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $validation = Validation::where('society_id', $society->id)->first();

        $dashboard = [
            'profile' => [
                'name' => $society->name,
                'id_card_number' => $society->id_card_number,
                'gender' => $society->gender,
                'address' => $society->address,
                'regional' => $society->regional ? [
                    'province' => $society->regional->province,
                    'district' => $society->regional->district,
                ] : null,
            ],
            'validation_status' => $validation ? [
                'id' => $validation->id,
                'status' => $validation->status,
                'job_position' => $validation->job_position,
                'job_category' => $validation->jobCategory ? $validation->jobCategory->job_category : null,
                'submitted_at' => $validation->created_at,
            ] : null,
            'application_summary' => [
                'total_applications' => JobApplySociety::where('society_id', $society->id)->count(),
                'pending' => JobApplyPosition::where('society_id', $society->id)->where('status', 'pending')->count(),
                'accepted' => JobApplyPosition::where('society_id', $society->id)->where('status', 'accepted')->count(),
                'rejected' => JobApplyPosition::where('society_id', $society->id)->where('status', 'rejected')->count(),
            ],
            'bookmarked_jobs' => Bookmark::where('society_id', $society->id)->count(),
            'unread_notifications' => Notification::where('user_id', $society->user->id ?? 0)
                ->where('is_read', false)
                ->count(),
            'recent_applications' => JobApplySociety::where('society_id', $society->id)
                ->with(['jobVacancy:id,company', 'jobApplyPositions'])
                ->latest()
                ->take(5)
                ->get()
                ->map(function ($app) {
                    return [
                        'id' => $app->id,
                        'company' => $app->jobVacancy->company ?? '',
                        'date' => $app->date,
                        'positions' => $app->jobApplyPositions->map(function ($pos) {
                            return [
                                'position' => $pos->availablePosition->position ?? '',
                                'status' => $pos->status,
                            ];
                        }),
                    ];
                }),
            'recommended_jobs' => $this->getRecommendedJobsForSociety($society, 3),
        ];

        return response()->json([
            'message' => 'Dashboard retrieved successfully',
            'data' => $dashboard
        ], 200);
    }

    // ============= PROFILE MANAGEMENT =============

    public function getProfile(Request $request)
    {
        $society = $this->getAuthenticatedSociety($request);

        if (!$society) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $profile = [
            'id' => $society->id,
            'id_card_number' => $society->id_card_number,
            'name' => $society->name,
            'email' => $society->user->email ?? null,
            'born_date' => $society->born_date,
            'gender' => $society->gender,
            'address' => $society->address,
            'regional' => $society->regional ? [
                'id' => $society->regional->id,
                'province' => $society->regional->province,
                'district' => $society->regional->district,
            ] : null,
            'created_at' => $society->created_at,
            'updated_at' => $society->updated_at,
        ];

        return response()->json([
            'message' => 'Profile retrieved successfully',
            'data' => $profile
        ], 200);
    }

    public function updateProfile(Request $request)
    {
        $society = $this->getAuthenticatedSociety($request);

        if (!$society) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'born_date' => 'sometimes|date',
            'gender' => 'sometimes|in:male,female',
            'address' => 'sometimes|string',
            'regional_id' => 'sometimes|exists:regionals,id',
            'email' => 'sometimes|email|unique:users,email,' . ($society->user->id ?? 0),
        ]);

        if ($validator->fails()) {
            return response()->json([
                "message" => "Invalid field",
                "errors" => $validator->errors()
            ], 422);
        }

        $society->update($request->only([
            'name', 'born_date', 'gender', 'address', 'regional_id'
        ]));

        // Update email di tabel users jika ada
        if ($request->has('email') && $society->user) {
            $society->user()->update(['email' => $request->email]);
        }

        return response()->json([
            'message' => 'Profile updated successfully',
            'data' => $society->fresh()->load('regional', 'user')
        ], 200);
    }

    public function uploadDocuments(Request $request)
    {
        $society = $this->getAuthenticatedSociety($request);

        if (!$society) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        // Karena tabel societies tidak memiliki kolom dokumen,
        // kita simpan informasi upload sebagai catatan atau return success
        // Untuk implementasi nyata, bisa ditambahkan migration untuk kolom dokumen

        return response()->json([
            'message' => 'Document upload feature ready. Add document columns to societies table to enable.',
            'note' => 'Run migration: ALTER TABLE societies ADD COLUMN documents TEXT NULL;'
        ], 200);
    }

    // ============= VALIDATION MANAGEMENT =============

    public function submitValidation(Request $request)
    {
        $society = $this->getAuthenticatedSociety($request);

        if (!$society) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $alreadySubmit = Validation::where("society_id", $society->id)->first();

        if ($alreadySubmit) {
            return response()->json([
                "message" => "You already submitted validation"
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            "work_experience" => "required|string",
            "job_category_id" => "required|exists:job_categories,id",
            "job_position" => "required|string",
            "reason_accepted" => "required|string"
        ]);

        if ($validator->fails()) {
            return response()->json([
                "message" => "Invalid field",
                "errors" => $validator->errors()
            ], 422);
        }

        $validation = Validation::create([
            "job_category_id" => $request->job_category_id,
            "society_id" => $society->id,
            "status" => "pending",
            "work_experience" => $request->work_experience,
            "job_position" => $request->job_position,
            "reason_accepted" => $request->reason_accepted,
        ]);

        // Kirim notifikasi ke society
        if ($society->user) {
            Notification::create([
                'user_id' => $society->user->id,
                'title' => 'Validation Submitted',
                'message' => 'Your validation request has been submitted and is pending review.',
                'type' => 'validation',
            ]);
        }

        return response()->json([
            "message" => "Request data validation sent successfully",
            "data" => $validation
        ], 200);
    }

    public function getValidationStatus(Request $request)
    {
        $society = $this->getAuthenticatedSociety($request);

        if (!$society) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $validation = Validation::with(['jobCategory', 'validator'])
            ->where("society_id", $society->id)
            ->first();

        if (!$validation) {
            return response()->json([
                "message" => "No validation found",
                "data" => null
            ], 200);
        }

        return response()->json([
            "message" => "Validation status retrieved",
            "data" => [
                "id" => $validation->id,
                "status" => $validation->status,
                "work_experience" => $validation->work_experience,
                "job_category" => $validation->jobCategory ? [
                    "id" => $validation->jobCategory->id,
                    "job_category" => $validation->jobCategory->job_category,
                ] : null,
                "job_position" => $validation->job_position,
                "reason_accepted" => $validation->reason_accepted,
                "validator_notes" => $validation->validator_notes,
                "validator" => $validation->validator ? [
                    "name" => $validation->validator->name,
                ] : null,
                "created_at" => $validation->created_at,
                "updated_at" => $validation->updated_at,
            ]
        ], 200);
    }

    public function updateValidation(Request $request)
    {
        $society = $this->getAuthenticatedSociety($request);

        if (!$society) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $validation = Validation::where("society_id", $society->id)->first();

        if (!$validation) {
            return response()->json(["message" => "No validation found"], 404);
        }

        // Hanya bisa update jika status masih pending
        if ($validation->status !== 'pending') {
            return response()->json([
                "message" => "Cannot update validation that has been " . $validation->status
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            "work_experience" => "sometimes|string",
            "job_category_id" => "sometimes|exists:job_categories,id",
            "job_position" => "sometimes|string",
            "reason_accepted" => "sometimes|string"
        ]);

        if ($validator->fails()) {
            return response()->json([
                "message" => "Invalid field",
                "errors" => $validator->errors()
            ], 422);
        }

        $validation->update($request->only([
            'work_experience', 'job_category_id', 'job_position', 'reason_accepted'
        ]));

        return response()->json([
            "message" => "Validation updated successfully",
            "data" => $validation->fresh()->load('jobCategory')
        ], 200);
    }

    public function cancelValidation(Request $request)
    {
        $society = $this->getAuthenticatedSociety($request);

        if (!$society) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $validation = Validation::where("society_id", $society->id)->first();

        if (!$validation) {
            return response()->json(["message" => "No validation found"], 404);
        }

        // Hanya bisa cancel jika status pending
        if ($validation->status !== 'pending') {
            return response()->json([
                "message" => "Cannot cancel validation that has been " . $validation->status
            ], 400);
        }

        $validation->delete();

        // Kirim notifikasi
        if ($society->user) {
            Notification::create([
                'user_id' => $society->user->id,
                'title' => 'Validation Cancelled',
                'message' => 'Your validation request has been cancelled.',
                'type' => 'validation',
            ]);
        }

        return response()->json([
            "message" => "Validation cancelled successfully"
        ], 200);
    }

    // ============= JOB VACANCY =============

    public function getAllVacancies(Request $request)
    {
        $society = $this->getAuthenticatedSociety($request);

        if (!$society) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $JobVacancies = JobVacancy::with(["AvailablePositions", "JobCategory"])->get();

        // Tambahkan informasi bookmark
        $bookmarkedIds = Bookmark::where('society_id', $society->id)->pluck('job_vacancy_id')->toArray();

        return response()->json([
            "vacancies" => $JobVacancies->map(function ($vacancy) use ($bookmarkedIds) {
                return [
                    "id" => $vacancy->id,
                    "category" => [
                        "id" => $vacancy->JobCategory->id,
                        "job_category" => $vacancy->JobCategory->job_category
                    ],
                    "company" => $vacancy->company,
                    "address" => $vacancy->address,
                    "description" => $vacancy->description,
                    "is_bookmarked" => in_array($vacancy->id, $bookmarkedIds),
                    "avaliable_position" => $vacancy->AvailablePositions->map(function ($position) {
                        return [
                            "id" => $position->id,
                            "position" => $position->position,
                            "capacity" => $position->capacity,
                            "apply_capacity" => $position->apply_capacity
                        ];
                    })
                ];
            })
        ], 200);
    }

    public function getVacancyDetail(Request $request, $id)
    {
        $society = $this->getAuthenticatedSociety($request);

        if (!$society) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $vacancy = JobVacancy::with(["AvailablePositions", "JobCategory"])->where("id", $id)->first();

        if (!$vacancy) {
            return response()->json(["message" => "Vacancy not found"], 404);
        }

        $isBookmarked = Bookmark::where('society_id', $society->id)
            ->where('job_vacancy_id', $id)
            ->exists();

        $hasApplied = JobApplyPosition::where('society_id', $society->id)
            ->where('job_vacancy_id', $id)
            ->exists();

        return response()->json([
            "vacancy" => [
                "id" => $vacancy->id,
                "category" => [
                    "id" => $vacancy->JobCategory->id,
                    "job_category" => $vacancy->JobCategory->job_category
                ],
                "company" => $vacancy->company,
                "address" => $vacancy->address,
                "description" => $vacancy->description,
                "is_bookmarked" => $isBookmarked,
                "has_applied" => $hasApplied,
                "avaliable_position" => $vacancy->AvailablePositions->map(function ($position) {
                    return [
                        "id" => $position->id,
                        "position" => $position->position,
                        "capacity" => $position->capacity,
                        "apply_capacity" => $position->apply_capacity
                    ];
                })
            ]
        ], 200);
    }

    public function searchVacancies(Request $request)
    {
        $society = $this->getAuthenticatedSociety($request);

        if (!$society) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $query = JobVacancy::with(["AvailablePositions", "JobCategory"]);

        if ($request->has('keyword')) {
            $keyword = $request->keyword;
            $query->where(function($q) use ($keyword) {
                $q->where('company', 'like', "%{$keyword}%")
                  ->orWhere('address', 'like', "%{$keyword}%")
                  ->orWhere('description', 'like', "%{$keyword}%")
                  ->orWhereHas('availablePositions', function($pos) use ($keyword) {
                      $pos->where('position', 'like', "%{$keyword}%");
                  })
                  ->orWhereHas('jobCategory', function($cat) use ($keyword) {
                      $cat->where('job_category', 'like', "%{$keyword}%");
                  });
            });
        }

        $vacancies = $query->get();
        $bookmarkedIds = Bookmark::where('society_id', $society->id)->pluck('job_vacancy_id')->toArray();

        return response()->json([
            "message" => "Search results",
            "keyword" => $request->keyword,
            "total" => $vacancies->count(),
            "vacancies" => $vacancies->map(function ($vacancy) use ($bookmarkedIds) {
                return [
                    "id" => $vacancy->id,
                    "category" => [
                        "id" => $vacancy->JobCategory->id,
                        "job_category" => $vacancy->JobCategory->job_category
                    ],
                    "company" => $vacancy->company,
                    "address" => $vacancy->address,
                    "description" => $vacancy->description,
                    "is_bookmarked" => in_array($vacancy->id, $bookmarkedIds),
                    "avaliable_position" => $vacancy->AvailablePositions->map(function ($position) {
                        return [
                            "id" => $position->id,
                            "position" => $position->position,
                            "capacity" => $position->capacity,
                            "apply_capacity" => $position->apply_capacity
                        ];
                    })
                ];
            })
        ], 200);
    }

    public function filterVacancies(Request $request)
    {
        $society = $this->getAuthenticatedSociety($request);

        if (!$society) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $query = JobVacancy::with(["AvailablePositions", "JobCategory"]);

        // Filter by job category
        if ($request->has('job_category_id')) {
            $query->where('job_category_id', $request->job_category_id);
        }

        // Filter by multiple categories
        if ($request->has('job_category_ids') && is_array($request->job_category_ids)) {
            $query->whereIn('job_category_id', $request->job_category_ids);
        }

        // Filter by position keyword
        if ($request->has('position')) {
            $query->whereHas('availablePositions', function($q) use ($request) {
                $q->where('position', 'like', "%{$request->position}%");
            });
        }

        // Sorting
        $sortBy = $request->sort_by ?? 'created_at';
        $sortOrder = $request->sort_order ?? 'desc';
        $allowedSorts = ['created_at', 'company', 'updated_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder);
        }

        // Pagination
        $perPage = $request->per_page ?? 10;
        $vacancies = $query->paginate($perPage);

        $bookmarkedIds = Bookmark::where('society_id', $society->id)->pluck('job_vacancy_id')->toArray();

        $vacancies->getCollection()->transform(function ($vacancy) use ($bookmarkedIds) {
            return [
                "id" => $vacancy->id,
                "category" => [
                    "id" => $vacancy->JobCategory->id,
                    "job_category" => $vacancy->JobCategory->job_category
                ],
                "company" => $vacancy->company,
                "address" => $vacancy->address,
                "description" => $vacancy->description,
                "is_bookmarked" => in_array($vacancy->id, $bookmarkedIds),
                "avaliable_position" => $vacancy->AvailablePositions->map(function ($position) {
                    return [
                        "id" => $position->id,
                        "position" => $position->position,
                        "capacity" => $position->capacity,
                        "apply_capacity" => $position->apply_capacity
                    ];
                })
            ];
        });

        return response()->json([
            "message" => "Filtered vacancies",
            "data" => $vacancies
        ], 200);
    }

    public function getRecommendedJobs(Request $request)
    {
        $society = $this->getAuthenticatedSociety($request);

        if (!$society) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $recommended = $this->getRecommendedJobsForSociety($society, 10);

        return response()->json([
            "message" => "Recommended jobs retrieved",
            "data" => $recommended
        ], 200);
    }

    private function getRecommendedJobsForSociety($society, $limit = 5)
    {
        // Cari validasi society untuk menentukan kategori yang direkomendasikan
        $validation = Validation::where('society_id', $society->id)->first();

        $query = JobVacancy::with(['jobCategory', 'availablePositions'])
            ->whereHas('availablePositions', function($q) {
                $q->where('apply_capacity', '>', 0);
            });

        // Jika society punya validasi accepted, rekomendasikan berdasarkan kategori
        if ($validation && $validation->job_category_id) {
            $query->where('job_category_id', $validation->job_category_id);
        }

        $recommended = $query->latest()
            ->take($limit)
            ->get();

        $bookmarkedIds = Bookmark::where('society_id', $society->id)->pluck('job_vacancy_id')->toArray();

        return $recommended->map(function ($vacancy) use ($bookmarkedIds) {
            return [
                'id' => $vacancy->id,
                'company' => $vacancy->company,
                'category' => $vacancy->jobCategory->job_category ?? '',
                'address' => $vacancy->address,
                'is_bookmarked' => in_array($vacancy->id, $bookmarkedIds),
                'positions' => $vacancy->availablePositions->map(function ($pos) {
                    return [
                        'id' => $pos->id,
                        'position' => $pos->position,
                        'capacity' => $pos->capacity,
                    ];
                }),
            ];
        });
    }

    // ============= JOB APPLICATION =============

    public function applyJob(Request $request)
    {
        $society = $this->getAuthenticatedSociety($request);

        if (!$society) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        // Cek validasi accepted
        $validationAccepted = Validation::where("society_id", $society->id)
            ->where("status", "accepted")
            ->exists();

        if (!$validationAccepted) {
            return response()->json([
                "message" => "Your data validator must be accepted by validator before applying"
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            "vacancy_id" => "required|exists:job_vacancies,id",
            "positions" => "required|array",
            "positions.*" => "exists:available_positions,id",
            "notes" => "required|string"
        ]);

        if ($validator->fails()) {
            return response()->json([
                "message" => "Invalid field",
                "errors" => $validator->errors()
            ], 422);
        }

        // Cek apakah sudah pernah apply di vacancy yang sama
        $alreadyApplied = JobApplyPosition::where("society_id", $society->id)
            ->where("job_vacancy_id", $request->vacancy_id)
            ->exists();

        if ($alreadyApplied) {
            return response()->json([
                "message" => "Application for this job vacancy can only be submitted once"
            ], 400);
        }

        $applySociety = JobApplySociety::create([
            "society_id" => $society->id,
            "job_vacancy_id" => $request->vacancy_id,
            "notes" => $request->notes,
            "date" => Carbon::now()
        ]);

        $appliedPositions = [];

        foreach ($request->positions as $positionId) {
            $position = AvailablePosition::where("id", $positionId)
                ->where("job_vacancy_id", $request->vacancy_id)
                ->first();

            if (!$position) continue;

            $applyCount = JobApplyPosition::where("position_id", $position->id)->count();

            if ($applyCount >= $position->capacity) {
                continue;
            }

            $jobApplyPosition = JobApplyPosition::create([
                "date" => Carbon::now(),
                "society_id" => $society->id,
                "job_vacancy_id" => $request->vacancy_id,
                "position_id" => $position->id,
                "job_apply_societies_id" => $applySociety->id,
                "status" => "pending"
            ]);

            $appliedPositions[] = $position->position;
        }

        // Kirim notifikasi
        if ($society->user) {
            Notification::create([
                'user_id' => $society->user->id,
                'title' => 'Job Application Submitted',
                'message' => 'Your application has been submitted successfully.',
                'type' => 'application',
            ]);
        }

        return response()->json([
            "message" => "Applying for job successful",
            "data" => [
                "application_id" => $applySociety->id,
                "positions_applied" => $appliedPositions,
                "date" => $applySociety->date,
            ]
        ], 200);
    }

    public function getMyApplications(Request $request)
    {
        $society = $this->getAuthenticatedSociety($request);

        if (!$society) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        // Filter by status
        $statusFilter = $request->status; // pending, accepted, rejected

        $query = JobApplySociety::with([
            'JobVacancy.JobCategory',
            'JobApplyPositions.AvailablePosition'
        ])->where('society_id', $society->id);

        if ($statusFilter) {
            $query->whereHas('JobApplyPositions', function($q) use ($statusFilter) {
                $q->where('status', $statusFilter);
            });
        }

        $applications = $query->latest()->get()->groupBy('job_vacancy_id');

        $vacancies = $applications->map(function ($items) {
            $apply = $items->first();
            $vacancy = $apply->JobVacancy;

            return [
                "id" => $vacancy->id,
                "application_id" => $apply->id,
                "category" => [
                    "id" => $vacancy->JobCategory->id,
                    "job_category" => $vacancy->JobCategory->job_category,
                ],
                "company" => $vacancy->company,
                "address" => $vacancy->address,
                "description" => $vacancy->description,
                "apply_date" => $apply->date,
                "positions" => $apply->JobApplyPositions->map(function ($pos) {
                    return [
                        "id" => $pos->id,
                        "position" => $pos->AvailablePosition->position ?? '',
                        "apply_status" => $pos->status,
                        "notes" => $pos->JobApplySociety->notes ?? '',
                    ];
                })->values()
            ];
        })->values();

        return response()->json([
            "message" => "Applications retrieved successfully",
            "total" => $vacancies->count(),
            "vacancies" => $vacancies
        ], 200);
    }

    public function getApplicationDetail(Request $request, $id)
    {
        $society = $this->getAuthenticatedSociety($request);

        if (!$society) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $application = JobApplySociety::with([
            'JobVacancy.JobCategory',
            'JobVacancy.AvailablePositions',
            'JobApplyPositions.AvailablePosition'
        ])->where('society_id', $society->id)
          ->where('id', $id)
          ->first();

        if (!$application) {
            return response()->json(["message" => "Application not found"], 404);
        }

        return response()->json([
            "message" => "Application detail retrieved",
            "data" => [
                "id" => $application->id,
                "date" => $application->date,
                "notes" => $application->notes,
                "vacancy" => [
                    "id" => $application->JobVacancy->id,
                    "category" => [
                        "id" => $application->JobVacancy->JobCategory->id,
                        "job_category" => $application->JobVacancy->JobCategory->job_category,
                    ],
                    "company" => $application->JobVacancy->company,
                    "address" => $application->JobVacancy->address,
                    "description" => $application->JobVacancy->description,
                ],
                "positions" => $application->JobApplyPositions->map(function ($pos) {
                    return [
                        "id" => $pos->id,
                        "position" => $pos->AvailablePosition->position ?? '',
                        "status" => $pos->status,
                        "date" => $pos->date,
                    ];
                }),
                "created_at" => $application->created_at,
            ]
        ], 200);
    }

    public function cancelApplication(Request $request, $id)
    {
        $society = $this->getAuthenticatedSociety($request);

        if (!$society) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $application = JobApplySociety::where('society_id', $society->id)
            ->where('id', $id)
            ->first();

        if (!$application) {
            return response()->json(["message" => "Application not found"], 404);
        }

        // Cek apakah ada posisi yang sudah accepted/rejected
        $hasProcessed = JobApplyPosition::where('job_apply_societies_id', $application->id)
            ->whereIn('status', ['accepted', 'rejected'])
            ->exists();

        if ($hasProcessed) {
            return response()->json([
                "message" => "Cannot cancel application that has been processed"
            ], 400);
        }

        // Hapus job apply positions dan job apply society
        JobApplyPosition::where('job_apply_societies_id', $application->id)->delete();
        $application->delete();

        // Kirim notifikasi
        if ($society->user) {
            Notification::create([
                'user_id' => $society->user->id,
                'title' => 'Application Cancelled',
                'message' => 'Your job application has been cancelled.',
                'type' => 'application',
            ]);
        }

        return response()->json([
            "message" => "Application cancelled successfully"
        ], 200);
    }

    public function withdrawApplication(Request $request, $id)
    {
        // Sama dengan cancel, withdraw digunakan setelah application sudah diterima
        $society = $this->getAuthenticatedSociety($request);

        if (!$society) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $application = JobApplySociety::where('society_id', $society->id)
            ->where('id', $id)
            ->first();

        if (!$application) {
            return response()->json(["message" => "Application not found"], 404);
        }

        // Update status semua posisi menjadi rejected (withdrawn)
        JobApplyPosition::where('job_apply_societies_id', $application->id)
            ->update(['status' => 'rejected']);

        // Kirim notifikasi
        if ($society->user) {
            Notification::create([
                'user_id' => $society->user->id,
                'title' => 'Application Withdrawn',
                'message' => 'You have withdrawn your job application.',
                'type' => 'application',
            ]);
        }

        return response()->json([
            "message" => "Application withdrawn successfully"
        ], 200);
    }

    // ============= NOTIFICATIONS =============

    public function getNotifications(Request $request)
    {
        $society = $this->getAuthenticatedSociety($request);

        if (!$society || !$society->user) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $query = Notification::where('user_id', $society->user->id);

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter read/unread
        if ($request->has('is_read')) {
            $query->where('is_read', $request->is_read);
        }

        $perPage = $request->per_page ?? 20;
        $notifications = $query->latest()->paginate($perPage);

        return response()->json([
            "message" => "Notifications retrieved successfully",
            "unread_count" => Notification::where('user_id', $society->user->id)
                ->where('is_read', false)
                ->count(),
            "data" => $notifications
        ], 200);
    }

    public function markAsRead(Request $request, $id)
    {
        $society = $this->getAuthenticatedSociety($request);

        if (!$society || !$society->user) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $notification = Notification::where('user_id', $society->user->id)
            ->where('id', $id)
            ->first();

        if (!$notification) {
            return response()->json(["message" => "Notification not found"], 404);
        }

        $notification->update(['is_read' => true]);

        return response()->json([
            "message" => "Notification marked as read"
        ], 200);
    }

    public function markAllAsRead(Request $request)
    {
        $society = $this->getAuthenticatedSociety($request);

        if (!$society || !$society->user) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        Notification::where('user_id', $society->user->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            "message" => "All notifications marked as read"
        ], 200);
    }

    // ============= BOOKMARKS =============

    public function bookmarkJob(Request $request, $id)
    {
        $society = $this->getAuthenticatedSociety($request);

        if (!$society) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $vacancy = JobVacancy::find($id);
        if (!$vacancy) {
            return response()->json(["message" => "Job vacancy not found"], 404);
        }

        // Cek duplikat
        $existingBookmark = Bookmark::where('society_id', $society->id)
            ->where('job_vacancy_id', $id)
            ->first();

        if ($existingBookmark) {
            return response()->json([
                "message" => "Job already bookmarked"
            ], 400);
        }

        Bookmark::create([
            'society_id' => $society->id,
            'job_vacancy_id' => $id
        ]);

        return response()->json([
            "message" => "Job bookmarked successfully"
        ], 200);
    }

    public function removeBookmark(Request $request, $id)
    {
        $society = $this->getAuthenticatedSociety($request);

        if (!$society) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $bookmark = Bookmark::where('society_id', $society->id)
            ->where('job_vacancy_id', $id)
            ->first();

        if (!$bookmark) {
            return response()->json(["message" => "Bookmark not found"], 404);
        }

        $bookmark->delete();

        return response()->json([
            "message" => "Bookmark removed successfully"
        ], 200);
    }

    public function getBookmarkedJobs(Request $request)
    {
        $society = $this->getAuthenticatedSociety($request);

        if (!$society) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        $bookmarks = Bookmark::where('society_id', $society->id)
            ->with(['jobVacancy.jobCategory', 'jobVacancy.availablePositions'])
            ->latest()
            ->get();

        $jobs = $bookmarks->map(function ($bookmark) {
            $vacancy = $bookmark->jobVacancy;
            if (!$vacancy) return null;

            return [
                "bookmark_id" => $bookmark->id,
                "id" => $vacancy->id,
                "category" => $vacancy->jobCategory ? [
                    "id" => $vacancy->jobCategory->id,
                    "job_category" => $vacancy->jobCategory->job_category,
                ] : null,
                "company" => $vacancy->company,
                "address" => $vacancy->address,
                "description" => $vacancy->description,
                "bookmarked_at" => $bookmark->created_at,
                "avaliable_position" => $vacancy->availablePositions->map(function ($position) {
                    return [
                        "id" => $position->id,
                        "position" => $position->position,
                        "capacity" => $position->capacity,
                        "apply_capacity" => $position->apply_capacity
                    ];
                })
            ];
        })->filter();

        return response()->json([
            "message" => "Bookmarked jobs retrieved",
            "total" => $jobs->count(),
            "data" => $jobs
        ], 200);
    }

    // ============= JOB HISTORY =============

    public function getJobHistory(Request $request)
    {
        $society = $this->getAuthenticatedSociety($request);

        if (!$society) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        // Semua aplikasi yang sudah selesai (accepted/rejected)
        $history = JobApplySociety::with([
            'JobVacancy.JobCategory',
            'JobApplyPositions.AvailablePosition'
        ])
        ->where('society_id', $society->id)
        ->whereHas('JobApplyPositions', function($q) {
            $q->whereIn('status', ['accepted', 'rejected']);
        })
        ->latest()
        ->get()
        ->groupBy('job_vacancy_id');

        $result = $history->map(function ($items) {
            $apply = $items->first();
            $vacancy = $apply->JobVacancy;

            return [
                "id" => $vacancy->id,
                "application_id" => $apply->id,
                "company" => $vacancy->company,
                "category" => $vacancy->JobCategory->job_category ?? '',
                "apply_date" => $apply->date,
                "positions" => $apply->JobApplyPositions->map(function ($pos) {
                    return [
                        "position" => $pos->AvailablePosition->position ?? '',
                        "status" => $pos->status,
                        "date" => $pos->date,
                    ];
                }),
            ];
        })->values();

        return response()->json([
            "message" => "Job history retrieved",
            "data" => $result
        ], 200);
    }

    public function getApplicationHistory(Request $request)
    {
        $society = $this->getAuthenticatedSociety($request);

        if (!$society) {
            return response()->json(["message" => "Unauthorized user"], 401);
        }

        // Semua riwayat aplikasi termasuk yang pending
        $history = JobApplyPosition::with([
            'jobVacancy.jobCategory',
            'availablePosition'
        ])
        ->where('society_id', $society->id)
        ->latest()
        ->get()
        ->groupBy('status');

        $result = [];
        foreach (['pending', 'accepted', 'rejected'] as $status) {
            $items = $history->get($status, collect([]));
            $result[$status] = [
                'count' => $items->count(),
                'items' => $items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'position' => $item->availablePosition->position ?? '',
                        'company' => $item->jobVacancy->company ?? '',
                        'date' => $item->date,
                        'application_id' => $item->job_apply_societies_id,
                    ];
                })->values()
            ];
        }

        return response()->json([
            "message" => "Application history retrieved",
            "data" => $result
        ], 200);
    }
}
