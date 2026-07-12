import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Fuel, Receipt, Plus } from 'lucide-react';

// 1. Added activeCurrencySymbol prop
export default function FuelExpenseManager({ vehicles, trips, fuelLogs, expenses, refreshData, activeCurrencySymbol = '$' }) {
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const todayString = new Date().toISOString().split('T')[0];

  const handleLogFuel = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const { error } = await supabase.from('fuel_logs').insert([{
      vehicle_id: formData.get('vehicle_id'),
      liters: parseFloat(formData.get('liters')),
      cost: parseFloat(formData.get('cost')),
      log_date: formData.get('log_date')
    }]);
    if (!error) { 
      e.target.reset(); 
      setShowFuelForm(false);
      refreshData(); 
    }
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
    if (!error) { 
      e.target.reset(); 
      setShowExpenseForm(false);
      refreshData(); 
    }
  };

  const totalFuelOperationalCost = fuelLogs.reduce((sum, f) => sum + (Number(f.cost) || 0), 0);
  const totalMiscOperationalCost = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const aggregateSystemOperationalCost = totalFuelOperationalCost + totalMiscOperationalCost;

  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-colors";

  return (
    <div className="space-y-6">
      {/* ... header and form logic remain same ... */}
      
      {/* TABLE 1: FUEL LOGS */}
      <div className="op-card bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">FUEL LOGS</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/40 border-b border-slate-200 text-slate-400 text-[11px] uppercase font-bold tracking-wider">
                <th className="p-4">VEHICLE</th>
                <th className="p-4">DATE</th>
                <th className="p-4">LITERS</th>
                <th className="p-4 text-right">FUEL COST</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {fuelLogs.map((fl, index) => {
                const v = vehicles.find(veh => veh.id === fl.vehicle_id);
                return (
                  <tr key={fl.id || index} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{v ? v.license_plate : 'VAN-05'}</td>
                    <td className="p-4 text-slate-500">{fl.log_date || '05 Jul 2026'}</td>
                    <td className="p-4 font-mono">{fl.liters} L</td>
                    {/* UPDATED: Dynamic Currency */}
                    <td className="p-4 text-right font-mono text-slate-900 font-bold">{activeCurrencySymbol}{Number(fl.cost || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLE 2: OTHER EXPENSES */}
      <div className="op-card bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">OTHER EXPENSES (TOLL / MISC)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/40 border-b border-slate-200 text-slate-400 text-[11px] uppercase font-bold tracking-wider">
                <th className="p-4">TRIP</th>
                <th className="p-4">VEHICLE</th>
                <th className="p-4 text-right">TOLL</th>
                <th className="p-4 text-right">OTHER</th>
                <th className="p-4 text-center">STATUS</th> 
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {expenses.map((exp, index) => {
                const v = vehicles.find(veh => veh.id === exp.vehicle_id);
                return (
                  <tr key={exp.id || index} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-slate-400 font-mono text-xs">TRK-{101 + index}</td>
                    <td className="p-4 font-bold text-slate-900">{v ? v.license_plate : 'TRK-12'}</td>
                    {/* UPDATED: Dynamic Currency */}
                    <td className="p-4 text-right font-mono">{activeCurrencySymbol}{exp.type === 'Toll' ? exp.amount : 0}</td>
                    <td className="p-4 text-right font-mono">{activeCurrencySymbol}{exp.type !== 'Toll' ? exp.amount : 0}</td>
                    <td className="p-4 text-center">
                      <span className="inline-block bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded text-[11px] uppercase tracking-wide">Available</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* BOTTOM AUTOMATIC AGGREGATE LEDGER */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between font-bold text-xs uppercase tracking-wider font-mono">
          <span>TOTAL OPERATIONAL COST (AUTO) = FUEL + MISC</span>
          {/* UPDATED: Dynamic Currency */}
          <span className="text-[#FF7A1A] text-lg font-extrabold">
            {activeCurrencySymbol}{aggregateSystemOperationalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
    </div>
  );
}