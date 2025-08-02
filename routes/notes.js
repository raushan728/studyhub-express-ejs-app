const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Note = require('../models/Note');
const { isAuthenticated } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/notes/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: function (req, file, cb) {
        // Allow PDFs and documents
        if (file.mimetype === 'application/pdf' || 
            file.mimetype === 'application/msword' || 
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDFs and documents are allowed.'), false);
        }
    }
});

// Middleware to ensure user is authenticated
router.use(isAuthenticated);

// GET /notes - Display all notes
router.get('/', async (req, res) => {
    try {
        const notes = await Note.find().sort({ createdAt: -1 });
        res.render('notes/index', {
            title: 'Notes',
            notes: notes,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error fetching notes:', error);
        req.flash('error', 'Failed to load notes');
        res.redirect('/dashboard');
    }
});

// POST /notes/upload - Upload a new note
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const { title, tags } = req.body;
        const userId = req.session.user._id;

        if (!req.file) {
            req.flash('error', 'No file uploaded');
            return res.redirect('/notes');
        }

        const newNote = new Note({
            title: title,
            tags: tags.split(','),
            fileUrl: `/uploads/notes/${req.file.filename}`,
            uploadedBy: userId
        });

        await newNote.save();

        req.flash('success', 'Note uploaded successfully');
        res.redirect('/notes');
    } catch (error) {
        console.error('Error uploading note:', error);
        req.flash('error', 'Failed to upload note');
        res.redirect('/notes');
    }
});

module.exports = router;
