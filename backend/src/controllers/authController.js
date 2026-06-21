const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const ActivityLog = require('../models/ActivityLog');
const SecurityAlert = require('../models/SecurityAlert');

exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email address already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || 'Receptionist'
    });

    // Audit Log
    await AuditLog.create({
      user: 'SYSTEM',
      role: 'System',
      actionType: 'USER_REGISTER',
      newValue: `Registered user: ${username} (${newUser.role})`
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';

    const user = await User.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      // Record failed login
      await AuditLog.create({
        user: username || 'UNKNOWN',
        role: 'Unknown',
        actionType: 'LOGIN_FAIL',
        ipAddress: ip,
        newValue: 'Failed login attempt'
      });

      await ActivityLog.create({
        user: username || 'UNKNOWN',
        role: 'Unknown',
        action: 'LOGIN_FAIL',
        isSuccess: false,
        ipAddress: ip
      });

      // Check for brute force (multiple failed logins in last minute)
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const failedAttempts = await ActivityLog.countDocuments({
        user: username,
        action: 'LOGIN_FAIL',
        timestamp: { $gte: oneMinuteAgo }
      });

      if (failedAttempts >= 3) {
        await SecurityAlert.create({
          type: 'BRUTE_FORCE',
          severity: 'HIGH',
          description: `POTENTIAL BRUTE FORCE: User '${username}' had ${failedAttempts} failed login attempts in the last 60 seconds.`,
          recordId: username
        });
      }

      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Success
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'tmds_secret',
      { expiresIn: '8h' }
    );

    await AuditLog.create({
      user: user.username,
      role: user.role,
      actionType: 'LOGIN_SUCCESS',
      ipAddress: ip
    });

    await ActivityLog.create({
      user: user.username,
      role: user.role,
      action: 'LOGIN',
      isSuccess: true,
      ipAddress: ip
    });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({});
    // Remove passwords
    const sanitized = users.map(u => ({
      _id: u._id,
      username: u.username,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt
    }));
    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Security best practice: don't reveal if user exists or not, but for our demo we can return a success state with simulated logs
      return res.status(200).json({ 
        message: 'If the email matches an account, an OTP code has been dispatched.',
        demoBypass: null
      });
    }

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to user (valid for 10 minutes)
    user.resetCode = otp;
    user.resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Console Logging SMTP Simulation
    console.log('\n==================================================');
    console.log('       TMDS SMTP MAIL DISPATCH SIMULATION         ');
    console.log('==================================================');
    console.log(`To:      ${email}`);
    console.log(`Subject: [TMDS Security] Password Reset OTP Code`);
    console.log(`Message: Your password reset verification code is: ${otp}`);
    console.log('==================================================\n');

    // Return success. In development/mock mode we also return the otp so the frontend can mock an email inbox notification!
    res.json({
      message: 'OTP verification code has been dispatched to your email.',
      demoBypass: {
        to: email,
        otpCode: otp
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error processing forgot password request.', error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Please provide all details (email, OTP code, new password).' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found.' });
    }

    // Validate OTP
    if (!user.resetCode || user.resetCode !== otp) {
      return res.status(400).json({ message: 'Invalid or incorrect OTP verification code.' });
    }

    // Validate expiration
    if (new Date() > new Date(user.resetCodeExpires)) {
      return res.status(400).json({ message: 'OTP verification code has expired.' });
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetCode = null;
    user.resetCodeExpires = null;
    await user.save();

    // Log to audit log
    await AuditLog.create({
      user: user.username,
      role: user.role,
      actionType: 'PASSWORD_RESET',
      newValue: `Successfully reset password for user: ${user.username}`
    });

    res.json({ success: true, message: 'Password has been successfully updated.' });
  } catch (error) {
    res.status(500).json({ message: 'Password reset failed.', error: error.message });
  }
};

