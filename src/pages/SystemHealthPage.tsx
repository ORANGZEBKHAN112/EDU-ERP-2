import React from 'react';

export const SystemHealthPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">System Status & Health</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Event Processor
          </h3>
          <p className="text-sm text-slate-500 font-mono">Status: Operational</p>
        </div>
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Database Connection
          </h3>
          <p className="text-sm text-slate-500 font-mono">Status: Connected (Latency: 12ms)</p>
        </div>
      </div>
    </div>
  );
};
