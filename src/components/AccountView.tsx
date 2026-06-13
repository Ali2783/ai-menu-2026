import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  User,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { Mail, Lock, LogIn, AlertCircle, ExternalLink, ShieldCheck, LogOut } from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

export const AccountView: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return unsubscribe;
  }, []);

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('Google Sign-in failed', err);
      setError(err.message || 'Google Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSuccess('Successfully signed in!');
    } catch (err: any) {
      console.error('Email authentication failed:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setError(
          'Email/Password auth is disabled in Firebase. Please enable it in the Firebase Console (link below).'
        );
      } else if (err.code === 'auth/weak-password') {
        setError('The password is too weak. Please use at least 6 characters.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already in use by another account.');
      } else if (err.code === 'auth/invalid-email') {
        setError('The email address format is invalid.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError(
          'Invalid credentials. Please ensure: 1) You have manually added this User in the Firebase Authentication console ("Users" tab). 2) "Email/Password" is enabled under Sign-in methods. 3) The password matches exactly.'
        );
      } else {
        setError(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setError(null);
    setSuccess(null);
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign-out failed', error);
    }
  };

  const firebaseConsoleLink = firebaseConfig?.projectId 
    ? `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`
    : 'https://console.firebase.google.com/';

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full mx-auto">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Account Control Panel</h2>
        <p className="text-xs text-gray-500 mt-1">Manage credentials and backend access permissions</p>
      </div>

      {user ? (
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-left">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 block mb-1">Status: Active Session</span>
            <p className="text-sm font-semibold text-emerald-900 truncate">
              {user.email}
            </p>
            <p className="text-[10px] font-mono text-emerald-700 mt-1 max-w-full truncate">
              UID: {user.uid}
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 flex items-center justify-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* STATUS MESSAGES */}
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Authentication Error</p>
                <p className="opacity-90 mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3.5 rounded-xl text-xs flex items-start gap-2.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <p>{success}</p>
            </div>
          )}

          {/* EMAIL/PASSWORD FORM */}
          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all placeholder:text-gray-400 text-gray-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all placeholder:text-gray-400 text-gray-900"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-sm ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In with Credentials
                </>
              )}
            </button>
          </form>

          {/* DIVIDER */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <span className="relative bg-white px-3 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              Or Connect With
            </span>
          </div>

          {/* GOOGLE SIGN IN */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 flex items-center justify-center gap-2.5 transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.39 7.56l3.85 2.99c.9-2.7 3.4-4.51 6.76-4.51z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.39-4.87 3.39-8.48z"
              />
              <path
                fill="#FBBC05"
                d="M5.24 14.55c-.23-.69-.36-1.43-.36-2.2s.13-1.51.36-2.2L1.39 7.56C.5 9.34 0 11.31 0 13.4s.5 4.06 1.39 5.84l3.85-2.99z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.67-2.31 1.07-4.3 1.07-3.36 0-5.86-1.81-6.76-4.51L1.39 16.8C3.37 20.71 7.35 23 12 23z"
              />
            </svg>
            Sign in with Google
          </button>

          {/* HELP INFO BOX */}
          <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-4 text-[11px] text-amber-900 space-y-3">
            <div>
              <p className="font-extrabold text-amber-850 uppercase tracking-wider text-[10px] mb-1">
                ⚙️ Setup checklist for your new "menuanalizer" project:
              </p>
              <p className="leading-relaxed font-medium">
                Please make sure the active Sign-In providers are enabled in your new Firebase project console before using them:
              </p>
            </div>

            <div className="space-y-2 border-t border-amber-200/50 pt-2">
              <p className="font-bold text-amber-800 text-[10px] uppercase tracking-wider">
                1. Enable Providers (Email & Google):
              </p>
              <ol className="list-decimal pl-4 space-y-1 font-medium">
                <li>
                  Go to your{' '}
                  <a
                    href={firebaseConsoleLink}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-indigo-600 hover:text-indigo-800 underline font-semibold inline-flex items-center gap-0.5"
                  >
                    Firebase Auth Sign-In Methods
                    <ExternalLink className="w-3 h-3 inline" />
                  </a>
                </li>
                <li>
                  Click <strong className="font-bold">"Add new provider"</strong>, select <strong className="font-bold">Email/Password</strong>, set to <strong className="font-bold">Enabled</strong>, and click <strong className="font-bold">Save</strong>.
                </li>
                <li>
                  Click <strong className="font-bold">"Add new provider"</strong> again, select <strong className="font-bold">Google</strong>, set to <strong className="font-bold">Enabled</strong> (choose a project support email), and click <strong className="font-bold">Save</strong>.
                </li>
              </ol>
            </div>

            <div className="space-y-2 border-t border-amber-200/50 pt-2">
              <p className="font-bold text-amber-800 text-[10px] uppercase tracking-wider">
                2. Adding Admin Users Manually:
              </p>
              <p className="leading-relaxed font-medium">
                Since account creation/registration is disabled on this website for security, you must manually add your admin accounts:
              </p>
              <ol className="list-decimal pl-4 space-y-1 font-medium">
                <li>Under the <strong className="font-bold">Authentication</strong> section, click the <strong className="font-bold">Users</strong> tab.</li>
                <li>Click the <strong className="font-bold">Add user</strong> button.</li>
                <li>Enter your preferred email (e.g. <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">filmorstep68@gmail.com</code>) and safe password, then save. Now you can sign in directly!</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

