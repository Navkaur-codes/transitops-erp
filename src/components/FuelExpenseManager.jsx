import React from 'react';
import { supabase } from '../supabaseClient';

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

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black tracking-tight">Fuel & Expense Operations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <h3 className="text-lg font-bold mb-4 text-emerald-400">Log Fuel Allocation</h3>
          <form onSubmit={handleLogFuel} className="space-y-4">
            <select name="vehicle_id" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white">
              <option value="">-- Choose Asset --</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.license_plate})</option>)}
            </select>
            <input name="liters" type="number" step="0.01" placeholder="Volume in Liters" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm" />
            <input name="cost" type="number" step="0.01" placeholder="Total Cost ($)" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm" />
            <input name="log_date" type="date" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white" />
            <button type="submit" className="w-full bg-emerald-600 p-3 rounded-lg text-sm font-bold">Record Fuel Entry</button>
          </form>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <h3 className="text-lg font-bold mb-4 text-indigo-400">Log Operational Expense</h3>
          <form onSubmit={handleLogExpense} className="space-y-4">
            <select name="vehicle_id" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white">
              <option value="">-- Choose Asset --</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.license_plate})</option>)}
            </select>
            <select name="type" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white">
              <option value="Toll">Toll Fee</option>
              <option value="Fines">Regulatory Fine</option>
              <option value="Other">Other Ancillary Cost</option>
            </select>
            <input name="amount" type="number" step="0.01" placeholder="Amount ($)" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm" />
            <input name="log_date" type="date" required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white" />
            <button type="submit" className="w-full bg-indigo-600 p-3 rounded-lg text-sm font-bold">Record Expense Entry</button>
          </form>
        </div>
      </div>
    </div>
  );
}