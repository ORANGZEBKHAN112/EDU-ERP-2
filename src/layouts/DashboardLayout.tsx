import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/shared/Sidebar';
import { Header } from '../components/shared/Header';

export const DashboardLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
