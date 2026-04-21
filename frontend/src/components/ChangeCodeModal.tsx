import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { LockIcon, UserIcon } from './Icons';
import { useVerification, VerifyTarget } from '../utils/useVerification';
import VerificationModal from './VerificationModal';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userType: 'admin' | 'super-admin' | 'customer';
  username: string;
}

type Tab = 'profile' | 'password';

export default function ChangePasswordModal({ isOpen, onClose, userType, username }: Props) {
  const { changePassword, updateUser, getAllUsers, logout } = useAuthStore();
  const verification = useVerification();

  const allUsers = getAllUsers();
  const currentUser = allUsers.find(u => u.username === username);

  // Profile tab
  const [email, setEmail] = useState(currentUser?.email || '');
  const [ownerName, setOwnerName] = useState(currentUser?.ownerName || '');
  const [profileLoading, setProfileLoading] = useState(false);

  // Pending verified fields
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);

  // Verification modal
  const [verifyTarget, setVerifyTarget] = useState<{ value: string; type: VerifyTarget } | null>(null);

  // Password tab
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const handleClose = () => {
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    setVerifiedEmail(null);
    setVerifyTarget(null);
    verification.reset();
    setActiveTab('profile');
    onClose();
  };

  const requestVerify = async (value: string, type: VerifyTarget) => {
    if (!value.trim()) { toast.error('Email kiriting'); return; }
    if (!/\S+@\S+\.\S+/.test(value)) { toast.error('Email noto\'g\'ri formatda'); return; }
    setVerifyTarget({ value, type });
    await verification.sendCode(value, type);
  };

  const handleVerifyConfirm = async (code: string): Promise<boolean> => {
    const ok = await verification.verify(code);
    if (ok && verifyTarget) {
      setVerifiedEmail(verifyTarget.value);
      toast.success('Email tasdiqlandi');
      setVerifyTarget(null);
    }
    return ok;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailChanged = email && email !== (currentUser?.email || '');
    if (emailChanged && verifiedEmail !== email) {
      toast.error('Email tasdiqlanmagan. Avval tasdiqlash kodini yuboring.');
      return;
    }
    setProfileLoading(true);
    await new Promise(r => setTimeout(r, 300));
    const ok = updateUser(username, {
      email: email || undefined,
      ownerName: ownerName || undefined,
    });
    setProfileLoading(false);
    if (ok) { toast.success('Ma\'lumotlar saqlandi'); setVerifiedEmail(null); }
    else toast.error('Xatolik yuz berdi');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('Yangi parollar mos kelmaydi'); return; }
    if (newPassword.length < 6) { toast.error('Parol kamida 6 ta belgi bo\'lishi kerak'); return; }
    if (currentPassword === newPassword) { toast.error('Yangi parol joriy paroldan farq qilishi kerak'); return; }
    setPassLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const ok = await changePassword(username, currentPassword, newPassword);
    setPassLoading(false);
    if (ok) {
      toast.success('Parol o\'zgartirildi! Qayta kirish kerak.');
      setTimeout(() => { logout(); handleClose(); }, 1500);
    } else {
      toast.error('Joriy parol noto\'g\'ri');
    }
  };

  if (!isOpen) return null;

  const accent = userType === 'super-admin'
    ? 'from-red-400 to-orange-500'
    : userType === 'admin'
    ? 'from-blue-500 to-indigo-600'
    : 'from-green-500 to-teal-600';

  const emailChanged = email && email !== (currentUser?.email || '');

  return (
    <>
      <div className="fixed inset-0 modal-overlay-modern flex items-center justify-center p-4 z-[200]">
        <div className="modal-content-modern max-w-md w-full p-6 bg-white">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 bg-gradient-to-br ${accent} rounded-xl flex items-center justify-center`}>
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Profil Sozlamalari</h3>
                <p className="text-xs text-gray-500 font-mono">{username}</p>
              </div>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
          </div>

          {/* Tabs */}
          <div className="flex border border-gray-200 rounded-xl p-1 mb-5 bg-gray-50">
            {([
              { key: 'profile', label: 'Ma\'lumotlar', icon: <UserIcon className="w-3.5 h-3.5" /> },
              { key: 'password', label: 'Parol', icon: <LockIcon className="w-3.5 h-3.5" /> },
            ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">To'liq ism</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  placeholder="Ism Familiya"
                  className="input-modern w-full"
                  autoComplete="name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <div className="flex gap-2">
                    <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setVerifiedEmail(null); }}
                    placeholder="email@example.com"
                    className={`input-modern flex-1 ${verifiedEmail === email && emailChanged ? 'border-green-400 bg-green-50' : ''}`}
                    autoComplete="email"
                  />
                  {emailChanged && verifiedEmail !== email && (
                    <button
                      type="button"
                      onClick={() => requestVerify(email, 'email')}
                      className="shrink-0 px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap"
                    >
                      Tasdiqlash
                    </button>
                  )}
                  {verifiedEmail === email && emailChanged && (
                    <span className="shrink-0 px-3 py-2 text-xs bg-green-100 text-green-700 rounded-lg font-medium">✓ Tasdiqlandi</span>
                  )}
                </div>
              </div>

              {emailChanged && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Email o'zgartirilsa, avval tasdiqlash kodi yuborilishi kerak
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={handleClose} className="btn-secondary flex-1 py-2">Bekor qilish</button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className={`flex-1 py-2 bg-gradient-to-br ${accent} text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50`}
                >
                  {profileLoading ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Joriy parol</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Joriy parolingiz"
                  className="input-modern w-full"
                  required
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Yangi parol</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Kamida 6 ta belgi"
                  className="input-modern w-full"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Yangi parolni tasdiqlang</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Qayta kiriting"
                  className="input-modern w-full"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-xs text-amber-700 font-medium">Parol o'zgartirilgandan so'ng qayta kirish kerak bo'ladi</p>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={handleClose} className="btn-secondary flex-1 py-2">Bekor qilish</button>
                <button
                  type="submit"
                  disabled={passLoading || !currentPassword || !newPassword || !confirmPassword}
                  className={`flex-1 py-2 bg-gradient-to-br ${accent} text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50`}
                >
                  {passLoading ? 'O\'zgartirilmoqda...' : 'O\'zgartirish'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Verification Modal */}
      <VerificationModal
        isOpen={!!verifyTarget}
        target={verifyTarget?.value || ''}
        type={verifyTarget?.type || 'email'}
        timeLeft={verification.timeLeft}
        onVerify={handleVerifyConfirm}
        onResend={() => verifyTarget && verification.sendCode(verifyTarget.value, verifyTarget.type)}
        onCancel={() => { setVerifyTarget(null); verification.reset(); }}
      />
    </>
  );
}
