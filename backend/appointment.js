const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({ path: '.env' }); // Load environment variables

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));

const app = express();
const port = 3006;

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON requests

// Appointment Schema
const appointmentSchema = new mongoose.Schema({
  patientName: { type: String, required: true },
  gender: { type: String, required: true },
  phoneNo: { type: String, required: true },
  description: { type: String, required: true },
  appointmentDate: { type: Date, default: Date.now }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

// POST endpoint to book an appointment
app.post('/api/appointments', async (req, res) => {
  const { patientName, gender, phoneNo, description } = req.body;

  if (!patientName || !gender || !phoneNo || !description) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const noregex = /^(\+91[-\s]?)?[0]?[6-9]\d{9}$/;
  if (!noregex.test(phoneNo)) {
    return res.status(400).json({ message: 'Invalid phone number' });
  }

  try {
    const newAppointment = new Appointment({
      patientName,
      gender,
      phoneNo,
      description,
    });

    const result = await newAppointment.save();
    res.status(201).json({
      message: 'Appointment booked successfully',
      appointmentId: result._id,
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({
      message: 'Error booking appointment',
      error: error.message,
    });
  }
});

// GET endpoint to fetch all appointments
app.get('/api/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find();
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Error fetching appointments', error: error.message });
  }
});

// DELETE endpoint to remove an appointment by ID
app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Appointment.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.status(200).json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ message: 'Error deleting appointment', error: error.message });
  }
});

// Start the server
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
