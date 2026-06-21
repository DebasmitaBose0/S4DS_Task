import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  Lock, 
  User, 
  Mail, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ArrowLeft,
  Inbox
} from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Mode: 'login' | 'register' | 'forgot' | 'reset'
  const [mode, setMode] = useState('login'); 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Receptionist'); // for Register
  
  // Forgot/Reset Fields
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [simulatedEmail, setSimulatedEmail] = useState(null); // stores mock email content

  // Login handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, role })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('Account created successfully! Loading login...');
        setTimeout(() => {
          setMode('login');
          setPassword('');
          setError('');
          setSuccess('');
        }, 2000);
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch (err) {
      setError('Connection to backend failed.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot password handler
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setError('Please provide your email address.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message);
        
        // Capture the simulated mail object returned by backend for demo purposes
        if (data.demoBypass) {
          setSimulatedEmail({
            to: data.demoBypass.to,
            otp: data.demoBypass.otpCode
          });
        }
        
        // Transition to Reset input screen
        setTimeout(() => {
          setMode('reset');
          setError('');
          setSuccess('');
        }, 2000);
      } else {
        setError(data.message || 'Verification email dispatch failed.');
      }
    } catch (err) {
      setError('Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  // Reset password handler
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!otpCode || !newPassword) {
      setError('Please input both the OTP code and your new password.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          otp: otpCode,
          newPassword
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('Password updated successfully! Redirecting...');
        setSimulatedEmail(null);
        setTimeout(() => {
          setMode('login');
          setUsername('');
          setPassword('');
          setError('');
          setSuccess('');
        }, 2000);
      } else {
        setError(data.message || 'Reset failed.');
      }
    } catch (err) {
      setError('Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setMode('login');
  };

  return (
    <div className="min-h-screen bg-cyber-dark flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
      {/* Decorative background gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[200px] h-[200px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Simulated Email Notification Toast (Layered for visual demonstration) */}
      {simulatedEmail && (
        <div className="fixed top-6 right-6 w-full max-w-sm bg-blue-950/95 border-2 border-blue-500 rounded-2xl shadow-2xl p-5 z-50 text-xs text-blue-100 font-mono animate-bounce">
          <div className="flex items-center space-x-2 border-b border-blue-800 pb-2 mb-3 text-blue-400">
            <Inbox className="w-5 h-5 text-blue-400" />
            <span className="font-bold uppercase tracking-wider">Simulated Inbox Mail Delivery</span>
          </div>
          <p className="text-[10px] text-cyber-textMuted mb-2">
            Because SMTP is mock-logged, the TMDS engine intercepted this dispatch:
          </p>
          <div className="space-y-1">
            <p><strong>To:</strong> {simulatedEmail.to}</p>
            <p><strong>Subject:</strong> Password Reset Verification OTP</p>
            <p className="bg-blue-900/60 p-2.5 rounded border border-blue-800/80 mt-2 text-center text-sm font-bold tracking-widest text-emerald-400">
              OTP CODE: {simulatedEmail.otp}
            </p>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-cyber-card border border-cyber-border rounded-2xl shadow-2xl p-8 z-10">
        
        {/* Logo and title */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-blue-600/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mb-3">
            <Shield className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">TMDS Platform</h2>
          <p className="text-xs text-cyber-textMuted mt-1 text-center">
            Tampering Medical Databases & Related Security
          </p>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="flex items-center space-x-2 bg-red-950/80 border border-red-800/40 text-red-400 p-3 rounded-lg text-xs mb-4">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center space-x-2 bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 p-3 rounded-lg text-xs mb-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-cyber-textMuted uppercase mb-1.5">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-cyber-textMuted" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-9 pr-4 py-2.5 bg-cyber-dark/80 border border-cyber-border rounded-xl text-xs text-white placeholder-cyber-textMuted focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] font-bold text-cyber-textMuted uppercase">Password</label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-cyber-textMuted" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-10 py-2.5 bg-cyber-dark/80 border border-cyber-border rounded-xl text-xs text-white placeholder-cyber-textMuted focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-cyber-textMuted hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg transition-all disabled:opacity-50 text-xs"
            >
              {loading ? 'Authenticating System...' : 'Log In'}
            </button>

            <div className="text-center pt-2">
              <span className="text-[10px] text-cyber-textMuted">Don't have an account? </span>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors"
              >
                Sign Up Here
              </button>
            </div>
          </form>
        )}

        {/* 2. REGISTER/SIGN UP FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-cyber-textMuted uppercase mb-1.5">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-cyber-textMuted" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-9 pr-4 py-2.5 bg-cyber-dark/80 border border-cyber-border rounded-xl text-xs text-white placeholder-cyber-textMuted focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Create username"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-cyber-textMuted uppercase mb-1.5">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-cyber-textMuted" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-4 py-2.5 bg-cyber-dark/80 border border-cyber-border rounded-xl text-xs text-white placeholder-cyber-textMuted focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="name@tmds.org"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-cyber-textMuted uppercase mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-cyber-textMuted" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-4 py-2.5 bg-cyber-dark/80 border border-cyber-border rounded-xl text-xs text-white placeholder-cyber-textMuted focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-cyber-textMuted uppercase mb-1.5">System Access Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-cyber-dark border border-cyber-border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Receptionist">Receptionist (Read-Only)</option>
                <option value="Doctor">Doctor (Add/Edit records)</option>
                <option value="Admin">Admin (Full access, Dashboard, Logs)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg transition-all disabled:opacity-50 text-xs"
            >
              {loading ? 'Creating Account...' : 'Complete Sign Up'}
            </button>

            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className="w-full bg-transparent hover:bg-cyber-border/20 text-cyber-text border border-cyber-border py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all mt-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </button>
          </form>
        )}

        {/* 3. FORGOT PASSWORD FORM (Enter Email) */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-cyber-textMuted uppercase mb-1.5">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-cyber-textMuted" />
                </span>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="block w-full pl-9 pr-4 py-2.5 bg-cyber-dark/80 border border-cyber-border rounded-xl text-xs text-white placeholder-cyber-textMuted focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter registered email"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg transition-all disabled:opacity-50 text-xs"
            >
              {loading ? 'Dispatching OTP...' : 'Send Verification Code'}
            </button>

            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className="w-full bg-transparent hover:bg-cyber-border/20 text-cyber-text border border-cyber-border py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all mt-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </button>
          </form>
        )}

        {/* 4. RESET PASSWORD FORM (Enter OTP + New Pass) */}
        {mode === 'reset' && (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div className="bg-blue-950/20 border border-blue-900/40 p-3 rounded-lg text-[10px] text-blue-400 mb-2 leading-relaxed">
              An OTP code was sent to: <strong>{resetEmail}</strong>. Check the top-right overlay window for the intercepted OTP.
            </div>

            <div>
              <label className="block text-[10px] font-bold text-cyber-textMuted uppercase mb-1.5">OTP Code (6 digits)</label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                className="block w-full px-3 py-2.5 bg-cyber-dark/80 border border-cyber-border rounded-xl text-xs text-white font-mono text-center tracking-widest focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="000000"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-cyber-textMuted uppercase mb-1.5">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-cyber-textMuted" />
                </span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full pl-9 pr-4 py-2.5 bg-cyber-dark/80 border border-cyber-border rounded-xl text-xs text-white placeholder-cyber-textMuted focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter new password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg transition-all disabled:opacity-50 text-xs"
            >
              {loading ? 'Updating Password...' : 'Reset Password'}
            </button>

            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className="w-full bg-transparent hover:bg-cyber-border/20 text-cyber-text border border-cyber-border py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all mt-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </button>
          </form>
        )}

        {/* Demo Accounts Panel */}
        <div className="mt-6 pt-5 border-t border-cyber-border/80">
          <p className="text-[10px] font-bold text-cyber-textMuted uppercase tracking-widest text-center mb-2.5">
            Quick Load Demo Roles
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleDemoLogin('admin', 'admin123')}
              className="py-1.5 text-center rounded bg-cyber-border/30 hover:bg-blue-600/10 border border-cyber-border text-[10px] font-semibold text-blue-400 transition-colors"
            >
              Admin
            </button>
            <button
              onClick={() => handleDemoLogin('dr_smith', 'doctor123')}
              className="py-1.5 text-center rounded bg-cyber-border/30 hover:bg-purple-600/10 border border-cyber-border text-[10px] font-semibold text-purple-400 transition-colors"
            >
              Doctor
            </button>
            <button
              onClick={() => handleDemoLogin('receptionist_amy', 'recep123')}
              className="py-1.5 text-center rounded bg-cyber-border/30 hover:bg-amber-600/10 border border-cyber-border text-[10px] font-semibold text-amber-400 transition-colors"
            >
              Receptionist
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
