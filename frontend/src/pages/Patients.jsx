import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FolderHeart, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Edit3, 
  UserPlus, 
  Activity,
  Heart,
  Calendar,
  Layers,
  X
} from 'lucide-react';

const Patients = () => {
  const { user, fetchWithAuth } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form State
  const [formState, setFormState] = useState({
    id: '', // Mongoose ID
    patientId: '',
    fullName: '',
    age: '',
    gender: 'Male',
    bloodGroup: 'A+',
    allergies: '',
    diagnosis: '',
    prescription: '',
    doctorName: ''
  });

  const loadPatients = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth('http://localhost:5000/api/patients');
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (err) {
      console.error('Error loading patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setError('');
    setSuccess('');
    setFormState({
      id: '',
      patientId: `PT-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: '',
      age: '',
      gender: 'Male',
      bloodGroup: 'A+',
      allergies: '',
      diagnosis: '',
      prescription: '',
      doctorName: user.role === 'Doctor' ? user.username : 'dr_smith'
    });
    setShowModal(true);
  };

  const openEditModal = (patient) => {
    setIsEditing(true);
    setError('');
    setSuccess('');
    setFormState({
      id: patient._id,
      patientId: patient.patientId,
      fullName: patient.fullName,
      age: patient.age,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      allergies: patient.allergies || '',
      diagnosis: patient.diagnosis || '',
      prescription: patient.prescription || '',
      doctorName: patient.doctorName
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formState.fullName || !formState.age || !formState.patientId) {
      setError('Please fill in required fields (Patient ID, Full Name, Age).');
      return;
    }

    try {
      const url = isEditing 
        ? `http://localhost:5000/api/patients/${formState.id}`
        : 'http://localhost:5000/api/patients';
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(formState)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(isEditing ? 'Record updated successfully.' : 'Patient registered successfully.');
        setTimeout(() => {
          setShowModal(false);
          loadPatients();
        }, 1500);
      } else {
        setError(data.message || 'Operation failed.');
      }
    } catch (err) {
      setError('Connection to backend lost.');
    }
  };

  const filteredPatients = patients.filter(p => 
    p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.patientId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canEdit = user.role === 'Doctor' || user.role === 'Admin';
  const canCreate = user.role === 'Receptionist' || user.role === 'Doctor' || user.role === 'Admin';

  return (
    <div className="space-y-6 font-sans">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-white">Clinical Patient Records</h2>
          <p className="text-xs text-cyber-textMuted mt-1">
            Standard directory of medical charts. TMDS automatically signs and validates these records.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={openAddModal}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg shadow-blue-600/10 transition-colors self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Patient Record</span>
          </button>
        )}
      </div>

      {/* Control bar */}
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div className="relative max-w-md w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-cyber-textMuted" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-4 py-2 bg-cyber-dark/80 border border-cyber-border rounded-lg text-xs text-white placeholder-cyber-textMuted focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Search by ID, Name..."
          />
        </div>

        <div className="flex items-center space-x-3 text-xs text-cyber-textMuted font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
            <span>Intact Signature</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded bg-red-500 animate-pulse" />
            <span>Tampered Signature</span>
          </div>
        </div>
      </div>

      {/* Patient List Grid */}
      {loading ? (
        <div className="text-center py-12 text-cyber-textMuted text-sm">
          Accessing and validating database records...
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="text-center py-12 text-cyber-textMuted text-sm border border-dashed border-cyber-border rounded-xl">
          No medical records matching standard queries.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredPatients.map((patient) => (
            <div
              key={patient._id}
              className={`bg-cyber-card border rounded-xl overflow-hidden shadow-lg transition-all flex flex-col justify-between ${
                patient.isTampered 
                  ? 'border-red-600/60 bg-red-950/5 ring-1 ring-red-500/20' 
                  : 'border-cyber-border hover:border-blue-500/40'
              }`}
            >
              {/* Card top banner */}
              <div className={`p-4 border-b flex justify-between items-center ${
                patient.isTampered ? 'border-red-900/50 bg-red-950/20' : 'border-cyber-border bg-cyber-dark/20'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                    patient.isTampered ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    {patient.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{patient.fullName}</h3>
                    <p className="text-[10px] text-cyber-textMuted font-mono uppercase tracking-wider">{patient.patientId}</p>
                  </div>
                </div>

                {patient.isTampered ? (
                  <div className="flex items-center space-x-1 text-red-500 bg-red-950/50 border border-red-800/40 px-2 py-1 rounded text-[10px] font-bold animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>HASH MISMATCH</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 px-2 py-1 rounded text-[10px] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>SIGNATURE OK</span>
                  </div>
                )}
              </div>

              {/* Patient Core Details */}
              <div className="p-5 space-y-4 text-xs">
                {patient.isTampered && (
                  <div className="bg-red-950/40 border border-red-900/60 text-red-400 p-2.5 rounded-lg text-[11px] leading-relaxed">
                    <strong>Integrity Warning:</strong> This chart failed signature check! Raw values in database were changed by an attacker bypass (e.g. direct NoSQL bypass). Record is quarantined.
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 py-2 border-b border-cyber-border/40 font-mono text-[11px]">
                  <div>
                    <span className="text-cyber-textMuted block text-[9px] uppercase font-sans">Age / Gender</span>
                    <span className="text-white font-bold">{patient.age} Yrs / {patient.gender}</span>
                  </div>
                  <div>
                    <span className="text-cyber-textMuted block text-[9px] uppercase font-sans">Blood Type</span>
                    <span className={`font-bold ${patient.isTampered ? 'text-red-400' : 'text-white'}`}>{patient.bloodGroup}</span>
                  </div>
                  <div>
                    <span className="text-cyber-textMuted block text-[9px] uppercase font-sans">Assigned Doctor</span>
                    <span className="text-white">{patient.doctorName}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-cyber-textMuted block text-[10px] uppercase font-semibold">Known Allergies</span>
                    <p className={`mt-0.5 font-medium ${patient.isTampered ? 'text-red-300' : 'text-cyber-text'}`}>
                      {patient.allergies || 'No Known Allergies'}
                    </p>
                  </div>
                  <div>
                    <span className="text-cyber-textMuted block text-[10px] uppercase font-semibold">Diagnosis</span>
                    <p className={`mt-0.5 font-medium ${patient.isTampered ? 'text-red-300' : 'text-cyber-text'}`}>
                      {patient.diagnosis || 'Unspecified'}
                    </p>
                  </div>
                  <div>
                    <span className="text-cyber-textMuted block text-[10px] uppercase font-semibold">Prescription Plan</span>
                    <p className={`mt-0.5 font-medium font-mono text-[11px] ${patient.isTampered ? 'text-red-300' : 'text-blue-400'}`}>
                      {patient.prescription || 'No current treatment plan'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action bar */}
              <div className="px-5 py-3 border-t border-cyber-border/60 bg-cyber-dark/10 flex justify-between items-center text-[10px] font-mono text-cyber-textMuted">
                <span>Last Updated: {patient.lastUpdated ? new Date(patient.lastUpdated).toLocaleString() : 'N/A'}</span>
                
                {canEdit && (
                  <button
                    onClick={() => openEditModal(patient)}
                    className="flex items-center space-x-1 bg-cyber-border/60 text-white px-2.5 py-1.5 rounded hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Chart</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register/Edit Chart Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-cyber-card border border-cyber-border rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-cyber-border flex justify-between items-center bg-cyber-dark/40">
              <div className="flex items-center space-x-2.5 text-blue-500">
                {isEditing ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                <h3 className="text-md font-bold text-white">
                  {isEditing ? `Modify Patient: ${formState.fullName}` : 'Register New Patient Record'}
                </h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-cyber-textMuted hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-950/80 border border-red-800/40 text-red-400 text-xs rounded-lg flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 text-xs rounded-lg flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{success}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-cyber-textMuted uppercase mb-1">Patient ID *</label>
                  <input
                    type="text"
                    name="patientId"
                    value={formState.patientId}
                    onChange={handleInputChange}
                    disabled={isEditing}
                    className="w-full bg-cyber-dark border border-cyber-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-cyber-textMuted uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formState.fullName}
                    onChange={handleInputChange}
                    className="w-full bg-cyber-dark border border-cyber-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    placeholder="Alice Johnson"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-cyber-textMuted uppercase mb-1">Age *</label>
                  <input
                    type="number"
                    name="age"
                    value={formState.age}
                    onChange={handleInputChange}
                    className="w-full bg-cyber-dark border border-cyber-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    placeholder="35"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-cyber-textMuted uppercase mb-1">Gender</label>
                  <select
                    name="gender"
                    value={formState.gender}
                    onChange={handleInputChange}
                    className="w-full bg-cyber-dark border border-cyber-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-cyber-textMuted uppercase mb-1">Blood Group</label>
                  <select
                    name="bloodGroup"
                    value={formState.bloodGroup}
                    onChange={handleInputChange}
                    className="w-full bg-cyber-dark border border-cyber-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-cyber-textMuted uppercase mb-1">Known Allergies</label>
                <input
                  type="text"
                  name="allergies"
                  value={formState.allergies}
                  onChange={handleInputChange}
                  className="w-full bg-cyber-dark border border-cyber-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Penicillin, Peanuts"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-cyber-textMuted uppercase mb-1">Diagnosis</label>
                <textarea
                  name="diagnosis"
                  value={formState.diagnosis}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full bg-cyber-dark border border-cyber-border rounded-lg p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                  placeholder="Clinical assessment results..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-cyber-textMuted uppercase mb-1">Prescription</label>
                <textarea
                  name="prescription"
                  value={formState.prescription}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full bg-cyber-dark border border-cyber-border rounded-lg p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                  placeholder="Dosage instruction details..."
                />
              </div>

              <div className="pt-4 border-t border-cyber-border flex justify-end space-x-3 bg-cyber-dark/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-cyber-border/40 text-cyber-text hover:bg-cyber-border rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-500/10 transition-colors"
                >
                  {isEditing ? 'Save Changes & Re-hash' : 'Save Patient Chart'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;
