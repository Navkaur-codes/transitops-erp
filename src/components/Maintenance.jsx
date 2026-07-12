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
    <div>
      <h2 className="text-3xl font-extrabold tracking-tight mb-8">Maintenance Workshop Logs</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Open Ticket Form */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-md h-fit">
          <h3 className="text-xl font-bold mb-4 text-emerald-400 flex items-center gap-2">
            <Wrench size={18} /> Issue Workshop Ticket
          </h3>
          <form onSubmit={handleOpenMaintenance} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Target Vehicle</label>
              <select name="vehicle_id" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500 text-white">
                <option value="">-- Choose Asset --</option>
                {maintainableVehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.license_plate}) - Current: {v.status}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Service Description</label>
              <input name="description" type="text" placeholder="e.g. Oil Change & Brake Pad Replacement" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500 text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Estimated Maintenance Cost ($)</label>
              <input name="cost" type="number" step="0.01" placeholder="e.g. 150.00" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500 text-white" />
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3 rounded-lg text-sm transition-colors shadow-sm">
              Authorize Shop Check-in
            </button>
          </form>
        </div>

        {/* Output Table View */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
            <div className="p-4 bg-slate-800/30 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Service & Repair Records</span>
            </div>
            <div className="divide-y divide-slate-800/60 text-sm">
              {loading ? (
                <div className="p-6 text-center text-slate-500">Syncing workshop files...</div>
              ) : logs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-medium">No maintenance logs found.</div>
              ) : (
                logs.map(log => {
                  const v = vehicles.find(veh => veh.id === log.vehicle_id);
                  return (
                    <div key={log.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors">
                      <div>
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <span>{v?.name || 'Unknown Asset'} ({v?.license_plate || 'N/A'})</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            log.status === 'Open' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {log.status === 'Open' ? 'In Shop' : 'Completed'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{log.description}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">Cost: ${Number(log.cost).toFixed(2)} • Date: {log.log_date}</p>
                      </div>

                      {log.status === 'Open' && (
                        <button onClick={() => handleCloseMaintenance(log)} className="bg-emerald-600/15 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-600 hover:text-white transition-colors flex items-center gap-1 shrink-0">
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