import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import type { ConfirmationResult } from 'firebase/auth';
import { ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { phoneLogin, clearError } from '../../features/auth/authSlice';
import { auth } from '../../lib/firebase';
import Button from '../../components/ui/Button';

export default function CustomerLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user, isLoading, error } = useAppSelector(state => state.auth);

  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Redirect to requested page (or home) if already logged in
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  useEffect(() => {
    dispatch(clearError());
    // Cleanup recaptcha on unmount
    return () => {
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      }
    };
  }, [dispatch]);

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      const container = document.getElementById('recaptcha-container');
      if (container) {
        container.innerHTML = '';
      }
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        }
      });
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSendingOtp) return;
    setIsSendingOtp(true);
    setLocalError(null);
    dispatch(clearError());

    // Basic validation
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      setLocalError('Please enter a valid 10-digit mobile number.');
      setIsSendingOtp(false);
      return;
    }

    try {
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      const formatPhone = `+91${digitsOnly}`; // Assuming India for now
      
      const confirmation = await signInWithPhoneNumber(auth, formatPhone, appVerifier);
      setConfirmationResult(confirmation);
      setStep('OTP');
    } catch (err: any) {
      console.error('OTP Send Error:', err);
      setLocalError(err.message || 'Failed to send OTP. Please try again.');
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch (e) {
          console.warn('Error clearing recaptcha verifier:', e);
        }
        (window as any).recaptchaVerifier = null;
      }
      const container = document.getElementById('recaptcha-container');
      if (container) {
        container.innerHTML = '';
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!otp || otp.length !== 6) {
      setLocalError('Please enter a valid 6-digit OTP.');
      return;
    }

    if (!confirmationResult) return;

    try {
      // Verify OTP with Firebase
      const result = await confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken();

      // Send ID token to our backend
      await dispatch(phoneLogin({ idToken, name: name.trim() || undefined })).unwrap();
    } catch (err: any) {
      console.error('OTP Verify Error:', err);
      setLocalError(err.message || 'Invalid OTP. Please try again.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="font-heading text-2xl font-bold text-primary tracking-wider mb-2 block">
            ABPATEL
          </Link>
          <p className="text-text-muted text-sm">Login or create an account</p>
        </div>

        <div className="bg-surface rounded-2xl shadow-xl border border-border p-8">
          {(error || localError) && (
            <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg text-sm text-error flex items-start gap-2">
              <span className="mt-0.5">⚠️</span>
              <p>{error || localError}</p>
            </div>
          )}

          {step === 'PHONE' ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-text mb-2">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-text-muted font-medium">+91</span>
                    <div className="h-5 w-px bg-border mx-3" />
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full pl-20 pr-4 py-3 bg-bg border border-border rounded-xl text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                    maxLength={10}
                    autoFocus
                  />
                </div>
              </div>

              {/* Optional Name for Registration */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-text mb-2">
                  Name <span className="text-text-muted font-normal text-xs">(optional, for new accounts)</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Full Name"
                  className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
              </div>

              <Button
                type="submit"
                disabled={phoneNumber.length < 10}
                loading={isSendingOtp}
                loadingText="Sending..."
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white text-sm font-medium uppercase tracking-wider rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-heading text-lg font-bold text-primary mb-1">Verify Mobile</h3>
                <p className="text-sm text-text-muted">
                  OTP sent to +91 {phoneNumber}
                  <Button
                    type="button"
                    onClick={() => {
                      if ((window as any).recaptchaVerifier) {
                        try {
                          (window as any).recaptchaVerifier.clear();
                        } catch (e) {
                          console.warn('Error clearing recaptcha verifier:', e);
                        }
                        (window as any).recaptchaVerifier = null;
                      }
                      const container = document.getElementById('recaptcha-container');
                      if (container) {
                        container.innerHTML = '';
                      }
                      setStep('PHONE');
                    }}
                    className="text-accent ml-2 hover:underline"
                  >
                    Edit
                  </Button>
                </p>
              </div>

              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-text mb-2 text-center">
                  Enter 6-digit OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="------"
                  className="w-full text-center tracking-[1em] font-mono text-xl px-4 py-3 bg-bg border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                loading={isLoading}
                loadingText="Verifying..."
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-accent text-white text-sm font-medium uppercase tracking-wider rounded-xl hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Verify & Login
              </Button>
            </form>
          )}

          <div id="recaptcha-container"></div>

          {/* Value Props */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex flex-col gap-3">
              {[
                'Track your orders easily',
                'Save addresses for faster checkout',
                'Access exclusive hardware deals'
              ].map(text => (
                <div key={text} className="flex items-center gap-2 text-xs text-text-muted">
                  <CheckCircle className="w-3.5 h-3.5 text-success" />
                  {text}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
