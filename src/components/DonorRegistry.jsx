import React, { useState } from 'react';
import { Activity, Lock } from 'lucide-react';
import { Card, Badge } from './UI';
import { api } from '../api';

const DonorRegistry = ({ role, hospitalId, donors, setDonors, addNotification, fetchAllData }) => {
    const [formData, setFormData] = useState({
        name: '',
        bloodType: 'O-',
        organs: [], // Array of strings
        hla: '',
        consentGiven: false
    });
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(0);
    const [txDetails, setTxDetails] = useState(null);

    const toggleOrgan = (organ) => {
        setFormData(prev => ({
            ...prev,
            organs: prev.organs.includes(organ)
                ? prev.organs.filter(o => o !== organ)
                : [...prev.organs, organ]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.consentGiven) {
            alert("Consent required.");
            return;
        }
        setLoading(true);
        setStep(1);

        // Simulate IPFS
        await new Promise(r => setTimeout(r, 800));
        const mockIpfsCid = `Qm${Math.random().toString(36).substring(7)}...donor`;

        // Simulate Hashing
        const payload = JSON.stringify({ ...formData, timestamp: Date.now() });
        const dataHashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
        const dataHash = Array.from(new Uint8Array(dataHashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

        setStep(2);
        setTxDetails({ cid: mockIpfsCid, hash: dataHash });

        try {
            const donorId = `DON-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

            await api.createDonor({
                id: donorId,
                bloodType: formData.bloodType,
                hla: formData.hla,
                organsAvailable: formData.organs,
                ipfsHash: mockIpfsCid,
                consentHash: `0x${dataHash.substring(0, 10)}...signed`
            });

            // Refresh donors from blockchain
            const donorsData = await api.getDonors();
            setDonors(donorsData || []);
            addNotification("✅ Donor Record Committed to Blockchain!");
        } catch (error) {
            addNotification(`❌ Error: ${error.message}`);
        }

        setLoading(false);
        setStep(0);
        setFormData({ name: '', bloodType: 'O-', organs: [], hla: '', consentGiven: false });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Form */}
            {role === 'HOSPITAL_ADMIN' ? (
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 text-slate-800">Register Donor</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Donor Name (Private)</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="Jane Doe"
                                />
                            </div>

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
                                <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Available Organs</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Kidney', 'Liver', 'Heart', 'Lung', 'Pancreas', 'Intestine'].map(org => (
                                        <label key={org} className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.organs.includes(org)}
                                                onChange={() => toggleOrgan(org)}
                                                className="rounded text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>{org}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">HLA Markers</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.hla}
                                    onChange={e => setFormData({ ...formData, hla: e.target.value })}
                                    className="w-full p-2 border border-slate-300 rounded text-sm"
                                    placeholder="e.g., A2, A24, B35..."
                                />
                            </div>

                            <div className="pt-2">
                                <label className="flex items-start space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-slate-50">
                                    <input
                                        type="checkbox"
                                        required
                                        checked={formData.consentGiven}
                                        onChange={e => setFormData({ ...formData, consentGiven: e.target.checked })}
                                        className="mt-1 rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <div className="text-xs text-slate-600">
                                        <span className="font-bold text-slate-900">Legal Consent:</span> I certify that valid legal consent has been obtained and verified for organ donation according to regional regulations.
                                    </div>
                                </label>
                            </div>

                            <button
                                disabled={loading || formData.organs.length === 0}
                                type="submit"
                                className={`w-full py-2 px-4 rounded text-white font-medium text-sm transition-all ${loading ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                            >
                                {loading ? 'Processing...' : 'Register Donor on Ledger'}
                            </button>
                        </form>
                    </Card>
                </div>
            ) : (
                <div className="lg:col-span-1">
                    <Card className="p-6 bg-slate-50 border-dashed border-2 h-full flex flex-col items-center justify-center text-center">
                        <Lock className="w-12 h-12 text-slate-300 mb-4" />
                        <h3 className="text-slate-600 font-medium">Write Access Restricted</h3>
                        <p className="text-sm text-slate-400 mt-2">Only authorized Hospital Admins can register donors.</p>
                    </Card>
                </div>
            )}

            {/* Right: Data Table */}
            <div className="lg:col-span-2 space-y-6">
                {loading && (
                    <Card className="p-4 bg-emerald-50 border-emerald-100">
                        <h4 className="font-semibold text-emerald-800 text-sm mb-2">Smart Contract Execution</h4>
                        <div className="flex items-center space-x-3 text-sm text-slate-600">
                            <Activity className="w-4 h-4 animate-spin text-emerald-600" />
                            <span>Encrypting donor metadata and generating zero-knowledge proof...</span>
                        </div>
                    </Card>
                )}

                <Card className="overflow-hidden">
                    <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-700">Donor Ledger (Public State)</h3>
                        <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border">All Donors</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="p-3">ID</th>
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Blood</th>
                                    <th className="p-3">Organs Available</th>
                                    <th className="p-3">Status</th>
                                    {role === 'HOSPITAL_ADMIN' && <th className="p-3">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {donors.map(d => (
                                    <tr key={d.id} className="hover:bg-slate-50">
                                        <td className="p-3 font-mono text-xs">{d.id}</td>
                                        <td className="p-3 text-slate-700">{d.name || 'Anonymous'}</td>
                                        <td className="p-3"><span className="font-bold text-slate-700">{d.bloodType}</span></td>
                                        <td className="p-3">
                                            <div className="flex flex-wrap gap-1">
                                                {(d.organsAvailable || []).map(o => (
                                                    <span key={o} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">{o}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <Badge status={d.verificationStatus || 'PENDING_VERIFICATION'} />
                                        </td>
                                        {role === 'HOSPITAL_ADMIN' && (
                                            <td className="p-3">
                                                {(d.verificationStatus === 'PENDING_VERIFICATION' || !d.verificationStatus) ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await api.verifyDonor(d.id, hospitalId, 'VERIFIED');
                                                                    addNotification(`✅ Donor ${d.id} verified!`);
                                                                    fetchAllData();
                                                                } catch (err) {
                                                                    addNotification(`❌ Failed to verify donor: ${err.message}`);
                                                                }
                                                            }}
                                                            className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 font-medium"
                                                        >
                                                            ✓ Verify
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await api.verifyDonor(d.id, hospitalId, 'REJECTED');
                                                                    addNotification(`❌ Donor ${d.id} rejected`);
                                                                    fetchAllData();
                                                                } catch (err) {
                                                                    addNotification(`❌ Failed to reject donor: ${err.message}`);
                                                                }
                                                            }}
                                                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium"
                                                        >
                                                            ✗ Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400">
                                                        {d.verifiedBy ? `by ${d.verifiedBy}` : '-'}
                                                    </span>
                                                )}
                                            </td>
                                        )}
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

export default DonorRegistry;
