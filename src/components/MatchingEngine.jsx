import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Database, Users, Heart, Server, CheckCircle, Search, Loader2 } from 'lucide-react';
import { Card } from './UI';
import { api } from '../api';

const MatchingEngine = ({ donors, patients, setPatients, setDonors, hospitalId, addNotification, canReceiveFrom }) => {
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [matches, setMatches] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);

    const matchSteps = [
        { text: "Verifying Donor Consent Hash...", icon: ShieldCheck },
        { text: "Validating HLA Compatibility...", icon: Activity },
        { text: "Checking Organ Availability...", icon: Heart },
        { text: "Creating Immutable Match Record...", icon: Database },
        { text: "Broadcasting to Fabric Network...", icon: Server },
        { text: "Updating World State Ledger...", icon: Users },
        { text: "Finalizing Transaction...", icon: CheckCircle }
    ];

    useEffect(() => {
        if (isProcessing) {
            setLoadingStep(0);
            const interval = setInterval(() => {
                setLoadingStep(prev => (prev < matchSteps.length - 1 ? prev + 1 : prev));
            }, 800);
            return () => clearInterval(interval);
        }
    }, [isProcessing]);

    // The "Off-Chain" Matching Algorithm
    const runMatching = (patient) => {
        setSelectedPatient(patient);

        const results = donors.map(donor => {
            const isVerified = donor.verificationStatus === 'VERIFIED';
            const isBloodCompatible = canReceiveFrom(patient.bloodType, donor.bloodType);
            const isExactBloodMatch = patient.bloodType === donor.bloodType;
            const isOrganCompatible = (donor.organsAvailable || []).includes(patient.organNeeded);

            const patientHla = (patient.hla || '').split(',').map(s => s.trim());
            const donorHla = (donor.hla || '').split(',').map(s => s.trim());
            const commonAntigens = patientHla.filter(antigen => donorHla.includes(antigen));
            const hlaRawScore = (commonAntigens.length / Math.max(patientHla.length, 1)) * 100;

            const daysWaiting = (new Date() - new Date(patient.createdAt)) / (1000 * 60 * 60 * 24);
            const waitlistScore = Math.min(daysWaiting / 30, 1) * 100;

            let totalScore = 0;
            if (isBloodCompatible && isOrganCompatible && isVerified) {
                totalScore = (hlaRawScore * 0.6) + (waitlistScore * 0.3) + (isExactBloodMatch ? 10 : 0);
            }

            return {
                donorId: donor.id,
                bloodType: donor.bloodType,
                score: totalScore.toFixed(1),
                hlaScore: hlaRawScore.toFixed(0),
                daysWaiting: Math.floor(daysWaiting),
                common: commonAntigens.length,
                compatible: isBloodCompatible && isOrganCompatible && isVerified,
                reason: !isVerified ? 'Donor Not Verified' :
                    (!isBloodCompatible ? 'Blood Mismatch' :
                        (!isOrganCompatible ? 'Organ Mismatch' : 'Compatible'))
            };
        });

        const sorted = results.sort((a, b) => {
            if (a.compatible !== b.compatible) return b.compatible ? 1 : -1;
            return b.score - a.score;
        });

        setMatches(sorted);
    };

    const handleApproveMatch = async (match) => {
        setIsProcessing(true);

        try {
            const matchId = `MATCH-${Date.now()}`;
            await api.createMatch({
                id: matchId,
                patientId: selectedPatient.id,
                donorId: match.donorId,
                organType: selectedPatient.organNeeded,
                hlaScore: match.score,
                approvedBy: hospitalId || 'ADMIN-HOSP'
            });

            await api.updateDonorStatus(match.donorId, selectedPatient.organNeeded);

            const [patientsData, donorsData] = await Promise.all([
                api.getPatients(),
                api.getDonors()
            ]);
            setPatients(patientsData || []);
            setDonors(donorsData || []);

            addNotification(`✅ Match ${matchId} committed to blockchain!`);
        } catch (error) {
            addNotification(`❌ Error: ${error.message}`);
        }

        setIsProcessing(false);
        setSelectedPatient(null);
    };

    if (isProcessing) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200 p-12">
                <div className="relative mb-8">
                    <div className="w-24 h-24 border-4 border-slate-100 rounded-full"></div>
                    <div className="w-24 h-24 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                    <ShieldCheck className="w-10 h-10 text-indigo-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Processing On-Chain</h2>
                <p className="text-slate-500 mb-8 text-center max-w-md">Executing smart contract transaction...</p>
                <div className="w-full max-w-md space-y-2">
                    {matchSteps.map((s, idx) => (
                        <div
                            key={idx}
                            className={`flex items-center justify-between text-sm p-3 rounded-lg border transition-all duration-300 ${idx === loadingStep
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-100 scale-105 shadow-md'
                                : idx < loadingStep
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 opacity-50'
                                    : 'bg-slate-50 text-slate-400 border-slate-100 opacity-30'
                                }`}
                        >
                            <div className="flex items-center">
                                {idx < loadingStep ? (
                                    <CheckCircle className="w-4 h-4 mr-3 text-emerald-600" />
                                ) : idx === loadingStep ? (
                                    <Loader2 className="w-4 h-4 mr-3 animate-spin text-indigo-600" />
                                ) : (
                                    <s.icon className="w-4 h-4 mr-3" />
                                )}
                                <span className="font-medium">{s.text}</span>
                            </div>
                            {idx < loadingStep && <span className="text-xs font-bold text-emerald-600">DONE</span>}
                            {idx === loadingStep && <span className="text-xs font-bold text-indigo-600 animate-pulse">running...</span>}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            <div className="lg:col-span-4 flex flex-col h-[600px]">
                <Card className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-4 border-b bg-slate-50">
                        <h3 className="font-semibold text-slate-700">Waiting List</h3>
                        <p className="text-xs text-slate-500">Select a patient to run matching logic</p>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-2">
                        {patients.filter(p => p.status === 'WAITING').map(p => (
                            <div
                                key={p.id}
                                onClick={() => runMatching(p)}
                                className={`p-3 rounded border cursor-pointer transition-all ${selectedPatient?.id === p.id ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-mono text-xs font-bold text-slate-600">{p.id}</span>
                                    <span className="text-xs bg-red-100 text-red-600 px-1.5 rounded">{p.bloodType}</span>
                                </div>
                                <div className="text-sm text-slate-700">Needs: <span className="font-medium">{p.organNeeded}</span></div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="lg:col-span-8">
                {selectedPatient ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Matching Results for {selectedPatient.id}</h2>
                                <p className="text-xs text-slate-500">Algorithm: Blood Type Filter &rarr; Organ Filter &rarr; HLA Score</p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-medium">Required: {selectedPatient.organNeeded}</div>
                                <div className="text-xs text-slate-500">Patient Type: {selectedPatient.bloodType}</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {matches.map((m, idx) => (
                                <Card key={m.donorId} className={`p-4 flex items-center justify-between ${m.compatible ? 'border-l-4 border-l-emerald-500' : 'opacity-60 grayscale-[0.5]'}`}>
                                    <div className="flex items-center space-x-4">
                                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex flex-col items-center justify-center font-bold border-2 ${m.compatible ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                            <span className="text-sm leading-none">{m.score}</span>
                                            <span className="text-[8px] font-normal text-slate-500 uppercase">Score</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono font-bold text-slate-800 text-sm">{m.donorId}</span>
                                                <span className={`text-[10px] px-1.5 rounded border ${m.bloodType === selectedPatient.bloodType ? 'bg-pink-50 text-pink-600 border-pink-100 font-bold' : 'bg-slate-100 text-slate-600'}`}>
                                                    {m.bloodType}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
                                                <div>🧬 HLA: <span className="font-medium text-slate-700">{m.hlaScore}%</span></div>
                                                <div>⏳ Wait: <span className="font-medium text-slate-700">{m.daysWaiting}d</span></div>
                                                <div className="col-span-2 text-[10px] text-slate-400 truncate">
                                                    Matches {m.common} antigens • {m.bloodType === selectedPatient.bloodType ? 'Exact Blood Type' : 'Compatible Blood'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {m.compatible ? (
                                            <button
                                                onClick={() => handleApproveMatch(m)}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded shadow-sm transition-colors"
                                            >
                                                Approve Match
                                            </button>
                                        ) : (
                                            <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded">{m.reason}</span>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        <Search className="w-12 h-12 mb-2 opacity-50" />
                        <p>Select a patient from the waiting list to run the matching algorithm.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchingEngine;
