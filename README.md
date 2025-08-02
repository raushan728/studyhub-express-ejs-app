# 🎓 StudyHub - Online Learning Platform

A full-stack web application built with Express.js, EJS, MongoDB, and modern CSS animations. StudyHub provides a comprehensive learning platform with user authentication, course management, and interactive features.

## ✨ Features

### 🎨 Frontend
- **Modern Animated UI** - Beautiful landing page with CSS animations
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **Interactive Elements** - Floating cards, counter animations, scroll effects
- **Professional Design** - Clean and modern interface with gradient backgrounds

### 🔐 Authentication System
- **User Registration & Login** - Secure signup and login with password hashing
- **Session Management** - Express-session for user sessions
- **Password Strength Indicator** - Real-time password strength checking
- **Form Validation** - Client and server-side validation
- **Flash Messages** - User-friendly success and error notifications

### 📚 Course Management
- **Course CRUD Operations** - Create, Read, Update, Delete courses
- **User Roles** - Student, Instructor, and Admin roles
- **Course Enrollment** - Students can enroll in courses
- **Progress Tracking** - Track learning progress
- **Rating System** - Course ratings and reviews

### 🛠 Admin Features
- **Admin Dashboard** - Manage users and courses
- **User Management** - View, edit, and manage user accounts
- **Course Management** - Create and manage courses
- **Analytics** - Basic analytics for admin

## 🚀 Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **bcryptjs** - Password hashing
- **express-session** - Session management
- **connect-flash** - Flash messages

### Frontend
- **EJS** - Template engine
- **CSS3** - Modern styling with animations
- **JavaScript** - Interactive features
- **Font Awesome** - Icons
- **Google Fonts** - Typography

## 📦 Installation

1. Clone the repository:
   ```cmd
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```cmd
   cd studyhub
   ```

3. Install dependencies:
   ```cmd
   npm install
   ```

4. Set up the environment variables:
   - Create a `.env` file in the root directory.
   - Add the following variables:
     ```env
     PORT=3000
     MONGO_URI=<your-mongodb-uri>
     SESSION_SECRET=<your-session-secret>
     ```

5. Start the application:
   ```cmd
   npm start
   ```

6. Open the application in your browser:
   ```
   http://localhost:3000
   ```

## Deployment

To deploy the application:

1. Choose a platform (e.g., Render, Railway, DigitalOcean).
2. Set up the environment variables on the platform.
3. Push the code to the platform's repository.
4. Start the application.

## Folder Structure

```
studyhub/
├── app.js
├── package.json
├── README.md
├── bin/
│   └── www
├── middleware/
│   └── auth.js
├── models/
│   ├── Chat.js
│   ├── Course.js
│   └── User.js
├── public/
│   ├── images/
│   ├── javascripts/
│   └── stylesheets/
├── routes/
│   ├── admin.js
│   ├── auth.js
│   ├── chat.js
│   ├── courses.js
│   ├── dashboard.js
│   └── index.js
├── scripts/
│   └── create-admin.js
├── views/
│   ├── admin/
│   ├── auth/
│   ├── chat/
│   ├── courses/
│   ├── dashboard/
│   └── error.ejs
└── uploads/
```

## 🎯 Key Features Explained

### 1. Animated Landing Page
- **Hero Section** - Eye-catching gradient background with floating cards
- **Features Section** - Interactive cards with hover effects
- **Stats Section** - Animated counters with scroll triggers
- **Responsive Footer** - Complete with social links and newsletter

### 2. Authentication System
- **Secure Signup** - Password strength indicator and validation
- **User Login** - Session-based authentication
- **Password Reset** - Token-based password reset functionality
- **Profile Management** - Update user information

### 3. Database Models
- **User Model** - Complete user management with roles
- **Course Model** - Comprehensive course structure with enrollment
- **Relationships** - Proper MongoDB relationships between models

### 4. Security Features
- **Password Hashing** - bcryptjs for secure password storage
- **Session Management** - Secure session handling
- **Input Validation** - Both client and server-side validation
- **CSRF Protection** - Built-in Express security

## 🎨 UI/UX Features

### Animations
- **Fade-in Effects** - Smooth page load animations
- **Floating Cards** - Parallax effects on hero section
- **Counter Animations** - Animated statistics
- **Hover Effects** - Interactive button and card effects
- **Loading States** - Spinner animations for form submissions

### Responsive Design
- **Mobile-First** - Optimized for mobile devices
- **Flexible Grid** - CSS Grid and Flexbox layouts
- **Breakpoint System** - Multiple screen size support
- **Touch-Friendly** - Optimized for touch interactions

## 🔧 Development

### Running in Development Mode
```bash
npm run dev
```

### Database Seeding
```bash
# Create admin user
node scripts/seed-admin.js
```

### Testing
```bash
# Run tests (if configured)
npm test
```

## 📊 Database Schema

### User Collection
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (student/instructor/admin),
  avatar: String,
  bio: String,
  enrolledCourses: [Course IDs],
  completedCourses: [Course IDs],
  isActive: Boolean,
  lastLogin: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date
}
```

### Course Collection
```javascript
{
  title: String,
  slug: String (unique),
  description: String,
  instructor: User ID,
  category: String,
  level: String,
  duration: Number,
  price: Number,
  thumbnail: String,
  sections: [{
    title: String,
    lessons: [{
      title: String,
      content: String,
      videoUrl: String,
      duration: Number
    }]
  }],
  enrolledStudents: [{
    student: User ID,
    enrolledAt: Date,
    progress: Number,
    completedLessons: [Lesson IDs]
  }],
  ratings: [{
    user: User ID,
    rating: Number,
    review: String,
    createdAt: Date
  }],
  isPublished: Boolean,
  isFeatured: Boolean
}
```

## 🚀 Deployment

### Local Deployment
1. Install dependencies: `npm install`
2. Set up environment variables
3. Start MongoDB
4. Run: `npm start`

### Cloud Deployment (Render/Railway)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

### Environment Variables
```env
MONGODB_URI=your-mongodb-connection-string
SESSION_SECRET=your-session-secret
NODE_ENV=production
PORT=3000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Express.js** - Web framework
- **MongoDB** - Database
- **Font Awesome** - Icons
- **Google Fonts** - Typography

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact: [raushansinghrajpoot687@gmail.com]

---

**Built with ❤️ using Express.js, MongoDB, and modern web technologies**

## Help Page

The `/help` route provides a help page with FAQs and contact information for troubleshooting and support.

To access the help page:
1. Start the application.
2. Navigate to `http://localhost:3000/help` in your browser.

The help page includes:
- FAQs about using StudyHub.
- Contact information for support.