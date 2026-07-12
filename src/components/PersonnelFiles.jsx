import React from 'react';
import { supabase } from '../supabaseClient';

export default function PersonnelFiles({ drivers, refreshData }) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const contactNumber = formData.get('contact_number').trim();

    // Strict Validation Rule: Ensure phone numbers are between 7 to 15 digits 
    // and only contain digits, spaces, dashes, or a leading '+' sign.
    const phoneRegex = /^\+?[0-9\s\-]{7,15}$/;
    
    if (!phoneRegex.test(contactNumber)) {
      alert("Validation Error: Please enter a valid phone number (between 7 to 15 digits long). Short codes or 3-digit values are restricted.");
      return; // Halts execution, preventing database insertions
    }

    const newDriver = {
      name: formData.get('name'),
      license_number: formData.get('license_number'),
      license_category: formData.get('license_category'),
      license_expiry_date: formData.get('license_expiry_date'),
      contact_number: contactNumber,
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

  const statusBadge = (status) => {
    switch (status) {
      case 'Expired': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Available': return 'bg-emerald-50 text-emerald-600';
      case 'On Trip': return 'bg-sky-50 text-sky-600';
      case 'Suspended': return 'bg-red-50 text-red-600';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[28px] font-extrabold tracking-tight text-slate-900">Driver Management</h2>
        <p className="text-slate-500 text-sm mt-1">Onboard operators and track license & safety compliance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Advanced Driver Registration Form */}
        <div className="op-card bg-white border border-slate-200 p-6 rounded-2xl h-fit">
          <h3 className="text-[15px] font-bold text-slate-900 mb-5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A1A]" /> Register Operator Profile
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Driver Full Name</label>
              <input name="name" type="text" placeholder="e.g. Alex" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">License Number (Unique)</label>
              <input name="license_number" type="text" placeholder="e.g. CDL-7789" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">License Category</label>
              <select name="license_category" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors">
                <option value="Class A CDL">Class A CDL</option>
                <option value="Class B CDL">Class B CDL</option>
                <option value="Standard Fleet">Standard Fleet Permit</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">License Expiry Date</label>
              <input name="license_expiry_date" type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Contact Phone Number</label>
              <input name="contact_number" type="tel" placeholder="e.g. +1 555-0199" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Initial Safety Compliance Score (0 - 100)</label>
              <input name="safety_score" type="number" min="0" max="100" placeholder="100" defaultValue="100" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Duty Status</label>
              <select name="status" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:border-[#FF7A1A] focus:bg-white transition-colors">
                <option value="Available">Available</option>
                <option value="On Trip">On Trip</option>
                <option value="Off Duty">Off Duty</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-[#FF7A1A] to-[#FF9A4D] hover:from-[#FF8A33] hover:to-[#FFAA66] text-white font-bold p-3 rounded-lg text-sm transition-all active:scale-[0.98] shadow-lg shadow-[#FF7A1A]/20">
              Commit Profile to Ledger
            </button>
          </form>
        </div>

        {/* Output Table View */}
        <div className="lg:col-span-2">
          <div className="op-card bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-xs uppercase text-slate-500 tracking-wider">Registered Operators</span>
              <span className="op-mono text-[11px] text-slate-400">{drivers.length} total</span>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider">
                  <th className="p-4 font-semibold">Operator Info</th>
                  <th className="p-4 font-semibold">License details</th>
                  <th className="p-4 font-semibold text-right">Safety</th>
                  <th className="p-4 font-semibold text-center">Duty Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {drivers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-10 text-center text-slate-400 font-medium">No registered operators found.</td>
                  </tr>
                ) : (
                  drivers.map(d => {
                    const isExpired = d.license_expiry_date ? new Date(d.license_expiry_date) < new Date() : false;
                    const effectiveStatus = isExpired ? 'Expired' : d.status;

                    return (
                      <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{d.name}</div>
                          <div className="text-xs text-slate-400">{d.contact_number}</div>
                        </td>
                        <td className="p-4">
                          <span className="text-[11px] bg-slate-900 px-2 py-0.5 rounded op-mono text-slate-200">{d.license_number}</span>
                          <div className={`text-[11px] mt-1 ${isExpired ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                            {d.license_category} • Exp: {d.license_expiry_date} {isExpired && '⚠️'}
                          </div>
                        </td>
                        <td className="p-4 text-right op-mono font-bold text-slate-700">{d.safety_score}/100</td>
                        <td className="p-4 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${statusBadge(effectiveStatus)}`}>
                            {effectiveStatus}
                          </span>
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
  );
}