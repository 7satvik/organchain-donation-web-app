import React from 'react';

export const Card = ({ children, className = "", onClick }) => (
    <div onClick={onClick} className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
        {children}
    </div>
);

export const Badge = ({ status }) => {
    const styles = {
        WAITING: "bg-amber-100 text-amber-700 border-amber-200",
        MATCHED: "bg-emerald-100 text-emerald-700 border-emerald-200",
        REGISTERED: "bg-blue-100 text-blue-700 border-blue-200",
        AVAILABLE: "bg-emerald-100 text-emerald-700 border-emerald-200",
        PENDING_VERIFICATION: "bg-yellow-100 text-yellow-700 border-yellow-200",
        VERIFIED: "bg-emerald-100 text-emerald-700 border-emerald-200",
        REJECTED: "bg-red-100 text-red-700 border-red-200",
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || "bg-gray-100"}`}>
            {status?.replace(/_/g, ' ')}
        </span>
    );
};
