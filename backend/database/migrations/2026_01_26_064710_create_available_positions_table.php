<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('available_positions', function (Blueprint $table) {
            $table->id();
            $table->foreignId("job_vacancy_id")->constrained("job_vacancies")->cascadeOnDelete();
            $table->string("position");
            $table->unsignedBigInteger("capacity")->default(0);
            $table->unsignedBigInteger("apply_capacity")->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('available_positions');
    }
};
