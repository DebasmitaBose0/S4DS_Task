import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  Users, 
  Activity, 
  FolderHeart, 
  Terminal, 
  History, 
  AlertTriangle, 
  Cpu, 
  LogOut,
  Bell,
  CheckCircle2
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout, fetchWithAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [pulseColor, setPulseColor] = useState('text-emerald-500');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Poll for active un-resolved alerts to highlight on sidebar
    const checkAlerts = async () => {
      try {
        const res = await fetchWithAuth('http://localhost:5000/api/alerts');
        if (res.ok) {
          const data = await res.json();
          const active = data.filter(a => !a.resolved);
          setActiveAlerts(active.length);
          if (active.length > 0) {
            const hasCritical = active.some(a => a.severity === 'CRITICAL' || a.severity === 'HIGH');
            setPulseColor(hasCritical ? 'text-red-500 animate-pulse' : 'text-amber-500 animate-pulse');
          } else {
            setPulseColor('text-emerald-400');
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 4000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: Activity, roles: ['Admin', 'Doctor', 'Receptionist'] },
    { name: 'Patients Database', path: '/patients', icon: FolderHeart, roles: ['Admin', 'Doctor', 'Receptionist'] },
    { name: 'Attack Simulation', path: '/simulation', icon: Terminal, roles: ['Admin', 'Doctor', 'Receptionist'] },
    { name: 'Security Dashboard', path: '/security', icon: Shield, roles: ['Admin'] },
    { name: 'Audit Logs', path: '/audit', icon: History, roles: ['Admin'] },
    { name: 'Tampering Alerts', path: '/alerts', icon: AlertTriangle, roles: ['Admin'], badge: activeAlerts },
    { name: 'AI Detection', path: '/ai-detection', icon: Cpu, roles: ['Admin'] },
    { name: 'User Management', path: '/users', icon: Users, roles: ['Admin'] },
  ];

  return (
    <div className="flex h-screen bg-cyber-dark text-cyber-text overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-cyber-card border-r border-cyber-border flex flex-col justify-between z-10">
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-cyber-border flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white font-sans">TMDS</h1>
              <p className="text-[10px] text-cyber-textMuted uppercase font-semibold tracking-wider">Database Security</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 px-4 space-y-1">
            {menuItems
              .filter(item => item.roles.includes(user.role))
              .map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                      isActive 
                        ? 'bg-blue-600/10 text-blue-400 border-l-4 border-blue-500 pl-3' 
                        : 'text-cyber-textMuted hover:bg-cyber-border/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-cyber-textMuted group-hover:text-white'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-bounce">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
          </nav>
        </div>

        {/* User Profile Summary */}
        <div className="p-4 border-t border-cyber-border bg-cyber-dark/40">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-900/50 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 uppercase">
                {user.username.slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-semibold text-white truncate max-w-[120px]">{user.username}</p>
                <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-800/60 px-2 py-0.5 rounded font-mono font-bold">
                  {user.role}
                </span>
              </div>
            </div>
            <button 
              onClick={logout}
              className="text-cyber-textMuted hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* System status node */}
          <div className="flex items-center space-x-2 text-[10px] text-cyber-textMuted font-mono">
            <span className={`w-2 h-2 rounded-full bg-current ${pulseColor}`} />
            <span>TMDS Engine: ACTIVE</span>
          </div>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-cyber-card border-b border-cyber-border flex items-center justify-between px-8 z-0">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              {location.pathname === '/' ? 'System Health Overview' : location.pathname.substring(1).replace('-', ' ')}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            {activeAlerts > 0 ? (
              <div className="flex items-center space-x-2 bg-red-950/80 border border-red-800/60 text-red-400 px-3 py-1.5 rounded-lg text-xs font-semibold animate-pulse">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>{activeAlerts} Security Alert(s) Unresolved!</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 bg-emerald-950/50 border border-emerald-800/40 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>DB Signature Intact</span>
              </div>
            )}
            <div className="w-px h-6 bg-cyber-border" />
            <span className="text-xs text-cyber-textMuted font-mono">{new Date().toLocaleDateString()}</span>
          </div>
        </header>

        {/* Dynamic Content Body */}
        <main className="flex-1 overflow-y-auto p-8 bg-cyber-dark">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
