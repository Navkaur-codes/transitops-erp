import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Wrench, CheckCircle } from 'lucide-react';

export default function Maintenance({ vehicles, refreshData }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

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

    try {
      // 1. Insert new log row marked as 'Open'
      const { error: logError } = await supabase.from('maintenance_logs').insert([{
        vehicle_id: vehicleId,
        description,
        cost,
        status: 'Open'
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[28px] font-extrabold tracking-tight text-slate-900">Maintenance Workshop Logs</h2>
        <p className="text-slate-500 text-sm mt-1">Check assets into the shop and close out completed repairs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Open Ticket Form */}
        <div className="op-card bg-white border border-slate-200 p-6 rounded-2xl h-fit">
          <h3 className="text-[15px] font-bold text-slate-900 mb-5 flex items-center gap-2">
            <Wrench size={16} className="text-[#FF7A1A]" /> Issue Workshop Ticket
          </h3>
          <form onSubmit={handleOpenMaintenance} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Select Target Vehicle</label>
              <select name="vehicle_id" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors">
                <option value="">-- Choose Asset --</option>
                {maintainableVehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.license_plate}) - Current: {v.status}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Service Description</label>
              <input name="description" type="text" placeholder="e.g. Oil Change & Brake Pad Replacement" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Estimated Maintenance Cost ($)</label>
              <input name="cost" type="number" step="0.01" placeholder="e.g. 150.00" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors" />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-[#FF7A1A] to-[#FF9A4D] hover:from-[#FF8A33] hover:to-[#FFAA66] text-white font-bold p-3 rounded-lg text-sm transition-all active:scale-[0.98] shadow-lg shadow-[#FF7A1A]/20">
              Authorize Shop Check-in
            </button>
          </form>
        </div>

        {/* Output Table View */}
        <div className="lg:col-span-2">
          <div className="op-card bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Service & Repair Records</span>
              <span className="op-mono text-[11px] text-slate-400">{logs.length} total</span>
            </div>
            <div className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <div className="p-10 text-center text-slate-400">Syncing workshop files…</div>
              ) : logs.length === 0 ? (
                <div className="p-10 text-center text-slate-400 font-medium">No maintenance logs found.</div>
              ) : (
                logs.map(log => {
                  const v = vehicles.find(veh => veh.id === log.vehicle_id);
                  return (
                    <div key={log.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2 flex-wrap">
                          <span>{v?.name || 'Unknown Asset'} ({v?.license_plate || 'N/A'})</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                            log.status === 'Open' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {log.status === 'Open' ? 'In Shop' : 'Completed'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{log.description}</p>
                        <p className="text-[11px] text-slate-400 op-mono mt-0.5">Cost: ${Number(log.cost).toFixed(2)} • Date: {log.log_date}</p>
                      </div>

                      {log.status === 'Open' && (
                        <button onClick={() => handleCloseMaintenance(log)} className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-colors flex items-center gap-1 shrink-0">
                          <CheckCircle size={12} /> Complete Repair
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
