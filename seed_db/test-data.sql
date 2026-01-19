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

-- Insert test students (NO existe tabla students, se usan users con role_id=3)
-- Password for all test students: Test@1234 (same hash as admin)
INSERT INTO users(name, email, role_id, created_dt, password, is_active, is_email_verified)
VALUES
('Student One', 'student1@test.com', 3, now(), '$argon2id$v=19$m=65536,t=3,p=4$gCdEasg7XDGYdp9SUx5I1g$BsLnOehjqKsgTXTeCD0/JzIU8R828d1ItD2g3pyY4fI', true, true),
('Student Two', 'student2@test.com', 3, now(), '$argon2id$v=19$m=65536,t=3,p=4$gCdEasg7XDGYdp9SUx5I1g$BsLnOehjqKsgTXTeCD0/JzIU8R828d1ItD2g3pyY4fI', true, true),
('Student Three', 'student3@test.com', 3, now(), '$argon2id$v=19$m=65536,t=3,p=4$gCdEasg7XDGYdp9SUx5I1g$BsLnOehjqKsgTXTeCD0/JzIU8R828d1ItD2g3pyY4fI', true, true)
ON CONFLICT (email) DO NOTHING;

-- Insert profiles for test students
INSERT INTO user_profiles
(user_id, gender, marital_status, phone, dob, join_dt, current_address, permanent_address, father_name, mother_name, emergency_phone, class_name, section_name, roll)
SELECT 
  id, 
  CASE name 
    WHEN 'Student One' THEN 'Male'
    WHEN 'Student Two' THEN 'Female'
    WHEN 'Student Three' THEN 'Male'
  END,
  'Single', 
  CASE name
    WHEN 'Student One' THEN '1111111111'
    WHEN 'Student Two' THEN '3333333333'
    WHEN 'Student Three' THEN '5555555555'
  END,
  '2010-01-15', 
  now(), 
  '123 Test St', 
  '123 Test St', 
  'Test Father', 
  'Test Mother', 
  '9999999999',
  'Test Class',
  'Test Section',
  CASE name
    WHEN 'Student One' THEN 1
    WHEN 'Student Two' THEN 2
    WHEN 'Student Three' THEN 3
  END
FROM users 
WHERE email IN ('student1@test.com', 'student2@test.com', 'student3@test.com')
ON CONFLICT (user_id) DO NOTHING;

-- Insert notice recipient types (required for notices module)
ALTER SEQUENCE notice_recipient_types_id_seq RESTART WITH 1;
INSERT INTO notice_recipient_types (role_id, primary_dependent_name, primary_dependent_select)
VALUES 
(1, NULL, NULL),  -- Admin
(2, 'department', 'SELECT id, name FROM departments ORDER BY name'),  -- Teacher by department
(3, 'class', 'SELECT id, name FROM classes ORDER BY name')  -- Student by class
ON CONFLICT DO NOTHING;
