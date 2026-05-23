<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AvailablePosition;
use App\Models\JobApplyPosition;
use App\Models\JobApplySociety;
use App\Models\JobVacancy;
use App\Models\Society;
use App\Models\Validation;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;

class ApplyJobController extends Controller
{
    public function ApplyJob(Request $request)
    {
        $token = $request->query("token");

        if (!$token) {
            return response()->json([
                "message" => "Invalid Token"
            ], 401);
        }

        $society = Society::where("login_tokens", $token)->first();

        if (!$society) {
            return response()->json([
                "message" => "Unauthorized user"
            ], 401);
        }

        $validationAccepted = Validation::where("status", "accepted")->exists();

        if (!$validationAccepted) {
            return response()->json([
                "message" => "Your data validator must be accepted by validator before"
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
            ], 401);
        }

        $validationApply = JobApplyPosition::where("society_id", $society->id)->where("job_vacancy_id", $request->vacancy_id)->exists();

        if ($validationApply) {
            return response()->json([
                "message" => "Application for a job can only be once"
            ], 401);
        }

        $applySociety = JobApplySociety::create([
            "society_id" => $society->id,
            "job_vacancy_id" => $request->vacancy_id,
            "notes" => $request->notes,
            "date" => Carbon::now()
        ]);


        foreach ($request->positions as $positionId) {

            $position = AvailablePosition::where("id", $positionId)
                ->where("job_vacancy_id", $request->vacancy_id)
                ->first();

            if (!$position) continue;

            $applyCount = JobApplyPosition::where("position_id", $position->id)->count();

            if ($applyCount >= $position->capacity) {
                continue;
            }

            JobApplyPosition::create([
                "date" => Carbon::now(),
                "society_id" => $society->id,
                "job_vacancy_id" => $request->vacancy_id,
                "position_id" => $position->id,
                "job_apply_societies_id" => $applySociety->id,
                "status" => "pending"
            ]);
        }

        return response()->json([
            "message" => "Applying for job successful"
        ], 200);
    }

    public function getSocietyJob(Request $request)
    {
        $token = $request->query("token");

        if (!$token) {
            return response()->json([
                "message" => "Invalid Token"
            ], 401);
        }

        $society = Society::where("login_tokens", $token)->first();

        if (!$society) {
            return response()->json([
                "message" => "Unauthorized user"
            ], 401);
        }

        $applications = JobApplySociety::with([
            'JobVacancy.JobCategory',
            'JobApplyPositions.AvailablePosition'
        ])->where('society_id', $society->id)->get()->groupBy('job_vacancy_id');

        $vacancies = $applications->map(function ($items) {
            $apply = $items->first();
            $vacancy = $apply->JobVacancy;

            return [
                "id" => $vacancy->id,
                "category" => [
                    "id" => $vacancy->JobCategory->id,
                    "job_category" => $vacancy->JobCategory->job_category,
                ],
                "company" => $vacancy->company,
                "address" => $vacancy->address,
                "position" => $apply->JobApplyPositions->map(function ($pos) {
                    return [
                        "position" => $pos->AvailablePosition->position,
                        "apply_status" => $pos->status,
                        "notes" => $pos->JobApplySociety->notes,
                    ];
                })->values()
            ];
        })->values();

        return response()->json([
            "vacancies" => $vacancies
        ], 200);
    }
}
