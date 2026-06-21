require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');

const { connectDB } = require('./config/db');
const User = require('./models/User');
const Patient = require('./models/Patient');
const { generateRecordHash } = require('./security/tmdsFramework');

// Initialize app
const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: '*', // Allow connections from React app
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiter: Prevent brute-force flooding
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per window
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

app.use(express.json());

// Routes Setup
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/audit', require('./routes/auditRoutes'));
app.use('/api/alerts', require('./routes/alertRoutes'));
app.use('/api/anomaly', require('./routes/anomalyRoutes'));
app.use('/api/simulation', require('./routes/simulationRoutes'));

// Root Status check
app.get('/status', (req, res) => {
  res.json({
    status: 'ONLINE',
    framework: 'TMDS (Tamper Monitoring and Detection System)',
    timestamp: new Date().toISOString()
  });
});

// Seed Initial Admin, Doctor, Receptionist, Patients if database is empty
const seedDatabase = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Seeding default users...');
      
      const adminPass = await bcrypt.hash('admin123', 10);
      const doctorPass = await bcrypt.hash('doctor123', 10);
      const recepPass = await bcrypt.hash('recep123', 10);

      await User.create({ username: 'admin', email: 'admin@tmds.org', password: adminPass, role: 'Admin' });
      await User.create({ username: 'dr_smith', email: 'smith@tmds.org', password: doctorPass, role: 'Doctor' });
      await User.create({ username: 'receptionist_amy', email: 'amy@tmds.org', password: recepPass, role: 'Receptionist' });
      
      console.log('✅ Users seeded successfully: admin/admin123, dr_smith/doctor123, receptionist_amy/recep123');
    }

    const patientCount = await Patient.countDocuments();
    if (patientCount === 0) {
      console.log('🌱 Seeding initial patient records...');

      const defaultPatients = [
        {
          patientId: 'PT-1001',
          fullName: 'Alice Johnson',
          age: 34,
          gender: 'Female',
          bloodGroup: 'O+',
          allergies: 'Penicillin',
          diagnosis: 'Acute Tonsillitis',
          prescription: 'Amoxicillin 500mg - 3x daily',
          doctorName: 'dr_smith'
        },
        {
          patientId: 'PT-1002',
          fullName: 'Robert Miller',
          age: 45,
          gender: 'Male',
          bloodGroup: 'A-',
          allergies: 'Peanuts',
          diagnosis: 'Hypertension Stage 2',
          prescription: 'Lisinopril 10mg - 1x daily',
          doctorName: 'dr_smith'
        },
        {
          patientId: 'PT-1003',
          fullName: 'Catherine Davis',
          age: 28,
          gender: 'Female',
          bloodGroup: 'AB+',
          allergies: 'None',
          diagnosis: 'Type 1 Diabetes Mellitus',
          prescription: 'Insulin Glargine 10 units - Subcutaneous',
          doctorName: 'dr_smith'
        }
      ];

      for (let pat of defaultPatients) {
        pat.lastUpdated = new Date().toISOString();
        pat.recordHash = generateRecordHash(pat);
        await Patient.create(pat);
      }

      console.log('✅ Baseline Patients seeded and cryptographically hashed.');
    }
  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
};

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  seedDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 TMDS Backend running on http://localhost:${PORT}`);
    });
  });
});
