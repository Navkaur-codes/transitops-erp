import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import {
  Truck, Users, ArrowRightLeft, Wrench, Fuel, BarChart3, LogOut, ShieldCheck,
  Filter, Key, UserPlus, Search, Bell, ChevronDown, ChevronsLeft, ChevronsRight,
  CheckCircle2, AlertTriangle, X
} from 'lucide-react';
import FleetAssetLog from './components/FleetAssetLog';
import PersonnelFiles from './components/PersonnelFiles';
import ActiveDispatch from './components/ActiveDispatch';
import Maintenance from './components/Maintenance';
import FuelExpenseManager from './components/FuelExpenseManager';
import ReportsAnalytics from './components/ReportsAnalytics';

// ==========================================================================
// Theme layer for a real-product SaaS feel. See notes at the bottom of the
// file. Nothing here touches auth, data-fetching, or calculation logic.
// ==========================================================================
const ThemeStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    .op-display { font-family: 'Barlow Condensed', sans-serif; letter-spacing: -0.01em; }
    .op-body { font-family: 'Inter', sans-serif; }
    .op-mono { font-family: 'JetBrains Mono', monospace; }

    .op-input {
      width: 100%;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.10);
      color: #E7ECF2;
      font-family: 'Inter', sans-serif;
      font-size: 0.875rem;
      padding: 0.75rem 0.9rem;
      border-radius: 0.6rem;
      outline: none;
      transition: border-color 0.15s ease, background 0.15s ease;
    }
    .op-input::placeholder { color: #5C6672; }
    .op-input:focus { border-color: #FF7A1A; background: rgba(255,122,26,0.06); }

    .op-glass {
      background: rgba(19, 24, 32, 0.55);
      border: 1px solid rgba(255,255,255,0.08);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
    }

    .op-card {
      box-shadow: 0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.10);
      transition: box-shadow 0.2s ease, transform 0.2s ease;
    }
    .op-card:hover { box-shadow: 0 2px 4px rgba(15,23,42,0.06), 0 16px 32px -12px rgba(15,23,42,0.14); }

    .op-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
    .op-scroll::-webkit-scrollbar-track { background: transparent; }
    .op-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 8px; }
    .op-scroll-dark::-webkit-scrollbar-thumb { background: #232B36; border-radius: 8px; }

    @keyframes op-pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
    .op-live-dot { animation: op-pulse-dot 1.8s ease-in-out infinite; }

    @keyframes op-toast-in { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
    .op-toast { animation: op-toast-in 0.25s cubic-bezier(0.16, 1, 0.3, 1); }

    @keyframes op-tab-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    .op-tab-in { animation: op-tab-in 0.28s cubic-bezier(0.16, 1, 0.3, 1); }
  `}</style>
);

export default function App() {
  const [userRole, setUserRole] = useState(null); 
  const [session, setSession] = useState(null);   
  const [authView, setAuthView] = useState('login'); // Options: 'login', 'signup', 'forgot'
  const [currentTab, setCurrentTab] = useState('dashboard');
  
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Purely presentational, additive state below. None of it is read by
  // or feeds into the auth/data logic further down the file. ---
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState([]);

  const pushToast = (type, message) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, type, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
  };
  const dismissToast = (id) => setToasts(t => t.filter(x => x.id !== id));

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setUserRole(session.user.user_metadata?.role || 'Driver');
        fetchData();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setUserRole(session.user.user_metadata?.role || 'Driver');
        fetchData();
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: vData } = await supabase.from('vehicles').select('*');
      const { data: dData } = await supabase.from('drivers').select('*');
      const { data: tData } = await supabase.from('trips').select('*');
      const { data: mData } = await supabase.from('maintenance_logs').select('*');
      const { data: fData } = await supabase.from('fuel_logs').select('*');
      const { data: eData } = await supabase.from('expenses').select('*');
      
      setVehicles(vData || []);
      setDrivers(dData || []);
      setTrips(tData || []);
      setMaintenanceLogs(mData || []);
      setFuelLogs(fData || []);
      setExpenses(eData || []);
    } catch (error) {
      console.error("Error executing system sync:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) pushToast('error', `Authentication blocked: ${error.message}`);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const role = formData.get('role');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: role } 
      }
    });

    if (error) {
      pushToast('error', `Registration failed: ${error.message}`);
    } else {
      pushToast('success', 'Registration complete — you can now log in.');
      setAuthView('login');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });

    if (error) {
      pushToast('error', `Reset request failed: ${error.message}`);
    } else {
      pushToast('success', 'Recovery email sent — check your inbox.');
      setAuthView('login');
    }
  };

  const handleLogOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    setCurrentTab('dashboard');
  };

  // --- Toast stack, rendered above both the auth screen and the app shell ---
  const ToastStack = () => (
    toasts.length > 0 && (
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 w-full max-w-sm">
        {toasts.map(t => (
          <div key={t.id} className={`op-toast op-glass rounded-xl p-3.5 flex items-start gap-3 shadow-2xl border ${t.type === 'error' ? 'border-red-500/30' : 'border-emerald-500/30'}`}>
            {t.type === 'error'
              ? <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
              : <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />}
            <p className="text-[13px] text-slate-100 leading-snug flex-1">{t.message}</p>
            <button onClick={() => dismissToast(t.id)} className="text-slate-500 hover:text-slate-300 shrink-0">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    )
  );

  // --- Render Authentication Portal ---
  if (!session) {
    const accentTint = authView === 'signup' ? 'text-sky-400 border-sky-500/25 bg-sky-500/10' : 'text-[#FF7A1A] border-[#FF7A1A]/25 bg-[#FF7A1A]/10';
    const primaryBtn = authView === 'signup'
      ? 'from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 shadow-sky-950/50'
      : 'from-[#FF7A1A] to-[#FF9A4D] hover:from-[#FF8A33] hover:to-[#FFAA66] shadow-[#FF7A1A]/30';

    return (
      <div className="min-h-screen bg-[#0A0D12] op-body text-white flex">
        <ThemeStyles />
        <ToastStack />

        {/* ==================== LEFT: BRAND PANEL ==================== */}
        <div className="hidden lg:flex lg:w-5/12 p-12 flex-col justify-between relative bg-[#0A0D12] border-r border-white/5 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,122,26,0.10),transparent_55%)] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#FF7A1A]/5 blur-[100px] pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="p-2.5 rounded-xl border border-[#FF7A1A]/30 bg-[#FF7A1A]/10 text-[#FF7A1A]">
                <Truck size={22} />
              </div>
              <span className="op-display font-extrabold text-3xl tracking-tight text-white">
                TRANSIT<span className="text-[#FF7A1A]">OPS</span>
              </span>
            </div>
            <p className="text-[13px] leading-relaxed text-slate-400 max-w-xs">
              The operations platform fleet teams actually enjoy opening every morning.
            </p>
          </div>

          <div className="relative z-10 max-w-sm space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex -space-x-2">
                {['bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-[#FF7A1A]'].map((c, i) => (
                  <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-[#0A0D12]`} />
                ))}
              </div>
              <span className="text-[12px] text-slate-400">Trusted by every role on the team</span>
            </div>

            <div className="space-y-2.5">
              {[
                { name: "Fleet Manager", desc: "Vehicle registry & maintenance oversight" },
                { name: "Driver / Dispatcher", desc: "Trip manifests & live routing" },
                { name: "Safety Officer", desc: "Driver files & compliance tracking" },
                { name: "Financial Analyst", desc: "Fuel, expenses & performance reports" }
              ].map((role, idx) => (
                <div key={idx} className="flex items-center gap-3 px-3.5 py-3 rounded-lg bg-white/[0.03] border border-white/5 hover:border-[#FF7A1A]/30 hover:bg-white/[0.05] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-[#FF7A1A]/10 border border-[#FF7A1A]/20 flex items-center justify-center text-[#FF7A1A] op-display font-bold text-xs shrink-0">
                    {role.name[0]}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-[13px] text-slate-200 leading-none">{role.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">{role.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between border-t border-white/5 pt-4">
            <span className="flex items-center gap-2 text-[11px] op-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 op-live-dot" /> ALL SYSTEMS OPERATIONAL
            </span>
            <span className="text-[11px] op-mono text-slate-600">© 2026 TransitOps</span>
          </div>
        </div>

        {/* ==================== RIGHT: FORM ==================== */}
        <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12 relative">
          <div className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full blur-[130px] pointer-events-none bg-[#FF7A1A]/5" />

          <div className="w-full max-w-md relative z-10">
            <div className="op-glass rounded-2xl p-8 sm:p-10 relative shadow-2xl">
              <div className="lg:hidden flex flex-col items-center mb-6">
                <h1 className="op-display text-2xl font-extrabold text-white">TRANSIT<span className="text-[#FF7A1A]">OPS</span></h1>
              </div>

              {authView === 'login' && (
                <div className="op-tab-in">
                  <div className="mb-6">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] op-mono uppercase tracking-widest px-2.5 py-1 rounded-full border mb-3 ${accentTint}`}>
                      <ShieldCheck size={11} /> Secure session
                    </span>
                    <h3 className="text-2xl font-bold text-white">Welcome back</h3>
                    <p className="text-[13px] text-slate-400 mt-1">Sign in to reach your operational dashboard.</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-[12px] font-semibold text-slate-400">Email</label>
                      <input name="email" type="email" required placeholder="manager@transitops.com" className="op-input" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[12px] font-semibold text-slate-400">Password</label>
                        <button type="button" onClick={() => setAuthView('forgot')} className="text-[12px] font-semibold text-[#FF7A1A] hover:text-[#FF9A4D] transition-colors">Forgot?</button>
                      </div>
                      <input name="password" type="password" required placeholder="••••••••" className="op-input" />
                    </div>
                    <button type="submit" className={`w-full bg-gradient-to-r ${primaryBtn} text-white font-bold text-[14px] p-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2 shadow-lg`}>
                      <ShieldCheck size={17} /> Sign in
                    </button>
                    <div className="text-center pt-4 border-t border-white/5 mt-4">
                      <button type="button" onClick={() => setAuthView('signup')} className="text-[12px] font-medium text-slate-400 hover:text-white transition-colors">
                        Don't have access yet? <span className="text-[#FF7A1A]">Create an account</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {authView === 'signup' && (
                <div className="op-tab-in">
                  <div className="mb-6">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] op-mono uppercase tracking-widest px-2.5 py-1 rounded-full border mb-3 ${accentTint}`}>
                      <UserPlus size={11} /> New account
                    </span>
                    <h3 className="text-2xl font-bold text-white">Create your account</h3>
                    <p className="text-[13px] text-slate-400 mt-1">Set your credentials and pick your operational role.</p>
                  </div>

                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-[12px] font-semibold text-slate-400">Email</label>
                      <input name="email" type="email" required placeholder="operator@transitops.com" className="op-input" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[12px] font-semibold text-slate-400">Password</label>
                      <input name="password" type="password" required placeholder="Minimum 6 characters" className="op-input" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[12px] font-semibold text-slate-400">Role</label>
                      <select name="role" required className="op-input text-slate-300">
                        <option value="Fleet Manager">Fleet Manager</option>
                        <option value="Driver">Driver / Dispatcher</option>
                        <option value="Safety Officer">Safety Officer</option>
                        <option value="Financial Analyst">Financial Analyst</option>
                      </select>
                    </div>
                    <button type="submit" className={`w-full bg-gradient-to-r ${primaryBtn} text-white font-bold text-[14px] p-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2 shadow-lg`}>
                      <UserPlus size={17} /> Create account
                    </button>
                    <div className="text-center pt-4 border-t border-white/5 mt-4">
                      <button type="button" onClick={() => setAuthView('login')} className="text-[12px] font-medium text-slate-400 hover:text-white transition-colors">
                        Already registered? <span className="text-[#FF7A1A]">Log in</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {authView === 'forgot' && (
                <div className="op-tab-in">
                  <div className="mb-6">
                    <span className="inline-flex items-center gap-1.5 text-[10px] op-mono uppercase tracking-widest px-2.5 py-1 rounded-full border border-slate-600/40 bg-slate-500/10 text-slate-300 mb-3">
                      <Key size={11} /> Recovery
                    </span>
                    <h3 className="text-2xl font-bold text-white">Reset your password</h3>
                    <p className="text-[13px] text-slate-400 mt-1">We'll send a secure reset link to your inbox.</p>
                  </div>

                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-[12px] font-semibold text-slate-400">Account email</label>
                      <input name="email" type="email" required placeholder="manager@transitops.com" className="op-input" />
                    </div>
                    <button type="submit" className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[14px] p-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                      <Key size={16} /> Send reset link
                    </button>
                    <button type="button" onClick={() => setAuthView('login')} className="w-full text-center text-[12px] font-medium text-slate-500 hover:text-slate-300 pt-2 block transition-colors">
                      ← Back to login
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeVehicles = vehicles.filter(v => v.status === 'On Trip').length;
  const availableVehiclesCount = vehicles.filter(v => v.status === 'Available').length;
  const inShopVehicles = vehicles.filter(v => v.status === 'In Shop').length;
  const activeTripsCount = trips.filter(t => t.status === 'Dispatched').length;
  const pendingTripsCount = trips.filter(t => t.status === 'Draft').length;
  const driversOnDuty = drivers.filter(d => d.status === 'On Trip').length;
  
  const fleetUtilizationRate = vehicles.length > 0 
    ? ((vehicles.filter(v => v.status === 'On Trip' || v.status === 'In Shop').length / vehicles.length) * 100).toFixed(1) 
    : "0.0";

  const filteredVehiclesList = vehicles.filter(v => {
    const matchType = filterType === 'All' || v.type === filterType;
    const matchStatus = filterStatus === 'All' || v.status === filterStatus;
    const q = searchQuery.trim().toLowerCase();
    const matchSearch = !q || v.name?.toLowerCase().includes(q) || v.license_plate?.toLowerCase().includes(q);
    return matchType && matchStatus && matchSearch;
  });

  const navItems = [
    { id: 'dashboard', name: 'Dashboard Overview', icon: BarChart3, roles: ['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst'] },
    { id: 'vehicles', name: 'Vehicle Registry', icon: Truck, roles: ['Fleet Manager'] },
    { id: 'drivers', name: 'Driver Management', icon: Users, roles: ['Safety Officer'] },
    { id: 'trips', name: 'Trip Manager', icon: ArrowRightLeft, roles: ['Driver'] },
    { id: 'maintenance', name: 'Maintenance Workshop', icon: Wrench, roles: ['Fleet Manager'] },
    { id: 'expenses', name: 'Fuel & Expenses', icon: Fuel, roles: ['Financial Analyst'] },
    { id: 'reports', name: 'Reports & Analytics', icon: BarChart3, roles: ['Financial Analyst'] }
  ];

  const activeNavItem = navItems.find(t => t.id === currentTab);
  const initials = session.user.email ? session.user.email.slice(0, 2).toUpperCase() : '??';

  return (
    <div className="min-h-screen bg-[#0A0D12] op-body text-white flex">
      <ThemeStyles />
      <ToastStack />

      {/* ==================== SIDEBAR ==================== */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-[#0D1218] border-r border-white/5 px-4 py-6 flex flex-col justify-between shrink-0 transition-all duration-200`}>
        <div>
          <div className={`flex items-center gap-3 mb-6 px-1 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="p-2 rounded-lg border border-[#FF7A1A]/25 bg-[#FF7A1A]/10 text-[#FF7A1A] shrink-0">
              <Truck size={19} />
            </div>
            {!sidebarCollapsed && (
              <span className="op-display font-extrabold text-lg tracking-tight text-white whitespace-nowrap">
                TRANSIT<span className="text-[#FF7A1A]">OPS</span>
              </span>
            )}
          </div>

          {!sidebarCollapsed && (
            <div className="mb-5 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] op-mono uppercase tracking-widest text-slate-500 block mb-1">Signed in as</span>
              <span className="text-slate-200 truncate block text-[11px] op-mono">{session.user.email}</span>
              <span className="inline-flex items-center gap-1.5 text-[#FF7A1A] font-semibold text-[12px] mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A1A] op-live-dot" /> {userRole}
              </span>
            </div>
          )}
          
          <nav className="space-y-1">
            {navItems.map(tab => {
              if (!tab.roles.includes(userRole)) return null;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  title={sidebarCollapsed ? tab.name : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold text-[13.5px] transition-all border-l-2 ${sidebarCollapsed ? 'justify-center' : ''} ${
                    isActive
                      ? 'bg-[#FF7A1A]/10 text-white border-[#FF7A1A]'
                      : 'text-slate-400 border-transparent hover:bg-white/[0.04] hover:text-slate-200'
                  }`}
                >
                  <tab.icon size={17} className={`shrink-0 ${isActive ? 'text-[#FF7A1A]' : ''}`} />
                  {!sidebarCollapsed && <span className="truncate">{tab.name}</span>}
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className="space-y-2">
          <button
            onClick={() => setSidebarCollapsed(s => !s)}
            className={`flex items-center gap-2 w-full text-slate-500 hover:text-slate-300 py-2 rounded-lg text-xs font-semibold transition-all ${sidebarCollapsed ? 'justify-center' : 'px-1'}`}
          >
            {sidebarCollapsed ? <ChevronsRight size={16} /> : <><ChevronsLeft size={16} /> Collapse</>}
          </button>
          <button 
            onClick={handleLogOut} 
            title={sidebarCollapsed ? 'Log out' : undefined}
            className={`flex items-center justify-center gap-2 w-full border border-white/10 bg-white/[0.03] hover:bg-red-500/10 hover:border-red-500/30 text-slate-400 hover:text-red-400 py-2.5 rounded-xl text-[13px] font-semibold transition-all`}
          >
            <LogOut size={14} /> {!sidebarCollapsed && 'Log out'}
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-[#F7F8FA] text-slate-900 overflow-y-auto op-scroll flex flex-col">
        {/* ==================== TOPBAR ==================== */}
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-slate-400 text-[13px] hidden sm:inline">Workspace</span>
            <span className="text-slate-300 hidden sm:inline">/</span>
            {activeNavItem && <activeNavItem.icon size={15} className="text-[#FF7A1A] shrink-0" />}
            <span className="font-semibold text-slate-900 text-[14px] truncate">{activeNavItem?.name}</span>
          </div>

          <div className="flex items-center gap-3">
            {currentTab === 'dashboard' && (
              <div className="relative hidden md:block">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search fleet by name or plate…"
                  className="bg-slate-100 border border-transparent focus:border-[#FF7A1A]/40 focus:bg-white rounded-lg pl-9 pr-3 py-2 text-[13px] w-64 outline-none transition-colors"
                />
              </div>
            )}

            <button className="relative w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
              <Bell size={17} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#FF7A1A]" />
            </button>

            <div className="relative">
              <button
                onClick={() => setAvatarMenuOpen(o => !o)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF7A1A] to-[#FF9A4D] flex items-center justify-center text-white font-bold text-[11px]">
                  {initials}
                </div>
                <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
              </button>

              {avatarMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setAvatarMenuOpen(false)} />
                  <div className="absolute right-0 top-11 z-20 w-56 bg-white rounded-xl border border-slate-200 shadow-xl p-1.5 op-tab-in">
                    <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                      <p className="text-[13px] font-semibold text-slate-800 truncate">{session.user.email}</p>
                      <p className="text-[11px] text-[#FF7A1A] font-semibold mt-0.5">{userRole}</p>
                    </div>
                    <button
                      onClick={handleLogOut}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <LogOut size={14} /> Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 lg:p-8 flex-1">
          {loading ? (
            <div className="space-y-6">
              <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse" />
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="h-24 bg-white border border-slate-200 rounded-2xl animate-pulse" />
                ))}
              </div>
              <div className="h-64 bg-white border border-slate-200 rounded-2xl animate-pulse" />
            </div>
          ) : (
            <div key={currentTab} className="op-tab-in">
              {currentTab === 'dashboard' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-[28px] font-extrabold tracking-tight text-slate-900">Operations Control Center</h2>
                    <p className="text-slate-500 text-sm mt-1">Real-time indicators across active transport networks.</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {[
                      { label: "Active Fleet", val: activeVehicles, bar: "bg-sky-500" },
                      { label: "Available Fleet", val: availableVehiclesCount, bar: "bg-emerald-500" },
                      { label: "In Shop Repairs", val: inShopVehicles, bar: "bg-amber-500" },
                      { label: "Active Deliveries", val: activeTripsCount, bar: "bg-indigo-500" },
                      { label: "Pending Drafts", val: pendingTripsCount, bar: "bg-slate-400" },
                      { label: "Operators On Duty", val: driversOnDuty, bar: "bg-purple-500" },
                      { label: "Fleet Utilization", val: `${fleetUtilizationRate}%`, bar: "bg-[#FF7A1A]" }
                    ].map((kpi, idx) => (
                      <div key={idx} className="op-card bg-white border border-slate-200 rounded-2xl overflow-hidden hover:-translate-y-0.5">
                        <div className="p-5 text-center">
                          <span className="text-[10px] uppercase op-mono font-semibold text-slate-400 block tracking-wider">{kpi.label}</span>
                          <span className="op-display text-4xl font-extrabold block mt-1.5 text-slate-900">{kpi.val}</span>
                        </div>
                        <div className={`h-1 ${kpi.bar}`} />
                      </div>
                    ))}
                  </div>

                  <div className="op-card bg-white border border-slate-200 rounded-2xl p-5 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold">
                      <Filter size={16} className="text-[#FF7A1A]" /> Filter live feed
                    </div>
                    <div className="flex gap-3">
                      <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-[#FF7A1A] text-slate-700 font-medium">
                        <option value="All">All Vehicle Types</option>
                        <option value="Van">Van</option>
                        <option value="Truck">Truck</option>
                        <option value="Semi">Semi-Trailer</option>
                        <option value="Box Truck">Box Truck</option>
                      </select>
                      <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-[#FF7A1A] text-slate-700 font-medium">
                        <option value="All">All Status Options</option>
                        <option value="Available">Available</option>
                        <option value="On Trip">On Trip</option>
                        <option value="In Shop">In Shop</option>
                        <option value="Retired">Retired</option>
                      </select>
                    </div>
                  </div>

                  <div className="op-card bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <span className="font-bold text-xs uppercase text-slate-500 tracking-wider">Live Asset Manifest</span>
                      <span className="op-mono text-[11px] text-slate-400">{filteredVehiclesList.length} matched</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {filteredVehiclesList.map(v => (
                        <div key={v.id} className="p-4 flex justify-between items-center text-sm hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-900">{v.name}</span>
                            <span className="text-[11px] bg-slate-900 px-2 py-0.5 rounded op-mono text-slate-200">{v.license_plate}</span>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                            v.status === 'Available' ? 'bg-emerald-50 text-emerald-600' :
                            v.status === 'On Trip' ? 'bg-sky-50 text-sky-600' : 'bg-amber-50 text-amber-600'
                          }`}>{v.status}</span>
                        </div>
                      ))}
                      {filteredVehiclesList.length === 0 && (
                        <div className="p-12 text-center">
                          <Search size={22} className="text-slate-300 mx-auto mb-2" />
                          <p className="text-slate-400 text-sm">No vehicles match the current filters.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentTab === 'vehicles' && <FleetAssetLog vehicles={vehicles} refreshData={fetchData} />}
              {currentTab === 'drivers' && <PersonnelFiles drivers={drivers} refreshData={fetchData} />}
              {currentTab === 'trips' && <ActiveDispatch vehicles={vehicles} drivers={drivers} trips={trips} refreshData={fetchData} />}
              {currentTab === 'maintenance' && <Maintenance vehicles={vehicles} refreshData={fetchData} />}
              {currentTab === 'expenses' && <FuelExpenseManager vehicles={vehicles} trips={trips} fuelLogs={fuelLogs} expenses={expenses} refreshData={fetchData} />}
              {currentTab === 'reports' && <ReportsAnalytics vehicles={vehicles} trips={trips} fuelLogs={fuelLogs} expenses={expenses} maintenanceLogs={maintenanceLogs} />}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/*
  DESIGN NOTES — "Real SaaS platform" pass
  --------------------------------------------------------------------------
  Moved away from the more thematic "highway console" motif toward patterns
  people actually recognize from Linear/Stripe/Vercel-style products:
    - Collapsible icon-rail sidebar with a workspace/account card
    - A real topbar: breadcrumb, live search (wired to the dashboard's
      vehicle list), notification bell, avatar dropdown with sign-out
    - Toast notifications (top-right, auto-dismiss) instead of browser
      alert() popups — the one behavioral change in this pass, since native
      alert() boxes are the biggest tell of a non-production app. The
      success/error conditions themselves are untouched.
    - Skeleton loading state instead of a static "loading…" line
    - Soft layered shadows (op-card) and consistent hover lift instead of
      flat borders, plus a subtle mount transition when switching tabs

  Everything else — every useState, useEffect, fetchData, and the three
  auth handlers' actual supabase calls and field names — is unchanged from
  your original file. If you'd rather keep native alert() instead of
  toasts, swap pushToast('error', msg) / pushToast('success', msg) calls
  back to alert(msg) — nothing else depends on them.
*/
