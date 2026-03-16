import React from 'react';
import { Users, Heart, Server, Database } from 'lucide-react';
import { Badge } from './UI';

const Ledger = ({ patients, donors, apiConnected }) => {
    return (
        <div className="max-w-4xl">
            <h2 className="text-3xl font-bold text-[#064e3b] font-heading mb-10 tracking-tight">On-Chain Ledger</h2>

            {/* Patients Section */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" /> Patients ({patients.length})
                </h3>
                <div className="space-y-2">
                    {patients.length === 0 ? (
                        <p className="text-slate-400 text-sm">No patients on ledger</p>
                    ) : patients.map(p => (
                        <div key={p.id} className="p-4 bg-slate-50 rounded-xl flex items-center justify-between border hover:bg-white hover:shadow-sm transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <span className="font-mono text-sm font-bold text-slate-700">{p.id}</span>
                                    <span className="text-xs text-slate-500 ml-2">| {p.bloodType} | {p.organNeeded}</span>
                                </div>
                            </div>
                            <Badge status={p.status} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Donors Section */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-emerald-500" /> Donors ({donors.length})
                </h3>
                <div className="space-y-2">
                    {donors.length === 0 ? (
                        <p className="text-slate-400 text-sm">No donors on ledger</p>
                    ) : donors.map(d => (
                        <div key={d.id} className="p-4 bg-slate-50 rounded-xl flex items-center justify-between border hover:bg-white hover:shadow-sm transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                    <Heart className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <span className="font-mono text-sm font-bold text-slate-700">{d.id}</span>
                                    <span className="text-xs text-slate-500 ml-2">| {d.bloodType || 'N/A'}</span>
                                    {d.name && <span className="text-xs text-slate-500 ml-2">| {d.name}</span>}
                                    <div className="flex gap-1 mt-1">
                                        {(d.organsAvailable || []).map(o => (
                                            <span key={o} className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100">{o}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <Badge status={d.verificationStatus || 'PENDING_VERIFICATION'} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Network Info */}
            <div className="p-6 bg-gradient-to-r from-slate-50 to-emerald-50 rounded-2xl border">
                <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <Server className="w-5 h-5 text-indigo-500" /> Network Status
                </h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 bg-white rounded-xl border">
                        <div className="text-2xl font-bold text-slate-800">{patients.length + donors.length}</div>
                        <div className="text-xs text-slate-500">Total Records</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-xl border">
                        <div className="text-2xl font-bold text-emerald-600">organchannel</div>
                        <div className="text-xs text-slate-500">Channel</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-xl border">
                        <div className={`text-2xl font-bold ${apiConnected ? 'text-emerald-600' : 'text-red-500'}`}>
                            {apiConnected ? 'Online' : 'Offline'}
                        </div>
                        <div className="text-xs text-slate-500">Peer Status</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Ledger;
