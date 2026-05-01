<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\TutorAvailability;
use App\Models\TutorProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with realistic MVP data.
     */
    public function run(): void
    {
        $password = Hash::make('password123'); // Universal password for all seeded accounts

        // =====================================================================
        // 1. Hardcoded Test Accounts (Guaranteed Authentication)
        // =====================================================================
        $testPassword = Hash::make('password');

        User::create([
            'name'              => 'Admin User',
            'email'             => 'admin@learnora.local',
            'password'          => $testPassword,
            'role'              => User::ROLE_ADMIN,
            'status'            => User::STATUS_ACTIVE,
            'email_verified_at' => now(),
        ]);

        $testTutor = User::create([
            'name'              => 'Test Tutor',
            'email'             => 'tutor@learnora.local',
            'password'          => $testPassword,
            'role'              => User::ROLE_TUTOR,
            'status'            => User::STATUS_ACTIVE,
            'email_verified_at' => now(),
            'bio'               => 'Test tutor account for authentication tests.',
        ]);

        TutorProfile::create([
            'user_id'             => $testTutor->id,
            'headline'            => 'Test Tutor Profile',
            'about'               => 'This is a hardcoded test tutor profile.',
            'hourly_rate'         => 1500.00,
            'experience_years'    => 5,
            'teaching_method'     => TutorProfile::METHOD_ONLINE,
            'availability_status' => 'available',
            'is_verified'         => true,
            'certifications'      => json_encode(['Test Cert']),
            'languages'           => json_encode(['English']),
        ]);

        // =====================================================================
        // 2. Core Subjects
        // =====================================================================
        $subjectsData = [
            ['name' => 'Mathematics', 'slug' => 'mathematics', 'icon' => 'calculator', 'color' => '#3B82F6'],
            ['name' => 'Physics', 'slug' => 'physics', 'icon' => 'atom', 'color' => '#8B5CF6'],
            ['name' => 'English Literature', 'slug' => 'english-literature', 'icon' => 'book', 'color' => '#10B981'],
        ];

        $subjects = [];
        foreach ($subjectsData as $data) {
            $subjects[$data['slug']] = Subject::create($data);
        }

        // =====================================================================
        // 3. Tutors
        // =====================================================================
        $tutorsData = [
            [
                'name'     => 'Dr. Alan Turing',
                'email'    => 'alan@learnora.local',
                'headline' => 'PhD in Mathematics | Expert in Calculus & Algebra',
                'rate'     => 4500.00,
                'subjects' => ['mathematics'],
                'method'   => TutorProfile::METHOD_BOTH,
                'slots'    => [
                    ['day' => 'monday', 'start' => '17:00', 'end' => '18:00', 'cost' => 4500.00],
                    ['day' => 'wednesday', 'start' => '17:00', 'end' => '18:00', 'cost' => 4500.00],
                ]
            ],
            [
                'name'     => 'Marie Curie',
                'email'    => 'marie@learnora.local',
                'headline' => 'Passionate Physics Educator',
                'rate'     => 3800.00,
                'subjects' => ['physics', 'mathematics'],
                'method'   => TutorProfile::METHOD_ONLINE,
                'slots'    => [
                    ['day' => 'saturday', 'start' => '09:00', 'end' => '11:00', 'cost' => 7600.00, 'duration' => 120],
                    ['day' => 'sunday', 'start' => '09:00', 'end' => '11:00', 'cost' => 7600.00, 'duration' => 120],
                ]
            ],
            [
                'name'     => 'William Shakespeare',
                'email'    => 'william@learnora.local',
                'headline' => 'Published Author & Literary Analyst',
                'rate'     => 3000.00,
                'subjects' => ['english-literature'],
                'method'   => TutorProfile::METHOD_IN_PERSON,
                'slots'    => [
                    ['day' => 'tuesday', 'start' => '15:00', 'end' => '16:00', 'cost' => 3000.00],
                    ['day' => 'thursday', 'start' => '15:00', 'end' => '16:00', 'cost' => 3000.00],
                ]
            ],
        ];

        foreach ($tutorsData as $tData) {
            // Create User
            $user = User::create([
                'name'              => $tData['name'],
                'email'             => $tData['email'],
                'password'          => $password,
                'role'              => User::ROLE_TUTOR,
                'status'            => User::STATUS_ACTIVE,
                'email_verified_at' => now(),
                'bio'               => 'Short tagline or general user bio goes here.',
            ]);

            // Create Tutor Profile
            $profile = TutorProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'headline'            => $tData['headline'],
                    'about'               => 'I am a highly experienced tutor dedicated to helping students achieve their academic goals through personalized lessons.',
                    'hourly_rate'         => $tData['rate'],
                    'experience_years'    => rand(2, 10),
                    'teaching_method'     => $tData['method'],
                    'availability_status' => 'available',
                    'is_verified'         => true,
                    'certifications'      => json_encode(['BSc (Hons)', 'PGCE']),
                    'languages'           => json_encode(['English']),
                ]
            );

            // Attach Subjects
            $subjectIds = array_map(fn($slug) => $subjects[$slug]->id, $tData['subjects']);
            $profile->subjects()->sync($subjectIds);

            // Create Availability Slots
            foreach ($tData['slots'] as $slot) {
                TutorAvailability::create([
                    'tutor_id'         => $user->id,
                    'day_of_week'      => $slot['day'],
                    'start_time'       => $slot['start'],
                    'end_time'         => $slot['end'],
                    'duration_minutes' => $slot['duration'] ?? 60,
                    'cost'             => $slot['cost'],
                    'meeting_type'     => $tData['method'],
                    'is_active'        => true,
                ]);
            }
        }

        // =====================================================================
        // 4. Students
        // =====================================================================
        $studentNames = [
            'Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince', 'Ethan Hunt'
        ];

        foreach ($studentNames as $name) {
            User::create([
                'name'              => $name,
                'email'             => strtolower(explode(' ', $name)[0]) . '@student.local',
                'password'          => $password,
                'role'              => User::ROLE_STUDENT,
                'status'            => User::STATUS_ACTIVE,
                'email_verified_at' => now(),
            ]);
        }
    }
}
