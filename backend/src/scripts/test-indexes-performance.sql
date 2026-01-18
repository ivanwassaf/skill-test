-- Database Performance Tests
-- Run EXPLAIN ANALYZE to test query performance with new indexes

-- ============================================
-- TEST 1: Query students by role (uses idx_users_role_id)
-- ============================================
EXPLAIN ANALYZE
SELECT u.id, u.name, u.email
FROM users u
WHERE u.role_id = 3
LIMIT 10;

-- ============================================
-- TEST 2: Query students with profile (uses indexes + JOIN)
-- ============================================
EXPLAIN ANALYZE
SELECT 
    u.id,
    u.name,
    u.email,
    u.last_login,
    u.is_active,
    p.class_name,
    p.section_name,
    p.roll
FROM users u
INNER JOIN user_profiles p ON u.id = p.user_id
WHERE u.role_id = 3
ORDER BY u.id
LIMIT 10;

-- ============================================
-- TEST 3: Filter by class and section (uses idx_user_profiles_class_section)
-- ============================================
EXPLAIN ANALYZE
SELECT 
    u.id,
    u.name,
    p.class_name,
    p.section_name,
    p.roll
FROM users u
INNER JOIN user_profiles p ON u.id = p.user_id
WHERE p.class_name = '10' AND p.section_name = 'A';

-- ============================================
-- TEST 4: Search by email (uses idx_users_email)
-- ============================================
EXPLAIN ANALYZE
SELECT id, name, email, is_active
FROM users
WHERE email = 'admin@school.com';

-- ============================================
-- TEST 5: Active users by role (uses idx_users_role_active composite)
-- ============================================
EXPLAIN ANALYZE
SELECT id, name, email
FROM users
WHERE role_id = 3 AND is_active = true
ORDER BY last_login DESC NULLS LAST
LIMIT 20;

-- ============================================
-- TEST 6: Refresh tokens by user (uses idx_user_refresh_tokens_user_id)
-- ============================================
EXPLAIN ANALYZE
SELECT token, expires_at
FROM user_refresh_tokens
WHERE user_id = 1
AND expires_at > NOW();

-- ============================================
-- TEST 7: Access control path matching (uses idx_access_controls_path_method)
-- ============================================
EXPLAIN ANALYZE
SELECT id, name, path, method
FROM access_controls
WHERE path = '/api/v1/students' AND method = 'GET';

-- ============================================
-- TEST 8: User permissions lookup (uses idx_permissions_role_access)
-- ============================================
EXPLAIN ANALYZE
SELECT p.id, p.role_id, p.access_control_id, ac.path, ac.method
FROM permissions p
INNER JOIN access_controls ac ON p.access_control_id = ac.id
WHERE p.role_id = 3;

-- ============================================
-- TEST 9: Recent notices (uses idx_notices_created_dt)
-- ============================================
EXPLAIN ANALYZE
SELECT id, title, author_id, created_dt, status
FROM notices
WHERE status = 1
ORDER BY created_dt DESC
LIMIT 10;

-- ============================================
-- TEST 10: User leaves by status (uses idx_user_leaves_user_status composite)
-- ============================================
EXPLAIN ANALYZE
SELECT id, user_id, from_dt, to_dt, reason
FROM user_leaves
WHERE user_id = 1
ORDER BY from_dt DESC;

-- ============================================
-- INDEX USAGE STATISTICS
-- ============================================
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 10 THEN 'LOW USAGE'
        WHEN idx_scan < 100 THEN 'MODERATE USAGE'
        ELSE 'HIGH USAGE'
    END as usage_level
FROM 
    pg_stat_user_indexes
WHERE 
    schemaname = 'public'
    AND indexname LIKE 'idx_%'
ORDER BY 
    idx_scan DESC;

-- ============================================
-- TABLE AND INDEX SIZES
-- ============================================
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size,
    ROUND(
        100.0 * (pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) / 
        NULLIF(pg_total_relation_size(schemaname||'.'||tablename), 0), 
        2
    ) AS index_percentage
FROM 
    pg_tables
WHERE 
    schemaname = 'public'
ORDER BY 
    pg_total_relation_size(schemaname||'.'||tablename) DESC;
