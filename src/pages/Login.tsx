import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import LanguageSelector from '../components/LanguageSelector';
import { LogIn } from 'lucide-react';

export default function Login() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authLogin({ login, password });
      navigate('/admin');
    } catch (err) {
      setError(t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)'
    }}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full filter blur-3xl opacity-20 animate-blob" style={{
          background: 'radial-gradient(circle, #fbbf24 0%, transparent 70%)'
        }}></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-2000" style={{
          background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)'
        }}></div>
        <div className="absolute top-40 left-40 w-80 h-80 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-4000" style={{
          background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)'
        }}></div>
      </div>

      <div className="max-w-md w-full space-y-8 p-10 relative z-10 rounded-2xl" style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        border: '1px solid #4b5563',
        boxShadow: '0 0 40px rgba(251, 191, 36, 0.1)'
      }}>
        <div className="absolute top-4 right-4">
          <LanguageSelector />
        </div>
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img 
                src="/logo_ziggy.png" 
                alt="ZIG MVP Logo" 
                className="h-24 w-auto relative z-10"
              />
              <div className="absolute inset-0 blur-xl opacity-50" style={{
                background: 'radial-gradient(circle, #fbbf24 0%, transparent 70%)'
              }}></div>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white mb-2">
            {t('auth.systemTitle')}
          </h2>
          <p className="mt-3 text-sm font-medium" style={{ color: '#9ca3af' }}>{t('auth.systemSubtitle')}</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="px-4 py-3 rounded-xl" style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5'
            }}>
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="login" className="block text-sm font-semibold mb-2" style={{ color: '#d1d5db' }}>
                {t('auth.username')}
              </label>
              <input
                id="login"
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                className="block w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all"
                style={{
                  background: 'rgba(31, 41, 55, 0.5)',
                  border: '1px solid #4b5563'
                }}
                placeholder={t('auth.loginPlaceholder')}
                onFocus={(e) => e.target.style.borderColor = '#fbbf24'}
                onBlur={(e) => e.target.style.borderColor = '#4b5563'}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2" style={{ color: '#d1d5db' }}>
                {t('auth.password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all"
                style={{
                  background: 'rgba(31, 41, 55, 0.5)',
                  border: '1px solid #4b5563'
                }}
                placeholder={t('auth.passwordPlaceholder')}
                onFocus={(e) => e.target.style.borderColor = '#fbbf24'}
                onBlur={(e) => e.target.style.borderColor = '#4b5563'}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: loading ? '#4b5563' : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              color: '#1a1a1a',
              boxShadow: loading ? 'none' : '0 0 20px rgba(251, 191, 36, 0.3)'
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.boxShadow = '0 0 30px rgba(251, 191, 36, 0.5)')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.boxShadow = '0 0 20px rgba(251, 191, 36, 0.3)')}
          >
            <LogIn className="w-5 h-5" />
            <span>{loading ? t('auth.loggingIn') : t('auth.login')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
