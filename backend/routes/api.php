<?php

use App\Http\Controllers\API\ApplyJobController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\JobVacancyController;
use App\Http\Controllers\API\ValidationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


Route::prefix("v1")->group(function() {
    Route::prefix("auth")->group(function() {
        Route::post("/login", [AuthController::class, "Login"]);
        Route::post("/logout", [AuthController::class, "Logout"]);
    });

    Route::prefix("validations")->group(function() {
        Route::post("/", [ValidationController::class, "validation"]);
        Route::get("/", [ValidationController::class, "getValidation"]);
    });

    Route::prefix("job_vacancies")->group(function() {
        Route::get("/", [JobVacancyController::class, "getAllVacancy"]);
        Route::get("/{id}", [JobVacancyController::class, "getDetailVacancy"]);
    });

    Route::prefix("applications")->group(function() {
        Route::post("/", [ApplyJobController::class, "ApplyJob"]);
        Route::get("/", [ApplyJobController::class, "getSocietyJob"]);
    });
});