<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
        public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();

            $table->enum('role', ['student', 'tutor', 'admin'])->default('student');
            $table->enum('status', ['active', 'pending', 'suspended'])->default('pending');

            $table->string('avatar')->nullable();
            $table->string('phone', 20)->nullable();
            $table->text('bio')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

        public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
