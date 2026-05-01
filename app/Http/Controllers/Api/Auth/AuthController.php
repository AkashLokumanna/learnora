<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Api\ApiController;
use App\Models\TutorProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends ApiController
{

        public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'                  => ['required', 'string', 'max:255'],
            'email'                 => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password'              => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
            'role'                  => ['required', 'in:student,tutor'],
            'phone'                 => ['nullable', 'string', 'max:20'],
        ]);

        $status = $validated['role'] === User::ROLE_TUTOR
            ? User::STATUS_PENDING
            : User::STATUS_ACTIVE;

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role'     => $validated['role'],
            'status'   => $status,
            'phone'    => $validated['phone'] ?? null,
        ]);

        if ($user->isTutor()) {
            TutorProfile::create(['user_id' => $user->id]);
        }

        $token = $user->createToken('learnora-api')->plainTextToken;

        return $this->created('Account created successfully.', [
            'user'         => $this->formatUser($user),
            'access_token' => $token,
            'token_type'   => 'Bearer',
        ]);
    }

        public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return $this->unauthorized('The provided credentials are incorrect.');
        }

        if ($user->status === User::STATUS_SUSPENDED) {
            return $this->forbidden('Your account has been suspended. Please contact support.');
        }

        $user->tokens()->delete();

        $token = $user->createToken('learnora-api')->plainTextToken;

        return $this->ok('Login successful.', [
            'user'         => $this->formatUser($user),
            'access_token' => $token,
            'token_type'   => 'Bearer',
        ]);
    }

        public function logout(Request $request): JsonResponse
    {
        
        $request->user()->currentAccessToken()->delete();

        return $this->ok('Logged out successfully.');
    }

        public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('tutorProfile');

        return $this->ok('Authenticated user retrieved.', [
            'user' => $this->formatUser($user, includeProfile: true),
        ]);
    }

        private function formatUser(User $user, bool $includeProfile = false): array
    {
        $data = [
            'id'                 => $user->id,
            'name'               => $user->name,
            'email'              => $user->email,
            'role'               => $user->role,
            'status'             => $user->status,
            'avatar'             => $user->avatar,
            'phone'              => $user->phone,
            'bio'                => $user->bio,
            'email_verified_at'  => $user->email_verified_at?->toISOString(),
            'created_at'         => $user->created_at->toISOString(),
        ];

        if ($includeProfile && $user->isTutor() && $user->tutorProfile) {
            $data['tutor_profile'] = [
                'id'                  => $user->tutorProfile->id,
                'headline'            => $user->tutorProfile->headline,
                'about'               => $user->tutorProfile->about,
                'hourly_rate'         => $user->tutorProfile->hourly_rate,
                'experience_years'    => $user->tutorProfile->experience_years,
                'teaching_method'     => $user->tutorProfile->teaching_method,
                'availability_status' => $user->tutorProfile->availability_status,
                'avg_rating'          => $user->tutorProfile->avg_rating,
                'total_reviews'       => $user->tutorProfile->total_reviews,
                'is_verified'         => $user->tutorProfile->is_verified,
                'certifications'      => $user->tutorProfile->certifications ?? [],
                'languages'           => $user->tutorProfile->languages ?? [],
            ];
        }

        return $data;
    }
}
