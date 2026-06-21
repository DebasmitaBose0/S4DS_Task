import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Cpu, AlertTriangle, ShieldCheck, RefreshCw, Zap, Clock, User } from 'lucide-react';

const AIDetection = () => {
  const { fetchWithAuth } = useAuth();
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const loadAnomalies = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth('http://localhost:5000/api/anomaly/anomalies');
      if (response.ok) {
        const data = await response.json();
        setAnomalies(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnomalies();
  }, [refreshKey]);

  const triggerAIScan = async () => {
    setScanning(true);
    setScanResult('');
    try {
      const response = await fetchWithAuth('http://localhost:5000/api/anomaly/analyze', {
        method: 'POST'
      });
      const data = await response.json();
      if (response.ok) {
        setScanResult(data.message);
        setRefreshKey(prev => prev + 1);
      } else {
        setScanResult('Scan failed: ' + data.message);
      }
    } catch (err) {
      setScanResult('Failed to reach AI pipeline server.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-white">AI-Based Anomaly Detection</h2>
          <p className="text-xs text-cyber-textMuted mt-1">
            Machine Learning module running Scikit-Learn Isolation Forest on security activity logs.
          </p>
        </div>

        <div className="flex space-x-3 no-print">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 bg-cyber-card border border-cyber-border hover:bg-cyber-border text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={triggerAIScan}
            disabled={scanning}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg shadow-blue-500/10 transition-colors disabled:opacity-50"
          >
            <Cpu className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Running ML Classifier...' : 'Trigger AI Behavior Scan'}</span>
          </button>
        </div>
      </div>

      {scanResult && (
        <div className="p-4 bg-blue-950/20 border border-blue-900/40 text-blue-400 text-xs rounded-xl flex items-center space-x-2.5">
          <Zap className="w-5 h-5 flex-shrink-0 text-blue-400" />
          <span>{scanResult}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ML Prediction Output (2/3 width) */}
        <div className="lg:col-span-2 bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4 flex flex-col">
          <div>
            <h3 className="text-sm font-bold text-white">ML Flagged Anomaly Registry</h3>
            <p className="text-xs text-cyber-textMuted">Activities categorised as outliers relative to typical clinical behavior baselines.</p>
          </div>

          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="text-center py-12 text-cyber-textMuted text-xs">Querying database journals...</div>
            ) : anomalies.length === 0 ? (
              <div className="text-center py-12 text-cyber-textMuted text-xs border border-dashed border-cyber-border rounded-xl flex flex-col items-center justify-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
                <span>Zero anomalous behaviors classified in active logs.</span>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-cyber-border text-cyber-textMuted font-mono">
                    <th className="pb-2 font-semibold">User Profile</th>
                    <th className="pb-2 font-semibold">Event Action</th>
                    <th className="pb-2 font-semibold">IP Address</th>
                    <th className="pb-2 font-semibold text-center">Confidence</th>
                    <th className="pb-2 text-right font-semibold">Risk Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-border/40">
                  {anomalies.map((log) => (
                    <tr key={log._id} className="hover:bg-cyber-dark/30 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded bg-cyber-border/50 flex items-center justify-center text-[10px] text-cyber-text font-bold">
                            {log.user.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">{log.user}</span>
                            <span className="text-[9px] text-cyber-textMuted block font-mono">{log.role}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-cyber-textMuted">{log.ipAddress || '127.0.0.1'}</td>
                      <td className="py-3 text-center text-white font-mono">{log.confidence || 90}%</td>
                      <td className="py-3 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold border ${
                          log.riskLevel === 'HIGH' 
                            ? 'bg-red-500/10 text-red-500 border-red-500/30' 
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                        }`}>
                          {log.riskLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Model description/parameters (1/3 width) */}
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-6">
          <div className="flex items-center space-x-2 text-blue-400 border-b border-cyber-border pb-3">
            <Cpu className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider">AI Classifier Summary</h3>
          </div>

          <div className="space-y-4 text-xs leading-relaxed text-cyber-textMuted">
            <div>
              <span className="text-white font-bold block mb-1">Algorithm: Isolation Forest</span>
              <p>
                An unsupervised learning algorithm for anomaly detection that works by isolating observations rather than building profiles of normal points.
              </p>
            </div>
            <div>
              <span className="text-white font-bold block mb-1">Feature Extraction Map</span>
              <p>
                Telemetry logs are mapped into a numerical feature matrix:
              </p>
              <ul className="list-disc pl-4 mt-1 space-y-1 font-mono text-[10px]">
                <li>role_index [0-3]</li>
                <li>action_index [0-6]</li>
                <li>success_flag [0,1]</li>
                <li>hour_of_day [0-23]</li>
                <li>weekend_flag [0,1]</li>
              </ul>
            </div>
            <div className="bg-blue-950/20 border border-blue-900/40 p-3 rounded-lg text-blue-400 text-[10px]">
              <strong>Anomalous Behaviors:</strong> Isolation Forest isolates events with shorter path lengths in tree hierarchies, catching behaviors like out-of-hours changes, failed login spikes, or unauthorized updates.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AIDetection;
