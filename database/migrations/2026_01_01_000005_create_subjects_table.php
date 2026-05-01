<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
        public function up(): void
    {
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('icon')->nullable();   
            $table->string('color', 7)->nullable(); 
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('tutor_subjects', function (Blueprint $table) {
            $table->foreignId('tutor_profile_id')
                  ->constrained('tutor_profiles')
                  ->cascadeOnDelete();

            $table->foreignId('subject_id')
                  ->constrained('subjects')
                  ->cascadeOnDelete();

            $table->primary(['tutor_profile_id', 'subject_id']);
        });
    }

        public function down(): void
    {
        Schema::dropIfExists('tutor_subjects');
        Schema::dropIfExists('subjects');
    }
};
