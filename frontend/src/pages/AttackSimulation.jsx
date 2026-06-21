import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Terminal, 
  ShieldAlert, 
  Database, 
  UserX, 
  Trash2, 
  Eye, 
  FileCode2, 
  CheckCircle2, 
  AlertTriangle,
  Play
} from 'lucide-react';

const AttackSimulation = () => {
  const { fetchWithAuth } = useAuth();
  const [patients, setPatients] = useState([]);
  const [activeTab, setActiveTab] = useState('modify');
  
  // Attack 1 State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [fieldToTamper, setFieldToTamper] = useState('bloodGroup');
  const [newValue, setNewValue] = useState('');
  const [modifyResult, setModifyResult] = useState(null);

  // Attack 2 State
  const [insiderLog, setInsiderLog] = useState('');
  const [insiderStatus, setInsiderStatus] = useState('');

  // Attack 3 State
  const [deletePatientId, setDeletePatientId] = useState('');
  const [deleteResult, setDeleteResult] = useState(null);

  // Attack 4 State
  const [sqlUsername, setSqlUsername] = useState('{"$gt": ""}');
  const [sqlPassword, setSqlPassword] = useState('{"$gt": ""}');
  const [sqlResult, setSqlResult] = useState(null);
  const [sqlMode, setSqlMode] = useState('vulnerable'); // vulnerable or secured

  const loadPatientsList = async () => {
    try {
      const res = await fetchWithAuth('http://localhost:5000/api/patients');
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
        if (data.length > 0) {
          setSelectedPatientId(data[0].patientId);
          setDeletePatientId(data[0]._id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadPatientsList();
  }, []);

  // Attack 1 Action: Direct DB tamper
  const handleModifyTamper = async () => {
    if (!selectedPatientId || !newValue) return;
    try {
      const response = await fetch('http://localhost:5000/api/simulation/unauthorized-modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatientId,
          fieldToTamper,
          newValue
        })
      });

      const data = await response.json();
      if (response.ok) {
        setModifyResult(data);
        loadPatientsList();
      } else {
        alert('Tampering failed: ' + data.message);
      }
    } catch (err) {
      alert('Error connecting to backend');
    }
  };

  // Attack 2 Action: Receptionist privilege bypass attempt
  const handleInsiderAttempt = async () => {
    setInsiderStatus('IN_PROGRESS');
    setInsiderLog('Creating raw API request with Receptionist token...\nEndpoint: PUT /api/patients/123\nPayload: { bloodGroup: "AB-" }');
    
    // Create a mock expired or bad receptionist session (or use receptionist credentials if logged in)
    // We will simulate a receptionist edit request by using a temporary token
    // The easiest way is to authenticate as receptionist behind the scenes
    setTimeout(async () => {
      try {
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'receptionist_amy', password: 'recep123' })
        });
        
        if (!loginRes.ok) {
          setInsiderLog(prev => prev + '\n❌ Simulation error: Seed user receptionist_amy missing.');
          setInsiderStatus('FAILED');
          return;
        }

        const auth = await loginRes.json();
        setInsiderLog(prev => prev + `\n🔑 Obtained token for receptionist_amy: bearer ${auth.token.substring(0, 15)}...`);

        // Find a patient ID to try to edit
        if (patients.length === 0) {
          setInsiderLog(prev => prev + '\n❌ Error: No patient records to attempt update.');
          setInsiderStatus('FAILED');
          return;
        }
        
        const targetPatient = patients[0];
        setInsiderLog(prev => prev + `\n📡 Sending PUT request to edit patient ${targetPatient.fullName}...`);

        const editRes = await fetch(`http://localhost:5000/api/patients/${targetPatient._id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.token}`
          },
          body: JSON.stringify({
            fullName: targetPatient.fullName,
            age: targetPatient.age,
            gender: targetPatient.gender,
            bloodGroup: 'AB-', // attempted change
            allergies: targetPatient.allergies,
            diagnosis: 'MALICIOUS MODIFICATION',
            prescription: targetPatient.prescription,
            doctorName: targetPatient.doctorName
          })
        });

        const data = await editRes.json();
        
        if (editRes.status === 403) {
          setInsiderLog(prev => prev + `\n🛑 BLOCKED BY TMDS FRAMEWORK!\nStatus Code: 403 Forbidden\nMessage: ${data.message}`);
          setInsiderLog(prev => prev + '\n🛡️ Layer 1 (RBAC) successfully registered violation. Audit log and high-severity alert created.');
          setInsiderStatus('SUCCESS');
        } else {
          setInsiderLog(prev => prev + `\n⚠️ Attack succeeded? Output: ${JSON.stringify(data)}`);
          setInsiderStatus('FAILED');
        }
      } catch (err) {
        setInsiderLog(prev => prev + `\n❌ Network failure: ${err.message}`);
        setInsiderStatus('FAILED');
      }
    }, 1200);
  };

  // Attack 3 Action: Record Deletion
  const handleDeleteTamper = async () => {
    if (!deletePatientId) return;
    try {
      const response = await fetch('http://localhost:5000/api/simulation/record-deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: deletePatientId })
      });

      const data = await response.json();
      if (response.ok) {
        setDeleteResult(data);
        loadPatientsList();
      } else {
        alert('Deletion failed');
      }
    } catch (e) {
      alert('Error');
    }
  };

  // Attack 4 Action: NoSQL Injection auth bypass
  const handleSqlInjection = async () => {
    setSqlResult(null);
    try {
      let parsedUser = sqlUsername;
      let parsedPass = sqlPassword;

      // In real payload, the front end sends JSON object
      if (sqlUsername.startsWith('{')) {
        try { parsedUser = JSON.parse(sqlUsername); } catch(e) {}
      }
      if (sqlPassword.startsWith('{')) {
        try { parsedPass = JSON.parse(sqlPassword); } catch(e) {}
      }

      const endpoint = sqlMode === 'vulnerable' 
        ? 'http://localhost:5000/api/simulation/nosql-vuln'
        : 'http://localhost:5000/api/simulation/nosql-secured';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: parsedUser, password: parsedPass })
      });

      const data = await response.json();
      setSqlResult({
        status: response.status,
        data
      });
    } catch (err) {
      setSqlResult({ status: 500, data: { message: 'Connection error' } });
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-bold text-white">Cybersecurity Attack Simulation Lab</h2>
        <p className="text-xs text-cyber-textMuted mt-1">
          Perform controlled attacks to analyze vulnerability mechanisms and inspect how TMDS detects breaches.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-cyber-border space-x-2">
        <button
          onClick={() => setActiveTab('modify')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'modify' ? 'border-blue-500 text-blue-400' : 'border-transparent text-cyber-textMuted hover:text-white'
          }`}
        >
          1. Unauthorized Modification
        </button>
        <button
          onClick={() => setActiveTab('insider')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'insider' ? 'border-blue-500 text-blue-400' : 'border-transparent text-cyber-textMuted hover:text-white'
          }`}
        >
          2. Insider Threat Block
        </button>
        <button
          onClick={() => setActiveTab('delete')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'delete' ? 'border-blue-500 text-blue-400' : 'border-transparent text-cyber-textMuted hover:text-white'
          }`}
        >
          3. Record Deletion Attack
        </button>
        <button
          onClick={() => setActiveTab('nosql')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'nosql' ? 'border-blue-500 text-blue-400' : 'border-transparent text-cyber-textMuted hover:text-white'
          }`}
        >
          4. NoSQL Injection Bypass
        </button>
      </div>

      {/* Panel contents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Simulation Form (2/3 width) */}
        <div className="lg:col-span-2 bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-6">
          
          {activeTab === 'modify' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Database className="w-5 h-5 text-blue-400" />
                  <span>Attack 1: Direct Database Bypass Tampering</span>
                </h3>
                <p className="text-xs text-cyber-textMuted mt-1">
                  Bypass the backend framework completely (mimicking direct DB access or query spoofing) to change a clinical value. This will intentionally NOT update the cryptographic signature hash.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-cyber-textMuted uppercase mb-1">Target Patient</label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full bg-cyber-dark border border-cyber-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {patients.map(p => (
                      <option key={p.patientId} value={p.patientId}>{p.fullName} ({p.patientId})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-cyber-textMuted uppercase mb-1">Field to Tamper</label>
                  <select
                    value={fieldToTamper}
                    onChange={(e) => setFieldToTamper(e.target.value)}
                    className="w-full bg-cyber-dark border border-cyber-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="bloodGroup">Blood Group</option>
                    <option value="allergies">Allergies</option>
                    <option value="diagnosis">Diagnosis</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-cyber-textMuted uppercase mb-1">Tampered Value</label>
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="e.g. AB- or Severe Asthma"
                    className="w-full bg-cyber-dark border border-cyber-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <button
                onClick={handleModifyTamper}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Execute Tamper Attack</span>
              </button>

              {modifyResult && (
                <div className="mt-4 p-4 rounded-lg bg-cyber-dark/80 border border-red-900/40 space-y-3 font-mono text-[11px]">
                  <p className="text-red-400 font-bold">💥 Tampering Successful (Simulated Out-of-Band Mod):</p>
                  <p className="text-cyber-text">{modifyResult.message}</p>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-cyber-border/40">
                    <div>
                      <span className="text-cyber-textMuted block text-[9px] uppercase font-sans">Before Attack</span>
                      <span className="text-white">{modifyResult.before.field}: {modifyResult.before.value}</span>
                      <span className="text-blue-400 block text-[9px] truncate">Hash: {modifyResult.before.hash}</span>
                    </div>
                    <div>
                      <span className="text-cyber-textMuted block text-[9px] uppercase font-sans">After Attack</span>
                      <span className="text-red-400">{modifyResult.after.field}: {modifyResult.after.value}</span>
                      <span className="text-red-400 block text-[9px] truncate">Hash: {modifyResult.after.hash} (UNCHANGED)</span>
                    </div>
                  </div>
                  <div className="bg-red-950/20 p-3 rounded border border-red-900/30 text-[10px] text-amber-400 leading-relaxed font-sans">
                    <strong>Post-Attack Security Analysis:</strong> Because the hash was NOT recalculated, the next reader querying this patient will trigger a hash signature mismatch. This alerts the Admin dashboard immediately.
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'insider' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <UserX className="w-5 h-5 text-blue-400" />
                  <span>Attack 2: Receptionist Insider Privilege Escalation</span>
                </h3>
                <p className="text-xs text-cyber-textMuted mt-1">
                  A receptionist user attempts to issue an update to a patient record (e.g. changing diagnosis or blood group). RBAC should block the request, log it, and trigger a security alert.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-cyber-dark/60 border border-cyber-border font-mono text-xs">
                <p className="text-cyber-textMuted">// Insider Test Telemetry Terminal</p>
                <pre className="mt-3 text-cyber-text whitespace-pre-wrap leading-relaxed max-h-[150px] overflow-y-auto bg-black/40 p-3 rounded border border-cyber-border/60">
                  {insiderLog || 'Ready for simulation. Click run below.'}
                </pre>
              </div>

              <button
                onClick={handleInsiderAttempt}
                disabled={insiderStatus === 'IN_PROGRESS'}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                <span>{insiderStatus === 'IN_PROGRESS' ? 'Executing API Probe...' : 'Simulate Insider Action'}</span>
              </button>

              {insiderStatus === 'SUCCESS' && (
                <div className="p-3.5 bg-emerald-950/20 border border-emerald-900/40 rounded-xl text-xs text-emerald-400 font-sans leading-relaxed">
                  <strong>Layer 1 RBAC Verification:</strong> The TMDS engine correctly identified that receptionist role does not hold PUT permissions. An audit record for action `PRIVILEGE_VIOLATION` was generated.
                </div>
              )}
            </div>
          )}

          {activeTab === 'delete' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Trash2 className="w-5 h-5 text-blue-400" />
                  <span>Attack 3: Medical Chart Deletion Attack</span>
                </h3>
                <p className="text-xs text-cyber-textMuted mt-1">
                  Simulate malicious removal of a patient's chart. Deleting clinical data leads to serious service interruptions.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-cyber-textMuted uppercase mb-1">Target Patient to Delete</label>
                <select
                  value={deletePatientId}
                  onChange={(e) => setDeletePatientId(e.target.value)}
                  className="w-full max-w-md bg-cyber-dark border border-cyber-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {patients.map(p => (
                    <option key={p._id} value={p.patientId}>{p.fullName} ({p.patientId})</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleDeleteTamper}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Simulate Deletion</span>
              </button>

              {deleteResult && (
                <div className="p-4 bg-cyber-dark/80 border border-red-900/40 rounded-xl space-y-2 font-mono text-[11px]">
                  <p className="text-red-400 font-bold">🗑️ Deletion Simulation Triggered:</p>
                  <p className="text-cyber-text">{deleteResult.message}</p>
                  <p className="text-cyber-textMuted">Deleted Target: {deleteResult.deletedRecord.fullName} ({deleteResult.deletedRecord.patientId})</p>
                  <div className="bg-red-950/20 p-3 rounded text-[10px] text-amber-400 font-sans leading-relaxed border border-red-900/20">
                    <strong>TMDS Consequence Analysis:</strong> Deletions represent raw datastore tampering. A high-risk alarm has been created, and the security score is updated.
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'nosql' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <FileCode2 className="w-5 h-5 text-blue-400" />
                  <span>Attack 4: NoSQL Injection Authentication Bypass</span>
                </h3>
                <p className="text-xs text-cyber-textMuted mt-1">
                  Test a login panel query. In NoSQL, sending payload objects instead of strings (e.g. using operator key `$gt`) can trick the database into returning user profiles without matching passwords.
                </p>
              </div>

              {/* Mode switch */}
              <div className="flex border-b border-cyber-border/40 pb-2">
                <button
                  onClick={() => { setSqlMode('vulnerable'); setSqlResult(null); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded ${
                    sqlMode === 'vulnerable' ? 'bg-red-600/10 text-red-400 border border-red-500/20' : 'text-cyber-textMuted'
                  }`}
                >
                  Vulnerable Endpoint Config
                </button>
                <button
                  onClick={() => { setSqlMode('secured'); setSqlResult(null); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded ml-2 ${
                    sqlMode === 'secured' ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20' : 'text-cyber-textMuted'
                  }`}
                >
                  Secured Endpoint Config
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-cyber-textMuted uppercase mb-1">Username Injection Payload</label>
                  <input
                    type="text"
                    value={sqlUsername}
                    onChange={(e) => setSqlUsername(e.target.value)}
                    className="w-full bg-cyber-dark border border-cyber-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-cyber-textMuted uppercase mb-1">Password Injection Payload</label>
                  <input
                    type="text"
                    value={sqlPassword}
                    onChange={(e) => setSqlPassword(e.target.value)}
                    className="w-full bg-cyber-dark border border-cyber-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <button
                onClick={handleSqlInjection}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Submit Query to API</span>
              </button>

              {sqlResult && (
                <div className={`p-4 rounded-xl border font-mono text-[11px] space-y-2 ${
                  sqlResult.data.success ? 'bg-red-950/20 border-red-900/60 text-red-400' : 'bg-emerald-950/20 border-emerald-900/60 text-emerald-400'
                }`}>
                  <p className="font-bold flex items-center space-x-1">
                    {sqlResult.data.success ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>API Response status: {sqlResult.status}</span>
                  </p>
                  <pre className="bg-black/30 p-2.5 rounded text-[10px] whitespace-pre-wrap overflow-x-auto text-white">
                    {JSON.stringify(sqlResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Impact Analysis & Explanation (1/3 width) */}
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-6">
          <div className="flex items-center space-x-2 text-red-400">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Attack Impact Analysis</h3>
          </div>

          {activeTab === 'modify' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-red-950/20 rounded border border-red-900/20 text-red-300">
                <strong>Critical Risk:</strong> Altering blood types or allergy records directly in database can cause life-threatening administration of incompatible medicine during emergencies.
              </div>
              <div className="space-y-2 text-cyber-textMuted leading-relaxed">
                <p><strong>Vector:</strong> Attacker gains DB login, or exploits SQL/NoSQL injections to execute out-of-band updates, bypassing audit controllers.</p>
                <p><strong>Defense:</strong> TMDS verifies SHA-256 signatures of core patient attributes on every read attempt, preventing the use of altered charts.</p>
              </div>
            </div>
          )}

          {activeTab === 'insider' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-amber-950/20 rounded border border-amber-900/20 text-amber-300">
                <strong>Insider Risk:</strong> Disgruntled employees with low privilege credentials (e.g. receptionist) may attempt to alter logs or diagnoses to harm patient credibility.
              </div>
              <div className="space-y-2 text-cyber-textMuted leading-relaxed">
                <p><strong>Vector:</strong> Exploiting API endpoints using valid authorization tokens but targeting unauthorized routes.</p>
                <p><strong>Defense:</strong> Strict middleware execution maps roles and terminates illegitimate PUT/DELETE paths immediately.</p>
              </div>
            </div>
          )}

          {activeTab === 'delete' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-red-950/20 rounded border border-red-900/20 text-red-300">
                <strong>Deletion Risk:</strong> Medical history removal leads to complete loss of treatment context.
              </div>
              <div className="space-y-2 text-cyber-textMuted leading-relaxed">
                <p><strong>Vector:</strong> SQL `DROP` commands, NoSQL `deleteMany` scripts executed via admin credentials.</p>
                <p><strong>Defense:</strong> Audit triggers log the pre-deleted object, and TMDS reports anomalies for cluster analysis.</p>
              </div>
            </div>
          )}

          {activeTab === 'nosql' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-amber-950/20 rounded border border-amber-900/20 text-amber-300">
                <strong>Injection Risk:</strong> Attackers can bypass authentication forms without supplying valid credentials.
              </div>
              <div className="space-y-2 text-cyber-textMuted leading-relaxed">
                <p><strong>Vulnerability Mechanics:</strong></p>
                <p>Receiving raw request objects directly into MongoDB queries allows the database engine to parse nested properties (like `$gt`, `$ne`, etc.) as query conditions instead of literal strings.</p>
                <p className="mt-2"><strong>Mitigation:</strong></p>
                <p>Sanitize input parameters by explicitly casting usernames and passwords to primitive String objects before database retrieval. This forces comparison queries to treat characters literally and neutralizes operators.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttackSimulation;
