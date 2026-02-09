const asyncHandler = require("express-async-handler");
const { ApiError } = require("../../utils");
const { getAllStudents, addNewStudent, getStudentDetail, setStudentStatus, updateStudent, deleteStudent } = require("./students-service");

const createStudentSchema = {
    name: (val) => typeof val === 'string' && val.trim().length > 0,
    email: (val) => typeof val === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
};

const validateCreateStudent = (data) => {
    const errors = {};
    let isValid = true;

    if (!createStudentSchema.name(data.name)) {
        errors.name = 'Name is required';
        isValid = false;
    }

    if (!createStudentSchema.email(data.email)) {
        errors.email = 'Valid email is required';
        isValid = false;
    }

    return { isValid, errors };
};

//GET /api/v1/students
const handleGetAllStudents = asyncHandler(async (req, res) => {
    try{
        const {page=1, limit=10, search='', class: classFilter, section: sectionFilter} = req.query;

        const result = await getAllStudents({
            page: parseInt(page),
            limit: parseInt(limit),
            search,
            classFilter,
            sectionFilter
        });

        res.status(200).json(result);
    } catch (error) {
        console.error('Error in handleGetAllStudents: ', error);
        throw error;
    }
});

//POST /api/v1/students
const handleAddStudent = asyncHandler(async (req, res) => {
    try{
        const {name, email, class_name, section_name, roll, dob, father_name, father_phone} = req.body;

        const validation = validateCreateStudent({name, email});
        if (!validation.isValid){
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors,
            });
        }
        const result = await addNewStudent({
            name, email, class_name, section_name, roll, dob, father_name, father_phone
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Error in handleAddStudent:', error)
        if (error.code === '23505'){
            return res.status(409).json({
                success: false,
                message: 'A student with this email already exists',
            });
        }
        throw error;
    }
});

//PUT /api/v1/students/:id
const handleUpdateStudent = asyncHandler(async (req, res) => {
    try{
        const {id} = req.params;
        const {name, email, class_name, section_name, roll, dob, father_name, father_phone} = req.body;

        if (!id || isNaN(id)){
            return res.status(400).json({
                success: false,
                message: 'Valid student ID is required',
            });
        }

        const result = await updateStudent(id, {
            name, email, class_name, section_name, roll, dob, father_name, father_phone,
        });
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in handleUpdateStudent:', error);
        if (error.code === '23505'){
            return res.status(409).json({
                success: false,
                message: 'Email already in use',
            });
        }
        if (error instanceof ApiError && error.statusCode === 404){
            return res.status(404).json({
                success: false,
                message: 'Student not found',
            })
        }
        throw error;
    }
});

//GET /api/v1/students/:id
const handleGetStudentDetail = asyncHandler(async (req, res) => {
    try{
        const {id} = req.params;

        if (!id || isNaN(id)){
            return res.status(400).json({
                success: false,
                message: 'Valid student ID is required',
            });
        }

        const result = await getStudentDetail(id);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in handleGetStudentDetail:', error);
        if (error instanceof ApiError && error.statusCode === 404){
            return res.status(404).json({
                success: false,
                message: 'Student not found',
            });
        }
        throw error;
    }
});

//PATCH /api/v1/students/:id/status
const handleStudentStatus = asyncHandler(async (req, res) => {
    try{
        const {id} = req.params;
        const {is_active} = req.body;
    
        if (!id || isNaN(id)){
            return res.status(400).json({
                success: false,
                message: 'Valid student ID is required',
            });
        }

        if (typeof is_active !== 'boolean'){
            return res.status(400).json({
                success: false,
                message: 'is_active must be a boolean value (true/false)',
            });
        }

        const result = await setStudentStatus(id, is_active);
        res.status(200).json(result);
    } catch (error){
        console.error('Error in handleStudentStatus:', error);
        if (error instanceof ApiError && error.statusCode === 404){
            return res.status(404).json({
                success: false,
                message: 'Student not found',
            });
        }
        throw error;
    }
});

const handleDeleteStudent = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) {
            return res.status(400).json({ success: false, message: 'Valid student ID is required' });
        }
        const result = await deleteStudent(id);
        res.status(200).json(result);
    } catch (error) {
        if (error instanceof ApiError && error.statusCode === 404) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        throw error;
    }
});

module.exports = {
    handleGetAllStudents,
    handleGetStudentDetail,
    handleAddStudent,
    handleStudentStatus,
    handleUpdateStudent,
    handleDeleteStudent,
};
