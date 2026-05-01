<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
        public function up(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            $table->dateTime('expires_at')->nullable()->change();
        });

        DB::statement("ALTER TABLE coupons MODIFY COLUMN type ENUM('fixed','percentage','percent') NOT NULL DEFAULT 'percentage'");
        DB::statement("UPDATE coupons SET type = 'percentage' WHERE type = 'percent'");
    }

        public function down(): void
    {
        DB::statement("UPDATE coupons SET type = 'percent' WHERE type = 'percentage'");
        DB::statement("ALTER TABLE coupons MODIFY COLUMN type ENUM('fixed','percent') NOT NULL DEFAULT 'percent'");

        Schema::table('coupons', function (Blueprint $table) {
            $table->date('expires_at')->nullable()->change();
        });
    }
};
