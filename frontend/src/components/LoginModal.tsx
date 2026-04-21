import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'admin' | 'super-admin';
}

export default function LoginModal({ isOpen, onClose, targetType }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const success = await login(username, password);
    
    if (success) {
      setUsername('');
      setPassword('');
      onClose();
    } else {
      setError('Noto\'g\'ri login yoki parol. Iltimos, qayta urinib ko\'ring.');
    }
    
    setIsLoading(false);
  };

  const handleClose = () => {
    setUsername('');
    setPassword('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass rounded-2xl max-w-md w-full p-6 border border-white/20 animate-fade-in-up">
        <div className="text-center mb-6">
          <div className={`w-16 h-16 ${targetType === 'super-admin' ? 'bg-gradient-to-r from-red-500 to-orange-600' : 'bg-gradient-to-r from-blue-500 to-purple-600'} rounded-full mx-auto flex items-center justify-center mb-4`}>
            <span className="text-2xl">{targetType === 'super-admin' ? '👑' : '🏪'}</span>
          </div>
          <h3 className="text-xl font-semibold text-white">
            {targetType === 'super-admin' ? 'Super Admin' : 'Admin'} Kirish
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            {targetType === 'super-admin' 
              ? 'Tizimga kirish uchun login va parolni kiriting'
              : 'Restoran paneliga kirish uchun login va parolni kiriting'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-username" className="block text-sm font-medium text-gray-300 mb-2">
              Login
            </label>
            <input
              id="login-username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="Loginni kiriting..."
              className="w-full p-3 glass border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              required
              autoFocus
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-300 mb-2">
              Parol
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Parolni kiriting..."
              className="w-full p-3 glass border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm animate-shake">
              {error}
            </div>
          )}

          <div className="flex space-x-4 mt-8">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 glass border border-white/20 text-gray-300 py-3 rounded-lg hover:bg-white/10 transition-all duration-300"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className={`flex-1 ${targetType === 'super-admin' 
                ? 'bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700' 
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
              } text-white py-3 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Tekshirilmoqda...</span>
                </>
              ) : (
                <>
                  <span>🔓</span>
                  <span>Kirish</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}