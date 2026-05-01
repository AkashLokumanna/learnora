<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
        public function up(): void
    {
        Schema::create('availability_exceptions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('availability_id')
                  ->constrained('tutor_availabilities')
                  ->cascadeOnDelete();

            $table->date('exception_date');
            $table->string('reason')->nullable();   

            $table->timestamps();

            $table->unique(['availability_id', 'exception_date']);
        });
    }

        public function down(): void
    {
        Schema::dropIfExists('availability_exceptions');
    }
};
