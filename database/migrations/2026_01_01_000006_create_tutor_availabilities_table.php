<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
        public function up(): void
    {
        Schema::create('tutor_availabilities', function (Blueprint $table) {
            $table->id();

            $table->foreignId('tutor_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->enum('day_of_week', [
                'monday', 'tuesday', 'wednesday',
                'thursday', 'friday', 'saturday', 'sunday'
            ]);

            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedSmallInteger('duration_minutes')->default(60);  

            $table->decimal('cost', 10, 2)->default(0);

            $table->enum('meeting_type', ['online', 'in_person', 'both'])->default('online');
            $table->boolean('is_active')->default(true);

            $table->date('valid_from')->nullable();
            $table->date('valid_until')->nullable();

            $table->timestamps();
        });
    }

        public function down(): void
    {
        Schema::dropIfExists('tutor_availabilities');
    }
};
