import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Filter, Search } from 'lucide-react';

export default function FleetAssetLog({ vehicles, refreshData }) {
  // Local states for filtering matching Screen 2 requirements
  const [localTypeFilter, setLocalTypeFilter] = useState('All');
  const [localStatusFilter, setLocalStatusFilter] = useState('All');
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newVehicle = {
      license_plate: formData.get('registration_number'), 
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

  const statusBadge = (status) => {
    switch (status) {
      case 'Available': return 'bg-emerald-50 text-emerald-600';
      case 'On Trip': return 'bg-sky-50 text-sky-600';
      case 'In Shop': return 'bg-amber-50 text-amber-600';
      case 'Retired': return 'bg-red-50 text-red-600';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  // Perform reactive filtration mapping matching the mockup controls
  const computedFilteredVehicles = vehicles.filter(v => {
    const matchType = localTypeFilter === 'All' || v.type === localTypeFilter;
    const matchStatus = localStatusFilter === 'All' || v.status === localStatusFilter;
    const query = localSearchQuery.trim().toLowerCase();
    const matchSearch = !query || v.license_plate?.toLowerCase().includes(query);
    return matchType && matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-extrabold tracking-tight text-slate-900">Vehicle Registry</h2>
          <p className="text-slate-500 text-sm mt-1">Onboard new assets and review the full fleet ledger.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Form */}
        <div className="op-card bg-white border border-slate-200 rounded-2xl p-6 h-fit">
          <h3 className="text-[15px] font-bold text-slate-900 mb-5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A1A]" /> Register New Asset
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Registration Number (Unique)</label>
              <input name="registration_number" type="text" placeholder="e.g. VAN-05" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Vehicle Name / Model</label>
              <input name="name" type="text" placeholder="e.g. Ford Transit Van" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Vehicle Type</label>
              <select name="type" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors">
                <option value="Van">Van</option>
                <option value="Truck">Truck</option>
                <option value="Semi">Semi-Trailer</option>
                <option value="Box Truck">Box Truck</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Maximum Load Capacity (kg)</label>
              <input name="max_load_kg" type="number" placeholder="e.g. 500" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Initial Odometer (km)</label>
              <input name="odometer" type="number" placeholder="e.g. 12000" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Acquisition Cost ($)</label>
              <input name="acquisition_cost" type="number" step="0.01" placeholder="e.g. 35000.00" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Initial Asset Status</label>
              <select name="status" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors">
                <option value="Available">Available</option>
                <option value="On Trip">On Trip</option>
                <option value="In Shop">In Shop</option>
                <option value="Retired">Retired</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-[#FF7A1A] to-[#FF9A4D] hover:from-[#FF8A33] hover:to-[#FFAA66] text-white font-bold p-3 rounded-lg text-sm transition-all active:scale-[0.98] shadow-lg shadow-[#FF7A1A]/20 cursor-pointer">
              Commit Asset to Registry
            </button>
          </form>
        </div>

        {/* Output Data Table */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="op-card bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap gap-3 items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <Filter size={14} className="text-[#FF7A1A]" /> Filter Ledger
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <select value={localTypeFilter} onChange={(e) => setLocalTypeFilter(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-[#FF7A1A] text-slate-700 font-medium">
                <option value="All">All Types</option>
                <option value="Van">Van</option>
                <option value="Truck">Truck</option>
                <option value="Semi">Semi-Trailer</option>
                <option value="Box Truck">Box Truck</option>
              </select>
              <select value={localStatusFilter} onChange={(e) => setLocalStatusFilter(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-[#FF7A1A] text-slate-700 font-medium">
                <option value="All">All Statuses</option>
                <option value="Available">Available</option>
                <option value="On Trip">On Trip</option>
                <option value="In Shop">In Shop</option>
                <option value="Retired">Retired</option>
              </select>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  placeholder="Search reg. no..." 
                  className="bg-slate-50 border border-slate-200 text-xs rounded-lg pl-8 pr-2.5 py-2 focus:outline-none focus:border-[#FF7A1A] text-slate-700 w-36"
                />
              </div>
            </div>
          </div>

          <div className="op-card bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-xs uppercase text-slate-500 tracking-wider">Registered Assets</span>
              <span className="op-mono text-[11px] text-slate-400">{computedFilteredVehicles.length} matched</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider">
                    <th className="p-4 font-semibold">Reg Code</th>
                    <th className="p-4 font-semibold">Model / Type</th>
                    <th className="p-4 font-semibold text-right">Max Cap</th>
                    <th className="p-4 font-semibold text-right">Odometer</th>
                    <th className="p-4 font-semibold text-right">Acq. Cost</th>
                    <th className="p-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {computedFilteredVehicles.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-10 text-center text-slate-400 font-medium">No registered assets found matching selection scope.</td>
                    </tr>
                  ) : (
                    computedFilteredVehicles.map(v => (
                      <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <span className="text-[11px] bg-slate-900 px-2 py-0.5 rounded op-mono text-slate-200">{v.license_plate}</span>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{v.name}</div>
                          <div className="text-xs text-slate-400">{v.type || 'Unspecified'}</div>
                        </td>
                        <td className="p-4 text-right font-medium text-slate-700">{v.max_load_kg} kg</td>
                        <td className="p-4 text-right text-slate-500 op-mono">{Number(v.odometer).toLocaleString()} km</td>
                        <td className="p-4 text-right text-slate-600 font-mono">${Number(v.acquisition_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${statusBadge(v.status)}`}>
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
    </div>
  );
}