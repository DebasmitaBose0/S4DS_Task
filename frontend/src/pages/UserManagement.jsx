import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Users, Plus, Shield, ShieldAlert, CheckCircle } from 'lucide-react';

const UserManagement = () => {
  const { fetchWithAuth } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Receptionist');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth('http://localhost:5000/api/auth/users');
      if (response.ok) {
        const data = await response.json();
        setUsersList(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username || !email || !password) {
      setError('All fields are required.');
      return;
    }

    try {
      const response = await fetchWithAuth('http://localhost:5000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password, role })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('New user registered successfully!');
        setUsername('');
        setEmail('');
        setPassword('');
        setRole('Receptionist');
        loadUsers();
      } else {
        setError(data.message || 'Failed to register user.');
      }
    } catch (err) {
      setError('Connection failure.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-bold text-white">Identity & Access Control</h2>
        <p className="text-xs text-cyber-textMuted mt-1">
          Review credentials, assign roles (Admin, Doctor, Receptionist), and register new user accounts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* User Account Registry (2/3 width) */}
        <div className="lg:col-span-2 bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span>Registered Accounts</span>
            </h3>
            <p className="text-xs text-cyber-textMuted mt-0.5">Active database profiles authorized to query clinical nodes.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-cyber-border text-cyber-textMuted font-mono">
                  <th className="pb-2 font-semibold">User</th>
                  <th className="pb-2 font-semibold">Email</th>
                  <th className="pb-2 font-semibold font-mono">Role</th>
                  <th className="pb-2 text-right font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/40">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center p-8 text-cyber-textMuted">Reading registry...</td>
                  </tr>
                ) : (
                  usersList.map((usr) => (
                    <tr key={usr._id} className="hover:bg-cyber-dark/30 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-950/40 border border-blue-900/30 flex items-center justify-center font-bold text-xs text-blue-400 uppercase">
                            {usr.username.slice(0, 2)}
                          </div>
                          <span className="font-semibold text-white">{usr.username}</span>
                        </div>
                      </td>
                      <td className="py-3 text-cyber-textMuted">{usr.email}</td>
                      <td className="py-3 font-mono">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold border ${
                          usr.role === 'Admin' 
                            ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                            : usr.role === 'Doctor'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {usr.role}
                        </span>
                      </td>
                      <td className="py-3 text-right text-cyber-textMuted font-mono">
                        {new Date(usr.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Register Account Form (1/3 width) */}
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
          <div className="flex items-center space-x-2 text-blue-400 border-b border-cyber-border pb-3 mb-4">
            <Plus className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Register User Account</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-red-950/80 border border-red-800/40 text-red-400 text-xs rounded-lg flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 text-xs rounded-lg flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-cyber-textMuted uppercase mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-cyber-dark border border-cyber-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g. dr_watson"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-cyber-textMuted uppercase mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-cyber-dark border border-cyber-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g. watson@tmds.org"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-cyber-textMuted uppercase mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-cyber-dark border border-cyber-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-cyber-textMuted uppercase mb-1">Assigned Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-cyber-dark border border-cyber-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Receptionist">Receptionist</option>
                <option value="Doctor">Doctor</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-lg shadow-lg shadow-blue-500/10 transition-all text-xs"
            >
              Provision Account
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default UserManagement;
