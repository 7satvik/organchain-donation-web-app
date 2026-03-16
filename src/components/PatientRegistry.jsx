import React, { useState } from 'react';
import { Lock, UploadCloud, Loader2 } from 'lucide-react';
import { Card, Badge } from './UI';
import { api } from '../api';

const PatientRegistry = ({ role, hospitalId, patients, setPatients, addNotification }) => {
    const [formData, setFormData] = useState({
        name: '',
        bloodType: 'A+',
        organNeeded: 'Kidney',
        hla: '',
        medicalNotes: ''
    });
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(0);
    const [txDetails, setTxDetails] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStep(1);

        await new Promise(r => setTimeout(r, 800));
        const mockIpfsCid = `Qm${Math.random().toString(36).substring(7)}...${Math.random().toString(36).substring(7)}`;

        const payload = JSON.stringify({ ...formData, timestamp: Date.now() });
        const dataHashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
        const dataHash = Array.from(new Uint8Array(dataHashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

        setStep(2);
        setTxDetails({ cid: mockIpfsCid, hash: dataHash });

        try {
            const patientId = `PAT-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
            // Use subtle crypto for simple hashing
            const nameHashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(formData.name));
            const nameHash = Array.from(new Uint8Array(nameHashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 8) + '...';

            await api.createPatient({
                id: patientId,
                nameHash: nameHash,
                bloodType: formData.bloodType,
                hla: formData.hla,
                organNeeded: formData.organNeeded,
                ipfsHash: mockIpfsCid,
                hospitalId: hospitalId || 'ADMIN-HOSP'
            });

            // Refresh patients from blockchain
            const patientsData = await api.getPatients();
            setPatients(patientsData || []);
            addNotification("✅ Patient Record Committed to Blockchain!");
        } catch (error) {
            addNotification(`❌ Error: ${error.message}`);
        }

        setLoading(false);
        setStep(0);
        setFormData({ name: '', bloodType: 'A+', organNeeded: 'Kidney', hla: '', medicalNotes: '' });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {role === 'HOSPITAL_ADMIN' ? (
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 text-slate-800">New Patient Record</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Patient Name (Private)</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="John Doe"
                                />
                                <p className="text-xs text-slate-400 mt-1 flex items-center">
                                    <Lock className="w-3 h-3 mr-1" /> Will be hashed on-chain
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Blood Type</label>
                                    <select
                                        value={formData.bloodType}
                                        onChange={e => setFormData({ ...formData, bloodType: e.target.value })}
                                        className="w-full p-2 border border-slate-300 rounded text-sm"
                                    >
                                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Organ</label>
                                    <select
                                        value={formData.organNeeded}
                                        onChange={e => setFormData({ ...formData, organNeeded: e.target.value })}
                                        className="w-full p-2 border border-slate-300 rounded text-sm"
                                    >
                                        {['Kidney', 'Liver', 'Heart', 'Lung'].map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">HLA Markers (6 Antigens)</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.hla}
                                    onChange={e => setFormData({ ...formData, hla: e.target.value })}
                                    className="w-full p-2 border border-slate-300 rounded text-sm"
                                    placeholder="e.g., A2, A24, B35, B44, DR1, DR4"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Medical Record (PDF)</label>
                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors">
                                    <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                                    <span className="text-xs text-slate-500">Click to mock upload to IPFS</span>
                                </div>
                            </div>

                            <button
                                disabled={loading}
                                type="submit"
                                className={`w-full py-2 px-4 rounded text-white font-medium text-sm transition-all ${loading ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {loading ? 'Processing Transaction...' : 'Sign & Submit to Fabric'}
                            </button>
                        </form>
                    </Card>
                </div>
            ) : (
                <div className="lg:col-span-1">
                    <Card className="p-6 bg-slate-50 border-dashed border-2 h-full flex flex-col items-center justify-center text-center">
                        <Lock className="w-12 h-12 text-slate-300 mb-4" />
                        <h3 className="text-slate-600 font-medium">Write Access Restricted</h3>
                        <p className="text-sm text-slate-400 mt-2">Only authorized Hospital Admins can create new patient records.</p>
                    </Card>
                </div>
            )}

            {/* Right: Data Table */}
            <div className="lg:col-span-2 space-y-6">
                {loading && (
                    <Card className="p-4 bg-indigo-50 border-indigo-100">
                        <h4 className="font-semibold text-indigo-800 text-sm mb-2">Transaction Lifecycle</h4>
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs mr-3 ${step >= 1 ? 'bg-green-500 text-white' : 'bg-slate-200'}`}>1</div>
                                <span className="text-sm text-slate-600">Encrypting & Uploading to IPFS...</span>
                            </div>
                            {txDetails?.cid && (
                                <div className="ml-8 text-xs font-mono text-slate-500 bg-white p-2 rounded border truncate">
                                    CID: {txDetails.cid}
                                </div>
                            )}
                            <div className="flex items-center">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs mr-3 ${step >= 2 ? 'bg-green-500 text-white' : 'bg-slate-200'}`}>2</div>
                                <span className="text-sm text-slate-600">Generating Data Hash & Signing...</span>
                            </div>
                            {txDetails?.hash && (
                                <div className="ml-8 text-xs font-mono text-slate-500 bg-white p-2 rounded border truncate">
                                    Hash: {txDetails.hash.substring(0, 30)}...
                                </div>
                            )}
                            <div className="flex items-center">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs mr-3 ${step >= 2 ? 'bg-blue-500 animate-pulse text-white' : 'bg-slate-200'}`}>3</div>
                                <span className="text-sm text-slate-600">Invoking Chaincode: CreatePatient</span>
                            </div>
                        </div>
                    </Card>
                )}

                <Card className="overflow-hidden">
                    <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-700">Patient Ledger (Public State)</h3>
                        <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border">World State</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="p-3">ID</th>
                                    <th className="p-3">Blood</th>
                                    <th className="p-3">Organ</th>
                                    <th className="p-3">HLA Data</th>
                                    <th className="p-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {patients.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50">
                                        <td className="p-3 font-mono text-xs">{p.id}</td>
                                        <td className="p-3"><span className="font-bold text-slate-700">{p.bloodType}</span></td>
                                        <td className="p-3">{p.organNeeded}</td>
                                        <td className="p-3 text-xs text-slate-500 truncate max-w-[150px]">{p.hla}</td>
                                        <td className="p-3"><Badge status={p.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default PatientRegistry;
