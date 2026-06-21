import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, 
  Flame, 
  Skull, 
  HelpCircle, 
  TrendingUp, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const SecurityDashboard = () => {
  const { fetchWithAuth } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const [alertRes, auditRes] = await Promise.all([
        fetchWithAuth('http://localhost:5000/api/alerts'),
        fetchWithAuth('http://localhost:5000/api/audit')
      ]);

      if (alertRes.ok) {
        const alertData = await alertRes.json();
        setAlerts(alertData);
      }
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAudits(auditData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  // Calculations
  const totalAlerts = alerts.length;
  const unresolvedAlerts = alerts.filter(a => !a.resolved).length;
  const tamperingCount = alerts.filter(a => a.type === 'TAMPERING').length;
  const privilegeViolations = alerts.filter(a => a.type === 'PRIVILEGE_VIOLATION').length;
  const injectionAttempts = alerts.filter(a => a.type === 'INJECTION_ATTACK').length;
  const anomalyCount = alerts.filter(a => a.type === 'AI_ANOMALY').length;

  const chartData = [
    { name: 'Tampering', count: tamperingCount, color: '#EF4444' },
    { name: 'RBAC Breach', count: privilegeViolations, color: '#F59E0B' },
    { name: 'NoSQL Inj', count: injectionAttempts, color: '#3B82F6' },
    { name: 'AI Anomaly', count: anomalyCount, color: '#8B5CF6' }
  ];

  // Risk Matrix (Likelihood x Impact)
  const riskMatrix = [
    { type: 'Unauthorized Modification', likelihood: 4, impact: 5, desc: 'Bypass API, change vital patient blood groups/allergies.' },
    { type: 'Insider Privilege Violation', likelihood: 3, impact: 3, desc: 'Receptionist attempting to alter medical diagnostics.' },
    { type: 'Record Deletion Attack', likelihood: 2, impact: 5, desc: 'Malicious deletion of critical clinical datasets.' },
    { type: 'NoSQL Injection Exploit', likelihood: 3, impact: 4, desc: 'Query injection to bypass login credentials.' },
    { type: 'AI Suspected Anomalies', likelihood: 4, impact: 3, desc: 'Mass record views, abnormal logins flagged by ML.' }
  ];

  const getSeverity = (score) => {
    if (score >= 16) return { name: 'CRITICAL', color: 'bg-red-500/10 text-red-500 border-red-500/30' };
    if (score >= 12) return { name: 'HIGH', color: 'bg-orange-500/10 text-orange-500 border-orange-500/30' };
    if (score >= 6) return { name: 'MEDIUM', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' };
    return { name: 'LOW', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
  };

  // Calculate Security Score (dynamic formula)
  const calculateSecurityScore = () => {
    // Starts at 100, drops per unresolved high-priority alert
    let score = 100;
    const unresolved = alerts.filter(a => !a.resolved);
    unresolved.forEach(a => {
      if (a.severity === 'CRITICAL') score -= 15;
      else if (a.severity === 'HIGH') score -= 10;
      else if (a.severity === 'MEDIUM') score -= 5;
      else score -= 2;
    });
    return Math.max(0, score);
  };

  const securityScore = calculateSecurityScore();

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Security Intelligence Center</h2>
          <p className="text-xs text-cyber-textMuted mt-1">
            Real-time visual monitoring of risk surfaces, signature validations, and threat metrics.
          </p>
        </div>
        <div className="flex space-x-3 no-print">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Download PDF Report</span>
          </button>
          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="flex items-center space-x-1.5 bg-cyber-card border border-cyber-border hover:bg-cyber-border text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Feeds</span>
          </button>
        </div>
      </div>

      {/* Security Health Score Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-cyber-textMuted uppercase tracking-wider">Overall Security Score</h3>
            <p className="text-[10px] text-cyber-textMuted mt-0.5">Calculated based on unresolved threat alerts.</p>
          </div>
          <div className="py-4 flex items-baseline space-x-2">
            <span className={`text-5xl font-extrabold ${securityScore > 80 ? 'text-emerald-400' : securityScore > 50 ? 'text-amber-400' : 'text-red-500'}`}>
              {securityScore}%
            </span>
            <span className="text-xs font-bold text-cyber-textMuted">HEALTHY LIMIT</span>
          </div>
          <div className="w-full bg-cyber-dark/80 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${securityScore > 80 ? 'bg-emerald-400' : securityScore > 50 ? 'bg-amber-400' : 'bg-red-500'}`}
              style={{ width: `${securityScore}%` }}
            />
          </div>
        </div>

        <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-cyber-textMuted uppercase tracking-wider">Threat Mitigation Rate</h3>
            <p className="text-[10px] text-cyber-textMuted mt-0.5">Resolved alerts vs total incident alarms.</p>
          </div>
          <div className="py-4 flex items-baseline space-x-2">
            <span className="text-5xl font-extrabold text-blue-400">
              {totalAlerts > 0 ? Math.round(((totalAlerts - unresolvedAlerts) / totalAlerts) * 100) : 100}%
            </span>
            <span className="text-xs font-bold text-cyber-textMuted">RESOLVED</span>
          </div>
          <p className="text-[10px] text-cyber-textMuted">
            {totalAlerts - unresolvedAlerts} of {totalAlerts} incidents successfully resolved.
          </p>
        </div>

        <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-cyber-textMuted uppercase tracking-wider">Active Alarm Vectors</h3>
            <p className="text-[10px] text-cyber-textMuted mt-0.5">High-severity unresolved security blocks.</p>
          </div>
          <div className="py-4 flex items-baseline space-x-2">
            <span className={`text-5xl font-extrabold ${unresolvedAlerts > 0 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
              {unresolvedAlerts}
            </span>
            <span className="text-xs font-bold text-cyber-textMuted">ACTIVE</span>
          </div>
          <p className="text-[10px] text-cyber-textMuted">
            Requires attention: {alerts.filter(a => !a.resolved && (a.severity === 'CRITICAL' || a.severity === 'HIGH')).length} High/Critical.
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recharts chart */}
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Threat Incident Vector Distribution</h3>
            <p className="text-xs text-cyber-textMuted">Breakdown of security alert triggers caught by TMDS sensors.</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#243249" vertical={false} />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161F30', borderColor: '#243249', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Assessment Heatmap Matrix */}
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Likelihood vs Impact Risk Matrix</h3>
            <p className="text-xs text-cyber-textMuted">
              Calculated using the industry standard Risk Assessment formulation: <strong className="text-blue-400">Risk = Likelihood × Impact</strong> (Scale: 1-25)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-cyber-border text-cyber-textMuted font-mono">
                  <th className="pb-2 font-semibold">Threat Profile</th>
                  <th className="pb-2 text-center font-semibold">Likelihood (1-5)</th>
                  <th className="pb-2 text-center font-semibold">Impact (1-5)</th>
                  <th className="pb-2 text-center font-semibold">Risk Score</th>
                  <th className="pb-2 text-right font-semibold">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/40">
                {riskMatrix.map((item, idx) => {
                  const score = item.likelihood * item.impact;
                  const severity = getSeverity(score);
                  return (
                    <tr key={idx} className="hover:bg-cyber-dark/30 transition-colors">
                      <td className="py-2.5">
                        <span className="font-semibold text-white block">{item.type}</span>
                        <span className="text-[10px] text-cyber-textMuted block mt-0.5">{item.desc}</span>
                      </td>
                      <td className="py-2.5 text-center text-cyber-textMuted font-mono">{item.likelihood}</td>
                      <td className="py-2.5 text-center text-cyber-textMuted font-mono">{item.impact}</td>
                      <td className="py-2.5 text-center font-bold text-white font-mono">{score}</td>
                      <td className="py-2.5 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold border ${severity.color}`}>
                          {severity.name}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Live Threat Alert Log Panel */}
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white">Unresolved Alarm Registry</h3>
          <p className="text-xs text-cyber-textMuted">Real-time alerts generated by integrity signature failures and RBAC blocks.</p>
        </div>

        {alerts.filter(a => !a.resolved).length === 0 ? (
          <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 rounded-lg text-xs flex items-center space-x-2 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>No pending active threats detected. Standard database integrity intact.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.filter(a => !a.resolved).slice(0, 4).map((alert) => (
              <div 
                key={alert._id} 
                className={`p-4 rounded-xl border flex items-start justify-between space-x-4 ${
                  alert.severity === 'CRITICAL' || alert.severity === 'HIGH'
                    ? 'bg-red-950/20 border-red-900/60 text-red-300' 
                    : 'bg-amber-950/20 border-amber-900/60 text-amber-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-current" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs uppercase tracking-wider">{alert.type}</span>
                      <span className="text-[9px] bg-black/40 px-2 py-0.5 rounded font-mono font-bold">{alert.severity}</span>
                    </div>
                    <p className="text-xs mt-1 text-cyber-text">{alert.description}</p>
                    <span className="text-[9px] text-cyber-textMuted block mt-1.5 font-mono">
                      Detected: {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default SecurityDashboard;
