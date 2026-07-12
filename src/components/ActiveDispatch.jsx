import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { ShieldAlert, Play, CheckCircle2, XCircle, FileText } from 'lucide-react';

export default function ActiveDispatch({ vehicles, drivers, trips, refreshData }) {
  const [errorMsg, setErrorMsg] = useState('');
  const [closingTripId, setClosingTripId] = useState(null);

  // Mandatory Business Rule: Retired, On Trip, or In Shop vehicles must NEVER appear in the dispatch selection pool
  const availableVehicles = vehicles.filter(v => v.status === 'Available');
  // Mandatory Business Rule: Drivers with Expired/Suspended or On Trip status cannot be assigned to trips
  const availableDrivers = drivers.filter(d => {
    const isExpired = d.license_expiry_date ? new Date(d.license_expiry_date) < new Date() : false;
    return d.status === 'Available' && d.license_status === 'Active' && !isExpired;
  });

  const handleCreateTrip = async (e, mode) => {
    e.preventDefault();
    setErrorMsg('');
    
    const formData = new FormData(e.target);
    const vehicleId = formData.get('vehicle_id');
    const driverId = formData.get('driver_id');
    const cargoWeight = parseInt(formData.get('cargo_weight_kg'));
    const source = formData.get('source');
    const destination = formData.get('destination');
    const plannedDistance = parseFloat(formData.get('planned_distance')) || 0;

    const selectedVehicle = vehicles.find(v => v.id === vehicleId);
    const selectedDriver = drivers.find(d => d.id === driverId);

    // Double check constraints safety check
    if (!selectedVehicle || !selectedDriver) return;

    // Mandatory Business Rule: Cargo Weight must not exceed the vehicle's maximum load capacity
    if (cargoWeight > selectedVehicle.max_load_kg) {
      setErrorMsg(`🚨 Dispatch Blocked: Cargo weight (${cargoWeight}kg) exceeds maximum capacity rating for ${selectedVehicle.name} (${selectedVehicle.max_load_kg}kg)!`);
      return;
    }

    try {
      // 1. Create trip record row
      const { error: tripError } = await supabase.from('trips').insert([{
        source,
        destination,
        cargo_weight_kg: cargoWeight,
        planned_distance: plannedDistance,
        vehicle_id: vehicleId,
        driver_id: driverId,
        status: mode // 'Draft' or 'Dispatched'
      }]);
      if (tripError) throw tripError;

      // Mandatory Business Rule: Dispatching a trip automatically changes both vehicle and driver status to On Trip
      if (mode === 'Dispatched') {
        await supabase.from('vehicles').update({ status: 'On Trip' }).eq('id', vehicleId);
        await supabase.from('drivers').update({ status: 'On Trip' }).eq('id', driverId);
      }

      e.target.reset();
      refreshData();
    } catch (err) {
      alert("Database error: " + err.message);
    }
  };

  const changeStatus = async (trip, targetStatus) => {
    try {
      // Mandatory Business Rule: Cancelling a dispatched trip restores vehicle and driver to Available
      if (targetStatus === 'Cancelled') {
        await supabase.from('trips').update({ status: 'Cancelled' }).eq('id', trip.id);
        await supabase.from('vehicles').update({ status: 'Available' }).eq('id', trip.vehicle_id);
        await supabase.from('drivers').update({ status: 'Available' }).eq('id', trip.driver_id);
      } 
      // Deploying a saved draft
      else if (targetStatus === 'Dispatched') {
        await supabase.from('trips').update({ status: 'Dispatched' }).eq('id', trip.id);
        await supabase.from('vehicles').update({ status: 'On Trip' }).eq('id', trip.vehicle_id);
        await supabase.from('drivers').update({ status: 'On Trip' }).eq('id', trip.driver_id);
      }
      refreshData();
    } catch (err) {
      alert("Error transitioning status: " + err.message);
    }
  };

  const handleCompleteTrip = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const finalOdometer = parseFloat(formData.get('final_odometer'));
    const fuelConsumed = parseFloat(formData.get('fuel_consumed'));

    const trip = trips.find(t => t.id === closingTripId);
    if (!trip) return;

    try {
      // 1. Update trip lifecycle status info metrics
      await supabase.from('trips').update({
        status: 'Completed',
        final_odometer: finalOdometer,
        fuel_consumed: fuelConsumed
      }).eq('id', trip.id);

      // 2. Update the vehicle's mileage odometer tracking metric log
      await supabase.from('vehicles').update({
        status: 'Available',
        odometer: finalOdometer
      }).eq('id', trip.vehicle_id);

      // Mandatory Business Rule: Completing a trip automatically changes both the vehicle and driver status back to Available
      await supabase.from('drivers').update({ status: 'Available' }).eq('id', trip.driver_id);

      // 3. Log fuel entry directly to fuel_logs for financial analytics requirements
      const fuelCostEstimated = fuelConsumed * 1.25; // standard sample index scaling factor
      await supabase.from('fuel_logs').insert([{
        vehicle_id: trip.vehicle_id,
        trip_id: trip.id,
        liters: fuelConsumed,
        cost: fuelCostEstimated
      }]);

      setClosingTripId(null);
      refreshData();
    } catch (err) {
      alert("Error finalizing trip complete metrics: " + err.message);
    }
  };

  const statusBadge = (status) => {
    switch (status) {
      case 'Draft': return 'bg-slate-100 text-slate-500';
      case 'Dispatched': return 'bg-sky-50 text-sky-600';
      case 'Completed': return 'bg-emerald-50 text-emerald-600';
      default: return 'bg-red-50 text-red-600';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[28px] font-extrabold tracking-tight text-slate-900">Trip Manifest Controller</h2>
        <p className="text-slate-500 text-sm mt-1">Schedule routes, monitor active lifecycle states, and input completion parameters.</p>
      </div>

      {errorMsg && (
        <div className="op-card bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 text-red-600 text-sm">
          <ShieldAlert size={20} className="shrink-0 mt-0.5" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Creation Manifest Interface Form */}
        <div className="op-card bg-white border border-slate-200 p-6 rounded-2xl h-fit">
          <h3 className="text-[15px] font-bold text-slate-900 mb-5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A1A]" /> Create New Route
          </h3>
          <form className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Assign Fleet Unit</label>
              <select name="vehicle_id" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors">
                <option value="">-- Choose Available Vehicle --</option>
                {availableVehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.name} (Max: {v.max_load_kg}kg • Current Odo: {v.odometer}km)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Assign Eligible Operator</label>
              <select name="driver_id" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors">
                <option value="">-- Choose Available Driver --</option>
                {availableDrivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name} (Score: {d.safety_score})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Source Location</label>
                <input name="source" type="text" placeholder="Warehouse A" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Destination</label>
                <input name="destination" type="text" placeholder="Terminal B" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Cargo Weight (kg)</label>
                <input name="cargo_weight_kg" type="number" placeholder="450" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Planned Distance (km)</label>
                <input name="planned_distance" type="number" placeholder="120" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={(e) => handleCreateTrip(e.target.form ? {preventDefault:()=>{}, target:e.target.form} : e, 'Draft')} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-3 rounded-lg text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5">
                <FileText size={13} /> Save as Draft
              </button>
              <button type="button" onClick={(e) => handleCreateTrip(e.target.form ? {preventDefault:()=>{}, target:e.target.form} : e, 'Dispatched')} className="flex-1 bg-gradient-to-r from-[#FF7A1A] to-[#FF9A4D] hover:from-[#FF8A33] hover:to-[#FFAA66] text-white font-bold p-3 rounded-lg text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF7A1A]/20">
                <Play size={14} fill="currentColor" /> Dispatch Route
              </button>
            </div>
          </form>
        </div>

        {/* Live Route Lifecycle Monitor Panel */}
        <div className="lg:col-span-2 space-y-4">
          {closingTripId && (
            <div className="op-card bg-white border border-sky-200 p-6 rounded-2xl">
              <h4 className="text-[15px] font-bold mb-4 text-sky-600 flex items-center gap-2">
                <CheckCircle2 size={16} /> Complete Trip Manifest Parameters
              </h4>
              <form onSubmit={handleCompleteTrip} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">Final Odometer Reading (km)</label>
                  <input name="final_odometer" type="number" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:border-sky-400 focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">Total Fuel Consumed (Liters)</label>
                  <input name="fuel_consumed" type="number" step="0.01" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:border-sky-400 focus:bg-white transition-colors" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold p-3 rounded-lg text-sm transition-colors shadow-sm">
                    Save Closeout
                  </button>
                  <button type="button" onClick={() => setClosingTripId(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-3 rounded-lg text-sm border border-slate-200 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="op-card bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operational Lifecycle Registry</span>
              <span className="op-mono text-[11px] text-slate-400">{trips.length} total</span>
            </div>
            <div className="divide-y divide-slate-100 text-sm">
              {trips.length === 0 ? (
                <div className="p-10 text-center text-slate-400 font-medium">No route records recorded in workspace memory.</div>
              ) : (
                trips.map(t => {
                  const v = vehicles.find(veh => veh.id === t.vehicle_id);
                  const d = drivers.find(drv => drv.id === t.driver_id);
                  return (
                    <div key={t.id} className="p-5 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:bg-slate-50 transition-colors">
                      <div>
                        <div className="font-bold text-slate-900 text-[15px] flex items-center flex-wrap gap-2">
                          <span>{t.source} ➔ {t.destination}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusBadge(t.status)}`}>
                            {t.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          <span className="font-semibold text-slate-600">Asset:</span> {v?.name || 'Unknown'} ({v?.license_plate}) | 
                          <span className="font-semibold text-slate-600"> Operator:</span> {d?.name || 'Unknown'} | 
                          <span className="font-semibold text-slate-600"> Load:</span> {t.cargo_weight_kg}kg
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-auto">
                        {t.status === 'Draft' && (
                          <button onClick={() => changeStatus(t, 'Dispatched')} className="bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-colors">
                            Authorize Dispatch
                          </button>
                        )}
                        {t.status === 'Dispatched' && (
                          <>
                            <button onClick={() => setClosingTripId(t.id)} className="bg-sky-50 text-sky-600 border border-sky-200 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-sky-600 hover:text-white hover:border-sky-600 transition-colors flex items-center gap-1">
                              <CheckCircle2 size={12} /> Complete
                            </button>
                            <button onClick={() => changeStatus(t, 'Cancelled')} className="bg-red-50 text-red-600 border border-red-200 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors flex items-center gap-1">
                              <XCircle size={12} /> Cancel
                            </button>
                          </>
                        )}
                      </div>
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
