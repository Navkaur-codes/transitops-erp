import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Truck, Users, ArrowRightLeft, Wrench, Fuel, BarChart3, LogOut, ShieldCheck, Filter } from 'lucide-react';
import FleetAssetLog from './components/FleetAssetLog';
import PersonnelFiles from './components/PersonnelFiles';
import ActiveDispatch from './components/ActiveDispatch';
import Maintenance from './components/Maintenance';
import FuelExpenseManager from './components/FuelExpenseManager';
import ReportsAnalytics from './components/ReportsAnalytics';

export default function App() {
  // Authentication & View States
  const [userRole, setUserRole] = useState(null); // 'Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTab, setCurrentTab] = useState('dashboard');
  
  // Filtering states for the Control Panel
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Real-time Database State Collections
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
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

  // --- 3.1 Authentication & RBAC Login Shield ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full shadow-2xl">
          <div className="flex justify-center mb-4 text-emerald-500">
            <Truck size={48} />
          </div>
          <h1 className="text-3xl font-extrabold text-white text-center tracking-tight">TransitOps</h1>
          <p className="text-slate-400 text-center text-xs mt-1 mb-6">Smart Transport Operations Platform</p>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const email = formData.get('email');
            const role = formData.get('role');
            if (email && role) {
              setUserRole(role);
              setIsAuthenticated(true);
            }
          }} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <input name="email" type="email" required placeholder="manager@transitops.com" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500 text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password System Code</label>
              <input name="password" type="password" required placeholder="••••••••" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500 text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Assigned Security Role (RBAC)</label>
              <select name="role" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500 text-white">
                <option value="Fleet Manager">Fleet Manager</option>
                <option value="Dispatcher">Dispatcher / Operations Crew</option>
                <option value="Safety Officer">Safety Officer</option>
                <option value="Financial Analyst">Financial Analyst</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3 rounded-xl text-sm transition-all shadow-md mt-2 flex items-center justify-center gap-2">
              <ShieldCheck size={18} /> Authenticate Session
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Compute Complex KPIs for Section 3.2 ---
  const activeVehicles = vehicles.filter(v => v.status === 'On Trip').length;
  const availableVehiclesCount = vehicles.filter(v => v.status === 'Available').length;
  const inShopVehicles = vehicles.filter(v => v.status === 'In Shop').length;
  const activeTripsCount = trips.filter(t => t.status === 'Dispatched').length;
  const pendingTripsCount = trips.filter(t => t.status === 'Draft').length;
  const driversOnDuty = drivers.filter(d => d.status === 'On Trip').length;
  
  const fleetUtilizationRate = vehicles.length > 0 
    ? ((vehicles.filter(v => v.status === 'On Trip' || v.status === 'In Shop').length / vehicles.length) * 100).toFixed(1) 
    : "0.0";

  // Filtered Assets list for dashboard overview display grid logic
  const filteredVehiclesList = vehicles.filter(v => {
    const matchType = filterType === 'All' || v.type === filterType;
    const matchStatus = filterStatus === 'All' || v.status === filterStatus;
    return matchType && matchStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Dynamic Navigation Sidebar Layout Grid */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-6 text-emerald-500">
            <Truck size={28} />
            <span className="font-extrabold text-xl tracking-tight text-white">TransitOps</span>
          </div>
          <div className="mb-6 px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-lg text-xs">
            <span className="text-slate-500 block font-medium">User Profile Access Context:</span>
            <span className="text-emerald-400 font-bold text-sm block mt-0.5">{userRole}</span>
          </div>
          
          <nav className="space-y-1.5">
            {[
              { id: 'dashboard', name: 'Dashboard Overview', icon: BarChart3, roles: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'] },
              { id: 'vehicles', name: 'Vehicle Registry', icon: Truck, roles: ['Fleet Manager', 'Financial Analyst'] },
              { id: 'drivers', name: 'Driver Management', icon: Users, roles: ['Fleet Manager', 'Safety Officer'] },
              { id: 'trips', name: 'Trip Manager', icon: ArrowRightLeft, roles: ['Fleet Manager', 'Dispatcher'] },
              { id: 'maintenance', name: 'Maintenance Workshop', icon: Wrench, roles: ['Fleet Manager'] },
              { id: 'expenses', name: 'Fuel & Expenses', icon: Fuel, roles: ['Fleet Manager', 'Financial Analyst'] },
              { id: 'reports', name: 'Reports & Analytics', icon: BarChart3, roles: ['Fleet Manager', 'Financial Analyst', 'Safety Officer'] }
            ].map(tab => {
              // RBAC Tab Access Verification Rule
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
          onClick={() => { setIsAuthenticated(false); setUserRole(null); setCurrentTab('dashboard'); }} 
          className="flex items-center justify-center gap-2 w-full border border-slate-800 hover:border-red-900 bg-slate-950 hover:bg-red-950/20 text-slate-400 hover:text-red-400 py-2.5 rounded-xl text-xs font-bold transition-all"
        >
          <LogOut size={14} /> Log Out System Terminal
        </button>
      </aside>

      {/* Main Panel Dynamic Content View Window */}
      <main className="flex-1 p-8 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-500 font-medium">Synchronizing enterprise system matrices...</div>
        ) : (
          <>
            {/* Section 3.2: Main Control Panel KPI Dashboard */}
            {currentTab === 'dashboard' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-white">Operations Control Center</h2>
                  <p className="text-slate-400 text-sm mt-0.5">Real-time indicators across active transport networks.</p>
                </div>

                {/* KPI Metrics Row Grid Dashboard Elements */}
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

                {/* Asset Monitor Grid View Filter Modules */}
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

                {/* Dashboard Live Mini-Table Log */}
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

            {/* Dynamic Mount Tabs */}
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