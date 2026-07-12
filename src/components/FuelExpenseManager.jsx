import React from 'react';
import { supabase } from '../supabaseClient';
import { Fuel, Receipt } from 'lucide-react';

export default function FuelExpenseManager({ vehicles, trips, fuelLogs, expenses, refreshData }) {
  const handleLogFuel = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const { error } = await supabase.from('fuel_logs').insert([{
      vehicle_id: formData.get('vehicle_id'),
      liters: parseFloat(formData.get('liters')),
      cost: parseFloat(formData.get('cost')),
      log_date: formData.get('log_date')
    }]);
    if (!error) { e.target.reset(); refreshData(); }
  };

  const handleLogExpense = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const { error } = await supabase.from('expenses').insert([{
      vehicle_id: formData.get('vehicle_id'),
      type: formData.get('type'),
      amount: parseFloat(formData.get('amount')),
      log_date: formData.get('log_date')
    }]);
    if (!error) { e.target.reset(); refreshData(); }
  };

  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-colors";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[28px] font-extrabold tracking-tight text-slate-900">Fuel & Expense Operations</h2>
        <p className="text-slate-500 text-sm mt-1">Record fuel fills and ancillary costs against fleet assets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="op-card bg-white border border-slate-200 p-6 rounded-2xl">
          <h3 className="text-[15px] font-bold text-slate-900 mb-5 flex items-center gap-2">
            <Fuel size={16} className="text-[#FF7A1A]" /> Log Fuel Allocation
          </h3>
          <form onSubmit={handleLogFuel} className="space-y-4">
            <select name="vehicle_id" required className={`${inputClass} focus:border-[#FF7A1A] focus:bg-white`}>
              <option value="">-- Choose Asset --</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.license_plate})</option>)}
            </select>
            <input name="liters" type="number" step="0.01" placeholder="Volume in Liters" required className={`${inputClass} focus:border-[#FF7A1A] focus:bg-white`} />
            <input name="cost" type="number" step="0.01" placeholder="Total Cost ($)" required className={`${inputClass} focus:border-[#FF7A1A] focus:bg-white`} />
            <input name="log_date" type="date" required className={`${inputClass} focus:border-[#FF7A1A] focus:bg-white`} />
            <button type="submit" className="w-full bg-gradient-to-r from-[#FF7A1A] to-[#FF9A4D] hover:from-[#FF8A33] hover:to-[#FFAA66] text-white font-bold p-3 rounded-lg text-sm transition-all active:scale-[0.98] shadow-lg shadow-[#FF7A1A]/20">
              Record Fuel Entry
            </button>
          </form>
        </div>

        <div className="op-card bg-white border border-slate-200 p-6 rounded-2xl">
          <h3 className="text-[15px] font-bold text-slate-900 mb-5 flex items-center gap-2">
            <Receipt size={16} className="text-indigo-500" /> Log Operational Expense
          </h3>
          <form onSubmit={handleLogExpense} className="space-y-4">
            <select name="vehicle_id" required className={`${inputClass} focus:border-indigo-400 focus:bg-white`}>
              <option value="">-- Choose Asset --</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.license_plate})</option>)}
            </select>
            <select name="type" className={`${inputClass} focus:border-indigo-400 focus:bg-white`}>
              <option value="Toll">Toll Fee</option>
              <option value="Fines">Regulatory Fine</option>
              <option value="Other">Other Ancillary Cost</option>
            </select>
            <input name="amount" type="number" step="0.01" placeholder="Amount ($)" required className={`${inputClass} focus:border-indigo-400 focus:bg-white`} />
            <input name="log_date" type="date" required className={`${inputClass} focus:border-indigo-400 focus:bg-white`} />
            <button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-bold p-3 rounded-lg text-sm transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/20">
              Record Expense Entry
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
