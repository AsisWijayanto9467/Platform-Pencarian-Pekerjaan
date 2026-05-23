<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\JobVacancy;
use App\Models\Society;
use Illuminate\Http\Request;

class JobVacancyController extends Controller
{
    public function getAllVacancy(Request $request)
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


        $JobVacancies = JobVacancy::with("AvailablePositions", "JobCategory")->get();


        return response()->json([
            "vacancies" => $JobVacancies->map(function ($vacancy) {
                return [
                    "id" => $vacancy->id,
                    "category" =>  [
                        "id" => $vacancy->JobCategory->id,
                        "job_category" => $vacancy->JobCategory->job_category
                    ],
                    "company" => $vacancy->company,
                    "address" => $vacancy->address,
                    "description" => $vacancy->description,
                    "avaliable_position" => $vacancy->AvailablePositions->map(function ($position) {
                        return [
                            "position" => $position->position,
                            "capacity" => $position->capacity,
                            "apply_capacity" => $position->apply_capacity
                        ];
                    })
                ];
            })
        ], 200);
    }


    public function getDetailVacancy(Request $request, $id)
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


        $vacancy = JobVacancy::with("AvailablePositions", "JobCategory")->where("id", $id)->first();


        return response()->json([
            "vacancies" => [
                "id" => $vacancy->id,
                "category" =>  [
                    "id" => $vacancy->JobCategory->id,
                    "job_category" => $vacancy->JobCategory->job_category
                ],
                "company" => $vacancy->company,
                "address" => $vacancy->address,
                "description" => $vacancy->description,
                "avaliable_position" => $vacancy->AvailablePositions->map(function ($position) {
                    return [
                        "position" => $position->position,
                        "capacity" => $position->capacity,
                        "apply_capacity" => $position->apply_capacity
                    ];
                })
            ]
        ], 200);
    }
}
