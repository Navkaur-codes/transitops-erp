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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight mb-2">Trip Manifest Controller</h2>
        <p className="text-slate-400 text-sm">Schedule routes, monitor active lifecycle states, and input completion parameters.</p>
      </div>

      {errorMsg && (
        <div className="bg-red-950/40 border border-red-900/50 p-4 rounded-xl flex items-start gap-3 text-red-400 text-sm shadow-sm">
          <ShieldAlert size={20} className="shrink-0 mt-0.5" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creation Manifest Interface Form */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-md h-fit">
          <h3 className="text-xl font-bold mb-4 text-emerald-400">Create New Route</h3>
          <form className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assign Fleet Unit</label>
              <select name="vehicle_id" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500 text-white">
                <option value="">-- Choose Available Vehicle --</option>
                {availableVehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.name} (Max: {v.max_load_kg}kg • Current Odo: {v.odometer}km)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assign Eligible Operator</label>
              <select name="driver_id" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500 text-white">
                <option value="">-- Choose Available Driver --</option>
                {availableDrivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name} (Score: {d.safety_score})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Source Location</label>
                <input name="source" type="text" placeholder="Warehouse A" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Destination</label>
                <input name="destination" type="text" placeholder="Terminal B" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Cargo Weight (kg)</label>
                <input name="cargo_weight_kg" type="number" placeholder="450" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Planned Distance (km)</label>
                <input name="planned_distance" type="number" placeholder="120" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500" />
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button type="button" onClick={(e) => handleCreateTrip(e.target.form ? {preventDefault:()=>{}, target:e.target.form} : e, 'Draft')} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold p-3 rounded-lg text-xs border border-slate-700 transition-colors">
                Save as Draft
              </button>
              <button type="button" onClick={(e) => handleCreateTrip(e.target.form ? {preventDefault:()=>{}, target:e.target.form} : e, 'Dispatched')} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 shadow-sm">
                <Play size={14} fill="currentColor" /> Dispatch Route
              </button>
            </div>
          </form>
        </div>

        {/* Live Route Lifecycle Monitor Panel */}
        <div className="lg:col-span-2 space-y-4">
          {closingTripId && (
            <div className="bg-slate-900 border border-emerald-800/60 p-6 rounded-xl shadow-md">
              <h4 className="text-lg font-bold mb-3 text-emerald-400">Complete Trip Manifest Parameters</h4>
              <form onSubmit={handleCompleteTrip} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Final Odometer Reading (km)</label>
                  <input name="final_odometer" type="number" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Total Fuel Consumed (Liters)</label>
                  <input name="fuel_consumed" type="number" step="0.01" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3 rounded-lg text-sm transition-colors">
                    Save Closeout
                  </button>
                  <button type="button" onClick={() => setClosingTripId(null)} className="bg-slate-800 text-slate-400 p-3 rounded-lg text-sm border border-slate-700">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
            <div className="p-4 bg-slate-800/30 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operational Lifecycle Registry</span>
            </div>
            <div className="divide-y divide-slate-800/60 text-sm">
              {trips.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-medium">No route records recorded in workspace memory.</div>
              ) : (
                trips.map(t => {
                  const v = vehicles.find(veh => veh.id === t.vehicle_id);
                  const d = drivers.find(drv => drv.id === t.driver_id);
                  return (
                    <div key={t.id} className="p-5 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:bg-slate-800/20 transition-colors">
                      <div>
                        <div className="font-bold text-white text-base flex items-center flex-wrap gap-2">
                          <span>{t.source} ➔ {t.destination}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            t.status === 'Draft' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                            t.status === 'Dispatched' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            t.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          <span className="font-semibold text-slate-300">Asset:</span> {v?.name || 'Unknown'} ({v?.license_plate}) | 
                          <span className="font-semibold text-slate-300"> Operator:</span> {d?.name || 'Unknown'} | 
                          <span className="font-semibold text-slate-300"> Load:</span> {t.cargo_weight_kg}kg
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-auto">
                        {t.status === 'Draft' && (
                          <button onClick={() => changeStatus(t, 'Dispatched')} className="bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-600 hover:text-white transition-colors">
                            Authorize Dispatch
                          </button>
                        )}
                        {t.status === 'Dispatched' && (
                          <>
                            <button onClick={() => setClosingTripId(t.id)} className="bg-blue-600/10 text-blue-400 border border-blue-500/20 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-1">
                              <CheckCircle2 size={12} /> Complete
                            </button>
                            <button onClick={() => changeStatus(t, 'Cancelled')} className="bg-red-600/10 text-red-400 border border-red-500/20 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-red-600 hover:text-white transition-colors flex items-center gap-1">
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