const { ApiError, sendAccountVerificationEmail } = require("../../utils");
const {
    findAllStudents,
    findStudentDetail,
    findStudentToSetStatus,
    addOrUpdateStudent,
    deleteStudent: deleteStudentRepo,
    updateStudentBasic
} = require("./students-repository");
const { findUserById } = require("../../shared/repository");

const checkStudentId = async (id) => {
    const isStudentFound = await findUserById(id);
    if (!isStudentFound) {
        throw new ApiError(404, "Student not found");
    }
};

const getAllStudents = async (payload) => {
    const result = await findAllStudents(payload);
    
    return {
        success: true,
        data: result.students,
        pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
        },
    };
};

const getStudentDetail = async (id) => {
    await checkStudentId(id);

    const student = await findStudentDetail(id);
    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    return {
        success: true,
        data: student,
    };
};

const addNewStudent = async (payload) => {
    const ADD_STUDENT_AND_EMAIL_SEND_SUCCESS = "Student added and verification email sent successfully.";
    const ADD_STUDENT_AND_BUT_EMAIL_SEND_FAIL = "Student added, but failed to send verification email.";
    try {
        const result = await addOrUpdateStudent(payload);
        if (!result.status) {
            throw new ApiError(500, result.message);
        }

        try {
            await sendAccountVerificationEmail({ userId: result.userId, userEmail: payload.email });
            return {
                success: true,
                data: result,
                message: ADD_STUDENT_AND_EMAIL_SEND_SUCCESS
            };
        } catch (error) {
            return {
                success: true,
                data: result,
                message: ADD_STUDENT_AND_BUT_EMAIL_SEND_FAIL
            };
        }
    } catch (error) {
        throw new ApiError(500, "Unable to add student");
    }
};

const updateStudent = async (id, payload) => {
    await checkStudentId(id);
    
    const { name, email } = payload;
    
    if (!name && !email) {
        throw new ApiError(400, "At least one field (name or email) must be provided for update");
    }
    
    try {
        const updated = await updateStudentBasic(id, name || undefined, email || undefined);
        return {
            success: true,
            message: "Student updated successfully",
            updated
        };
    } catch (error) {
        if (error.message === "Student not found") {
            throw new ApiError(404, "Student not found");
        }
        throw new ApiError(500, "Unable to update student");
    }
};

const setStudentStatus = async (id, is_active) => {
    await checkStudentId(id);

    const reviewerId = null;
    const affectedRow = await findStudentToSetStatus({
        userId: id,
        reviewerId,
        status: is_active
    });
    if (affectedRow <= 0) {
        throw new ApiError(500, "Unable to change student status");
    }

    return {
        success: true,
        message: "Student status changed successfully" 
    };
};

//Delete Function
const deleteStudent = async (id) => {
    await checkStudentId(id);
    try {
        await deleteStudentRepo(id);
        return {
            success: true,
            message: "Student deleted successfully"
        };
    } catch (error) {
        if (error.message === "Student not found") {
            throw new ApiError(404, "Student not found");
        }
        throw error;
    }
};

module.exports = {
    getAllStudents,
    getStudentDetail,
    addNewStudent,
    setStudentStatus,
    updateStudent,
    deleteStudent
};