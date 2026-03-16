import React from 'react';
import { Users, Activity, Database, ShieldCheck, Server, Link as LinkIcon } from 'lucide-react';

const Dashboard = ({ patients, donors }) => {
    const stats = [
        { label: 'Total Patients', value: patients.length, icon: Users, color: 'text-[#10b981]', bg: 'bg-[#10b981]/5' },
        { label: 'Active Donors', value: donors.length, icon: Activity, color: 'text-[#059669]', bg: 'bg-[#059669]/5' },
        { label: 'Pending Matches', value: patients.filter(p => p.status === 'WAITING').length, icon: Database, color: 'text-[#f59e0b]', bg: 'bg-[#f59e0b]/5' },
        { label: 'Successful Matches', value: patients.filter(p => p.status === 'MATCHED').length, icon: ShieldCheck, color: 'text-[#ef4444]', bg: 'bg-[#ef4444]/5' },
    ];

    return (
        <div className="space-y-12 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((stat, idx) => (
                    <div key={idx} className="p-8 bg-white rounded-[24px] border border-slate-100 shadow-sm flex flex-col items-start gap-4 hover:shadow-md transition-all">
                        <div className={`p-4 rounded-2xl ${stat.bg}`}>
                            <stat.icon className={`w-7 h-7 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-[#5f6368] uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-4xl font-bold text-[#1f1f1f] font-heading tracking-tight">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-50 rounded-3xl p-8 border border-white">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center font-heading">
                        <Server className="w-6 h-6 mr-3 text-indigo-500" />
                        Network Status
                    </h3>
                    <div className="space-y-5">
                        <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-3">
                            <span className="text-slate-500 font-medium">Peer Status</span>
                            <span className="text-emerald-600 font-bold flex items-center"><span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>Online (Peer0.Org1)</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-3">
                            <span className="text-slate-500 font-medium">Channel Height</span>
                            <span className="font-mono font-bold text-slate-700">Block #14,203</span>
                        </div>
                        <div className="flex justify-between items-center text-sm pb-1">
                            <span className="text-slate-500 font-medium">Chaincode Version</span>
                            <span className="font-mono font-bold text-slate-700 bg-white px-2 py-1 rounded border">v1.4.2-STABLE</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-3xl p-8 border border-white">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center font-heading">
                        <LinkIcon className="w-6 h-6 mr-3 text-indigo-500" />
                        Ledger Events
                    </h3>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center text-sm p-4 bg-white rounded-2xl shadow-sm border border-slate-100 group hover:border-indigo-200 transition-colors">
                                <div className="flex-1">
                                    <p className="font-bold text-slate-700">Tx: {`8f43...a${i}2`}</p>
                                    <p className="text-xs text-slate-400 font-medium">Invoked: CreatePatientRecord</p>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-400 transition-colors uppercase tracking-widest">{i * 2} min ago</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
