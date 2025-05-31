import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './models/user.model';
import config from './config/config';

// Function to create test users
const createTestUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB for test setup');

    // Create password hash (used for both users)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@digiwallet.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
    } else {
      // Create admin user
      const adminUser = new User({
        username: 'admin',
        email: 'admin@digiwallet.com',
        password: hashedPassword,
        balance: { USD: 1000 },
        isAdmin: true
      });

      await adminUser.save();
      console.log('Admin user created successfully');
    }

    // Check if regular user already exists
    const existingRegularUser = await User.findOne({ email: 'user@digiwallet.com' });
    
    if (existingRegularUser) {
      console.log('Regular user already exists');
    } else {
      // Create a regular user for testing
      const regularUser = new User({
        username: 'user',
        email: 'user@digiwallet.com',
        password: hashedPassword,
        balance: { USD: 500 },
        isAdmin: false
      });

      await regularUser.save();
      console.log('Regular user created successfully');
    }

    console.log('\nTest users available:');
    console.log('Admin User:');
    console.log('- Email: admin@digiwallet.com');
    console.log('- Password: admin123');
    console.log('- Balance: $1000 USD');
    console.log('\nRegular User:');
    console.log('- Email: user@digiwallet.com');
    console.log('- Password: admin123');
    console.log('- Balance: $500 USD');

  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the setup
createTestUsers();
