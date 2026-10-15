<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->date('birth_date')->nullable()->change();
            $table->string('gender', 20)->nullable()->change();
        });
    }

    public function down(): void
    {
        DB::table('users')->whereNull('birth_date')->update(['birth_date' => '1970-01-01']);
        DB::table('users')->whereNull('gender')->update(['gender' => 'MALE']);

        Schema::table('users', function (Blueprint $table) {
            $table->date('birth_date')->nullable(false)->change();
            $table->string('gender', 20)->nullable(false)->change();
        });
    }
};
