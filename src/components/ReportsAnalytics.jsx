import React from 'react';
import { Download } from 'lucide-react';

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tight">System Performance Analytics</h2>
          <p className="text-slate-400 text-sm">Dynamic evaluation formulas and metric logs calculation.</p>
        </div>
        <button onClick={exportFleetDataCSV} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs p-3 rounded-xl flex items-center gap-2 transition-all shadow-md">
          <Download size={14} /> Export CSV Matrix Ledger
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
              <th className="p-4 font-semibold">Fleet Asset</th>
              <th className="p-4 font-semibold text-right">Fuel Consumed</th>
              <th className="p-4 font-semibold text-right">Maintenance Book</th>
              <th className="p-4 font-semibold text-right">Estimated Revenue</th>
              <th className="p-4 font-semibold text-center">Calculated Asset ROI (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-sm">
            // Replace your existing vehicles.map loop inside src/components/ReportsAnalytics.jsx with this fully loaded metric row layout:

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
              <tr key={v.id} className="hover:bg-slate-800/20 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-white">{v.name}</div>
                  <div className="text-xs text-slate-500 font-mono">{v.license_plate}</div>
                </td>
                <td className="p-4 text-right text-slate-300 font-mono">
                  <div>${fuelCost.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-500">{fuelEfficiency} km/L</div>
                </td>
                <td className="p-4 text-right text-slate-300 font-mono">${maintCost.toFixed(2)}</td>
                <td className="p-4 text-right text-emerald-400 font-mono">${calculatedRevenue.toFixed(2)}</td>
                <td className="p-4 text-center font-bold">
                  <span className={`px-3 py-1 rounded-full font-mono text-xs ${assetROI >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
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