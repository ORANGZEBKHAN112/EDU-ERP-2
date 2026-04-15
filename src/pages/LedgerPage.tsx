import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ledgerApi } from '../api/ledgerApi';
import { studentApi } from '../api/studentApi';
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Loader2, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Wallet
} from 'lucide-react';
import { toast } from 'sonner';

export const LedgerPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [ledger, setLedger] = useState<any[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) return;
      setIsLoading(true);
      setError(null);
      try {
        const [ledgerData, studentData] = await Promise.all([
          ledgerApi.getStudentLedger(parseInt(studentId)),
          studentApi.getById(parseInt(studentId))
        ]);
        setLedger(ledgerData);
        setStudent(studentData);
      } catch (err) {
        setError('Failed to load ledger data');
        toast.error('Failed to load ledger');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [studentId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="p-6 bg-red-50 border border-red-100 rounded-xl text-red-600 flex items-center gap-3">
        <AlertCircle size={20} />
        <p>{error || 'Student not found'}</p>
      </div>
    );
  }

  const currentBalance = ledger.length > 0 ? ledger[ledger.length - 1].runningBalance : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/students')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Student Ledger</h1>
            <p className="text-slate-500 text-sm">Financial statement for {student.fullName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
            <Printer size={16} />
            Print
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <Download size={16} />
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Student Details</p>
          <p className="text-lg font-bold text-slate-900">{student.fullName}</p>
          <p className="text-sm text-slate-500">{student.className} | {student.campusName}</p>
          <p className="text-xs text-slate-400 mt-2 font-mono">ID: {student.admissionNo}</p>
        </div>
        
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Current Balance</p>
          <div className="flex items-end gap-2">
            <p className={`text-3xl font-black ${currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ${Math.abs(currentBalance).toLocaleString()}
            </p>
            <p className="text-sm font-bold text-slate-400 mb-1 uppercase">
              {currentBalance > 0 ? 'Payable' : 'Credit'}
            </p>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Transactions</p>
            <p className="text-xl font-bold text-slate-900">{ledger.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Debit (+)</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Credit (-)</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    No transactions found for this student.
                  </td>
                </tr>
              ) : (
                ledger.map((entry, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        entry.type === 'Voucher' ? 'bg-blue-100 text-blue-700' :
                        entry.type === 'Payment' ? 'bg-green-100 text-green-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {entry.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{entry.description}</td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-red-600">
                      {entry.debit > 0 ? `+${entry.debit.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-green-600">
                      {entry.credit > 0 ? `-${entry.credit.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-bold text-slate-900">
                      ${entry.runningBalance.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
