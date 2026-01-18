const { processDBRequest } = require("../../utils");
const { buildWhereClause } = require("../../utils/pagination");

const getRoleId = async (roleName) => {
    const query = "SELECT id FROM roles WHERE name ILIKE $1";
    const queryParams = [roleName];
    const { rows } = await processDBRequest({ query, queryParams });
    return rows[0].id;
}

/**
 * Find all students with pagination and filtering
 * Optimized with proper JOIN and indexed queries
 */
const findAllStudents = async (payload) => {
    const { name, className, section, roll, page = 1, limit = 10, sortBy = 'id', sortOrder = 'ASC' } = payload;
    
    // Build base query with proper JOIN (not LEFT JOIN for better performance)
    let query = `
        SELECT
            u.id,
            u.name,
            u.email,
            u.last_login AS "lastLogin",
            u.is_active AS "systemAccess",
            p.class_name AS "className",
            p.section_name AS "sectionName",
            p.roll
        FROM users u
        INNER JOIN user_profiles p ON u.id = p.user_id
        WHERE u.role_id = 3`;
    
    let queryParams = [];
    let paramIndex = 1;
    
    // Add filters dynamically
    if (name) {
        query += ` AND u.name ILIKE $${paramIndex}`;
        queryParams.push(`%${name}%`); // Allow partial matching
        paramIndex++;
    }
    if (className) {
        query += ` AND p.class_name = $${paramIndex}`;
        queryParams.push(className);
        paramIndex++;
    }
    if (section) {
        query += ` AND p.section_name = $${paramIndex}`;
        queryParams.push(section);
        paramIndex++;
    }
    if (roll) {
        query += ` AND p.roll = $${paramIndex}`;
        queryParams.push(roll);
        paramIndex++;
    }

    // Add sorting and pagination
    const offset = (page - 1) * limit;
    const allowedSortFields = ['id', 'name', 'email', 'lastLogin', 'className', 'roll'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'id';
    const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    // Map sortField to actual column names
    const fieldMapping = {
        'id': 'u.id',
        'name': 'u.name',
        'email': 'u.email',
        'lastLogin': 'u.last_login',
        'className': 'p.class_name',
        'roll': 'p.roll'
    };
    
    query += ` ORDER BY ${fieldMapping[sortField]} ${order} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const { rows } = await processDBRequest({ query, queryParams });
    return rows;
}

/**
 * Count total students with filtering (for pagination metadata)
 */
const countStudents = async (payload) => {
    const { name, className, section, roll } = payload;
    
    let query = `
        SELECT COUNT(*) as total
        FROM users u
        INNER JOIN user_profiles p ON u.id = p.user_id
        WHERE u.role_id = 3`;
    
    let queryParams = [];
    let paramIndex = 1;
    
    if (name) {
        query += ` AND u.name ILIKE $${paramIndex}`;
        queryParams.push(`%${name}%`);
        paramIndex++;
    }
    if (className) {
        query += ` AND p.class_name = $${paramIndex}`;
        queryParams.push(className);
        paramIndex++;
    }
    if (section) {
        query += ` AND p.section_name = $${paramIndex}`;
        queryParams.push(section);
        paramIndex++;
    }
    if (roll) {
        query += ` AND p.roll = $${paramIndex}`;
        queryParams.push(roll);
        paramIndex++;
    }

    const { rows } = await processDBRequest({ query, queryParams });
    return parseInt(rows[0].total, 10);
}

const addOrUpdateStudent = async (payload) => {
    const query = "SELECT * FROM student_add_update($1)";
    const queryParams = [payload];
    const { rows } = await processDBRequest({ query, queryParams });
    return rows[0];
}

const findStudentDetail = async (id) => {
    const query = `
        SELECT
            u.id,
            u.name,
            u.email,
            u.is_active AS "systemAccess",
            p.phone,
            p.gender,
            p.dob,
            p.class_name AS "class",
            p.section_name AS "section",
            p.roll,
            p.father_name AS "fatherName",
            p.father_phone AS "fatherPhone",
            p.mother_name AS "motherName",
            p.mother_phone AS "motherPhone",
            p.guardian_name AS "guardianName",
            p.guardian_phone AS "guardianPhone",
            p.relation_of_guardian as "relationOfGuardian",
            p.current_address AS "currentAddress",
            p.permanent_address AS "permanentAddress",
            p.admission_dt AS "admissionDate",
            r.name as "reporterName"
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        LEFT JOIN users r ON u.reporter_id = r.id
        WHERE u.id = $1`;
    const queryParams = [id];
    const { rows } = await processDBRequest({ query, queryParams });
    return rows[0];
}

const findStudentToSetStatus = async ({ userId, reviewerId, status }) => {
    const now = new Date();
    const query = `
        UPDATE users
        SET
            is_active = $1,
            status_last_reviewed_dt = $2,
            status_last_reviewer_id = $3
        WHERE id = $4
    `;
    const queryParams = [status, now, reviewerId, userId];
    const { rowCount } = await processDBRequest({ query, queryParams });
    return rowCount
}

const findStudentToUpdate = async (paylaod) => {
    const { basicDetails: { name, email }, id } = paylaod;
    const currentDate = new Date();
    const query = `
        UPDATE users
        SET name = $1, email = $2, updated_dt = $3
        WHERE id = $4;
    `;
    const queryParams = [name, email, currentDate, id];
    const { rows } = await processDBRequest({ query, queryParams });
    return rows;
}

module.exports = {
    getRoleId,
    findAllStudents,
    countStudents,
    addOrUpdateStudent,
    findStudentDetail,
    findStudentToSetStatus,
    findStudentToUpdate
};
