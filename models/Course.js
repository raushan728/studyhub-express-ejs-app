const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Course title is required'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Course description is required'],
        maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    shortDescription: {
        type: String,
        maxlength: [200, 'Short description cannot be more than 200 characters']
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Instructor is required']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['programming', 'design', 'business', 'marketing', 'lifestyle', 'other']
    },
    level: {
        type: String,
        required: [true, 'Level is required'],
        enum: ['beginner', 'intermediate', 'advanced']
    },
    duration: {
        type: Number, // in hours
        required: [true, 'Duration is required'],
        min: [1, 'Duration must be at least 1 hour']
    },
    price: {
        type: Number,
        default: 0,
        min: [0, 'Price cannot be negative']
    },
    originalPrice: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative'],
        max: [100, 'Discount cannot be more than 100%']
    },
    thumbnail: {
        type: String,
        default: 'default-course-thumbnail.jpg'
    },
    courseMaterial: {
        type: String
    },
    syllabus: {
        type: String
    },
    videoUrl: {
        type: String
    },
    materials: [{
        title: String,
        type: {
            type: String,
            enum: ['pdf', 'video', 'link', 'document']
        },
        url: String,
        description: String
    }],
    sections: [{
        title: {
            type: String,
            required: true
        },
        description: String,
        lessons: [{
            title: {
                type: String,
                required: true
            },
            content: String,
            videoUrl: String,
            duration: Number, // in minutes
            isFree: {
                type: Boolean,
                default: false
            }
        }]
    }],
    tags: [{
        type: String,
        trim: true
    }],
    requirements: [{
        type: String,
        trim: true
    }],
    learningOutcomes: [{
        type: String,
        trim: true
    }],
    enrolledStudents: [{
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        enrolledAt: {
            type: Date,
            default: Date.now
        },
        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        completedLessons: [{
            type: mongoose.Schema.Types.ObjectId
        }],
        certificateIssued: {
            type: Boolean,
            default: false
        },
        certificateIssuedAt: Date
    }],
    ratings: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        review: {
            type: String,
            maxlength: [500, 'Review cannot be more than 500 characters']
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalRatings: {
        type: Number,
        default: 0
    },
    totalStudents: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    language: {
        type: String,
        default: 'English'
    },
    certificateTemplate: {
        type: String,
        default: 'default'
    }
}, {
    timestamps: true
});

// Indexes for better query performance
courseSchema.index({ slug: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ isPublished: 1 });
courseSchema.index({ isFeatured: 1 });
courseSchema.index({ 'enrolledStudents.student': 1 });

// Virtual for course price after discount
courseSchema.virtual('finalPrice').get(function() {
    if (this.discount > 0) {
        return this.price - (this.price * this.discount / 100);
    }
    return this.price;
});

// Virtual for total lessons count
courseSchema.virtual('totalLessons').get(function() {
    return this.sections.reduce((total, section) => {
        return total + section.lessons.length;
    }, 0);
});

// Virtual for total duration in minutes
courseSchema.virtual('totalDurationMinutes').get(function() {
    return this.sections.reduce((total, section) => {
        return total + section.lessons.reduce((sectionTotal, lesson) => {
            return sectionTotal + (lesson.duration || 0);
        }, 0);
    }, 0);
});

// Pre-save middleware to generate slug
courseSchema.pre('save', function(next) {
    if (!this.isModified('title')) return next();
    
    this.slug = this.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    
    next();
});

// Method to calculate average rating
courseSchema.methods.calculateAverageRating = function() {
    if (this.ratings.length === 0) {
        this.averageRating = 0;
        this.totalRatings = 0;
        return;
    }
    
    const totalRating = this.ratings.reduce((sum, rating) => sum + rating.rating, 0);
    this.averageRating = totalRating / this.ratings.length;
    this.totalRatings = this.ratings.length;
};

// Method to enroll a student
courseSchema.methods.enrollStudent = function(studentId) {
    const existingEnrollment = this.enrolledStudents.find(
        enrollment => enrollment.student.toString() === studentId.toString()
    );
    
    if (existingEnrollment) {
        return false; // Already enrolled
    }
    
    this.enrolledStudents.push({
        student: studentId,
        enrolledAt: new Date(),
        progress: 0,
        completedLessons: []
    });
    
    this.totalStudents = this.enrolledStudents.length;
    return true;
};

// Method to update student progress
courseSchema.methods.updateStudentProgress = function(studentId, lessonId, progress) {
    const enrollment = this.enrolledStudents.find(
        enrollment => enrollment.student.toString() === studentId.toString()
    );
    
    if (!enrollment) {
        return false;
    }
    
    if (!enrollment.completedLessons.includes(lessonId)) {
        enrollment.completedLessons.push(lessonId);
    }
    
    enrollment.progress = progress;
    return true;
};

// Static method to find published courses
courseSchema.statics.findPublished = function() {
    return this.find({ isPublished: true, status: 'published' });
};

// Static method to find featured courses
courseSchema.statics.findFeatured = function() {
    return this.find({ isPublished: true, isFeatured: true, status: 'published' });
};

// Static method to find courses by category
courseSchema.statics.findByCategory = function(category) {
    return this.find({ category, isPublished: true, status: 'published' });
};

// Static method to find courses by instructor
courseSchema.statics.findByInstructor = function(instructorId) {
    return this.find({ instructor: instructorId });
};

module.exports = mongoose.model('Course', courseSchema); 