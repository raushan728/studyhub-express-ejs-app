const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const multer = require('multer');
const path = require('path');

// Middleware to check if user is authenticated and is admin
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        req.flash('error', 'Access denied. Admin privileges required.');
        res.redirect('/auth/login');
    }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/courses/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        // Allow images, PDFs, and documents
        const allowedImageTypes = /jpeg|jpg|png|gif/;
        const allowedDocTypes = /pdf|doc|docx/;
        const extname = path.extname(file.originalname).toLowerCase();
        
        if (allowedImageTypes.test(extname) || allowedDocTypes.test(extname)) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files (JPG, PNG, GIF) and documents (PDF, DOC, DOCX) are allowed!'));
        }
    }
});

// GET /admin - Admin Dashboard
router.get('/', isAdmin, async (req, res) => {
    try {
        // Get statistics
        const totalUsers = await User.countDocuments({ role: 'student' });
        const totalCourses = await Course.countDocuments();
        const totalEnrollments = await Course.aggregate([
            { $group: { _id: null, total: { $sum: { $size: "$enrolledStudents" } } } }
        ]);

        // Get recent courses
        const recentCourses = await Course.find()
            .populate('instructor', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        // Get popular courses
        const popularCourses = await Course.find({ isPublished: true })
            .sort({ totalStudents: -1 })
            .limit(5);

        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            user: req.session.user,
            stats: {
                totalUsers: totalUsers,
                totalCourses: totalCourses,
                totalEnrollments: totalEnrollments[0]?.total || 0
            },
            recentCourses: recentCourses,
            popularCourses: popularCourses
        });
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        req.flash('error', 'Error loading admin dashboard');
        res.redirect('/');
    }
});

// GET /admin/courses - Course Management
router.get('/courses', isAdmin, async (req, res) => {
    try {
        const courses = await Course.find()
            .populate('instructor', 'name')
            .sort({ createdAt: -1 });

        res.render('admin/courses', {
            title: 'Course Management',
            user: req.session.user,
            courses: courses
        });
    } catch (error) {
        console.error('Error loading courses:', error);
        req.flash('error', 'Error loading courses');
        res.redirect('/admin');
    }
});

// GET /admin/courses/create - Create Course Form
router.get('/courses/create', isAdmin, async (req, res) => {
    try {
        const instructors = await User.find({ role: { $in: ['admin', 'instructor'] } });
        res.render('admin/course-form', {
            title: 'Create Course',
            user: req.session.user,
            course: null,
            instructors: instructors,
            isEdit: false
        });
    } catch (error) {
        console.error('Error loading create course form:', error);
        req.flash('error', 'Error loading form');
        res.redirect('/admin/courses');
    }
});

// POST /admin/courses/create - Create Course
router.post('/courses/create', isAdmin, upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'courseMaterial', maxCount: 1 },
    { name: 'syllabus', maxCount: 1 }
]), async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            level,
            duration,
            price,
            originalPrice,
            discount,
            instructor,
            requirements,
            learningOutcomes,
            language
        } = req.body;

        const courseData = {
            title,
            description,
            category,
            level,
            duration,
            price: parseFloat(price),
            originalPrice: parseFloat(originalPrice),
            discount: parseFloat(discount),
            instructor,
            requirements: requirements ? requirements.split('\n') : [],
            learningOutcomes: learningOutcomes ? learningOutcomes.split('\n') : [],
            language,
            isPublished: req.body.isPublished === 'on',
            isFeatured: req.body.isFeatured === 'on'
        };

        // Handle file uploads
        if (req.files) {
            if (req.files.thumbnail && req.files.thumbnail[0]) {
                courseData.thumbnail = '/uploads/courses/' + req.files.thumbnail[0].filename;
            }
            if (req.files.courseMaterial && req.files.courseMaterial[0]) {
                courseData.courseMaterial = '/uploads/courses/' + req.files.courseMaterial[0].filename;
            }
            if (req.files.syllabus && req.files.syllabus[0]) {
                courseData.syllabus = '/uploads/courses/' + req.files.syllabus[0].filename;
            }
        }

        const course = new Course(courseData);
        await course.save();

        req.flash('success', 'Course created successfully!');
        res.redirect('/admin/courses');
    } catch (error) {
        console.error('Error creating course:', error);
        req.flash('error', 'Error creating course');
        res.redirect('/admin/courses/create');
    }
});

// GET /admin/courses/:id/edit - Edit Course Form
router.get('/courses/:id/edit', isAdmin, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        const instructors = await User.find({ role: { $in: ['admin', 'instructor'] } });

        if (!course) {
            req.flash('error', 'Course not found');
            return res.redirect('/admin/courses');
        }

        res.render('admin/course-form', {
            title: 'Edit Course',
            user: req.session.user,
            course: course,
            instructors: instructors,
            isEdit: true
        });
    } catch (error) {
        console.error('Error loading edit course form:', error);
        req.flash('error', 'Error loading form');
        res.redirect('/admin/courses');
    }
});

// POST /admin/courses/:id/edit - Update Course
router.post('/courses/:id/edit', isAdmin, upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'courseMaterial', maxCount: 1 },
    { name: 'syllabus', maxCount: 1 }
]), async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            req.flash('error', 'Course not found');
            return res.redirect('/admin/courses');
        }

        const {
            title,
            description,
            category,
            level,
            duration,
            price,
            originalPrice,
            discount,
            instructor,
            requirements,
            learningOutcomes,
            language
        } = req.body;

        const updateData = {
            title,
            description,
            category,
            level,
            duration,
            price: parseFloat(price),
            originalPrice: parseFloat(originalPrice),
            discount: parseFloat(discount),
            instructor,
            requirements: requirements ? requirements.split('\n') : [],
            learningOutcomes: learningOutcomes ? learningOutcomes.split('\n') : [],
            language,
            isPublished: req.body.isPublished === 'on',
            isFeatured: req.body.isFeatured === 'on'
        };

        // Handle file uploads
        if (req.files) {
            if (req.files.thumbnail && req.files.thumbnail[0]) {
                updateData.thumbnail = '/uploads/courses/' + req.files.thumbnail[0].filename;
            }
            if (req.files.courseMaterial && req.files.courseMaterial[0]) {
                updateData.courseMaterial = '/uploads/courses/' + req.files.courseMaterial[0].filename;
            }
            if (req.files.syllabus && req.files.syllabus[0]) {
                updateData.syllabus = '/uploads/courses/' + req.files.syllabus[0].filename;
            }
        }

        await Course.findByIdAndUpdate(req.params.id, updateData);

        req.flash('success', 'Course updated successfully!');
        res.redirect('/admin/courses');
    } catch (error) {
        console.error('Error updating course:', error);
        req.flash('error', 'Error updating course');
        res.redirect(`/admin/courses/${req.params.id}/edit`);
    }
});

// POST /admin/courses/:id/delete - Delete Course
router.post('/courses/:id/delete', isAdmin, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            req.flash('error', 'Course not found');
            return res.redirect('/admin/courses');
        }

        await Course.findByIdAndDelete(req.params.id);
        req.flash('success', 'Course deleted successfully!');
        res.redirect('/admin/courses');
    } catch (error) {
        console.error('Error deleting course:', error);
        req.flash('error', 'Error deleting course');
        res.redirect('/admin/courses');
    }
});

// GET /admin/users - User Management
router.get('/users', isAdmin, async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        
        res.render('admin/users', {
            title: 'User Management',
            user: req.session.user,
            users: users
        });
    } catch (error) {
        console.error('Error loading users:', error);
        req.flash('error', 'Error loading users');
        res.redirect('/admin');
    }
});

// POST /admin/users/:id/delete - Delete User
router.post('/users/:id/delete', isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/admin/users');
        }

        if (user.role === 'admin' && user._id.toString() === req.session.user._id.toString()) {
            req.flash('error', 'You cannot delete your own admin account');
            return res.redirect('/admin/users');
        }

        await User.findByIdAndDelete(req.params.id);
        req.flash('success', 'User deleted successfully!');
        res.redirect('/admin/users');
    } catch (error) {
        console.error('Error deleting user:', error);
        req.flash('error', 'Error deleting user');
        res.redirect('/admin/users');
    }
});

// POST /admin/users/:id/toggle-status - Toggle User Status
router.post('/users/:id/toggle-status', isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/admin/users');
        }

        user.isActive = !user.isActive;
        await user.save();

        req.flash('success', `User ${user.isActive ? 'activated' : 'deactivated'} successfully!`);
        res.redirect('/admin/users');
    } catch (error) {
        console.error('Error toggling user status:', error);
        req.flash('error', 'Error updating user status');
        res.redirect('/admin/users');
    }
});

module.exports = router; 