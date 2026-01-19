-- Script to insert test data for integration tests
-- This creates a test admin user with known credentials

-- First, ensure we have a role for admin (typically role_id = 1)
-- If you need to create the role, uncomment the following:
-- INSERT INTO roles (id, name, description) VALUES (1, 'Admin', 'Administrator role')
-- ON CONFLICT (id) DO NOTHING;

-- Delete existing test user if exists
DELETE FROM user_refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email = 'admin@test.com');
DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE email = 'admin@test.com');
DELETE FROM users WHERE email = 'admin@test.com';

-- Insert test admin user
-- Password: Test@1234 (hashed with argon2)
INSERT INTO users (
    id, 
    name, 
    email, 
    password, 
    role_id, 
    is_active, 
    is_email_verified,
    created_dt,
    updated_dt
) VALUES (
    999999,
    'Test Admin',
    'admin@test.com',
    '$argon2id$v=19$m=65536,t=3,p=4$a3eGdYL8Uc5SLNrZUmJW7A$fL5lSKpIY3JyAfXFe1bxj2BGvgfEnabWVU8teaR5G6I',
    1, -- Admin role
    true,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    password = EXCLUDED.password,
    role_id = EXCLUDED.role_id,
    is_active = EXCLUDED.is_active,
    is_email_verified = EXCLUDED.is_email_verified;

-- Insert user profile for test admin
INSERT INTO user_profiles (
    user_id,
    phone,
    current_address,
    created_dt,
    updated_dt
) VALUES (
    999999,
    '+1234567890',
    'Test Address',
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    phone = EXCLUDED.phone,
    current_address = EXCLUDED.current_address;

-- Insert a test student user
DELETE FROM user_refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email = 'student@test.com');
DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE email = 'student@test.com');
DELETE FROM users WHERE email = 'student@test.com';

INSERT INTO users (
    id,
    name,
    email,
    password,
    role_id,
    is_active,
    is_email_verified,
    created_dt,
    updated_dt
) VALUES (
    999998,
    'Test Student',
    'student@test.com',
    '$argon2id$v=19$m=65536,t=3,p=4$a3eGdYL8Uc5SLNrZUmJW7A$fL5lSKpIY3JyAfXFe1bxj2BGvgfEnabWVU8teaR5G6I',
    3, -- Student role
    true,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    password = EXCLUDED.password,
    role_id = EXCLUDED.role_id,
    is_active = EXCLUDED.is_active,
    is_email_verified = EXCLUDED.is_email_verified;

INSERT INTO user_profiles (
    user_id,
    phone,
    current_address,
    class_name,
    section_name,
    roll,
    created_dt,
    updated_dt
) VALUES (
    999998,
    '+1234567891',
    'Student Address',
    'Class 1',
    'Section 1',
    1,
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    phone = EXCLUDED.phone,
    current_address = EXCLUDED.current_address,
    class_name = EXCLUDED.class_name,
    section_name = EXCLUDED.section_name,
    roll = EXCLUDED.roll;

COMMIT;
