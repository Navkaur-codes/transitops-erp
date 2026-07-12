import React from 'react';
import { supabase } from '../supabaseClient';

export default function FleetAssetLog({ vehicles, refreshData }) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newVehicle = {
      license_plate: formData.get('registration_number'), // Maps the unique registration number directly to license_plate
      name: formData.get('name'),
      type: formData.get('type'),
      max_load_kg: parseInt(formData.get('max_load_kg')),
      odometer: parseFloat(formData.get('odometer')) || 0,
      acquisition_cost: parseFloat(formData.get('acquisition_cost')) || 0,
      status: formData.get('status') || 'Available'
    };

    const { error } = await supabase.from('vehicles').insert([newVehicle]);
    if (error) {
      alert("Database Error: " + error.message);
    } else {
      e.target.reset();
      refreshData();
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-extrabold tracking-tight mb-8">Vehicle Registry</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Registration Form */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-md h-fit">
          <h3 className="text-xl font-bold mb-4 text-emerald-400">Register New Asset</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Registration Number (Unique)</label>
              <input name="registration_number" type="text" placeholder="e.g. VAN-05" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Vehicle Name / Model</label>
              <input name="name" type="text" placeholder="e.g. Ford Transit Van" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Vehicle Type</label>
              <select name="type" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors text-white">
                <option value="Van">Van</option>
                <option value="Truck">Truck</option>
                <option value="Semi">Semi-Trailer</option>
                <option value="Box Truck">Box Truck</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Maximum Load Capacity (kg)</label>
              <input name="max_load_kg" type="number" placeholder="e.g. 500" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Initial Odometer (km)</label>
              <input name="odometer" type="number" placeholder="e.g. 12000" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Acquisition Cost ($)</label>
              <input name="acquisition_cost" type="number" step="0.01" placeholder="e.g. 35000.00" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Initial Asset Status</label>
              <select name="status" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors text-white">
                <option value="Available">Available</option>
                <option value="On Trip">On Trip</option>
                <option value="In Shop">In Shop</option>
                <option value="Retired">Retired</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3 rounded-lg text-sm transition-colors shadow-sm">
              Commit Asset to Registry
            </button>
          </form>
        </div>

        {/* Output Data Table */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Reg Code</th>
                  <th className="p-4 font-semibold">Model / Type</th>
                  <th className="p-4 font-semibold text-right">Max Cap</th>
                  <th className="p-4 font-semibold text-right">Odometer</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500 font-medium">No registered assets found in registry.</td>
                  </tr>
                ) : (
                  vehicles.map(v => (
                    <tr key={v.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-mono font-bold text-emerald-400 text-xs">{v.license_plate}</td>
                      <td className="p-4">
                        <div className="font-bold text-white">{v.name}</div>
                        <div className="text-xs text-slate-400">{v.type || 'Unspecified'}</div>
                      </td>
                      <td className="p-4 text-right font-medium">{v.max_load_kg} kg</td>
                      <td className="p-4 text-right text-slate-300 font-mono">{Number(v.odometer).toLocaleString()} km</td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold tracking-wide ${
                          v.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          v.status === 'On Trip' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          v.status === 'In Shop' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}