import React from 'react';

export default function SettingsConfig({ activeCurrencySymbol, setActiveCurrencySymbol }) {
  const rbacMatrix = [
    { role: 'Fleet Manager', fleet: '✓', drivers: '✓', trips: '—', fuel: '—', analytics: '✓' },
    { role: 'Dispatcher', fleet: 'View', drivers: '—', trips: '✓', fuel: '—', analytics: '—' },
    { role: 'Safety Officer', fleet: '—', drivers: '✓', trips: 'View', fuel: '—', analytics: '—' },
    { role: 'Financial Analyst', fleet: 'View', drivers: '—', trips: '—', fuel: '✓', analytics: '✓' }
  ];

  const handleSaveGeneralSettings = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const selectedCurrencyType = formData.get('currency_selection');
    
    // Set the global symbol dynamically based on selection
    if (selectedCurrencyType === 'INR') {
      setActiveCurrencySymbol('₹');
    } else {
      setActiveCurrencySymbol('$');
    }
    
    alert(`Configuration updated! System currency updated globally to ${selectedCurrencyType}.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[28px] font-extrabold tracking-tight text-slate-900">System Settings & Governance</h2>
        <p className="text-slate-500 text-sm mt-1">Configure global local defaults and review structural workspace parameters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT PANEL: GENERAL METADATA CONFIGURATION */}
        <div className="lg:col-span-1 bg-white border border-slate-200 p-6 rounded-2xl h-fit shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-5">
            GENERAL
          </h3>
          
          <form onSubmit={handleSaveGeneralSettings} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Depot Name</label>
              <input type="text" name="depot_name" defaultValue="Gandhinagar Depot GJ4" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:border-[#FF7A1A] transition-colors" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Currency Setup</label>
              <select 
                name="currency_selection" 
                defaultValue={activeCurrencySymbol === '₹' ? 'INR' : 'USD'}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:border-[#FF7A1A] transition-colors"
              >
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Distance Unit</label>
              <input type="text" name="distance_unit" defaultValue="Kilometers" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:border-[#FF7A1A] transition-colors" />
            </div>
            
            <button type="submit" className="w-fit bg-[#4A86E8] hover:bg-[#356AC3] text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors shadow-sm cursor-pointer">
              Save changes
            </button>
          </form>
        </div>

        {/* RIGHT PANEL: CORE ROLE-BASED ACCESS CONTROL MATRIX GRID */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
          <div>
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">ROLE-BASED ACCESS (RBAC)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/40 border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    <th className="p-4">ROLE</th>
                    <th className="p-4 text-center">FLEET</th>
                    <th className="p-4 text-center">DRIVER</th>
                    <th className="p-4 text-center">TRIPS</th>
                    <th className="p-4 text-center">FUEL/EXP.</th>
                    <th className="p-4 text-center">ANALYTICS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {rbacMatrix.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{row.role}</td>
                      <td className="p-4 text-center font-mono text-xs">{row.fleet}</td>
                      <td className="p-4 text-center font-mono text-xs">{row.drivers}</td>
                      <td className="p-4 text-center font-mono text-xs">{row.trips}</td>
                      <td className="p-4 text-center font-mono text-xs">{row.fuel}</td>
                      <td className="p-4 text-center font-mono text-xs">{row.analytics}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="p-3.5 bg-slate-900 text-white/70 text-[11px] font-mono uppercase tracking-wider text-center border-t border-slate-800">
            Active Security State: Router intercepted via <span className="text-[#FF7A1A] font-bold">session.user.metadata.role</span> criteria.
          </div>
        </div>

      </div>
    </div>
  );
}