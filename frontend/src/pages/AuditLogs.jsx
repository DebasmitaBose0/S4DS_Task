import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, History, Eye, ArrowRight, User } from 'lucide-react';

const AuditLogs = () => {
  const { fetchWithAuth } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const endpoint = searchQuery 
        ? `http://localhost:5000/api/audit?query=${encodeURIComponent(searchQuery)}`
        : 'http://localhost:5000/api/audit';
      
      const response = await fetchWithAuth(endpoint);
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [searchQuery]);

  const parseDiffValues = (val) => {
    if (!val) return 'N/A';
    try {
      const parsed = JSON.parse(val);
      return (
        <pre className="text-[10px] text-cyber-text bg-cyber-dark p-2 rounded max-h-[150px] overflow-y-auto font-mono whitespace-pre-wrap">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch (e) {
      return <span className="font-mono text-xs">{val}</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Immutable System Audit Logs</h2>
          <p className="text-xs text-cyber-textMuted mt-1">
            Detailed cryptographic records tracking every authentication, database update, and integrity alert.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors no-print"
        >
          <History className="w-3.5 h-3.5" />
          <span>Export Logs PDF</span>
        </button>
      </div>

      {/* Control bar */}
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-4 flex items-center">
        <div className="relative max-w-md w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-cyber-textMuted" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-4 py-2 bg-cyber-dark/80 border border-cyber-border rounded-lg text-xs text-white placeholder-cyber-textMuted focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Search by User, Action Type, or Patient ID..."
          />
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Logs Table (2/3 width) */}
        <div className="lg:col-span-2 bg-cyber-card border border-cyber-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-cyber-dark/40 border-b border-cyber-border text-cyber-textMuted font-mono">
                  <th className="p-4 font-semibold">Timestamp</th>
                  <th className="p-4 font-semibold">User (Role)</th>
                  <th className="p-4 font-semibold">Action Event</th>
                  <th className="p-4 font-semibold">Patient ID</th>
                  <th className="p-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/40">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-cyber-textMuted">Reading audit journals...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-cyber-textMuted">No audit logs matching search metrics.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr 
                      key={log._id} 
                      onClick={() => setSelectedLog(log)}
                      className={`hover:bg-cyber-dark/30 transition-colors cursor-pointer ${
                        selectedLog?._id === log._id ? 'bg-blue-600/5' : ''
                      }`}
                    >
                      <td className="p-4 text-cyber-textMuted font-mono whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <User className="w-3.5 h-3.5 text-cyber-textMuted" />
                          <div>
                            <span className="font-semibold text-white block">{log.user}</span>
                            <span className="text-[9px] text-cyber-textMuted block font-mono">{log.role}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          log.actionType.includes('FAIL') || log.actionType.includes('VIOLATION') || log.actionType.includes('TAMPER')
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {log.actionType}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-semibold text-white">{log.targetId || 'N/A'}</td>
                      <td className="p-4 text-right">
                        <button className="text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1 ml-auto">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Inspector Panel (1/3 width) */}
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-2 text-blue-400 border-b border-cyber-border pb-3">
            <History className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Log Record Inspector</h3>
          </div>

          {selectedLog ? (
            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <div>
                  <span className="text-cyber-textMuted block text-[9px] uppercase font-sans">Event ID</span>
                  <span className="font-mono text-white font-semibold">{selectedLog._id}</span>
                </div>
                <div>
                  <span className="text-cyber-textMuted block text-[9px] uppercase font-sans">Origin IP Address</span>
                  <span className="font-mono text-white">{selectedLog.ipAddress || '127.0.0.1'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-cyber-border/60 space-y-3">
                <div>
                  <span className="text-cyber-textMuted block text-[9px] uppercase font-sans mb-1">State: Before Action (Old Value)</span>
                  {parseDiffValues(selectedLog.oldValue)}
                </div>
                <div className="flex justify-center text-cyber-textMuted my-1">
                  <ArrowRight className="w-4 h-4 transform rotate-90 lg:rotate-0" />
                </div>
                <div>
                  <span className="text-cyber-textMuted block text-[9px] uppercase font-sans mb-1">State: After Action (New Value)</span>
                  {parseDiffValues(selectedLog.newValue)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-cyber-textMuted text-xs">
              Select an audit row from the table list to inspect state transition details.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AuditLogs;
