-- Database Optimization: Indexes for Performance (Actual Schema)
-- Run this file to create indexes on frequently queried columns

-- ============================================
-- USERS TABLE INDEXES
-- ============================================

-- Index on email (used in login, unique constraint already exists)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index on role_id (frequently used for filtering users by role)
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

-- Index on is_active (filtering active/inactive users)
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Index on last_login (for sorting by last login date)
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login DESC);

-- Index on is_email_verified (filtering verified users)
CREATE INDEX IF NOT EXISTS idx_users_is_email_verified ON users(is_email_verified);

-- Index on reporter_id (for hierarchical queries)
CREATE INDEX IF NOT EXISTS idx_users_reporter_id ON users(reporter_id);

-- Composite index for role + active status (very common query)
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role_id, is_active);


-- ============================================
-- USER_PROFILES TABLE INDEXES
-- ============================================

-- Index on user_id (foreign key, primary key already indexed)
-- PK already creates index, no need for additional

-- Index on class_name (used in filtering students by class)
CREATE INDEX IF NOT EXISTS idx_user_profiles_class_name ON user_profiles(class_name);

-- Index on section_name (used in filtering by section)
CREATE INDEX IF NOT EXISTS idx_user_profiles_section_name ON user_profiles(section_name);

-- Index on department_id (used in filtering staff by department)
CREATE INDEX IF NOT EXISTS idx_user_profiles_department_id ON user_profiles(department_id);

-- Composite index for class + section queries (very common for students)
CREATE INDEX IF NOT EXISTS idx_user_profiles_class_section ON user_profiles(class_name, section_name);

-- Index on admission_date (for sorting and filtering by date)
CREATE INDEX IF NOT EXISTS idx_user_profiles_admission_dt ON user_profiles(admission_dt);

-- Index on roll number (for student lookups)
CREATE INDEX IF NOT EXISTS idx_user_profiles_roll ON user_profiles(roll);


-- ============================================
-- CLASSES TABLE INDEXES
-- ============================================

-- Index on class name (used in searches, unique constraint already creates index)
CREATE INDEX IF NOT EXISTS idx_classes_name ON classes(name);


-- ============================================
-- SECTIONS TABLE INDEXES
-- ============================================

-- Index on section name (unique constraint already creates index)
CREATE INDEX IF NOT EXISTS idx_sections_name ON sections(name);


-- ============================================
-- DEPARTMENTS TABLE INDEXES
-- ============================================

-- Index on department name (unique constraint already creates index)
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);


-- ============================================
-- NOTICES TABLE INDEXES
-- ============================================

-- Index on created_by (foreign key to users)
CREATE INDEX IF NOT EXISTS idx_notices_created_by ON notices(created_by);

-- Index on created_dt (used for sorting by date)
CREATE INDEX IF NOT EXISTS idx_notices_created_dt ON notices(created_dt DESC);

-- Index on notice_status_id (used in filtering)
CREATE INDEX IF NOT EXISTS idx_notices_status_id ON notices(notice_status_id);

-- Index on recipient_type_id (used in filtering by audience)
CREATE INDEX IF NOT EXISTS idx_notices_recipient_type_id ON notices(recipient_type_id);


-- ============================================
-- USER_LEAVES TABLE INDEXES
-- ============================================

-- Index on user_id (frequently queried)
CREATE INDEX IF NOT EXISTS idx_user_leaves_user_id ON user_leaves(user_id);

-- Index on reviewer_id (for manager queries)
CREATE INDEX IF NOT EXISTS idx_user_leaves_reviewer_id ON user_leaves(reviewer_id);

-- Index on leave_status_id (for filtering pending/approved/rejected)
CREATE INDEX IF NOT EXISTS idx_user_leaves_status_id ON user_leaves(leave_status_id);

-- Index on leave_policy_id
CREATE INDEX IF NOT EXISTS idx_user_leaves_policy_id ON user_leaves(leave_policy_id);

-- Index on start_dt (for date range queries)
CREATE INDEX IF NOT EXISTS idx_user_leaves_start_dt ON user_leaves(start_dt);

-- Composite index for user + status (very common query)
CREATE INDEX IF NOT EXISTS idx_user_leaves_user_status ON user_leaves(user_id, leave_status_id);


-- ============================================
-- ROLES TABLE INDEXES
-- ============================================

-- Index on role name (unique constraint already creates index)
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

-- Index on is_active
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);


-- ============================================
-- PERMISSIONS TABLE INDEXES
-- ============================================

-- Index on access_control_id (foreign key)
CREATE INDEX IF NOT EXISTS idx_permissions_access_control_id ON permissions(access_control_id);

-- Index on role_id (foreign key)
CREATE INDEX IF NOT EXISTS idx_permissions_role_id ON permissions(role_id);

-- Composite index for role-access lookups
CREATE INDEX IF NOT EXISTS idx_permissions_role_access ON permissions(role_id, access_control_id);


-- ============================================
-- USER_REFRESH_TOKENS TABLE INDEXES
-- ============================================

-- Index on user_id (for finding user tokens)
CREATE INDEX IF NOT EXISTS idx_user_refresh_tokens_user_id ON user_refresh_tokens(user_id);

-- Index on token (for validation)
CREATE INDEX IF NOT EXISTS idx_user_refresh_tokens_token ON user_refresh_tokens(token);

-- Index on expires_at (for cleanup of expired tokens)
CREATE INDEX IF NOT EXISTS idx_user_refresh_tokens_expires_at ON user_refresh_tokens(expires_at);


-- ============================================
-- ACCESS_CONTROLS TABLE INDEXES
-- ============================================

-- Index on path (frequently used for route matching)
CREATE INDEX IF NOT EXISTS idx_access_controls_path ON access_controls(path);

-- Index on parent_path (for hierarchical queries)
CREATE INDEX IF NOT EXISTS idx_access_controls_parent_path ON access_controls(parent_path);

-- Index on type (for filtering by type)
CREATE INDEX IF NOT EXISTS idx_access_controls_type ON access_controls(type);

-- Composite index for path + method (route matching with HTTP method)
CREATE INDEX IF NOT EXISTS idx_access_controls_path_method ON access_controls(path, method);


-- ============================================
-- CLASS_TEACHERS TABLE INDEXES
-- ============================================

-- Index on user_id (teacher lookup)
CREATE INDEX IF NOT EXISTS idx_class_teachers_user_id ON class_teachers(user_id);

-- Index on class_id (class lookup)
CREATE INDEX IF NOT EXISTS idx_class_teachers_class_id ON class_teachers(class_id);

-- Index on section_id (section lookup)
CREATE INDEX IF NOT EXISTS idx_class_teachers_section_id ON class_teachers(section_id);


-- ============================================
-- LEAVE_POLICIES TABLE INDEXES
-- ============================================

-- Index on is_active
CREATE INDEX IF NOT EXISTS idx_leave_policies_is_active ON leave_policies(is_active);


-- ============================================
-- USER_LEAVE_POLICY TABLE INDEXES
-- ============================================

-- Index on user_id
CREATE INDEX IF NOT EXISTS idx_user_leave_policy_user_id ON user_leave_policy(user_id);

-- Index on leave_policy_id
CREATE INDEX IF NOT EXISTS idx_user_leave_policy_policy_id ON user_leave_policy(leave_policy_id);


-- ============================================
-- ANALYZE TABLES FOR QUERY OPTIMIZER
-- ============================================

-- Update statistics for query planner
ANALYZE users;
ANALYZE user_profiles;
ANALYZE classes;
ANALYZE sections;
ANALYZE departments;
ANALYZE notices;
ANALYZE user_leaves;
ANALYZE roles;
ANALYZE permissions;
ANALYZE user_refresh_tokens;
ANALYZE access_controls;
ANALYZE class_teachers;
ANALYZE leave_policies;
ANALYZE user_leave_policy;


-- ============================================
-- CHECK INDEX USAGE AFTER APPLYING
-- ============================================

-- Query to check index usage statistics (run after some time)
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM 
    pg_stat_user_indexes
WHERE 
    schemaname = 'public'
ORDER BY 
    idx_scan DESC;
*/

-- Query to find unused indexes
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan
FROM 
    pg_stat_user_indexes
WHERE 
    schemaname = 'public' 
    AND idx_scan = 0
    AND indexname NOT LIKE '%_pkey'
    AND indexname NOT LIKE '%_key';
*/

-- Query to check table and index sizes
/*
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM 
    pg_tables
WHERE 
    schemaname = 'public'
ORDER BY 
    pg_total_relation_size(schemaname||'.'||tablename) DESC;
*/
