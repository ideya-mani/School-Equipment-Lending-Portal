const mongoose = require('mongoose');
const User = require('../models/User');
const Equipment = require('../models/Equipment');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/equipment_lending');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Equipment.deleteMany({});

    // Create users
    const users = await User.create([
      {
        name: 'Admin User',
        email: 'admin@school.edu',
        password: 'password123',
        role: 'admin',
        department: 'Administration',
        phone: '+1234567890'
      },
      {
        name: 'Lab Assistant',
        email: 'staff@school.edu',
        password: 'password123',
        role: 'staff',
        department: 'Science Department',
        phone: '+1234567891'
      },
      {
        name: 'John Student',
        email: 'student@school.edu',
        password: 'password123',
        role: 'student',
        studentId: 'S12345',
        department: 'Computer Science',
        phone: '+1234567892'
      },
      {
        name: 'Jane Doe',
        email: 'jane@school.edu',
        password: 'password123',
        role: 'student',
        studentId: 'S12346',
        department: 'Engineering',
        phone: '+1234567893'
      }
    ]);

    // Create equipment - let the model handle availableQuantity automatically
    const equipmentData = [
      {
        name: 'Basketball Set',
        description: 'Complete basketball set with balls, nets, and pumps',
        category: 'sports',
        condition: 'good',
        quantity: 5,
        location: 'Sports Hall',
        specifications: {
          'Ball Size': 'Size 7',
          'Material': 'Rubber',
          'Color': 'Orange'
        }
      },
      {
        name: 'Microscope',
        description: 'Digital microscope for laboratory use',
        category: 'lab',
        condition: 'excellent',
        quantity: 10,
        location: 'Science Lab A',
        specifications: {
          'Magnification': '1000x',
          'Type': 'Digital',
          'Brand': 'Olympus'
        }
      },
      {
        name: 'DSLR Camera',
        description: 'Canon EOS DSLR camera with lens kit',
        category: 'camera',
        condition: 'excellent',
        quantity: 3,
        location: 'Media Center',
        specifications: {
          'Brand': 'Canon',
          'Model': 'EOS 2000D',
          'Resolution': '24.1 MP'
        }
      },
      {
        name: 'Acoustic Guitar',
        description: 'Yamaha acoustic guitar for music classes',
        category: 'musical',
        condition: 'good',
        quantity: 8,
        location: 'Music Room',
        specifications: {
          'Brand': 'Yamaha',
          'Type': 'Acoustic',
          'Strings': 'Nylon'
        }
      },
      {
        name: 'Arduino Starter Kit',
        description: 'Complete Arduino kit for electronics projects',
        category: 'project',
        condition: 'fair',
        quantity: 15,
        location: 'Engineering Lab',
        specifications: {
          'Model': 'Uno R3',
          'Components': '40+ pieces',
          'Skill Level': 'Beginner'
        }
      },
      {
        name: 'Volleyball Net',
        description: 'Professional volleyball net with poles',
        category: 'sports',
        condition: 'good',
        quantity: 2,
        location: 'Sports Hall',
        specifications: {
          'Height': '2.43m',
          'Material': 'Nylon',
          'Color': 'White/Red'
        }
      }
    ];

    // Create equipment using individual saves to trigger pre-save hooks
    const equipment = [];
    for (const item of equipmentData) {
      const eq = new Equipment(item);
      await eq.save();
      equipment.push(eq);
    }

    console.log('Seed data created successfully:');
    console.log('- Users:', users.length);
    console.log('- Equipment:', equipment.length);

    console.log('\nDefault Login Credentials:');
    console.log('Admin: admin@school.edu / password123');
    console.log('Staff: staff@school.edu / password123');
    console.log('Student: student@school.edu / password123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();