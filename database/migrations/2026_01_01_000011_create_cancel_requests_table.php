<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
        public function up(): void
    {
        
        Schema::create('cancel_requests', function (Blueprint $table) {
            $table->id();

            $table->foreignId('booking_id')
                  ->constrained('bookings')
                  ->cascadeOnDelete();

            $table->foreignId('requested_by')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->text('reason');

            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');

            $table->timestamps();
        });

        Schema::create('reschedule_logs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('booking_id')
                  ->constrained('bookings')
                  ->cascadeOnDelete();

            $table->foreignId('rescheduled_by')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->date('old_date');
            $table->time('old_time_from');
            $table->time('old_time_to');

            $table->date('new_date');
            $table->time('new_time_from');
            $table->time('new_time_to');

            $table->text('reason')->nullable();

            $table->timestamp('rescheduled_at')->useCurrent();

            $table->timestamps();
        });
    }

        public function down(): void
    {
        Schema::dropIfExists('reschedule_logs');
        Schema::dropIfExists('cancel_requests');
    }
};
