import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Truck, Users, ArrowRightLeft, Wrench, Fuel, BarChart3, LogOut, ShieldCheck, Filter, Key, UserPlus } from 'lucide-react';
import FleetAssetLog from './components/FleetAssetLog';
import PersonnelFiles from './components/PersonnelFiles';
import ActiveDispatch from './components/ActiveDispatch';
import Maintenance from './components/Maintenance';
import FuelExpenseManager from './components/FuelExpenseManager';
import ReportsAnalytics from './components/ReportsAnalytics';

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
    if (error) alert(`🚨 Authentication Blocked: ${error.message}`);
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
      alert(`🚨 Registration Failed: ${error.message}`);
    } else {
      alert("🎉 Registration Complete! You can now log into the operations control platform.");
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
      alert(`🚨 Reset Request Failed: ${error.message}`);
    } else {
      alert("📧 Recovery Protocol Authorized! Check your email for a secure password reset link.");
      setAuthView('login');
    }
  };

  const handleLogOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    setCurrentTab('dashboard');
  };

  // --- Render Enhanced High-Tech Authentication Terminal ---
  if (!session) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Decorative Energy Rings */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10 transition-all duration-500 animate-in fade-in zoom-in-95 duration-300">
          <div className="glass-panel p-8 border-slate-800/80 relative overflow-hidden bg-slate-900/30">
            {/* Top Glowing Trim Line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-80" />

            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 text-emerald-400 mb-4 shadow-lg shadow-emerald-950/40">
                <Truck size={28} className="animate-pulse" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                TransitOps
              </h1>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-400/70 mt-1.5 font-mono">
                System Command Terminal
              </p>
            </div>

            {authView === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <input name="email" type="email" required placeholder="name@transitops.com" className="cyber-input" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                    <button type="button" onClick={() => setAuthView('forgot')} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors">Forgot Access Key?</button>
                  </div>
                  <input name="password" type="password" required placeholder="••••••••" className="cyber-input" />
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold p-3.5 rounded-xl text-sm transition-all duration-200 active:scale-[0.98] shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 mt-2">
                  <ShieldCheck size={18} /> Authenticate Session
                </button>
                <div className="text-center pt-3 border-t border-slate-800/60 mt-4">
                  <button type="button" onClick={() => setAuthView('signup')} className="text-xs font-bold text-slate-400 hover:text-white transition-colors underline decoration-slate-700 hover:decoration-slate-400 underline-offset-4">
                    Register New Profile Context
                  </button>
                </div>
              </form>
            )}

            {authView === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <input name="email" type="email" required placeholder="operator@transitops.com" className="cyber-input" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Choose Secure Password</label>
                  <input name="password" type="password" required placeholder="Minimum 6 characters" className="cyber-input" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Operational Role (RBAC)</label>
                  <select name="role" required className="cyber-input text-slate-300">
                    <option value="Fleet Manager">Fleet Manager</option>
                    <option value="Driver">Driver / Operations</option>
                    <option value="Safety Officer">Safety Officer</option>
                    <option value="Financial Analyst">Financial Analyst</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-extrabold p-3.5 rounded-xl text-sm transition-all duration-200 active:scale-[0.98] shadow-lg shadow-indigo-950/50 flex items-center justify-center gap-2 mt-2">
                  <UserPlus size={18} /> Deploy Account Node
                </button>
                <div className="text-center pt-3 border-t border-slate-800/60 mt-4">
                  <button type="button" onClick={() => setAuthView('login')} className="text-xs font-bold text-slate-400 hover:text-white transition-colors underline decoration-slate-700 hover:decoration-slate-400 underline-offset-4">
                    Already initialized? Log In
                  </button>
                </div>
              </form>
            )}

            {authView === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <p className="text-xs text-slate-400 text-center leading-relaxed">Provide your access email coordinate. The cloud will dispatch an encrypted reset link.</p>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <input name="email" type="email" required placeholder="manager@transitops.com" className="cyber-input" />
                </div>
                <button type="submit" className="w-full bg-slate-800 hover:bg-slate-750 text-white font-extrabold p-3.5 rounded-xl text-sm transition-all duration-200 shadow-md flex items-center justify-center gap-2">
                  <Key size={16} /> Request Recovery Signal
                </button>
                <button type="button" onClick={() => setAuthView('login')} className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-300 pt-2 block transition-colors">
                  Cancel and Return
                </button>
              </form>
            )}
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
    return matchType && matchStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-6 text-emerald-500">
            <Truck size={28} />
            <span className="font-extrabold text-xl tracking-tight text-white">TransitOps</span>
          </div>
          <div className="mb-6 px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-lg text-xs">
            <span className="text-slate-500 block font-medium">Active Credentials:</span>
            <span className="text-slate-300 truncate block text-[11px] font-mono">{session.user.email}</span>
            <span className="text-emerald-400 font-bold text-sm block mt-1.5">{userRole}</span>
          </div>
          
          <nav className="space-y-1.5">
            {[
              { id: 'dashboard', name: 'Dashboard Overview', icon: BarChart3, roles: ['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst'] },
              { id: 'vehicles', name: 'Vehicle Registry', icon: Truck, roles: ['Fleet Manager'] },
              { id: 'drivers', name: 'Driver Management', icon: Users, roles: ['Safety Officer'] },
              { id: 'trips', name: 'Trip Manager', icon: ArrowRightLeft, roles: ['Driver'] },
              { id: 'maintenance', name: 'Maintenance Workshop', icon: Wrench, roles: ['Fleet Manager'] },
              { id: 'expenses', name: 'Fuel & Expenses', icon: Fuel, roles: ['Financial Analyst'] },
              { id: 'reports', name: 'Reports & Analytics', icon: BarChart3, roles: ['Financial Analyst'] }
            ].map(tab => {
              if (!tab.roles.includes(userRole)) return null;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                    currentTab === tab.id ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
        
        <button 
          onClick={handleLogOut} 
          className="flex items-center justify-center gap-2 w-full border border-slate-800 hover:border-red-900 bg-slate-950 hover:bg-red-950/20 text-slate-400 hover:text-red-400 py-2.5 rounded-xl text-xs font-bold transition-all"
        >
          <LogOut size={14} /> Log Out System Terminal
        </button>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-500 font-medium">Synchronizing enterprise system matrices...</div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-white">Operations Control Center</h2>
                  <p className="text-slate-400 text-sm mt-0.5">Real-time indicators across active transport networks.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {[
                    { label: "Active Fleet", val: activeVehicles, color: "text-blue-400" },
                    { label: "Available Fleet", val: availableVehiclesCount, color: "text-emerald-400" },
                    { label: "In Shop Repairs", val: inShopVehicles, color: "text-amber-400" },
                    { label: "Active Deliveries", val: activeTripsCount, color: "text-indigo-400" },
                    { label: "Pending Drafts", val: pendingTripsCount, color: "text-slate-400" },
                    { label: "Operators On Duty", val: driversOnDuty, color: "text-purple-400" },
                    { label: "Fleet Utilization", val: `${fleetUtilizationRate}%`, color: "text-emerald-500 font-black" }
                  ].map((kpi, idx) => (
                    <div key={idx} className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">{kpi.label}</span>
                      <span className={`text-2xl font-extrabold block mt-1.5 ${kpi.color}`}>{kpi.val}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap gap-4 items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold">
                    <Filter size={16} /> Filter Operations Context Logs:
                  </div>
                  <div className="flex gap-3">
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-slate-950 border border-slate-800 text-xs rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-slate-300">
                      <option value="All">All Vehicle Types</option>
                      <option value="Van">Van</option>
                      <option value="Truck">Truck</option>
                      <option value="Semi">Semi-Trailer</option>
                      <option value="Box Truck">Box Truck</option>
                    </select>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-slate-950 border border-slate-800 text-xs rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-slate-300">
                      <option value="All">All Status Options</option>
                      <option value="Available">Available</option>
                      <option value="On Trip">On Trip</option>
                      <option value="In Shop">In Shop</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
                  <div className="p-4 bg-slate-850 border-b border-slate-800 font-bold text-xs uppercase text-slate-400 tracking-wider">
                    Targeted Live Asset Allocation Feed ({filteredVehiclesList.length})
                  </div>
                  <div className="divide-y divide-slate-800">
                    {filteredVehiclesList.map(v => (
                      <div key={v.id} className="p-4 flex justify-between items-center text-sm">
                        <div>
                          <span className="font-bold text-white">{v.name}</span>
                          <span className="text-xs bg-slate-800 px-2 py-0.5 rounded ml-2 text-slate-400 font-mono">{v.license_plate}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${
                          v.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400' :
                          v.status === 'On Trip' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>{v.status}</span>
                      </div>
                    ))}
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
          </>
        )}
      </main>
    </div>
  );
}