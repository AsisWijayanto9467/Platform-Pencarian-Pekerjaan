<?php

use App\Http\Controllers\API\AdminController;
use App\Http\Controllers\API\ApplyJobController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\JobVacancyController;
use App\Http\Controllers\API\Society\SocietyController;
use App\Http\Controllers\API\ValidationController;
use App\Http\Controllers\API\Validator\ValidatorController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


Route::prefix("v1")->group(function() {
    Route::prefix("auth")->group(function() {
        Route::post("/login", [AuthController::class, "login"]);
        Route::post("/register", [AuthController::class, "registerSociety"]);
        Route::post("/forgot-password", [AuthController::class, "forgotPassword"]);

        Route::middleware(['role:admin,officer,validator,society'])->group(function() {
            Route::post("/logout", [AuthController::class, "logout"]);
            Route::post("/refresh-token", [AuthController::class, "refreshToken"]);
            Route::get("/profile", [AuthController::class, "profile"]);
            Route::put("/profile", [AuthController::class, "updateProfile"]);
            Route::post("/change-password", [AuthController::class, "changePassword"]);
        });
    });

    Route::prefix("admin")->middleware(['role:admin'])->group(function() {
        // Dashboard & Statistics
        Route::get("/dashboard", [AdminController::class, "dashboard"]);
        Route::get("/statistics", [AdminController::class, "getStatistics"]);

        // Reports & Export
        Route::get("/reports", [AdminController::class, "generateReport"]);
        Route::get("/export", [AdminController::class, "exportData"]);
        Route::get("/logs", [AdminController::class, "getSystemLogs"]);

        // Regional Management
        Route::prefix("regionals")->group(function() {
            Route::get("/", [AdminController::class, "getAllRegionals"]);
            Route::get("/{id}", [AdminController::class, "getRegionalById"]);
            Route::post("/", [AdminController::class, "createRegional"]);
            Route::put("/{id}", [AdminController::class, "updateRegional"]);
            Route::delete("/{id}", [AdminController::class, "deleteRegional"]);
        });

        // Job Category Management
        Route::prefix("job-categories")->group(function() {
            Route::get("/", [AdminController::class, "getAllJobCategories"]);
            Route::get("/{id}", [AdminController::class, "getJobCategoryById"]);
            Route::post("/", [AdminController::class, "createJobCategory"]);
            Route::put("/{id}", [AdminController::class, "updateJobCategory"]);
            Route::delete("/{id}", [AdminController::class, "deleteJobCategory"]);
        });

        // Validator Management
        Route::prefix("validators")->group(function() {
            Route::get("/", [AdminController::class, "getAllValidators"]);
            Route::get("/{id}", [AdminController::class, "getValidatorById"]);
            Route::post("/", [AdminController::class, "createValidator"]);
            Route::put("/{id}", [AdminController::class, "updateValidator"]);
            Route::delete("/{id}", [AdminController::class, "deleteValidator"]);
            Route::patch("/{id}/toggle-status", [AdminController::class, "toggleValidatorStatus"]);
        });

        // Officer Management
        Route::prefix("officers")->group(function() {
            Route::get("/", [AdminController::class, "getAllOfficers"]);
            Route::get("/{id}", [AdminController::class, "getOfficerById"]);
            Route::post("/", [AdminController::class, "createOfficer"]);
            Route::put("/{id}", [AdminController::class, "updateOfficer"]);
            Route::delete("/{id}", [AdminController::class, "deleteOfficer"]);
            Route::patch("/{id}/toggle-status", [AdminController::class, "toggleOfficerStatus"]);
        });

        // Society Management
        Route::prefix("societies")->group(function() {
            Route::get("/", [AdminController::class, "getAllSocieties"]);
            Route::get("/{id}", [AdminController::class, "getSocietyById"]);
            Route::put("/{id}", [AdminController::class, "updateSociety"]);
            Route::delete("/{id}", [AdminController::class, "deleteSociety"]);
            Route::patch("/{id}/deactivate", [AdminController::class, "deactivateSociety"]);
            Route::patch("/{id}/activate", [AdminController::class, "activateSociety"]);
        });

        // Validation Oversight
        Route::prefix("validations")->group(function() {
            Route::get("/", [AdminController::class, "getAllValidations"]);
            Route::get("/stats", [AdminController::class, "getValidationStats"]);
            Route::get("/{id}", [AdminController::class, "getValidationById"]);
        });

        // Job Vacancy Oversight
        Route::prefix("job-vacancies")->group(function() {
            Route::get("/", [AdminController::class, "getAllJobVacancies"]);
            Route::get("/stats", [AdminController::class, "getJobVacancyStats"]);
            Route::get("/{id}", [AdminController::class, "getJobVacancyById"]);
            Route::post("/", [AdminController::class, "createJobVacancy"]);
            Route::put("/{id}", [AdminController::class, "updateJobVacancy"]);
            Route::delete("/{id}", [AdminController::class, "deleteJobVacancy"]);
        });
    });

     Route::prefix("society")->middleware(['role:society'])->group(function() {

        // Dashboard
        Route::get("/dashboard", [SocietyController::class, "dashboard"]);

        // Profile
        Route::get("/profile", [SocietyController::class, "getProfile"]);
        Route::put("/profile", [SocietyController::class, "updateProfile"]);
        Route::post("/documents", [SocietyController::class, "uploadDocuments"]);

        // Validation
        Route::post("/validation", [SocietyController::class, "submitValidation"]);
        Route::get("/validation", [SocietyController::class, "getValidationStatus"]);
        Route::put("/validation", [SocietyController::class, "updateValidation"]);
        Route::delete("/validation", [SocietyController::class, "cancelValidation"]);

        // Job Vacancies
        Route::get("/vacancies", [SocietyController::class, "getAllVacancies"]);
        Route::get("/vacancies/{id}", [SocietyController::class, "getVacancyDetail"]);
        Route::get("/vacancies/search", [SocietyController::class, "searchVacancies"]);
        Route::get("/vacancies/filter", [SocietyController::class, "filterVacancies"]);
        Route::get("/recommended-jobs", [SocietyController::class, "getRecommendedJobs"]);

        // Job Applications
        Route::post("/applications", [SocietyController::class, "applyJob"]);
        Route::get("/applications", [SocietyController::class, "getMyApplications"]);
        Route::get("/applications/{id}", [SocietyController::class, "getApplicationDetail"]);
        Route::delete("/applications/{id}/cancel", [SocietyController::class, "cancelApplication"]);
        Route::post("/applications/{id}/withdraw", [SocietyController::class, "withdrawApplication"]);

        // Notifications
        Route::get("/notifications", [SocietyController::class, "getNotifications"]);
        Route::patch("/notifications/{id}/read", [SocietyController::class, "markAsRead"]);
        Route::patch("/notifications/read-all", [SocietyController::class, "markAllAsRead"]);

        // Bookmarks
        Route::post("/bookmarks/{id}", [SocietyController::class, "bookmarkJob"]);
        Route::delete("/bookmarks/{id}", [SocietyController::class, "removeBookmark"]);
        Route::get("/bookmarks", [SocietyController::class, "getBookmarkedJobs"]);

        // History
        Route::get("/job-history", [SocietyController::class, "getJobHistory"]);
        Route::get("/application-history", [SocietyController::class, "getApplicationHistory"]);
    });

    Route::prefix("validator")->middleware(['role:validator,officer'])->group(function() {

        // Dashboard & Stats
        Route::get("/dashboard", [ValidatorController::class, "dashboard"]);
        Route::get("/stats", [ValidatorController::class, "getMyStats"]);

        // Profile
        Route::get("/profile", [ValidatorController::class, "getMyProfile"]);
        Route::put("/profile", [ValidatorController::class, "updateMyProfile"]);

        // Validations
        Route::get("/validations/pending", [ValidatorController::class, "getPendingValidations"]);
        Route::get("/validations/history", [ValidatorController::class, "getValidationHistory"]);
        Route::get("/validations/{id}", [ValidatorController::class, "getValidationDetail"]);
        Route::post("/validations/{id}/approve", [ValidatorController::class, "approveValidation"]);
        Route::post("/validations/{id}/decline", [ValidatorController::class, "declineValidation"]);
        Route::put("/validations/{id}/notes", [ValidatorController::class, "addValidatorNotes"]);

        // Reports
        Route::get("/reports", [ValidatorController::class, "generateMyReport"]);
    });

    Route::prefix("officer")->middleware(['role:officer'])->group(function() {
        // Job Vacancy Management
        Route::get("/vacancies", [ValidatorController::class, "getMyJobVacancies"]);
        Route::post("/vacancies", [ValidatorController::class, "createJobVacancy"]);
        Route::put("/vacancies/{id}", [ValidatorController::class, "updateJobVacancy"]);
        Route::delete("/vacancies/{id}", [ValidatorController::class, "deleteJobVacancy"]);

        // Position Management
        Route::post("/vacancies/{vacancyId}/positions", [ValidatorController::class, "addAvailablePosition"]);
        Route::put("/positions/{id}", [ValidatorController::class, "updateAvailablePosition"]);
        Route::delete("/positions/{id}", [ValidatorController::class, "deleteAvailablePosition"]);

        // Application Management
        Route::get("/applications", [ValidatorController::class, "getJobApplications"]);
        Route::post("/applications/{id}/process", [ValidatorController::class, "processApplication"]);
        Route::post("/applications/bulk-process", [ValidatorController::class, "bulkProcessApplications"]);
    });

    Route::prefix("validations")->group(function() {
        Route::middleware(['role:officer,validator'])->group(function() {
            Route::post("/", [ValidationController::class, "validation"]);
        });

        Route::middleware(['role:admin,officer,validator,society'])->group(function() {
            Route::get("/", [ValidationController::class, "getValidation"]);
        });
    });

    Route::prefix("job_vacancies")->group(function() {
        Route::middleware(['role:society,admin,officer,validator'])->group(function() {
            Route::get("/", [JobVacancyController::class, "getAllVacancy"]);
            Route::get("/{id}", [JobVacancyController::class, "getDetailVacancy"]);
        });

    });

    Route::prefix("applications")->group(function() {
        Route::middleware(['role:society'])->group(function() {
            Route::post("/", [ApplyJobController::class, "ApplyJob"]);
            Route::get("/my", [ApplyJobController::class, "getSocietyJob"]);
        });
    });
});
