const express = require('express');
const router = express.Router();
const User = require('../models/User');
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

// GET /dashboard - User dashboard
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.user._id)
            .populate('enrolledCourses.course');

        // Get user's enrolled courses
        const enrolledCourses = user.enrolledCourses || [];

        res.render('dashboard/index', {
            title: 'Dashboard',
            user: user,
            enrolledCourses: enrolledCourses
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        req.flash('error', 'Error loading dashboard');
        res.redirect('/');
    }
});

// GET /dashboard/admin - Admin dashboard
router.get('/admin', isAuthenticated, isAdmin, async (req, res) => {
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

        res.render('dashboard/admin', {
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

// GET /dashboard/profile - User profile page
router.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.user._id);
        res.render('dashboard/profile', {
            title: 'My Profile',
            user: user
        });
    } catch (error) {
        console.error('Error loading profile:', error);
        req.flash('error', 'Error loading profile');
        res.redirect('/dashboard');
    }
});

module.exports = router; 