import React from 'react';
import { Download, TrendingUp } from 'lucide-react';

export default function ReportsAnalytics({ vehicles, trips, fuelLogs, expenses, maintenanceLogs }) {
  
  // Dynamic CSV data compilation engine
  const exportFleetDataCSV = () => {
    let csvRows = [["Asset Name", "Plate", "Type", "Fuel Expenses ($)", "Maintenance Expenses ($)", "Total Revenue ($)", "Calculated ROI Status"]];
    
    vehicles.forEach(v => {
      const fleetFuelCost = fuelLogs.filter(f => f.vehicle_id === v.id).reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
      const fleetMaintCost = maintenanceLogs.filter(m => m.vehicle_id === v.id).reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
      
      // Calculate revenue index from completed manifests ($12.50 per cargo ton-km factor)
      const assetTrips = trips.filter(t => t.vehicle_id === v.id && t.status === 'Completed');
      const calculatedRevenue = assetTrips.reduce((sum, t) => sum + ((Number(t.cargo_weight_kg) / 1000) * Number(t.planned_distance) * 12.5), 0);
      
      const acqCost = Number(v.acquisition_cost) || 1; 
      const calculatedROI = ((calculatedRevenue - (fleetMaintCost + fleetFuelCost)) / acqCost) * 100;

      csvRows.push([
        v.name, v.license_plate, v.type || 'N/A', 
        fleetFuelCost.toFixed(2), fleetMaintCost.toFixed(2), 
        calculatedRevenue.toFixed(2), `${calculatedROI.toFixed(1)}%`
      ]);
    });

    const csvString = csvRows.map(row => row.map(val => `"${val}"`).join(",")).join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "TransitOps_Fleet_Analytics_2026.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div>
          <h2 className="text-[28px] font-extrabold tracking-tight text-slate-900">System Performance Analytics</h2>
          <p className="text-slate-500 text-sm mt-1">Dynamic evaluation formulas and metric logs calculation.</p>
        </div>
        <button onClick={exportFleetDataCSV} className="bg-gradient-to-r from-[#FF7A1A] to-[#FF9A4D] hover:from-[#FF8A33] hover:to-[#FFAA66] text-white font-bold text-xs px-4 py-3 rounded-xl flex items-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#FF7A1A]/20">
          <Download size={14} /> Export CSV Matrix Ledger
        </button>
      </div>

      <div className="op-card bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="font-bold text-xs uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
            <TrendingUp size={13} className="text-[#FF7A1A]" /> Per-Asset Financial Breakdown
          </span>
          <span className="op-mono text-[11px] text-slate-400">{vehicles.length} assets</span>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/60 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider">
              <th className="p-4 font-semibold">Fleet Asset</th>
              <th className="p-4 font-semibold text-right">Fuel Consumed</th>
              <th className="p-4 font-semibold text-right">Maintenance Book</th>
              <th className="p-4 font-semibold text-right">Estimated Revenue</th>
              <th className="p-4 font-semibold text-center">Calculated Asset ROI (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">

          {vehicles.map(v => {
            const fuelRows = fuelLogs.filter(f => f.vehicle_id === v.id);
            const totalLiters = fuelRows.reduce((sum, item) => sum + (Number(item.liters) || 0), 0);
            const fuelCost = fuelRows.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
            const maintCost = maintenanceLogs.filter(m => m.vehicle_id === v.id).reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
            
            const assetTrips = trips.filter(t => t.vehicle_id === v.id && t.status === 'Completed');
            const totalDistance = assetTrips.reduce((sum, t) => sum + (Number(t.planned_distance) || 0), 0);
            const calculatedRevenue = assetTrips.reduce((sum, t) => sum + ((Number(t.cargo_weight_kg) / 1000) * Number(t.planned_distance) * 12.5), 0);
            
            const acqCost = Number(v.acquisition_cost) || 1;
            const assetROI = ((calculatedRevenue - (maintCost + fuelCost)) / acqCost) * 100;
            
            // Calculate dynamic Fuel Efficiency (Distance / Fuel Liters)
            const fuelEfficiency = totalLiters > 0 ? (totalDistance / totalLiters).toFixed(1) : "0.0";

            return (
              <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-slate-900">{v.name}</div>
                  <span className="text-[11px] bg-slate-900 px-2 py-0.5 rounded op-mono text-slate-200 inline-block mt-1">{v.license_plate}</span>
                </td>
                <td className="p-4 text-right text-slate-700 op-mono">
                  <div>${fuelCost.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-400">{fuelEfficiency} km/L</div>
                </td>
                <td className="p-4 text-right text-slate-700 op-mono">${maintCost.toFixed(2)}</td>
                <td className="p-4 text-right text-emerald-600 op-mono font-semibold">${calculatedRevenue.toFixed(2)}</td>
                <td className="p-4 text-center font-bold">
                  <span className={`px-3 py-1 rounded-full op-mono text-xs ${assetROI >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {assetROI.toFixed(1)}%
                  </span>
                </td>
              </tr>
            );
          })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
