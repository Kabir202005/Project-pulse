import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { useApp } from '../context/AppContext';
import { authService } from '../services/api';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    toast,
    hideToast,
    isAuthModalOpen,
    closeAuthModal,
    authRedirectPath,
    login,
  } = useApp();
  const navigate = useNavigate();

  // Auth modal internal state
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expirySeconds, setExpirySeconds] = useState(600);

  // Timer countdowns
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && isAuthModalOpen) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        setExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, isAuthModalOpen]);

  // Reset modal state on close or open
  useEffect(() => {
    if (!isAuthModalOpen) {
      setError(null);
      setLoading(false);
    }
  }, [isAuthModalOpen]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await authService.sendOtp(cleanEmail);
      setStep('otp');
      setResendCooldown(15);
      setExpirySeconds(600);
      if (res.dev_otp) {
        setDevOtp(res.dev_otp);
      } else {
        setDevOtp(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (expirySeconds <= 0) {
      setError('This verification code has expired. Please request a new one.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await authService.verifyOtp(email.trim().toLowerCase(), cleanOtp);
      login(res.token, res.email);
      setStep('email');
      setEmail('');
      setOtp('');
      setDevOtp(null);
      if (authRedirectPath) {
        navigate(authRedirectPath);
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await authService.sendOtp(email.trim().toLowerCase());
      setResendCooldown(15);
      setExpirySeconds(600);
      setOtp('');
      if (res.dev_otp) {
        setDevOtp(res.dev_otp);
      } else {
        setDevOtp(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen flex antialiased relative">
      {/* Blueprint Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-blueprint opacity-50"></div>

      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-[260px] flex flex-col min-h-screen relative z-10 w-[calc(100%-260px)]">
        <TopNav />
        <main className="p-container-padding flex flex-col gap-card-gap max-w-[1600px] mx-auto w-full flex-1">
          {children}
        </main>
      </div>

      {/* Global Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-lg bg-surface-container-high transition-all animate-bounce">
          <span className="material-symbols-outlined text-xl">
            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
          </span>
          <span className="text-sm font-medium text-on-surface">{toast.message}</span>
          <button onClick={hideToast} className="text-on-surface-variant hover:text-on-surface ml-2">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Auth Modal Overlay */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-all animate-fadeIn">
          <div className="bg-surface-container border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-lg">shield</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-base font-bold text-on-surface">
                    {step === 'email' ? 'Sign In to Project Pulse' : 'Verify One-Time Code'}
                  </h3>
                  <p className="font-label-md text-xs text-on-surface-variant">
                    {step === 'email' ? 'Secure Email Authentication' : 'Check your inbox for the OTP'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeAuthModal}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Error Message Box */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 flex items-start gap-2.5 text-error text-xs">
                <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Email Form */}
            {step === 'email' ? (
              <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Enter your email address below. We'll send a secure one-time verification code (OTP) to authenticate your session.
                </p>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-primary">mail</span>
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="name@company.com"
                    autoFocus
                    required
                    className="w-full bg-surface-container-high border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-body-md"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-on-primary font-medium py-2.5 rounded-lg text-sm transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-on-primary/30 border-t-on-primary animate-spin"></div>
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue with Email</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Step 2: OTP Verification Form */
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <div className="text-xs text-on-surface-variant leading-relaxed flex flex-col gap-1">
                  <span>A 6-digit verification code was sent to:</span>
                  <span className="font-semibold text-primary">{email}</span>
                </div>

                {devOtp && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/25 flex flex-col gap-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-primary flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">developer_mode</span>
                        Simulation Mode (No SMTP)
                      </span>
                      <button
                        type="button"
                        onClick={() => setOtp(devOtp)}
                        className="bg-primary/20 hover:bg-primary/30 text-primary px-2 py-0.5 rounded font-mono font-bold text-xs transition-colors"
                      >
                        Auto-fill: {devOtp}
                      </button>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-normal">
                      SMTP credentials are not configured in <code className="text-primary font-mono">backend/.env</code>. You can click <strong>Auto-fill</strong> above or enter <code className="text-primary font-mono">123456</code> to authenticate immediately.
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-primary">key</span>
                      <span>Enter 6-Digit OTP</span>
                    </label>
                    <span className={`text-[11px] font-mono ${expirySeconds < 60 ? 'text-error' : 'text-on-surface-variant'}`}>
                      Expires in {formatTime(expirySeconds)}
                    </span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setOtp(val);
                      if (error) setError(null);
                    }}
                    placeholder="······"
                    autoFocus
                    required
                    className="w-full bg-surface-container-high border border-white/10 rounded-lg px-3.5 py-3 text-center text-xl font-bold tracking-[0.5em] text-primary placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 4 || expirySeconds <= 0}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-on-primary font-medium py-2.5 rounded-lg text-sm transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 mt-1"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-on-primary/30 border-t-on-primary animate-spin"></div>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">lock_open</span>
                      <span>Verify & Sign In</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-2 text-xs border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setOtp('');
                      setError(null);
                    }}
                    className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">arrow_back</span>
                    <span>Use different email</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    className="text-primary hover:text-primary/80 disabled:text-on-surface-variant/40 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend OTP'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
