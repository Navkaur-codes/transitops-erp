import React from 'react';
import { supabase } from '../supabaseClient';

export default function PersonnelFiles({ drivers, refreshData }) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newDriver = {
      name: formData.get('name'),
      license_number: formData.get('license_number'),
      license_category: formData.get('license_category'),
      license_expiry_date: formData.get('license_expiry_date'),
      contact_number: formData.get('contact_number'),
      safety_score: parseFloat(formData.get('safety_score')) || 100,
      status: formData.get('status') || 'Available'
    };

    const { error } = await supabase.from('drivers').insert([newDriver]);
    if (error) {
      alert("Database Error: " + error.message);
    } else {
      e.target.reset();
      refreshData();
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-extrabold tracking-tight mb-8">Driver Management</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Advanced Driver Registration Form */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-md h-fit">
          <h3 className="text-xl font-bold mb-4 text-emerald-400">Register Operator Profile</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Driver Full Name</label>
              <input name="name" type="text" placeholder="e.g. Alex" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">License Number (Unique)</label>
              <input name="license_number" type="text" placeholder="e.g. CDL-7789" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">License Category</label>
              <select name="license_category" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors text-white">
                <option value="Class A CDL">Class A CDL</option>
                <option value="Class B CDL">Class B CDL</option>
                <option value="Standard Fleet">Standard Fleet Permit</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">License Expiry Date</label>
              <input name="license_expiry_date" type="date" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Contact Phone Number</label>
              <input name="contact_number" type="tel" placeholder="e.g. +1 555-0199" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Initial Safety Compliance Score (0 - 100)</label>
              <input name="safety_score" type="number" min="0" max="100" placeholder="100" defaultValue="100" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Duty Status Status</label>
              <select name="status" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors text-white">
                <option value="Available">Available</option>
                <option value="On Trip">On Trip</option>
                <option value="Off Duty">Off Duty</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3 rounded-lg text-sm transition-colors shadow-sm">
              Commit Profile to Ledger
            </button>
          </form>
        </div>

        {/* Output Table View */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Operator Info</th>
                  <th className="p-4 font-semibold">License details</th>
                  <th className="p-4 font-semibold text-right">Safety</th>
                  <th className="p-4 font-semibold text-center">Duty Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {drivers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-slate-500 font-medium">No registered operators found.</td>
                  </tr>
                ) : (
                  drivers.map(d => (
                    <tr key={d.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white">{d.name}</div>
                        <div className="text-xs text-slate-400">{d.contact_number}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-mono text-xs text-emerald-400">{d.license_number}</div>
                        <div className="text-[11px] text-slate-400">{d.license_category} • Exp: {d.license_expiry_date}</div>
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-slate-300">{d.safety_score}/100</td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          d.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          d.status === 'On Trip' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          d.status === 'Suspended' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}>
                          {d.status}
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