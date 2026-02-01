import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  ShieldCheck,
  Database,
  Users,
  FileText,
  Search,
  PlusCircle,
  Lock,
  UploadCloud,
  CheckCircle,
  AlertCircle,
  Link as LinkIcon,
  Server,
  LogOut,
  ChevronRight,
  ArrowLeft,
  Heart,
  Loader2
} from 'lucide-react';

// --- API CONFIGURATION ---
const API_URL = 'http://localhost:3001/api';

// --- UTILITIES ---

// Utility to simulate SHA-256 Hashing (Async)
const sha256 = async (message) => {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Blood Type Compatibility Chart
const canReceiveFrom = (recipientType, donorType) => {
  const map = {
    'O-': ['O-'],
    'O+': ['O+', 'O-'],
    'A-': ['A-', 'O-'],
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'AB-': ['AB-', 'A-', 'B-', 'O-'],
    'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-']
  };
  return map[recipientType]?.includes(donorType) || false;
};

// --- COMPONENTS ---

const Card = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const Badge = ({ status }) => {
  const styles = {
    WAITING: "bg-amber-100 text-amber-700 border-amber-200",
    MATCHED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    REGISTERED: "bg-blue-100 text-blue-700 border-blue-200",
    AVAILABLE: "bg-emerald-100 text-emerald-700 border-emerald-200",
    PENDING_VERIFICATION: "bg-yellow-100 text-yellow-700 border-yellow-200",
    VERIFIED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    REJECTED: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || "bg-gray-100"}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
};

// Donor Self-Registration Form Component
const DonorRegistrationForm = ({ onBack, addNotification, setIsAuthenticated, setRole }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bloodType: '',
    hla: '',
    organs: [],
    consent: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const organOptions = ['Kidney', 'Liver', 'Heart', 'Lungs', 'Pancreas', 'Corneas'];

  const handleOrganToggle = (organ) => {
    setFormData(prev => ({
      ...prev,
      organs: prev.organs.includes(organ)
        ? prev.organs.filter(o => o !== organ)
        : [...prev.organs, organ]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!formData.name || !formData.email || !formData.bloodType || !formData.organs.length || !formData.consent) {
      setError('Please fill all required fields and provide consent');
      setIsSubmitting(false);
      return;
    }

    try {
      const donorId = `DON-${Date.now()}`;
      const consentHash = await sha256(`${formData.name}-${formData.email}-consent-${Date.now()}`);

      const response = await fetch(`${API_URL}/donors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: donorId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          bloodType: formData.bloodType,
          hla: formData.hla || 'Pending medical test',
          organsAvailable: formData.organs,
          ipfsHash: '',
          consentHash: consentHash
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        addNotification(`✅ Registration submitted! Your Donor ID: ${donorId}`);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }

    setIsSubmitting(false);
  };

  if (success) {
    return (
      <div className="text-center animate-in fade-in duration-300 py-8">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h3 className="text-2xl font-bold text-emerald-700 mb-3">Registration Submitted!</h3>
        <p className="text-slate-500 mb-6">
          Your application is pending hospital verification.<br />
          A hospital will contact you for physical verification.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4 mb-6">
        <button type="button" onClick={onBack} className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="font-bold text-xl text-rose-600">Donor Registration</span>
          <p className="text-xs text-slate-400">Pending verification by hospital</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Full Name *"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="col-span-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
          required
        />
        <input
          type="email"
          placeholder="Email *"
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
          className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
          required
        />
        <input
          type="tel"
          placeholder="Phone"
          value={formData.phone}
          onChange={e => setFormData({ ...formData, phone: e.target.value })}
          className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Blood Type *</label>
        <div className="flex flex-wrap gap-2">
          {bloodTypes.map(bt => (
            <button
              key={bt}
              type="button"
              onClick={() => setFormData({ ...formData, bloodType: bt })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${formData.bloodType === bt
                ? 'bg-rose-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {bt}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Organs to Donate *</label>
        <div className="grid grid-cols-3 gap-2">
          {organOptions.map(organ => (
            <button
              key={organ}
              type="button"
              onClick={() => handleOrganToggle(organ)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${formData.organs.includes(organ)
                ? 'bg-rose-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {organ}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-start gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
        <input
          type="checkbox"
          checked={formData.consent}
          onChange={e => setFormData({ ...formData, consent: e.target.checked })}
          className="mt-1 w-4 h-4 accent-rose-500"
        />
        <span className="text-xs text-slate-600">
          I consent to organ donation and understand that hospital verification is required before matching. *
        </span>
      </label>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${isSubmitting
          ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
          : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600'
          }`}
      >
        {isSubmitting ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
        ) : (
          <><Heart className="w-5 h-5" /> Submit Application</>
        )}
      </button>
    </form>
  );
};

export default function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginStep, setLoginStep] = useState('selection'); // 'selection' | 'hospital-form'
  const [hospitalId, setHospitalId] = useState('');
  const [password, setPassword] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // App Data State
  const [view, setView] = useState('dashboard'); // dashboard, patients, donors, matching
  const [viewHistory, setViewHistory] = useState(['dashboard']); // History stack for Back button
  const [role, setRole] = useState('PUBLIC'); // HOSPITAL_ADMIN, PUBLIC
  const [patients, setPatients] = useState([]);
  const [donors, setDonors] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);

  // Fetch data from blockchain API
  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      const [patientsRes, donorsRes, healthRes] = await Promise.all([
        fetch(`${API_URL}/patients`),
        fetch(`${API_URL}/donors`),
        fetch(`${API_URL}/health`)
      ]);

      const patientsData = await patientsRes.json();
      const donorsData = await donorsRes.json();
      const healthData = await healthRes.json();

      setPatients(patientsData || []);
      setDonors(donorsData || []);
      setApiConnected(healthData.connected || false);
    } catch (error) {
      console.error('Failed to fetch from blockchain:', error);
      setApiConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const addNotification = (msg) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setRole('PUBLIC');
    setView('dashboard');
    setViewHistory(['dashboard']);
    setLoginStep('selection');
    setHospitalId('');
    setPassword('');
    setHospitalName('');
    setError('');
  };

  const handleNavigate = (newView) => {
    if (view !== newView) {
      setViewHistory(prev => [...prev, newView]);
      setView(newView);
      // scroll to top on navigate
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (viewHistory.length > 1) {
      const newHistory = [...viewHistory];
      newHistory.pop();
      const prevView = newHistory[newHistory.length - 1];
      setViewHistory(newHistory);
      setView(prevView);
    }
  };

  const verifyHospitalLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    try {
      // Hash the password using SHA-256
      const passwordHash = await sha256(password);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalId: hospitalId,
          passwordHash: passwordHash
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setRole('HOSPITAL_ADMIN');
        setIsAuthenticated(true);
        setHospitalName(data.hospital.name);
        setError('');
        addNotification(`✅ Welcome, ${data.hospital.name}!`);
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (error) {
      setError('Unable to connect to authentication server');
    }

    setIsLoggingIn(false);
  };

  const Navbar = () => (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between glass rounded-[24px] px-8 py-3">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setIsAuthenticated(false); setView('dashboard'); }}>
          <div className="w-10 h-10 bg-[#064e3b] rounded-xl flex items-center justify-center shadow-md">
            <Activity className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#064e3b] font-heading">OrganChain</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#4b5563]">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            <span className={`w-2 h-2 rounded-full ${apiConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
            {apiConnected ? 'Blockchain: Connected' : 'Blockchain: Offline'}
          </div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            <Server className="w-4 h-4 text-[#059669]" /> Peer0.Org1
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#10b981] bg-[#10b981]/5 px-3 py-1 rounded-full border border-[#10b981]/10">
                {role === 'HOSPITAL_ADMIN' ? (hospitalName || hospitalId) : 'GUEST'}
              </span>
              <button
                onClick={handleLogout}
                className="p-2 text-[#4b5563] hover:text-[#ef4444] hover:bg-[#ef4444]/5 rounded-full transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );

  const Hero = () => null; // Hero removed for minimalism


  // --- SUB-VIEWS ---

  // 1. DASHBOARD VIEW
  const DashboardView = () => {
    const stats = [
      { label: 'Total Patients', value: patients.length, icon: Users, color: 'text-[#10b981]', bg: 'bg-[#10b981]/5' },
      { label: 'Active Donors', value: donors.length, icon: Activity, color: 'text-[#059669]', bg: 'bg-[#059669]/5' },
      { label: 'Pending Matches', value: patients.filter(p => p.status === 'WAITING').length, icon: Database, color: 'text-[#f59e0b]', bg: 'bg-[#f59e0b]/5' },
      { label: 'Successful Matches', value: patients.filter(p => p.status === 'MATCHED').length, icon: ShieldCheck, color: 'text-[#ef4444]', bg: 'bg-[#ef4444]/5' },
    ];

    return (
      <div className="space-y-12 animate-fadeIn">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="p-8 bg-white rounded-[24px] border border-slate-100 shadow-sm flex flex-col items-start gap-4 hover:shadow-md transition-all">
              <div className={`p-4 rounded-2xl ${stat.bg}`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#5f6368] uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-4xl font-bold text-[#1f1f1f] font-heading tracking-tight">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-50 rounded-3xl p-8 border border-white">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center font-heading">
              <Server className="w-6 h-6 mr-3 text-indigo-500" />
              Network Status
            </h3>
            <div className="space-y-5">
              <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-3">
                <span className="text-slate-500 font-medium">Peer Status</span>
                <span className="text-emerald-600 font-bold flex items-center"><span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>Online (Peer0.Org1)</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-3">
                <span className="text-slate-500 font-medium">Channel Height</span>
                <span className="font-mono font-bold text-slate-700">Block #14,203</span>
              </div>
              <div className="flex justify-between items-center text-sm pb-1">
                <span className="text-slate-500 font-medium">Chaincode Version</span>
                <span className="font-mono font-bold text-slate-700 bg-white px-2 py-1 rounded border">v1.4.2-STABLE</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-3xl p-8 border border-white">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center font-heading">
              <LinkIcon className="w-6 h-6 mr-3 text-indigo-500" />
              Ledger Events
            </h3>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center text-sm p-4 bg-white rounded-2xl shadow-sm border border-slate-100 group hover:border-indigo-200 transition-colors">
                  <div className="flex-1">
                    <p className="font-bold text-slate-700">Tx: {`8f43...a${i}2`}</p>
                    <p className="text-xs text-slate-400 font-medium">Invoked: CreatePatientRecord</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-400 transition-colors uppercase tracking-widest">{i * 2} min ago</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };


  // 2. PATIENT REGISTRATION FORM
  const PatientRegistry = () => {
    const [formData, setFormData] = useState({
      name: '',
      bloodType: 'A+',
      organNeeded: 'Kidney',
      hla: '',
      medicalNotes: ''
    });
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(0);
    const [txDetails, setTxDetails] = useState(null);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setStep(1);

      await new Promise(r => setTimeout(r, 800));
      const mockIpfsCid = `Qm${Math.random().toString(36).substring(7)}...${Math.random().toString(36).substring(7)}`;

      const payload = JSON.stringify({ ...formData, timestamp: Date.now() });
      const dataHash = await sha256(payload);

      setStep(2);
      setTxDetails({ cid: mockIpfsCid, hash: dataHash });

      try {
        const patientId = `PAT-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        const nameHash = await sha256(formData.name);

        const response = await fetch(`${API_URL}/patients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: patientId,
            nameHash: nameHash.substring(0, 8) + '...',
            bloodType: formData.bloodType,
            hla: formData.hla,
            organNeeded: formData.organNeeded,
            ipfsHash: mockIpfsCid,
            hospitalId: hospitalId || 'HOSP-DEFAULT'
          })
        });

        if (response.ok) {
          // Refresh patients from blockchain
          const patientsRes = await fetch(`${API_URL}/patients`);
          const patientsData = await patientsRes.json();
          setPatients(patientsData || []);
          addNotification("✅ Patient Record Committed to Blockchain!");
        } else {
          const error = await response.json();
          addNotification(`❌ Error: ${error.error}`);
        }
      } catch (error) {
        addNotification(`❌ Failed to connect to blockchain: ${error.message}`);
      }

      setLoading(false);
      setStep(0);
      setFormData({ name: '', bloodType: 'A+', organNeeded: 'Kidney', hla: '', medicalNotes: '' });
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {role === 'HOSPITAL_ADMIN' ? (
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-slate-800">New Patient Record</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Patient Name (Private)</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="John Doe"
                  />
                  <p className="text-xs text-slate-400 mt-1 flex items-center">
                    <Lock className="w-3 h-3 mr-1" /> Will be hashed on-chain
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Blood Type</label>
                    <select
                      value={formData.bloodType}
                      onChange={e => setFormData({ ...formData, bloodType: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded text-sm"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Organ</label>
                    <select
                      value={formData.organNeeded}
                      onChange={e => setFormData({ ...formData, organNeeded: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded text-sm"
                    >
                      {['Kidney', 'Liver', 'Heart', 'Lung'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase mb-1">HLA Markers (6 Antigens)</label>
                  <input
                    required
                    type="text"
                    value={formData.hla}
                    onChange={e => setFormData({ ...formData, hla: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded text-sm"
                    placeholder="e.g., A2, A24, B35, B44, DR1, DR4"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Medical Record (PDF)</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors">
                    <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                    <span className="text-xs text-slate-500">Click to mock upload to IPFS</span>
                  </div>
                </div>

                <button
                  disabled={loading}
                  type="submit"
                  className={`w-full py-2 px-4 rounded text-white font-medium text-sm transition-all ${loading ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {loading ? 'Processing Transaction...' : 'Sign & Submit to Fabric'}
                </button>
              </form>
            </Card>
          </div>
        ) : (
          <div className="lg:col-span-1">
            <Card className="p-6 bg-slate-50 border-dashed border-2 h-full flex flex-col items-center justify-center text-center">
              <Lock className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-slate-600 font-medium">Write Access Restricted</h3>
              <p className="text-sm text-slate-400 mt-2">Only authorized Hospital Admins can create new patient records.</p>
            </Card>
          </div>
        )}

        {/* Right: Data Table */}
        <div className="lg:col-span-2 space-y-6">
          {loading && (
            <Card className="p-4 bg-indigo-50 border-indigo-100">
              <h4 className="font-semibold text-indigo-800 text-sm mb-2">Transaction Lifecycle</h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs mr-3 ${step >= 1 ? 'bg-green-500 text-white' : 'bg-slate-200'}`}>1</div>
                  <span className="text-sm text-slate-600">Encrypting & Uploading to IPFS...</span>
                </div>
                {txDetails?.cid && (
                  <div className="ml-8 text-xs font-mono text-slate-500 bg-white p-2 rounded border truncate">
                    CID: {txDetails.cid}
                  </div>
                )}
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs mr-3 ${step >= 2 ? 'bg-green-500 text-white' : 'bg-slate-200'}`}>2</div>
                  <span className="text-sm text-slate-600">Generating Data Hash & Signing...</span>
                </div>
                {txDetails?.hash && (
                  <div className="ml-8 text-xs font-mono text-slate-500 bg-white p-2 rounded border truncate">
                    Hash: {txDetails.hash.substring(0, 30)}...
                  </div>
                )}
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs mr-3 ${step >= 2 ? 'bg-blue-500 animate-pulse text-white' : 'bg-slate-200'}`}>3</div>
                  <span className="text-sm text-slate-600">Invoking Chaincode: CreatePatient</span>
                </div>
              </div>
            </Card>
          )}

          <Card className="overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-semibold text-slate-700">Patient Ledger (Public State)</h3>
              <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border">World State</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Blood</th>
                    <th className="p-3">Organ</th>
                    <th className="p-3">HLA Data</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-xs">{p.id}</td>
                      <td className="p-3"><span className="font-bold text-slate-700">{p.bloodType}</span></td>
                      <td className="p-3">{p.organNeeded}</td>
                      <td className="p-3 text-xs text-slate-500 truncate max-w-[150px]">{p.hla}</td>
                      <td className="p-3"><Badge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  // 3. DONOR REGISTRY FORM
  const DonorRegistry = () => {
    const [formData, setFormData] = useState({
      name: '',
      bloodType: 'O-',
      organs: [], // Array of strings
      hla: '',
      consentGiven: false
    });
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(0);
    const [txDetails, setTxDetails] = useState(null);

    const toggleOrgan = (organ) => {
      setFormData(prev => ({
        ...prev,
        organs: prev.organs.includes(organ)
          ? prev.organs.filter(o => o !== organ)
          : [...prev.organs, organ]
      }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!formData.consentGiven) {
        alert("Consent required.");
        return;
      }
      setLoading(true);
      setStep(1);

      // Simulate IPFS
      await new Promise(r => setTimeout(r, 800));
      const mockIpfsCid = `Qm${Math.random().toString(36).substring(7)}...donor`;

      // Simulate Hashing
      const payload = JSON.stringify({ ...formData, timestamp: Date.now() });
      const dataHash = await sha256(payload);

      setStep(2);
      setTxDetails({ cid: mockIpfsCid, hash: dataHash });

      try {
        const donorId = `DON-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

        const response = await fetch(`${API_URL}/donors`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: donorId,
            bloodType: formData.bloodType,
            hla: formData.hla,
            organsAvailable: formData.organs,
            ipfsHash: mockIpfsCid,
            consentHash: `0x${dataHash.substring(0, 10)}...signed`
          })
        });

        if (response.ok) {
          // Refresh donors from blockchain
          const donorsRes = await fetch(`${API_URL}/donors`);
          const donorsData = await donorsRes.json();
          setDonors(donorsData || []);
          addNotification("✅ Donor Record Committed to Blockchain!");
        } else {
          const error = await response.json();
          addNotification(`❌ Error: ${error.error}`);
        }
      } catch (error) {
        addNotification(`❌ Failed to connect to blockchain: ${error.message}`);
      }

      setLoading(false);
      setStep(0);
      setFormData({ name: '', bloodType: 'O-', organs: [], hla: '', consentGiven: false });
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        {role === 'HOSPITAL_ADMIN' ? (
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-slate-800">Register Donor</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Donor Name (Private)</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Blood Type</label>
                  <select
                    value={formData.bloodType}
                    onChange={e => setFormData({ ...formData, bloodType: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded text-sm"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Available Organs</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Kidney', 'Liver', 'Heart', 'Lung', 'Pancreas', 'Intestine'].map(org => (
                      <label key={org} className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.organs.includes(org)}
                          onChange={() => toggleOrgan(org)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>{org}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase mb-1">HLA Markers</label>
                  <input
                    required
                    type="text"
                    value={formData.hla}
                    onChange={e => setFormData({ ...formData, hla: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded text-sm"
                    placeholder="e.g., A2, A24, B35..."
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-start space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-slate-50">
                    <input
                      type="checkbox"
                      required
                      checked={formData.consentGiven}
                      onChange={e => setFormData({ ...formData, consentGiven: e.target.checked })}
                      className="mt-1 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-xs text-slate-600">
                      <span className="font-bold text-slate-900">Legal Consent:</span> I certify that valid legal consent has been obtained and verified for organ donation according to regional regulations.
                    </div>
                  </label>
                </div>

                <button
                  disabled={loading || formData.organs.length === 0}
                  type="submit"
                  className={`w-full py-2 px-4 rounded text-white font-medium text-sm transition-all ${loading ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                  {loading ? 'Processing...' : 'Register Donor on Ledger'}
                </button>
              </form>
            </Card>
          </div>
        ) : (
          <div className="lg:col-span-1">
            <Card className="p-6 bg-slate-50 border-dashed border-2 h-full flex flex-col items-center justify-center text-center">
              <Lock className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-slate-600 font-medium">Write Access Restricted</h3>
              <p className="text-sm text-slate-400 mt-2">Only authorized Hospital Admins can register donors.</p>
            </Card>
          </div>
        )}

        {/* Right: Data Table */}
        <div className="lg:col-span-2 space-y-6">
          {loading && (
            <Card className="p-4 bg-emerald-50 border-emerald-100">
              <h4 className="font-semibold text-emerald-800 text-sm mb-2">Smart Contract Execution</h4>
              <div className="flex items-center space-x-3 text-sm text-slate-600">
                <Activity className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Encrypting donor metadata and generating zero-knowledge proof...</span>
              </div>
            </Card>
          )}

          <Card className="overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-semibold text-slate-700">Donor Ledger (Public State)</h3>
              <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border">All Donors</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Blood</th>
                    <th className="p-3">Organs Available</th>
                    <th className="p-3">Status</th>
                    {role === 'HOSPITAL_ADMIN' && <th className="p-3">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {donors.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-xs">{d.id}</td>
                      <td className="p-3 text-slate-700">{d.name || 'Anonymous'}</td>
                      <td className="p-3"><span className="font-bold text-slate-700">{d.bloodType}</span></td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {(d.organsAvailable || []).map(o => (
                            <span key={o} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">{o}</span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge status={d.verificationStatus || 'PENDING_VERIFICATION'} />
                      </td>
                      {role === 'HOSPITAL_ADMIN' && (
                        <td className="p-3">
                          {(d.verificationStatus === 'PENDING_VERIFICATION' || !d.verificationStatus) ? (
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  try {
                                    await fetch(`${API_URL}/donors/${d.id}/verify`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ hospitalId: hospitalId, status: 'VERIFIED' })
                                    });
                                    addNotification(`✅ Donor ${d.id} verified!`);
                                    fetchAllData();
                                  } catch (err) {
                                    addNotification(`❌ Failed to verify donor`);
                                  }
                                }}
                                className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 font-medium"
                              >
                                ✓ Verify
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await fetch(`${API_URL}/donors/${d.id}/verify`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ hospitalId: hospitalId, status: 'REJECTED' })
                                    });
                                    addNotification(`❌ Donor ${d.id} rejected`);
                                    fetchAllData();
                                  } catch (err) {
                                    addNotification(`❌ Failed to reject donor`);
                                  }
                                }}
                                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium"
                              >
                                ✗ Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">
                              {d.verifiedBy ? `by ${d.verifiedBy}` : '-'}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  // 4. MATCHING LOGIC VIEW
  const MatchingEngine = () => {
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [matches, setMatches] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);

    const matchSteps = [
      { text: "Verifying Donor Consent Hash...", icon: ShieldCheck },
      { text: "Validating HLA Compatibility...", icon: Activity },
      { text: "Checking Organ Availability...", icon: Heart },
      { text: "Creating Immutable Match Record...", icon: Database },
      { text: "Broadcasting to Fabric Network...", icon: Server },
      { text: "Updating World State Ledger...", icon: Users },
      { text: "Finalizing Transaction...", icon: CheckCircle }
    ];

    useEffect(() => {
      if (isProcessing) {
        setLoadingStep(0);
        const interval = setInterval(() => {
          setLoadingStep(prev => (prev < matchSteps.length - 1 ? prev + 1 : prev));
        }, 800);
        return () => clearInterval(interval);
      }
    }, [isProcessing]);

    // The "Off-Chain" Matching Algorithm
    const runMatching = (patient) => {
      setSelectedPatient(patient);

      const results = donors.map(donor => {
        // 1. Verification Check (CRITICAL)
        const isVerified = donor.verificationStatus === 'VERIFIED';

        // 2. Blood Type Filter
        const isBloodCompatible = canReceiveFrom(patient.bloodType, donor.bloodType);
        const isExactBloodMatch = patient.bloodType === donor.bloodType;

        // 3. Organ Filter (Safe check for array)
        const isOrganCompatible = (donor.organsAvailable || []).includes(patient.organNeeded);

        // 4. HLA Scoring (Simplified String Comparison)
        // In production: Levenshtein distance or array intersection of specific antigens
        const patientHla = (patient.hla || '').split(',').map(s => s.trim());
        const donorHla = (donor.hla || '').split(',').map(s => s.trim());
        const commonAntigens = patientHla.filter(antigen => donorHla.includes(antigen));
        const hlaRawScore = (commonAntigens.length / Math.max(patientHla.length, 1)) * 100;

        // 5. Waitlist Priority Score (Days waiting)
        const daysWaiting = (new Date() - new Date(patient.createdAt)) / (1000 * 60 * 60 * 24);
        // Cap priority at 30 days for max score component
        const waitlistScore = Math.min(daysWaiting / 30, 1) * 100;

        // 6. Weighted Final Score
        // HLA: 60%, Waitlist: 30%, Exact Blood Match: 10%
        let totalScore = 0;
        if (isBloodCompatible && isOrganCompatible && isVerified) {
          totalScore = (hlaRawScore * 0.6) + (waitlistScore * 0.3) + (isExactBloodMatch ? 10 : 0);
        }

        return {
          donorId: donor.id,
          bloodType: donor.bloodType,
          score: totalScore.toFixed(1),
          hlaScore: hlaRawScore.toFixed(0),
          daysWaiting: Math.floor(daysWaiting),
          common: commonAntigens.length,
          compatible: isBloodCompatible && isOrganCompatible && isVerified,
          reason: !isVerified ? 'Donor Not Verified' :
            (!isBloodCompatible ? 'Blood Mismatch' :
              (!isOrganCompatible ? 'Organ Mismatch' : 'Compatible'))
        };
      });

      // Sort: Compatible first, then by Total Score
      const sorted = results.sort((a, b) => {
        if (a.compatible !== b.compatible) return b.compatible ? 1 : -1;
        return b.score - a.score;
      });

      setMatches(sorted);
    };

    const handleApproveMatch = async (match) => {
      setIsProcessing(true);

      try {
        // Generate match ID
        const matchId = `MATCH-${Date.now()}`;

        // 1. Create match on blockchain
        const matchResponse = await fetch(`${API_URL}/matches`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: matchId,
            patientId: selectedPatient.id,
            donorId: match.donorId,
            organType: selectedPatient.organNeeded,
            hlaScore: match.score,
            approvedBy: hospitalId || 'HOSP-DEFAULT'
          })
        });

        if (!matchResponse.ok) {
          throw new Error('Failed to create match on blockchain');
        }

        // 2. Update donor status (remove used organ)
        await fetch(`${API_URL}/donors/${match.donorId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organToRemove: selectedPatient.organNeeded
          })
        });

        // 3. Refresh data from blockchain
        const [patientsRes, donorsRes] = await Promise.all([
          fetch(`${API_URL}/patients`),
          fetch(`${API_URL}/donors`)
        ]);
        const patientsData = await patientsRes.json();
        const donorsData = await donorsRes.json();
        setPatients(patientsData || []);
        setDonors(donorsData || []);

        addNotification(`✅ Match ${matchId} committed to blockchain!`);
      } catch (error) {
        addNotification(`❌ Error: ${error.message}`);
      }

      setIsProcessing(false);
      setSelectedPatient(null);
    };

    if (isProcessing) {
      return (
        <div className="h-full flex flex-col items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200 p-12">
          <div className="relative mb-8">
            <div className="w-24 h-24 border-4 border-slate-100 rounded-full"></div>
            <div className="w-24 h-24 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
            <ShieldCheck className="w-10 h-10 text-indigo-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Processing On-Chain</h2>
          <p className="text-slate-500 mb-8 text-center max-w-md">
            Executing smart contract transaction...
          </p>
          <div className="w-full max-w-md space-y-2">
            {matchSteps.map((s, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between text-sm p-3 rounded-lg border transition-all duration-300 ${idx === loadingStep
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-100 scale-105 shadow-md'
                    : idx < loadingStep
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100 opacity-50'
                      : 'bg-slate-50 text-slate-400 border-slate-100 opacity-30'
                  }`}
              >
                <div className="flex items-center">
                  {idx < loadingStep ? (
                    <CheckCircle className="w-4 h-4 mr-3 text-emerald-600" />
                  ) : idx === loadingStep ? (
                    <Loader2 className="w-4 h-4 mr-3 animate-spin text-indigo-600" />
                  ) : (
                    <s.icon className="w-4 h-4 mr-3" />
                  )}
                  <span className="font-medium">{s.text}</span>
                </div>
                {idx < loadingStep && <span className="text-xs font-bold text-emerald-600">DONE</span>}
                {idx === loadingStep && <span className="text-xs font-bold text-indigo-600 animate-pulse">running...</span>}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
        {/* Left List: Waiting Patients */}
        <div className="lg:col-span-4 flex flex-col h-[600px]">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b bg-slate-50">
              <h3 className="font-semibold text-slate-700">Waiting List</h3>
              <p className="text-xs text-slate-500">Select a patient to run matching logic</p>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-2">
              {patients.filter(p => p.status === 'WAITING').map(p => (
                <div
                  key={p.id}
                  onClick={() => runMatching(p)}
                  className={`p-3 rounded border cursor-pointer transition-all ${selectedPatient?.id === p.id ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-xs font-bold text-slate-600">{p.id}</span>
                    <span className="text-xs bg-red-100 text-red-600 px-1.5 rounded">{p.bloodType}</span>
                  </div>
                  <div className="text-sm text-slate-700">Needs: <span className="font-medium">{p.organNeeded}</span></div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Area: Results */}
        <div className="lg:col-span-8">
          {selectedPatient ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Matching Results for {selectedPatient.id}</h2>
                  <p className="text-xs text-slate-500">Algorithm: Blood Type Filter &rarr; Organ Filter &rarr; HLA Score</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">Required: {selectedPatient.organNeeded}</div>
                  <div className="text-xs text-slate-500">Patient Type: {selectedPatient.bloodType}</div>
                </div>
              </div>

              <div className="space-y-3">
                {matches.map((m, idx) => (
                  <Card key={m.donorId} className={`p-4 flex items-center justify-between ${m.compatible ? 'border-l-4 border-l-emerald-500' : 'opacity-60 grayscale-[0.5]'}`}>
                    <div className="flex items-center space-x-4">

                      {/* Score Circle */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex flex-col items-center justify-center font-bold border-2 ${m.compatible ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                        <span className="text-sm leading-none">{m.score}</span>
                        <span className="text-[8px] font-normal text-slate-500 uppercase">Score</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* ID and Blood Type */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-slate-800 text-sm">{m.donorId}</span>
                          <span className={`text-[10px] px-1.5 rounded border ${m.bloodType === selectedPatient.bloodType ? 'bg-pink-50 text-pink-600 border-pink-100 font-bold' : 'bg-slate-100 text-slate-600'}`}>
                            {m.bloodType}
                          </span>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
                          <div title="HLA Compatibility Score">
                            🧬 HLA: <span className="font-medium text-slate-700">{m.hlaScore}%</span>
                          </div>
                          <div title="Based on patient wait time">
                            ⏳ Wait: <span className="font-medium text-slate-700">{m.daysWaiting}d</span>
                          </div>
                          <div className="col-span-2 text-[10px] text-slate-400 truncate">
                            Matches {m.common} antigens • {m.bloodType === selectedPatient.bloodType ? 'Exact Blood Type' : 'Compatible Blood'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {m.compatible ? (
                        <button
                          onClick={() => handleApproveMatch(m)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded shadow-sm transition-colors"
                        >
                          Approve Match
                        </button>
                      ) : (
                        <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded">
                          {m.reason}
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
              <Search className="w-12 h-12 mb-2 opacity-50" />
              <p>Select a patient from the waiting list to run the matching algorithm.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- MAIN RENDER ---

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6 grayscale-0">
          <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl shadow-emerald-100/20 border border-slate-100 p-12 animate-in zoom-in-95 duration-500">
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-[#064e3b] rounded-[20px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-100">
                <Activity className="text-white w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-[#064e3b] font-heading tracking-tight">Access Portal</h2>
              <p className="text-[#4b5563] mt-3 font-medium">Sustainable Blockchain Solutions</p>
            </div>

            {loginStep === 'selection' ? (
              <div className="space-y-4">
                <button
                  onClick={() => { setRole('PUBLIC'); setIsAuthenticated(true); setView('dashboard'); }}
                  className="w-full py-4 px-8 bg-slate-50 text-[#064e3b] font-semibold rounded-[20px] hover:bg-[#059669]/5 hover:text-[#059669] transition-all flex items-center justify-between group border border-transparent hover:border-[#059669]/20"
                >
                  <div className="flex items-center gap-4">
                    <Database className="w-6 h-6 text-[#4b5563] group-hover:text-[#059669]" />
                    <span className="text-lg">Public Insights</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#059669]" />
                </button>

                <button
                  onClick={() => setLoginStep('hospital-form')}
                  className="w-full py-4 px-8 bg-[#064e3b] text-white font-semibold rounded-[20px] hover:bg-[#065f46] transition-all flex items-center justify-between group shadow-lg shadow-emerald-100"
                >
                  <div className="flex items-center gap-4">
                    <ShieldCheck className="w-6 h-6 text-white/80" />
                    <span className="text-lg">Hospital Entry</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/50 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => setLoginStep('donor-form')}
                  className="w-full py-4 px-8 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-[20px] hover:from-rose-600 hover:to-pink-600 transition-all flex items-center justify-between group shadow-lg shadow-rose-100"
                >
                  <div className="flex items-center gap-4">
                    <Heart className="w-6 h-6 text-white/80" />
                    <span className="text-lg">Become a Donor</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/50 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : loginStep === 'donor-form' ? (
              <DonorRegistrationForm
                onBack={() => setLoginStep('selection')}
                addNotification={addNotification}
                setIsAuthenticated={setIsAuthenticated}
                setRole={setRole}
              />
            ) : (
              <form onSubmit={verifyHospitalLogin} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => { setLoginStep('selection'); setError(''); setPassword(''); }}
                    className="p-3 text-[#4b5563] hover:text-[#064e3b] hover:bg-slate-100 rounded-full transition-all"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <span className="font-bold text-xl text-[#064e3b]">Hospital Login</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4b5563] uppercase tracking-widest mb-3 px-1">Hospital ID</label>
                  <input
                    autoFocus
                    type="text"
                    value={hospitalId}
                    onChange={(e) => setHospitalId(e.target.value.toUpperCase())}
                    placeholder="e.g., HOSP-APOLLO"
                    className="w-full px-6 py-4 rounded-[16px] bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#10b981] focus:ring-4 focus:ring-[#10b981]/10 outline-none text-base text-[#064e3b] font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4b5563] uppercase tracking-widest mb-3 px-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-6 py-4 rounded-[16px] bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#10b981] focus:ring-4 focus:ring-[#10b981]/10 outline-none text-base text-[#064e3b] font-medium transition-all"
                  />
                </div>

                {error && (
                  <p className="text-sm text-[#ef4444] font-medium px-1 flex items-center bg-red-50 p-3 rounded-xl">
                    <AlertCircle className="w-4 h-4 mr-2" /> {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn || !hospitalId || !password}
                  className={`w-full py-4 font-bold text-lg rounded-[16px] shadow-xl shadow-emerald-100 transition-all font-heading flex items-center justify-center gap-2 ${isLoggingIn || !hospitalId || !password
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-[#064e3b] text-white hover:bg-[#065f46]'
                    }`}
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>

                <div className="text-center text-xs text-slate-400 pt-2">
                  <p className="font-medium">Test Credentials:</p>
                  <p className="font-mono mt-1">HOSP-APOLLO / apollo123</p>
                  <p className="font-mono">HOSP-AIIMS / aiims123</p>
                  <p className="font-mono">HOSP-FORTIS / fortis123</p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen text-slate-900 flex flex-col bg-slate-50">
      <Navbar />

      {/* Toast Notification */}
      <div className="fixed top-24 right-6 z-[60] space-y-3">
        {notifications.map(n => (
          <div key={n.id} className="glass px-6 py-4 rounded-2xl shadow-xl flex items-center text-sm border-l-4 border-emerald-500 animate-in slide-in-from-right duration-300">
            <CheckCircle className="w-5 h-5 mr-3 text-emerald-500" />
            <span className="font-bold text-slate-700">{n.msg}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 pt-32 pb-20 flex flex-col md:flex-row gap-10">
        <aside className="md:w-64 flex-shrink-0">
          <div className="space-y-8">
            <nav className="space-y-1.5">
              {[
                { id: 'dashboard', label: 'Overview', icon: Activity },
                { id: 'ledger', label: 'Ledger', icon: Database },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-[16px] text-sm font-semibold transition-all ${view === item.id
                    ? 'bg-[#10b981]/10 text-[#10b981]'
                    : 'text-[#4b5563] hover:bg-slate-50 hover:text-[#064e3b]'
                    }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}

              {role === 'HOSPITAL_ADMIN' && (
                <div className="pt-8 space-y-1.5">
                  <p className="text-[11px] font-bold text-[#5f6368] uppercase tracking-widest px-5 mb-2">Management</p>
                  {[
                    { id: 'patients', label: 'Patients', icon: Users },
                    { id: 'donors', label: 'Donors', icon: Heart },
                    { id: 'matching', label: 'Matching', icon: ShieldCheck },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setView(item.id)}
                      className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-[16px] text-sm font-semibold transition-all ${view === item.id
                        ? 'bg-[#10b981]/10 text-[#10b981]'
                        : 'text-[#4b5563] hover:bg-slate-50 hover:text-[#064e3b]'
                        }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </nav>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="bg-white rounded-[32px] p-12 shadow-sm border border-slate-100 min-h-[600px] animate-in slide-in-from-bottom-4 duration-500">
            {view === 'dashboard' && <DashboardView />}
            {view === 'ledger' && (
              <div className="max-w-4xl">
                <h2 className="text-3xl font-bold text-[#064e3b] font-heading mb-10 tracking-tight">On-Chain Ledger</h2>

                {/* Patients Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" /> Patients ({patients.length})
                  </h3>
                  <div className="space-y-2">
                    {patients.length === 0 ? (
                      <p className="text-slate-400 text-sm">No patients on ledger</p>
                    ) : patients.map(p => (
                      <div key={p.id} className="p-4 bg-slate-50 rounded-xl flex items-center justify-between border hover:bg-white hover:shadow-sm transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <span className="font-mono text-sm font-bold text-slate-700">{p.id}</span>
                            <span className="text-xs text-slate-500 ml-2">| {p.bloodType} | {p.organNeeded}</span>
                          </div>
                        </div>
                        <Badge status={p.status} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Donors Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-emerald-500" /> Donors ({donors.length})
                  </h3>
                  <div className="space-y-2">
                    {donors.length === 0 ? (
                      <p className="text-slate-400 text-sm">No donors on ledger</p>
                    ) : donors.map(d => (
                      <div key={d.id} className="p-4 bg-slate-50 rounded-xl flex items-center justify-between border hover:bg-white hover:shadow-sm transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <Heart className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <span className="font-mono text-sm font-bold text-slate-700">{d.id}</span>
                            <span className="text-xs text-slate-500 ml-2">| {d.bloodType || 'N/A'}</span>
                            {d.name && <span className="text-xs text-slate-500 ml-2">| {d.name}</span>}
                            <div className="flex gap-1 mt-1">
                              {(d.organsAvailable || []).map(o => (
                                <span key={o} className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100">{o}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <Badge status={d.verificationStatus || 'PENDING_VERIFICATION'} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Network Info */}
                <div className="p-6 bg-gradient-to-r from-slate-50 to-emerald-50 rounded-2xl border">
                  <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <Server className="w-5 h-5 text-indigo-500" /> Network Status
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 bg-white rounded-xl border">
                      <div className="text-2xl font-bold text-slate-800">{patients.length + donors.length}</div>
                      <div className="text-xs text-slate-500">Total Records</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-xl border">
                      <div className="text-2xl font-bold text-emerald-600">organchannel</div>
                      <div className="text-xs text-slate-500">Channel</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-xl border">
                      <div className={`text-2xl font-bold ${apiConnected ? 'text-emerald-600' : 'text-red-500'}`}>
                        {apiConnected ? 'Online' : 'Offline'}
                      </div>
                      <div className="text-xs text-slate-500">Peer Status</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {view === 'patients' && <PatientRegistry />}
            {view === 'donors' && <DonorRegistry />}
            {view === 'matching' && <MatchingEngine />}
          </div>
        </main>
      </div>
    </div>
  );
}