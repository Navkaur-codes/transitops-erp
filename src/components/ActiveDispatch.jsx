import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { ShieldAlert, Play, CheckCircle2, XCircle, FileText } from 'lucide-react';

export default function ActiveDispatch({ vehicles, drivers, trips, refreshData }) {
  const [closingTripId, setClosingTripId] = useState(null);

  // Form states required for real-time validation and stepper lookups matching Screen 4
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [cargoWeightInput, setCargoWeightInput] = useState('');
  const [activeStepProgress, setActiveStatusStep] = useState('Draft');
  const [submissionMode, setSubmissionMode] = useState('Dispatched'); // Tracks whether to submit as Draft or Dispatched

  // Mandatory Business Rule: Retired, On Trip, or In Shop vehicles must NEVER appear in the dispatch selection pool
  const availableVehicles = vehicles.filter(v => v.status === 'Available');
  
  // Mandatory Business Rule: Drivers with Expired/Suspended or On Trip status cannot be assigned to trips
  const availableDrivers = drivers.filter(d => {
    const isExpired = d.license_expiry_date ? new Date(d.license_expiry_date) < new Date() : false;
    return d.status === 'Available' && !isExpired;
  });

  // Calculate capacity overhead differences matching the red warning box metrics
  const activeVehicleObject = vehicles.find(v => v.id === selectedVehicleId);
  const parsedWeightInt = parseInt(cargoWeightInput) || 0;
  const isOverloaded = activeVehicleObject && parsedWeightInt > activeVehicleObject.max_load_kg;
  const weightOverheadDifference = activeVehicleObject ? parsedWeightInt - activeVehicleObject.max_load_kg : 0;

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const vehicleId = formData.get('vehicle_id');
    const driverId = formData.get('driver_id');
    const cargoWeight = parseInt(formData.get('cargo_weight_kg'));
    const source = formData.get('source');
    const destination = formData.get('destination');
    const plannedDistance = parseFloat(formData.get('planned_distance')) || 0;

    const selectedVehicle = vehicles.find(v => v.id === vehicleId);
    if (!selectedVehicle || cargoWeight > selectedVehicle.max_load_kg) return; 

    try {
      const { error: tripError } = await supabase.from('trips').insert([{
        source,
        destination,
        cargo_weight_kg: cargoWeight,
        planned_distance: plannedDistance,
        vehicle_id: vehicleId,
        driver_id: driverId,
        status: submissionMode 
      }]);
      if (tripError) throw tripError;

      if (submissionMode === 'Dispatched') {
        await supabase.from('vehicles').update({ status: 'On Trip' }).eq('id', vehicleId);
        await supabase.from('drivers').update({ status: 'On Trip' }).eq('id', driverId);
      }

      e.target.reset();
      setSelectedVehicleId('');
      setCargoWeightInput('');
      setActiveStatusStep('Draft'); 
      refreshData();
    } catch (err) {
      alert("Database error: " + err.message);
    }
  };

  const changeStatus = async (trip, targetStatus) => {
    try {
      if (targetStatus === 'Cancelled') {
        await supabase.from('trips').update({ status: 'Cancelled' }).eq('id', trip.id);
        await supabase.from('vehicles').update({ status: 'Available' }).eq('id', trip.vehicle_id);
        await supabase.from('drivers').update({ status: 'Available' }).eq('id', trip.driver_id);
      } else if (targetStatus === 'Dispatched') {
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
      await supabase.from('trips').update({
        status: 'Completed',
        final_odometer: finalOdometer,
        fuel_consumed: fuelConsumed
      }).eq('id', trip.id);

      await supabase.from('vehicles').update({
        status: 'Available',
        odometer: finalOdometer
      }).eq('id', trip.vehicle_id);

      await supabase.from('drivers').update({ status: 'Available' }).eq('id', trip.driver_id);

      const fuelCostEstimated = fuelConsumed * 1.25; 
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Creation Manifest Interface Form */}
        <div className="op-card bg-white border border-slate-200 p-6 rounded-2xl h-fit space-y-5">
          
          {/* TRIP LIFECYCLE HORIZONTAL PROGRESS TIMELINE STEPPER */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase op-mono font-bold text-slate-400 tracking-wider block">Trip Lifecycle Stage</span>
            <div className="flex items-center justify-between relative px-2">
              <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
              {[
                { label: 'Draft', color: activeStepProgress === 'Draft' ? 'bg-emerald-500 ring-emerald-100' : 'bg-slate-200 ring-transparent' },
                { label: 'Dispatched', color: activeStepProgress === 'Dispatched' ? 'bg-sky-500 ring-sky-100' : 'bg-slate-200 ring-transparent' },
                { label: 'Completed', color: activeStepProgress === 'Completed' ? 'bg-emerald-500 ring-emerald-100' : 'bg-slate-200 ring-transparent' },
                { label: 'Cancelled', color: activeStepProgress === 'Cancelled' ? 'bg-red-500 ring-red-100' : 'bg-slate-200 ring-transparent' }
              ].map((step, sIdx) => (
                <button 
                  key={sIdx} 
                  type="button"
                  onClick={() => setActiveStatusStep(step.label)}
                  className="relative z-10 flex flex-col items-center gap-1 group focus:outline-none"
                >
                  <div className={`w-3 h-3 rounded-full ${step.color} ring-4 transition-all duration-300`} />
                  <span className={`text-[10px] font-bold transition-colors ${activeStepProgress === step.label ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <h3 className="text-[15px] font-bold text-slate-900 pt-2 border-t border-slate-100 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A1A]" /> Create Trip
          </h3>

          <form onSubmit={handleSubmitForm} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Source</label>
              <input name="source" type="text" placeholder="e.g. Gandhinagar Depot" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Destination</label>
              <input name="destination" type="text" placeholder="e.g. Ahmedabad Hub" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Vehicle (Available Only)</label>
              <select 
                name="vehicle_id" 
                required 
                value={selectedVehicleId} 
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors"
              >
                <option value="">-- Choose Asset --</option>
                {availableVehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.name} - {v.max_load_kg} kg capacity</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Driver (Available Only)</label>
              <select name="driver_id" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors">
                <option value="">-- Choose Operator --</option>
                {availableDrivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Cargo Weight (kg)</label>
              <input 
                name="cargo_weight_kg" 
                type="number" 
                placeholder="700" 
                required 
                value={cargoWeightInput}
                onChange={(e) => setCargoWeightInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors" 
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Planned Distance (km)</label>
              <input name="planned_distance" type="number" placeholder="38" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors" />
            </div>

            {/* HIGH VISIBILITY CAPACITY OVERLOAD WARNING ALERT BOX */}
            {isOverloaded && (
              <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl text-xs text-red-700 space-y-1 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2 font-bold">
                  <ShieldAlert size={14} className="shrink-0" />
                  <span>Vehicle Capacity: {activeVehicleObject.max_load_kg} kg</span>
                </div>
                <div>Cargo Weight: {parsedWeightInt} kg</div>
                <div className="font-extrabold text-[11px] border-t border-red-200/50 pt-1 mt-1">
                  ❌ Capacity exceeded by {weightOverheadDifference} kg — dispatch blocked
                </div>
              </div>
            )}

            {/* SEPARATED EXPLICIT SUBMIT BUTTON WORKFLOWS */}
            <div className="flex gap-3 pt-2">
              <button 
                type="submit" 
                disabled={isOverloaded} 
                onClick={() => setSubmissionMode('Draft')} 
                className={`flex-1 font-bold p-3 rounded-lg text-xs border transition-colors flex items-center justify-center gap-1.5 ${
                  isOverloaded 
                    ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-50' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 cursor-pointer'
                }`}
              >
                <FileText size={13} /> Save as Draft
              </button>
              
              <button 
                type="submit" 
                disabled={isOverloaded}
                onClick={() => setSubmissionMode('Dispatched')}
                className={`flex-1 font-bold p-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg ${
                  isOverloaded
                    ? 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed border border-transparent'
                    : 'bg-gradient-to-r from-[#FF7A1A] to-[#FF9A4D] hover:from-[#FF8A33] hover:to-[#FFAA66] text-white shadow-[#FF7A1A]/20 active:scale-[0.98] cursor-pointer'
                }`}
              >
                {isOverloaded ? <span>Dispatch (disabled)</span> : <span>Dispatch Route</span>}
              </button>
            </div>
          </form>
        </div>

        {/* Live Board Interface Manifest Monitor Panel */}
        <div className="lg:col-span-2 space-y-4">
          {closingTripId && (
            <div className="op-card bg-white border border-sky-200 p-6 rounded-2xl animate-in slide-in-from-top-3 duration-200">
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
                  <button type="submit" className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold p-3 rounded-lg text-sm transition-colors shadow-sm cursor-pointer">
                    Save Closeout
                  </button>
                  <button type="button" onClick={() => setClosingTripId(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-3 rounded-lg text-sm border border-slate-200 transition-colors cursor-pointer">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="op-card bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">LIVE BOARD</span>
              <span className="op-mono text-[11px] text-slate-400">{trips.length} active matrices</span>
            </div>
            
            <div className="divide-y divide-slate-100 text-sm">
              {trips.length === 0 ? (
                <div className="p-10 text-center text-slate-400 font-medium">No active log matrices registered in live transport framework.</div>
              ) : (
                trips.map((t, idx) => {
                  const v = vehicles.find(veh => veh.id === t.vehicle_id);
                  const d = drivers.find(drv => drv.id === t.driver_id);
                  return (
                    <div key={t.id} className="p-5 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:bg-slate-50 transition-colors">
                      <div className="space-y-1 flex-1">
                        <div className="font-mono text-xs font-bold text-slate-400 uppercase">TRK-{100 + idx}</div>
                        <div className="font-bold text-slate-900 text-[15px] flex items-center flex-wrap gap-2">
                          <span>{t.source} ➔ {t.destination}</span>
                        </div>
                        <div className="text-xs text-slate-400 font-medium">
                          Vehicle/Driver: <span className="text-slate-600 font-bold">{v?.name || 'Unassigned'}</span> / {d?.name || 'Unassigned'}
                        </div>
                        
                        <div className="pt-2">
                          <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusBadge(t.status)}`}>
                            {t.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                        {t.status === 'Draft' && (
                          <button onClick={() => changeStatus(t, 'Dispatched')} className="bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-colors cursor-pointer">
                            Authorize Dispatch
                          </button>
                        )}
                        {t.status === 'Dispatched' && (
                          <>
                            <button onClick={() => setClosingTripId(t.id)} className="bg-sky-50 text-sky-600 border border-sky-200 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-sky-600 hover:text-white hover:border-sky-600 transition-colors flex items-center gap-1 cursor-pointer">
                              <CheckCircle2 size={12} /> Complete
                            </button>
                            <button onClick={() => changeStatus(t, 'Cancelled')} className="bg-red-50 text-red-600 border border-red-200 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors flex items-center gap-1 cursor-pointer">
                              <XCircle size={12} /> Cancel
                            </button>
                          </>
                        )}
                        {t.status === 'Cancelled' && (
                          <span className="text-xs text-slate-400 italic font-medium pr-2">Vehicle went to shop</span>
                        )}
                        {t.status === 'Completed' && (
                          <span className="text-xs text-slate-400 font-mono pr-2">Route finalized</span>
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