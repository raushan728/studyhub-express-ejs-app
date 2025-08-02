const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studyhub', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ MongoDB connected successfully');
}).catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

async function createAdmin() {
    try {
        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@studyhub.com' });
        
        if (existingAdmin) {
            console.log('⚠️ Admin account already exists');
            process.exit(0);
        }

        // Create admin user
        const adminUser = new User({
            name: 'Admin User',
            email: 'admin@studyhub.com',
            password: 'admin123',
            role: 'admin',
            isActive: true
        });

        await adminUser.save();
        console.log('✅ Admin account created successfully!');
        console.log('📧 Email: admin@studyhub.com');
        console.log('🔑 Password: admin123');
        console.log('🎯 Role: Admin');
        
    } catch (error) {
        console.error('❌ Error creating admin:', error);
    } finally {
        mongoose.connection.close();
    }
}

createAdmin(); 