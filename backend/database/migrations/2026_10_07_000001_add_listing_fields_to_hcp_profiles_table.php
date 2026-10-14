<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hcp_profiles', function (Blueprint $table) {
            $table->string('area', 100)->nullable()->after('city');

            $table->unsignedInteger('fees')->nullable()->after('area');

            $table->string('currency', 10)->default('EGP')->after('fees');

            $table->string('waiting_time', 20)->nullable()->after('currency');

            $table->decimal('rating', 2, 1)->default(0)->after('waiting_time');

            $table->unsignedInteger('review_count')->default(0)->after('rating');

            $table->json('insurance_accepted')->nullable()->after('review_count');
        });
    }

    public function down(): void
    {
        Schema::table('hcp_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'area',
                'fees',
                'currency',
                'waiting_time',
                'rating',
                'review_count',
                'insurance_accepted',
            ]);
        });
    }
};
