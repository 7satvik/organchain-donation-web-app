import { api } from '../api';

const DonorRegistrationForm = ({ onBack, addNotification }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        bloodType: '',
        hla: '',
        organs: [],
        consent: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const organOptions = ['Kidney', 'Liver', 'Heart', 'Lungs', 'Pancreas', 'Corneas'];

    const handleOrganToggle = (organ) => {
        setFormData(prev => ({
            ...prev,
            organs: prev.organs.includes(organ)
                ? prev.organs.filter(o => o !== organ)
                : [...prev.organs, organ]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        if (!formData.name || !formData.email || !formData.bloodType || !formData.organs.length || !formData.consent) {
            setError('Please fill all required fields and provide consent');
            setIsSubmitting(false);
            return;
        }

        try {
            const donorId = `DON-${Date.now()}`;
            // Use subtle crypto for simple hashing
            const consentHashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${formData.name}-${formData.email}-consent-${Date.now()}`));
            const consentHash = Array.from(new Uint8Array(consentHashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

            const data = await api.createDonor({
                id: donorId,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                bloodType: formData.bloodType,
                hla: formData.hla || 'Pending medical test',
                organsAvailable: formData.organs,
                ipfsHash: '',
                consentHash: consentHash
            });

            if (data.success) {
                setSuccess(true);
                addNotification(`✅ Registration submitted! Your Donor ID: ${donorId}`);
            }
        } catch (err) {
            setError(err.message || 'Registration failed');
        }

        setIsSubmitting(false);
    };

    if (success) {
        return (
            <div className="text-center animate-in fade-in duration-300 py-8">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-emerald-700 mb-3">Registration Submitted!</h3>
                <p className="text-slate-500 mb-6">
                    Your application is pending hospital verification.<br />
                    A hospital will contact you for physical verification.
                </p>
                <button
                    onClick={onBack}
                    className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
                >
                    Back to Login
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-4 mb-6">
                <button type="button" onClick={onBack} className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <span className="font-bold text-xl text-rose-600">Donor Registration</span>
                    <p className="text-xs text-slate-400">Pending verification by hospital</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <input
                    type="text"
                    placeholder="Full Name *"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="col-span-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
                    required
                />
                <input
                    type="email"
                    placeholder="Email *"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
                    required
                />
                <input
                    type="tel"
                    placeholder="Phone"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Blood Type *</label>
                <div className="flex flex-wrap gap-2">
                    {bloodTypes.map(bt => (
                        <button
                            key={bt}
                            type="button"
                            onClick={() => setFormData({ ...formData, bloodType: bt })}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${formData.bloodType === bt
                                ? 'bg-rose-500 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {bt}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Organs to Donate *</label>
                <div className="grid grid-cols-3 gap-2">
                    {organOptions.map(organ => (
                        <button
                            key={organ}
                            type="button"
                            onClick={() => handleOrganToggle(organ)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${formData.organs.includes(organ)
                                ? 'bg-rose-500 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {organ}
                        </button>
                    ))}
                </div>
            </div>

            <label className="flex items-start gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
                <input
                    type="checkbox"
                    checked={formData.consent}
                    onChange={e => setFormData({ ...formData, consent: e.target.checked })}
                    className="mt-1 w-4 h-4 accent-rose-500"
                />
                <span className="text-xs text-slate-600">
                    I consent to organ donation and understand that hospital verification is required before matching. *
                </span>
            </label>

            {error && (
                <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {error}
                </p>
            )}

            <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${isSubmitting
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600'
                    }`}
            >
                {isSubmitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
                ) : (
                    <><Heart className="w-5 h-5" /> Submit Application</>
                )}
            </button>
        </form>
    );
};

export default DonorRegistrationForm;
