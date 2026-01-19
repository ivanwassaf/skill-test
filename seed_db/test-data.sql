-- Test data for integration tests
-- This file inserts test users and data needed for CI/CD integration tests

-- Insert test admin user (password: Test@1234)
-- Hash generated with argon2id
INSERT INTO users(name, email, role_id, created_dt, password, is_active, is_email_verified)
VALUES('Test Admin', 'admin@test.com', 1, now(), '$argon2id$v=19$m=65536,t=3,p=4$gCdEasg7XDGYdp9SUx5I1g$BsLnOehjqKsgTXTeCD0/JzIU8R828d1ItD2g3pyY4fI', true, true)
ON CONFLICT (email) DO NOTHING;

-- Insert profile for test admin
INSERT INTO user_profiles
(user_id, gender, marital_status, phone, dob, join_dt, qualification, experience, current_address, permanent_address, father_name, mother_name, emergency_phone)
SELECT id, 'Male', 'Single', '1234567890', '1990-01-01', now(), 'Master', '5 years', 'Test Address', 'Test Address', 'Test Father', 'Test Mother', '0987654321'
FROM users WHERE email = 'admin@test.com'
ON CONFLICT (user_id) DO NOTHING;

-- Insert some test students
INSERT INTO students (name, gender, dob, email, phone, current_address, guardian_name, guardian_phone, class_id, section_id, status, admission_date)
VALUES
('Student One', 'Male', '2010-01-15', 'student1@test.com', '1111111111', '123 Test St', 'Guardian One', '2222222222', NULL, NULL, 'active', now()),
('Student Two', 'Female', '2011-03-20', 'student2@test.com', '3333333333', '456 Test Ave', 'Guardian Two', '4444444444', NULL, NULL, 'active', now()),
('Student Three', 'Male', '2010-07-10', 'student3@test.com', '5555555555', '789 Test Blvd', 'Guardian Three', '6666666666', NULL, NULL, 'active', now())
ON CONFLICT (email) DO NOTHING;
