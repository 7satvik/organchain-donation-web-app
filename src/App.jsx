import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldCheck,
  Database,
  Users,
  CheckCircle,
  AlertCircle,
  Server,
  LogOut,
  ChevronRight,
  ArrowLeft,
  Heart,
  Loader2
} from 'lucide-react';

import { Card, Badge } from './components/UI';
import PatientRegistry from './components/PatientRegistry';
import DonorRegistry from './components/DonorRegistry';
import MatchingEngine from './components/MatchingEngine';
import DonorRegistrationForm from './components/DonorRegistrationForm';
import Dashboard from './components/Dashboard';
import Ledger from './components/Ledger';

import { api, canReceiveFrom } from './api';

// Utilities removed - moved to api.js



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
      const [patientsData, donorsData, healthData] = await Promise.all([
        api.getPatients(),
        api.getDonors(),
        api.getHealth().catch(() => ({ connected: false }))
      ]);

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
      const passwordHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
        .then(hash => Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join(''));

      const data = await api.login(hospitalId, passwordHash);

      if (data.success) {
        setRole('HOSPITAL_ADMIN');
        setIsAuthenticated(true);
        setHospitalName(data.hospital.name);
        setError('');
        addNotification(`✅ Welcome, ${data.hospital.name}!`);
      }
    } catch (error) {
      setError(error.message || 'Invalid credentials');
    }

    setIsLoggingIn(false);
  };

  const Navbar = () => (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between glass rounded-[24px] px-8 py-3">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
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
                    placeholder="e.g., ADMIN-HOSP"
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
                  <p className="font-medium">Admin Credentials:</p>
                  <p className="font-mono mt-1">ADMIN-HOSP / admin123</p>
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
            {view === 'dashboard' && <Dashboard patients={patients} donors={donors} />}
            {view === 'ledger' && (
              <Ledger patients={patients} donors={donors} apiConnected={apiConnected} />
            )}
            {view === 'patients' && (
              <PatientRegistry
                role={role}
                hospitalId={hospitalId}
                patients={patients}
                setPatients={setPatients}
                addNotification={addNotification}
              />
            )}
            {view === 'donors' && (
              <DonorRegistry
                role={role}
                hospitalId={hospitalId}
                donors={donors}
                setDonors={setDonors}
                addNotification={addNotification}
                fetchAllData={fetchAllData}
              />
            )}
            {view === 'matching' && (
              <MatchingEngine
                donors={donors}
                patients={patients}
                setPatients={setPatients}
                setDonors={setDonors}
                hospitalId={hospitalId}
                addNotification={addNotification}
                canReceiveFrom={canReceiveFrom}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}