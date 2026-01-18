-- Database Optimization: Indexes for Performance
-- Run this file to create indexes on frequently queried columns

-- ============================================
-- STUDENTS TABLE INDEXES
-- ============================================

-- Index on email (used in login, unique constraint)
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);

-- Index on class_id (used in filtering students by class)
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);

-- Index on section_id (used in filtering students by section)
CREATE INDEX IF NOT EXISTS idx_students_section_id ON students(section_id);

-- Index on status (used in filtering active/inactive students)
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);

-- Composite index for class + section queries (very common)
CREATE INDEX IF NOT EXISTS idx_students_class_section ON students(class_id, section_id);

-- Index on admission_date (for sorting and filtering by date)
CREATE INDEX IF NOT EXISTS idx_students_admission_date ON students(admission_date);

-- Index on wallet_address (used in blockchain certificate operations)
CREATE INDEX IF NOT EXISTS idx_students_wallet_address ON students(wallet_address) 
WHERE wallet_address IS NOT NULL;


-- ============================================
-- STAFF TABLE INDEXES
-- ============================================

-- Index on email (used in login)
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);

-- Index on department_id (used in filtering staff by department)
CREATE INDEX IF NOT EXISTS idx_staff_department_id ON staff(department_id);

-- Index on role (used in filtering by role type)
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);

-- Index on status
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);


-- ============================================
-- CLASSES TABLE INDEXES
-- ============================================

-- Index on class name (used in searches)
CREATE INDEX IF NOT EXISTS idx_classes_name ON classes(name);

-- Index on academic year (used in filtering)
CREATE INDEX IF NOT EXISTS idx_classes_academic_year ON classes(academic_year);


-- ============================================
-- SECTIONS TABLE INDEXES
-- ============================================

-- Index on class_id (foreign key, frequently joined)
CREATE INDEX IF NOT EXISTS idx_sections_class_id ON sections(class_id);

-- Index on section name
CREATE INDEX IF NOT EXISTS idx_sections_name ON sections(name);


-- ============================================
-- DEPARTMENTS TABLE INDEXES
-- ============================================

-- Index on department name (used in searches)
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);


-- ============================================
-- NOTICES TABLE INDEXES
-- ============================================

-- Index on created_by (foreign key to staff)
CREATE INDEX IF NOT EXISTS idx_notices_created_by ON notices(created_by);

-- Index on created_at (used for sorting by date)
CREATE INDEX IF NOT EXISTS idx_notices_created_at ON notices(created_at DESC);

-- Index on target_audience (used in filtering)
CREATE INDEX IF NOT EXISTS idx_notices_target_audience ON notices(target_audience);

-- Index on status (used in filtering active/archived notices)
CREATE INDEX IF NOT EXISTS idx_notices_status ON notices(status);


-- ============================================
-- LEAVE TABLE INDEXES
-- ============================================

-- Index on user_id (frequently queried)
CREATE INDEX IF NOT EXISTS idx_leave_user_id ON leave(user_id);

-- Index on reviewer_id (for manager queries)
CREATE INDEX IF NOT EXISTS idx_leave_reviewer_id ON leave(reviewer_id);

-- Index on status (for filtering pending/approved/rejected)
CREATE INDEX IF NOT EXISTS idx_leave_status ON leave(status);

-- Index on leave_type
CREATE INDEX IF NOT EXISTS idx_leave_type ON leave(leave_type);

-- Index on start_date (for date range queries)
CREATE INDEX IF NOT EXISTS idx_leave_start_date ON leave(start_date);

-- Composite index for user + status (very common query)
CREATE INDEX IF NOT EXISTS idx_leave_user_status ON leave(user_id, status);


-- ============================================
-- ROLES TABLE INDEXES
-- ============================================

-- Index on role name (frequently searched)
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);


-- ============================================
-- PERMISSIONS TABLE INDEXES
-- ============================================

-- Index on permission name
CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);

-- Index on resource (for filtering by resource type)
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);


-- ============================================
-- ROLE_PERMISSIONS TABLE INDEXES
-- ============================================

-- Index on role_id (foreign key, frequently joined)
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);

-- Index on permission_id (foreign key, frequently joined)
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Composite index for role-permission lookups
CREATE INDEX IF NOT EXISTS idx_role_permissions_composite ON role_permissions(role_id, permission_id);


-- ============================================
-- USER_ROLES TABLE INDEXES
-- ============================================

-- Index on user_id (foreign key, frequently joined)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- Index on role_id (foreign key, frequently joined)
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- Composite index for user-role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_composite ON user_roles(user_id, role_id);


-- ============================================
-- REFRESH_TOKENS TABLE INDEXES
-- ============================================

-- Index on user_id (for finding user tokens)
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- Index on token (for validation, should be unique)
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

-- Index on expires_at (for cleanup of expired tokens)
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);


-- ============================================
-- ANALYZE TABLES FOR QUERY OPTIMIZER
-- ============================================

-- Update statistics for query planner
ANALYZE students;
ANALYZE staff;
ANALYZE classes;
ANALYZE sections;
ANALYZE departments;
ANALYZE notices;
ANALYZE leave;
ANALYZE roles;
ANALYZE permissions;
ANALYZE role_permissions;
ANALYZE user_roles;
ANALYZE refresh_tokens;


-- ============================================
-- VACUUM TABLES (Optional - for maintenance)
-- ============================================

-- Reclaim storage and update statistics
-- Run periodically, not during high traffic
-- VACUUM ANALYZE students;
-- VACUUM ANALYZE staff;
-- VACUUM ANALYZE notices;
-- VACUUM ANALYZE leave;


-- ============================================
-- CHECK INDEX USAGE
-- ============================================

-- Query to check index usage statistics
-- Run this after some time to see which indexes are being used
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

-- Query to find unused indexes (consider dropping these)
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
    AND indexname NOT LIKE '%_pkey';
*/

-- Query to check table sizes and index sizes
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
