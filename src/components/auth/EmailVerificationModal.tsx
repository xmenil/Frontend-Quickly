import React, { useState, useEffect, useRef } from 'react';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ArrowLeft, ShieldCheck } from 'lucide-react';

interface EmailVerificationModalProps {
  isOpen: boolean;
  email: string;
  devCode?: string;
  onClose: () => void;
  onVerify: (code: string) => Promise<{ success: boolean; message?: string }>;
  onResend: () => Promise<{ success: boolean; devCode?: string; message?: string }>;
  onEditEmail: () => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  email,
  devCode: initialDevCode,
  onClose,
  onVerify,
  onResend,
  onEditEmail,
}) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [devCode, setDevCode] = useState(initialDevCode);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setDevCode(initialDevCode);
  }, [initialDevCode]);

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setError(null);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Countdown for resend
  useEffect(() => {
    if (!isOpen || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, resendCooldown]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, val: string) => {
    setError(null);
    const clean = val.replace(/\D/g, '');

    // If pasted multi-digit string
    if (clean.length > 1) {
      const newDigits = [...digits];
      for (let i = 0; i < 6 && i < clean.length; i++) {
        newDigits[i] = clean[i];
      }
      setDigits(newDigits);
      const nextIdx = Math.min(clean.length, 5);
      inputRefs.current[nextIdx]?.focus();

      if (newDigits.every((d) => d !== '')) {
        handleComplete(newDigits.join(''));
      }
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = clean ? clean.slice(-1) : '';
    setDigits(newDigits);

    // Auto-advance
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all filled
    if (clean && index === 5 && newDigits.every((d) => d !== '')) {
      handleComplete(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleComplete = async (code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await onVerify(code);
      if (!res.success) {
        setError(res.message || 'Código incorrecto o expirado.');
      }
    } catch {
      setError('Error al validar el código. Inténtalo nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendClick = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await onResend();
      if (res.success) {
        setResendCooldown(60);
        if (res.devCode) setDevCode(res.devCode);
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(res.message || 'No se pudo reenviar el código.');
      }
    } catch {
      setError('Error al solicitar reenvío.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-6 animate-in zoom-in-95 duration-200">
        {/* Header with Icon */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-selva-soft text-selva flex items-center justify-center mx-auto shadow-subtle border border-selva-border">
            <Mail className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
            Verifica tu correo
          </h2>
          <p className="text-xs sm:text-sm text-ink-light max-w-xs mx-auto">
            Te enviamos un código de 6 dígitos a:
            <br />
            <strong className="text-ink font-semibold break-all">{email}</strong>
          </p>
        </div>

        {/* Development Helper Badge */}
        {devCode && (
          <div className="p-2.5 rounded-xl bg-selva-soft border border-selva-border flex items-center justify-between text-xs text-selva font-medium animate-in fade-in">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-selva flex-shrink-0" />
              <span>Código de prueba detectado:</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const arr = devCode.split('');
                setDigits(arr);
                handleComplete(devCode);
              }}
              className="font-mono font-bold tracking-wider underline hover:text-selva-dark"
            >
              {devCode} (Autocompletar)
            </button>
          </div>
        )}

        {/* 6 Digit Input Boxes */}
        <div className="space-y-4">
          <div className="flex justify-center gap-2 sm:gap-2.5">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                disabled={isLoading}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border transition-all outline-none ${
                  digit
                    ? 'border-primary bg-primary-50/30 text-ink shadow-sm'
                    : 'border-field bg-surface text-ink hover:border-field-focus'
                } focus:border-primary focus:ring-2 focus:ring-primary/20`}
              />
            ))}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            disabled={isLoading || digits.some((d) => d === '')}
            onClick={() => handleComplete(digits.join(''))}
            className="w-full min-h-[46px] h-12 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-semibold shadow-subtle transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verificando código...</span>
              </>
            ) : (
              <span>Verificar y activar cuenta</span>
            )}
          </button>

          {/* Resend and Edit options */}
          <div className="flex items-center justify-between text-xs text-ink-light pt-1">
            <button
              type="button"
              disabled={resendCooldown > 0 || isLoading}
              onClick={handleResendClick}
              className="text-primary hover:underline font-medium disabled:opacity-50 disabled:no-underline"
            >
              {resendCooldown > 0
                ? `Reenviar en ${resendCooldown}s`
                : 'Reenviar código'}
            </button>

            <button
              type="button"
              onClick={onEditEmail}
              className="text-ink-lighter hover:text-ink hover:underline inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cambiar correo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
