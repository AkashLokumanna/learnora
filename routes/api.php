<?php

use App\Http\Controllers\Api\Admin\AdminController;
use App\Http\Controllers\Api\Admin\AdminAnalyticsController;
use App\Http\Controllers\Api\Admin\AdminSubjectController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\TutorAvailabilityController;
use App\Http\Controllers\Api\TutorProfileController;
use App\Http\Controllers\Api\TutorSearchController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->name('api.v1.')->group(function () {

    Route::prefix('auth')->name('auth.')->group(function () {

        Route::post('register', [AuthController::class, 'register'])
            ->name('register');

        Route::post('login', [AuthController::class, 'login'])
            ->name('login');

        Route::middleware('auth:sanctum')->group(function () {

            Route::post('logout', [AuthController::class, 'logout'])
                ->name('logout');

            Route::get('me', [AuthController::class, 'me'])
                ->name('me');

        });
    });

    Route::prefix('subjects')->name('subjects.')->group(function () {
        
        Route::get('/',           [SubjectController::class, 'index'])->name('index');
        
        Route::get('/{subject}',  [SubjectController::class, 'show'])->name('show');
    });

    Route::prefix('tutors')->name('tutors.')->group(function () {

        Route::middleware('auth:sanctum')->group(function () {
            
            Route::get('/me',  [TutorProfileController::class, 'myProfile'])->name('me');
            
            Route::put('/me',  [TutorProfileController::class, 'updateMyProfile'])->name('update');
        });

        Route::get('/',        [TutorProfileController::class, 'index'])->name('index');
        
        Route::get('/{tutor}', [TutorProfileController::class, 'show'])->name('show');
    });

    Route::middleware('auth:sanctum')->group(function () {

        Route::get('search/tutors', [TutorSearchController::class, 'index'])
            ->name('search.tutors');

        Route::post('availability/bulk-sync', [TutorAvailabilityController::class, 'bulkSync'])
            ->name('availability.bulk-sync');

        Route::apiResource('availability', TutorAvailabilityController::class)
            ->parameters(['availability' => 'slot']); 

        Route::apiResource('bookings', BookingController::class)
            ->only(['index', 'store', 'show']);

        Route::patch('bookings/{booking}/cancel',   [BookingController::class, 'cancel'])
            ->name('bookings.cancel');
        
        Route::patch('bookings/{booking}/confirm',  [BookingController::class, 'confirm'])
            ->name('bookings.confirm');
        
        Route::patch('bookings/{booking}/complete', [BookingController::class, 'complete'])
            ->name('bookings.complete');

        Route::post('reviews', [ReviewController::class, 'store'])
            ->name('reviews.store');
    });

    Route::post('payments/webhook', [PaymentController::class, 'webhook'])
        ->name('payments.webhook');

    Route::middleware('auth:sanctum')->group(function () {
        
        Route::post('payments/initiate', [PaymentController::class, 'initiate'])
            ->name('payments.initiate');

        Route::get('payments/{payment}', [PaymentController::class, 'show'])
            ->name('payments.show');
    });

    Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('analytics',                           [AdminAnalyticsController::class, 'index']);
        Route::get('dashboard',                           [AdminController::class, 'dashboard']);
        Route::get('tutors',                              [AdminController::class, 'tutors']);
        Route::patch('tutors/{tutor}/verify',             [AdminController::class, 'verifyTutor']);
        Route::patch('tutors/{tutor}/suspend',            [AdminController::class, 'suspendTutor']);
        Route::apiResource('subjects', AdminSubjectController::class);
        Route::get('bookings',                            [AdminController::class, 'bookings']);
        Route::get('payments',                            [AdminController::class, 'payments']);
    });

});
