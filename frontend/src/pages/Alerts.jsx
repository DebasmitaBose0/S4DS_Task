import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, CheckCircle, RefreshCw, Clock, ShieldAlert } from 'lucide-react';

const Alerts = () => {
  const { fetchWithAuth } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth('http://localhost:5000/api/alerts');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [refreshKey]);

  const handleResolve = async (id) => {
    try {
      const response = await fetchWithAuth(`http://localhost:5000/api/alerts/${id}/resolve`, {
        method: 'PUT'
      });
      if (response.ok) {
        setRefreshKey(prev => prev + 1);
      }
    } catch (err) {
      alert('Failed to resolve alert');
    }
  };

  const getSeverityStyle = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-500/10 text-red-500 border border-red-500/30';
      case 'HIGH':
        return 'bg-orange-500/10 text-orange-500 border border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/30';
      default:
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">TMDS Tampering & Security Alarms</h2>
          <p className="text-xs text-cyber-textMuted mt-1">
            Real-time notifications generated on cryptographic mismatches, login brute force, and unauthorized API queries.
          </p>
        </div>
        <button
          onClick={() => setRefreshKey(prev => prev + 1)}
          className="flex items-center space-x-1.5 bg-cyber-card border border-cyber-border hover:bg-cyber-border text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Feeds</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-cyber-textMuted text-sm">
          Polling security sensors...
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12 text-cyber-textMuted text-sm border border-dashed border-cyber-border rounded-xl">
          No security alarms logged. System database signature is 100% verified.
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert._id}
              className={`bg-cyber-card border rounded-xl p-5 flex flex-col md:flex-row justify-between md:items-center gap-4 transition-all ${
                alert.resolved 
                  ? 'border-cyber-border opacity-60' 
                  : alert.severity === 'CRITICAL' || alert.severity === 'HIGH'
                    ? 'border-red-500/40 bg-red-950/5 shadow-md shadow-red-950/20' 
                    : 'border-amber-500/30 bg-amber-950/5'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-lg flex-shrink-0 ${
                  alert.resolved 
                    ? 'bg-cyber-border/40 text-cyber-textMuted' 
                    : alert.severity === 'CRITICAL' || alert.severity === 'HIGH'
                      ? 'bg-red-500/10 text-red-500' 
                      : 'bg-amber-500/10 text-amber-500'
                }`}>
                  <ShieldAlert className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-bold text-sm text-white uppercase tracking-wider">{alert.type}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${getSeverityStyle(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    {alert.resolved ? (
                      <span className="bg-emerald-950 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded text-[9px] font-bold">
                        RESOLVED
                      </span>
                    ) : (
                      <span className="bg-red-950 text-red-400 border border-red-800/40 px-2 py-0.5 rounded text-[9px] font-bold animate-pulse">
                        PENDING ACTION
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-cyber-text leading-relaxed">{alert.description}</p>
                  
                  <div className="flex items-center space-x-4 text-[10px] text-cyber-textMuted font-mono pt-1">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(alert.timestamp).toLocaleString()}</span>
                    </span>
                    {alert.recordId && <span>Target Reference: {alert.recordId}</span>}
                  </div>
                </div>
              </div>

              {!alert.resolved && (
                <button
                  onClick={() => handleResolve(alert._id)}
                  className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-lg shadow-emerald-500/10 transition-colors self-start md:self-auto"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Mark Resolved</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
