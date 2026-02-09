const { processDBRequest } = require("../../utils");

const getRoleId = async (roleName) => {
    const query = "SELECT id FROM roles WHERE name ILIKE $1";
    const queryParams = [roleName];
    const { rows } = await processDBRequest({ query, queryParams });
    return rows[0].id;
}

const findAllStudents = async (payload) => {
    const { page = 1, limit = 10, search = '', classFilter, sectionFilter } = payload;
    const offset = (page - 1) * limit;
    
    let query = `
        SELECT
            t1.id,
            t1.name,
            t1.email,
            t1.last_login AS "lastLogin",
            t1.is_active AS "systemAccess",
            t3.class_name AS "class",
            t3.section_name AS "section",
            t3.roll
        FROM users t1
        LEFT JOIN user_profiles t3 ON t1.id = t3.user_id
        WHERE t1.role_id = 3`;
    
    const queryParams = [];
    let paramIndex = 1;
    
    //Search filter
    if (search) {
        query += ` AND (t1.name ILIKE $${paramIndex} OR t1.email ILIKE $${paramIndex})`;
        queryParams.push(`%${search}%`);
        paramIndex++;
    }
    
    //Class filter
    if (classFilter) {
        query += ` AND t3.class_name = $${paramIndex}`;
        queryParams.push(classFilter);
        paramIndex++;
    }
    
    //Section filter
    if (sectionFilter) {
        query += ` AND t3.section_name = $${paramIndex}`;
        queryParams.push(sectionFilter);
        paramIndex++;
    }

    //Pagination
    query += ` ORDER BY t1.id LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);
    
    const { rows } = await processDBRequest({ query, queryParams });
    
    let countQuery = `
        SELECT COUNT(*) as total
        FROM users t1
        LEFT JOIN user_profiles t3 ON t1.id = t3.user_id
        WHERE t1.role_id = 3
    `;
    
    const countParams = [];
    let countIndex = 1;
    
    if (search) {
        countQuery += ` AND (t1.name ILIKE $${countIndex} OR t1.email ILIKE $${countIndex})`;
        countParams.push(`%${search}%`);
        countIndex++;
    }
    
    if (classFilter) {
        countQuery += ` AND t3.class_name = $${countIndex}`;
        countParams.push(classFilter);
        countIndex++;
    }
    
    if (sectionFilter) {
        countQuery += ` AND t3.section_name = $${countIndex}`;
        countParams.push(sectionFilter);
    }
    
    const { rows: countRows } = await processDBRequest({ query: countQuery, queryParams: countParams });
    
    return {
        students: rows,
        total: parseInt(countRows[0].total),
        page: parseInt(page),
        limit: parseInt(limit)
    };
};

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

const findStudentToUpdate = async (payload) => {
    const { basicDetails: { name, email }, id } = payload;
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

const deleteStudent = async (id) => {
    await processDBRequest({
        query: "DELETE FROM user_profiles WHERE user_id = $1",
        queryParams: [id]
    });
    
    const { rows } = await processDBRequest({
        query: "DELETE FROM users WHERE id = $1 RETURNING id",
        queryParams: [id]
    });
    
    if (rows.length === 0) {
        throw new Error("Student not found");
    }
    
    return rows[0];
};

const updateStudentBasic = async (id, name, email) => {
    const query = `
        UPDATE users 
        SET name = $1, email = $2, updated_dt = NOW() 
        WHERE id = $3 
        RETURNING id, name, email
    `;
    const { rows } = await processDBRequest({
        query,
        queryParams: [name, email, id]
    });
    
    if (rows.length === 0) {
        throw new Error("Student not found");
    }
    
    return rows[0];
};

module.exports = {
    getRoleId,
    findAllStudents,
    addOrUpdateStudent,
    findStudentDetail,
    findStudentToSetStatus,
    findStudentToUpdate,
    deleteStudent,
    updateStudentBasic
};
