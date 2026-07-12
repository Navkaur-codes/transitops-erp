import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Wrench, CheckCircle } from 'lucide-react';


export default function Maintenance({ vehicles, refreshData, activeCurrencySymbol = '$' })  {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get current date string formatted exactly for the mockup date field default value (YYYY-MM-DD)
  const todayString = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchLogs();
  }, [vehicles]);

  async function fetchLogs() {
    setLoading(true);
    const { data, error } = await supabase
      .from('maintenance_logs')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setLogs(data || []);
    setLoading(false);
  }

  const handleOpenMaintenance = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const vehicleId = formData.get('vehicle_id');
    const description = formData.get('description');
    const cost = parseFloat(formData.get('cost')) || 0;
    const logDate = formData.get('log_date') || todayString;

    try {
      // 1. Insert new log row marked as 'Open'
      const { error: logError } = await supabase.from('maintenance_logs').insert([{
        vehicle_id: vehicleId,
        description,
        cost,
        status: 'Open',
        log_date: logDate
      }]);
      if (logError) throw logError;

      // Mandatory Business Rule: Creating an active maintenance record automatically changes vehicle status to In Shop
      const { error: vError } = await supabase
        .from('vehicles')
        .update({ status: 'In Shop' })
        .eq('id', vehicleId);
      if (vError) throw vError;

      e.target.reset();
      refreshData();
      fetchLogs();
    } catch (err) {
      alert("Error opening maintenance: " + err.message);
    }
  };

  const handleCloseMaintenance = async (log) => {
    try {
      // 1. Close out log status
      await supabase.from('maintenance_logs').update({ status: 'Closed' }).eq('id', log.id);

      // Mandatory Business Rule: Closing maintenance restores the vehicle to Available (unless retired)
      const currentVehicle = vehicles.find(v => v.id === log.vehicle_id);
      if (currentVehicle && currentVehicle.status !== 'Retired') {
        await supabase.from('vehicles').update({ status: 'Available' }).eq('id', log.vehicle_id);
      }

      refreshData();
      fetchLogs();
    } catch (err) {
      alert("Error closing maintenance: " + err.message);
    }
  };

  // Filter out vehicles available to be checked into the shop (don't send vehicles already in shop or retired)
  const maintainableVehicles = vehicles.filter(v => v.status === 'Available' || v.status === 'On Trip');

  // ... (keep all your imports and function setup exactly as they are)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[28px] font-extrabold tracking-tight text-slate-900">Maintenance Workshop Logs</h2>
        <p className="text-slate-500 text-sm mt-1">Check assets into the shop and close out completed repairs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Open Ticket Form */}
        <div className="op-card bg-white border border-slate-200 p-6 rounded-2xl h-fit">
          <h3 className="text-[14px] font-bold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
            LOG, SERVICE RECORD
          </h3>
          <form onSubmit={handleOpenMaintenance} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Vehicle</label>
              <select name="vehicle_id" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors">
                <option value="">-- Choose Asset --</option>
                {maintainableVehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.license_plate})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Service Type</label>
              <input name="description" type="text" placeholder="e.g. Oil Change" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Cost</label>
              <input name="cost" type="number" step="0.01" placeholder="2500" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Date</label>
              <input name="log_date" type="date" defaultValue={todayString} required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
              <input type="text" readOnly value="Active" className="w-full bg-slate-100 border border-slate-200 rounded-lg p-3 text-sm text-slate-400 focus:outline-none cursor-not-allowed" />
            </div>
            
            <button type="submit" className="w-full bg-[#FF7A1A] hover:bg-[#E06610] text-white font-bold p-3.5 rounded-xl text-sm transition-all active:scale-[0.99] shadow-md cursor-pointer">
              Save
            </button>
          </form>
        </div>

        {/* Output Grid View */}
        <div className="lg:col-span-2">
          <div className="op-card bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">SERVICE LOG</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-400 text-[11px] uppercase font-bold tracking-wider">
                    <th className="p-4">Vehicle</th>
                    <th className="p-4">Service</th>
                    <th className="p-4 text-right">Cost</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="p-10 text-center text-slate-400 font-medium">Syncing workshop files…</td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-10 text-center text-slate-400 font-medium">No system log files stored in workspace.</td>
                    </tr>
                  ) : (
                    logs.map(log => {
                      const v = vehicles.find(veh => veh.id === log.vehicle_id);
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 font-bold text-slate-900">{v?.name || 'VAN-05'}</td>
                          <td className="p-4 text-slate-600">{log.description}</td>
                          <td className="p-4 text-right font-mono text-slate-900 font-semibold">
                            {/* DYNAMIC CURRENCY APPLIED HERE */}
                            {activeCurrencySymbol}{Number(log.cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-block px-3 py-1 rounded-md text-[11px] font-bold w-24 text-center text-white ${
                              log.status === 'Open' ? 'bg-[#FF7A1A]' : 'bg-[#55B315]'
                            }`}>
                              {log.status === 'Open' ? 'In Shop' : 'Completed'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {log.status === 'Open' ? (
                              <button onClick={() => handleCloseMaintenance(log)} className="text-emerald-600 hover:text-emerald-700 transition-colors font-bold text-xs flex items-center gap-1 justify-end ml-auto cursor-pointer">
                                <CheckCircle size={13} /> Close
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Settled</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}