
import React from 'react';

// --- Button ---
export const Button = ({ 
  children, variant = 'primary', size = 'md', isLoading, icon: Icon, className = '', ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm",
    secondary: "bg-slate-800 text-white hover:bg-slate-900 focus:ring-slate-500 shadow-sm",
    outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-500",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-500"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : Icon ? <Icon className="w-4 h-4 mr-2" /> : null}
      {children}
    </button>
  );
};

// --- Input ---
export const Input = ({ label, error, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
      <input
        className={`w-full rounded-lg border ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'} bg-slate-50 px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-shadow ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

// --- Card ---
export const Card = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${onClick ? 'cursor-pointer hover:border-blue-300 transition-colors' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

// --- Badge ---
export const Badge = ({ children, color = 'gray' }) => {
  const colors = {
    green: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    yellow: "bg-amber-100 text-amber-800 border border-amber-200",
    red: "bg-rose-100 text-rose-800 border border-rose-200",
    blue: "bg-blue-100 text-blue-800 border border-blue-200",
    gray: "bg-slate-100 text-slate-800 border border-slate-200",
    purple: "bg-purple-100 text-purple-800 border border-purple-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
};

// --- Container ---
export const Container = ({ children, className = '' }) => (
  <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
    {children}
  </div>
);
