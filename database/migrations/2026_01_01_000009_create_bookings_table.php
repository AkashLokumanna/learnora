<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
        public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->foreignId('tutor_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->foreignId('availability_id')
                  ->constrained('tutor_availabilities')
                  ->cascadeOnDelete();

            $table->foreignId('subject_id')
                  ->constrained('subjects')
                  ->cascadeOnDelete();

            $table->date('session_date');
            $table->time('time_from');
            $table->time('time_to');

            $table->decimal('amount', 10, 2)->default(0);           
            $table->decimal('discount_amount', 10, 2)->default(0);  
            $table->foreignId('coupon_id')
                  ->nullable()
                  ->constrained('coupons')
                  ->nullOnDelete();

            $table->enum('meeting_type', ['online', 'in_person'])->default('online');
            $table->string('meeting_link')->nullable();  

            $table->enum('status', [
                'pending',
                'confirmed',
                'completed',
                'cancelled',
                'no_show',
            ])->default('pending');

            $table->enum('payment_status', [
                'unpaid',
                'paid',
                'refunded',
            ])->default('unpaid');

            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tutor_id', 'session_date', 'time_from'], 'unique_tutor_slot');
        });
    }

        public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
