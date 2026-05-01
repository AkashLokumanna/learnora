# Learnora - Master Project Plan & Progress Tracker

## 1. Project Overview
* **Title:** Learnora - A Web-Based Tutor and Student Booking Platform[cite: 2].
* **Student:** Akash Lokumanna[cite: 2].
* **Project Outline:** Learnora is an online application to be utilized to automate tutoring, and also aids in scheduling the student appointments[cite: 2]. 
* **Primary Goal:** The project aims at the seamless delivery of scalable, safe, and user-friendly solutions that are true reflections of real-world software development practices[cite: 2].

## 2. Core Architecture
* **Backend:** Laravel will be used as a RESTful backend API[cite: 2].
* **Frontend:** React will be used as the frontend framework[cite: 2].

## 3. Feature Implementation Status

### The Tutor Experience
* [x] Tutors must be able to complete registration processes[cite: 2].
* [x] Tutors must be able to create their professional profiles[cite: 2].
* [x] Tutors must be able to select their teaching subjects[cite: 2].
* [x] Tutors must be able to create their availability schedules[cite: 2].
* [x] Tutors must be able to handle their class reservations[cite: 2].

### The Student Experience
* [x] Students must have the ability to find tutors who match their needed subjects, teaching times, and tuition costs and student evaluations[cite: 2]. *(Note: Global search bug currently being fixed in Cursor).*
* [x] Students must be able to use a secure payment system to schedule classes[cite: 2].

### Platform Features
* [x] The platform must feature integrated payment gateways which will enable users to make payments using both Visa and bank payment methods[cite: 2]. *(Implemented via PayHere).*
* [x] The system must include real-time notifications[cite: 2]. *(Implemented via Laravel queued emails).*
* [x] The system must include an administrative dashboard which will allow system monitoring and analytics[cite: 2]. *(Read-only analytics currently implemented).*
* [ ] **PENDING:** The platform must support coupon and discount management[cite: 2].

## 4. Academic Deliverables Checklist
To successfully complete the BSc Computing dissertation, the following must be submitted:

### Software Product
* [ ] A fully functional web application (Learnora)[cite: 2].
* [x] Source code repository[cite: 2]. *(Git repository initialized and pushed to GitHub).*
* [ ] Deployment demo[cite: 2].

### System Documentation
* [ ] Requirements specification[cite: 2].
* [ ] System architecture diagrams[cite: 2].
* [ ] Database design documentation[cite: 2].
* [ ] API documentation[cite: 2].

### Final Project Report
* [ ] Literature review[cite: 2].
* [ ] Design and implementation[cite: 2].
* [ ] Testing and evaluation[cite: 2].
* [ ] Reflection and future work[cite: 2].

## 5. Immediate Next Steps for Cursor AI
1. **Squash the Search Bug:** Fix the fuzzy search logic in `TutorSearchController` and the URL parameter parsing in `FindTutors.jsx` to complete the Student Discovery requirement.
2. **Squash the Auth Sync Bug:** Fix the React Router desynchronization upon login.
3. **Build Coupon Management:** Implement the "coupon and discount management" feature promised in the project proposal to ensure grading criteria are met.
4. **Upgrade Admin Dashboard:** Add functional controls to the admin dashboard (user management) alongside the existing analytics.