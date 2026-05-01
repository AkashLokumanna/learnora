<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
        public function up(): void
    {
        Schema::create('tutor_profiles', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                  ->unique()
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->string('headline')->nullable();             
            $table->text('about')->nullable();                  
            $table->decimal('hourly_rate', 10, 2)->default(0); 
            $table->unsignedSmallInteger('experience_years')->default(0);

            $table->json('certifications')->nullable();         
            $table->json('languages')->nullable();              

            $table->enum('teaching_method', ['online', 'in_person', 'both'])->default('online');
            $table->enum('availability_status', ['available', 'busy', 'paused'])->default('available');

            $table->float('avg_rating')->default(0);
            $table->unsignedInteger('total_reviews')->default(0);

            $table->boolean('is_verified')->default(false);

            $table->timestamps();
        });
    }

        public function down(): void
    {
        Schema::dropIfExists('tutor_profiles');
    }
};
