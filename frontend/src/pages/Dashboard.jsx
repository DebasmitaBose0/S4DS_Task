import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, FolderHeart, AlertOctagon, Terminal, Eye, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, fetchWithAuth } = useAuth();
  const [stats, setStats] = useState({
    totalPatients: 0,
    tamperedCount: 0,
    activeAlerts: 0,
    failedLogins: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [patRes, alertRes, auditRes] = await Promise.all([
          fetchWithAuth('http://localhost:5000/api/patients'),
          fetchWithAuth('http://localhost:5000/api/alerts'),
          fetchWithAuth('http://localhost:5000/api/audit')
        ]);

        let patients = [];
        let alerts = [];
        let audits = [];

        if (patRes.ok) patients = await patRes.json();
        if (alertRes.ok) alerts = await alertRes.json();
        if (auditRes.ok) audits = await auditRes.json();

        setStats({
          totalPatients: patients.length,
          tamperedCount: patients.filter(p => p.isTampered).length,
          activeAlerts: alerts.filter(a => !a.resolved).length,
          failedLogins: audits.filter(a => a.actionType === 'LOGIN_FAIL').length
        });
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const systemLayers = [
    { name: 'Layer 1: Role-Based Access Control (RBAC)', desc: 'Validates JWT credentials and permissions before granting resource manipulation.', active: true },
    { name: 'Layer 2: SHA-256 Cryptographic Record Hashing', desc: 'Validates digital signatures of critical clinical data on every read cycle.', active: true },
    { name: 'Layer 3: Immutable Audit Trails', desc: 'Saves pre-modification and post-modification snapshots to audit files.', active: true },
    { name: 'Layer 4: Real-time Attack Alarms', desc: 'Monitors query modifications, brute-force logs, and AI anomalies to trigger security sirens.', active: true }
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-cyber-card to-cyber-card border border-cyber-border rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-20">
          <Shield className="w-48 h-48 text-blue-500" />
        </div>
        <div className="max-w-2xl">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Welcome, {user.role === 'Doctor' ? 'Dr. ' : ''}{user.username}!</h1>
          <p className="text-cyber-textMuted mt-2 text-sm leading-relaxed">
            You are logged into the TMDS Control Center. This environment implements a multi-tiered security defense protocol safeguarding clinical datasets against unauthorized modifications, insider threats, and query manipulation.
          </p>
          <div className="mt-6 flex space-x-3">
            <Link 
              to="/patients" 
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg shadow-blue-600/10 transition-colors"
            >
              Browse Patient Database
            </Link>
            <Link 
              to="/simulation" 
              className="bg-cyber-border/40 hover:bg-cyber-border text-white text-xs font-semibold px-4 py-2.5 rounded-lg border border-cyber-border transition-colors"
            >
              Attack Simulation Room
            </Link>
          </div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-center text-blue-500">
            <FolderHeart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-cyber-textMuted uppercase font-bold tracking-wider">Total Patients</p>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{loading ? '...' : stats.totalPatients}</h3>
          </div>
        </div>

        <div className={`bg-cyber-card border rounded-xl p-5 flex items-center space-x-4 transition-colors ${stats.tamperedCount > 0 ? 'border-red-500/40 bg-red-950/10' : 'border-cyber-border'}`}>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stats.tamperedCount > 0 ? 'bg-red-500/10 border border-red-500/30 text-red-500' : 'bg-cyber-border/40 text-cyber-textMuted'}`}>
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-cyber-textMuted uppercase font-bold tracking-wider">Tampered Records</p>
            <h3 className={`text-2xl font-extrabold mt-0.5 ${stats.tamperedCount > 0 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              {loading ? '...' : stats.tamperedCount}
            </h3>
          </div>
        </div>

        <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 flex items-center space-x-4">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-center text-amber-500">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-cyber-textMuted uppercase font-bold tracking-wider">Active TMDS Alerts</p>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{loading ? '...' : stats.activeAlerts}</h3>
          </div>
        </div>

        <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 flex items-center space-x-4">
          <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center justify-center text-purple-500">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-cyber-textMuted uppercase font-bold tracking-wider">Failed Logins</p>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{loading ? '...' : stats.failedLogins}</h3>
          </div>
        </div>
      </div>

      {/* Main Grid content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* TMDS Framework Layers (Column 2/3) */}
        <div className="lg:col-span-2 bg-cyber-card border border-cyber-border rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white">TMDS Framework Active Defense Status</h3>
            <p className="text-xs text-cyber-textMuted">Operational logs verifying active protective modules in our cybersecurity configuration.</p>
          </div>
          <div className="space-y-4">
            {systemLayers.map((layer, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 rounded-xl bg-cyber-dark/40 border border-cyber-border/80">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-white">{layer.name}</h4>
                  <p className="text-xs text-cyber-textMuted mt-1 leading-relaxed">{layer.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Tips or Info Panel */}
        <div className="bg-cyber-card border border-cyber-border rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-blue-400">
              <Eye className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Role Access Details</h3>
            </div>
            <p className="text-xs text-cyber-textMuted leading-relaxed">
              Your profile is verified. Below are the permissions enabled for you within the healthcare cluster:
            </p>
            <div className="space-y-2 mt-4 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-cyber-border/40">
                <span className="text-cyber-textMuted">Create Patient Records:</span>
                <span className={user.role === 'Receptionist' || user.role === 'Doctor' || user.role === 'Admin' ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                  {user.role === 'Receptionist' || user.role === 'Doctor' || user.role === 'Admin' ? 'ALLOWED' : 'DENIED'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-cyber-border/40">
                <span className="text-cyber-textMuted">Update Patient Records:</span>
                <span className={user.role === 'Doctor' || user.role === 'Admin' ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                  {user.role === 'Doctor' || user.role === 'Admin' ? 'ALLOWED' : 'DENIED'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-cyber-border/40">
                <span className="text-cyber-textMuted">View Security Metrics:</span>
                <span className={user.role === 'Admin' ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                  {user.role === 'Admin' ? 'ALLOWED' : 'DENIED'}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-8 bg-blue-950/20 border border-blue-900/40 p-4 rounded-xl text-[11px] text-blue-400 leading-relaxed">
            <strong>System Security Tip:</strong> Use the <strong>Attack Simulation</strong> dashboard to trigger integrity compromises and observe how the Layer 2 cryptographic engine isolates corrupted data instantly.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
