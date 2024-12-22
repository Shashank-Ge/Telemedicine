const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config({ path: '.env' }); // Load environment variables

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));

const app = express();
const port =  3002;

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON requests

// User Schema
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userType: { type: String, required: true }  // Added userType field
});

// User Model
const User = mongoose.model('User', userSchema);

// Registration Endpoint
app.post('/api/users', async (req, res) => {
  const { fullName, email, password, confirmPassword, userType } = req.body;

  // Validate fields
  if (!fullName || !email || !password || !confirmPassword || !userType) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Validate password
  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character',
    });
  }
  try {
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user
    const user = new User({
      fullName,
      email,
      password: hashedPassword,
      userType  // Save the user type
    });

    const result = await user.save();
    res.status(201).json({ message: 'User registered successfully', userId: result._id });
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).json({ message: 'Error saving user data', error });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
