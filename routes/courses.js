const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        req.flash('error', 'Please login to access this page');
        res.redirect('/auth/login');
    }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        req.flash('error', 'Access denied. Admin privileges required.');
        res.redirect('/');
    }
};

// GET /courses - Display all courses
router.get('/', async (req, res) => {
    try {
        const courses = await Course.find({ isPublished: true })
            .populate('instructor', 'name')
            .sort({ createdAt: -1 });

        res.render('courses/index', {
            title: 'All Courses',
            courses: courses,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error fetching courses:', error);
        req.flash('error', 'Error loading courses');
        res.redirect('/');
    }
});

// GET /courses/:id - Display single course
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('instructor', 'name email');

        if (!course) {
            req.flash('error', 'Course not found');
            return res.redirect('/courses');
        }

        res.render('courses/show', {
            title: course.title,
            course: course,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error fetching course:', error);
        req.flash('error', 'Error loading course');
        res.redirect('/courses');
    }
});

// GET /courses/admin - Admin dashboard for courses
router.get('/admin', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const courses = await Course.find()
            .populate('instructor', 'name')
            .sort({ createdAt: -1 });

        res.render('courses/admin', {
            title: 'Course Management',
            courses: courses,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error fetching courses for admin:', error);
        req.flash('error', 'Error loading courses');
        res.redirect('/');
    }
});

module.exports = router; 