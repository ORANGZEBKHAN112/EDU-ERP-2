import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  icon?: React.ReactNode;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  message, 
  onRetry, 
  icon = <AlertCircle className="text-red-500" size={48} /> 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in zoom-in duration-300">
      <div className="p-4 bg-white rounded-full shadow-sm border border-slate-100 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">Oops! Something went wrong</h3>
      <p className="text-slate-500 max-w-xs mb-6 font-medium">{message}</p>
      {onRetry && (
        <Button 
          onClick={onRetry}
          variant="outline"
          className="font-bold gap-2 hover:bg-white hover:text-emerald-600 border-slate-200"
        >
          <RefreshCw size={16} />
          Try Again
        </Button>
      )}
    </div>
  );
};
