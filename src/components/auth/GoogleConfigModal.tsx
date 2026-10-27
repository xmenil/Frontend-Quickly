import React from 'react';
import { X, ExternalLink, Key, Check, Copy } from 'lucide-react';

interface GoogleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueDemo?: () => void;
}

export const GoogleConfigModal: React.FC<GoogleConfigModalProps> = ({
  isOpen,
  onClose,
  onContinueDemo,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const envSnippet = `VITE_GOOGLE_CLIENT_ID=TU_CLIENT_ID_DE_GOOGLE.apps.googleusercontent.com`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(envSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary/20 flex items-center justify-center text-primary">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-ink">Configurar Google Sign-In</h3>
              <p className="text-xs text-ink-light">Pasos para activar acceso con Google en tu app</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-lighter hover:text-ink hover:bg-surface-subtle transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps */}
        <div className="space-y-3 text-xs sm:text-sm text-ink-light">
          <p className="text-ink font-medium">
            Para habilitar el inicio de sesión real con Google en tu app:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-xs leading-relaxed text-ink-light">
            <li>
              Entra a la consola de{' '}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
              >
                Google Cloud Console <ExternalLink className="w-3 h-3" />
              </a>.
            </li>
            <li>Crea o selecciona tu proyecto (ej. <strong>Quickly Delivery</strong>).</li>
            <li>
              En <strong>Pantalla de consentimiento de OAuth</strong>, selecciona tipo <em>Externo</em> y guarda tu correo.
            </li>
            <li>
              En <strong>Credenciales</strong> &gt; <strong>Crear credenciales</strong> &gt; <strong>ID de cliente de OAuth</strong>:
              <ul className="list-disc pl-4 mt-1 space-y-0.5">
                <li>Tipo: <strong>Aplicación web</strong></li>
                <li>Orígenes de JavaScript autorizados: <code className="bg-surface-subtle px-1 rounded text-primary">http://localhost:5173</code> y tu dominio de Vercel.</li>
              </ul>
            </li>
            <li>
              Copia el <strong>ID de cliente</strong> y agrégalo en tu archivo <code className="bg-surface-subtle px-1 rounded text-ink font-semibold">.env</code> de frontend y backend:
            </li>
          </ol>

          {/* Code Snippet Box */}
          <div className="relative mt-2 p-3 rounded-xl bg-gray-900 text-gray-100 font-mono text-xs flex items-center justify-between">
            <span className="truncate pr-2">{envSnippet}</span>
            <button
              onClick={copyToClipboard}
              className="p-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors flex items-center gap-1"
              title="Copiar"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-selva" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
          {onContinueDemo && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onContinueDemo();
              }}
              className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl border border-field bg-surface hover:bg-surface-subtle text-ink font-semibold text-xs transition-colors"
            >
              Probar demo temporal
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-primary text-white font-semibold text-xs shadow-subtle hover:bg-primary-hover transition-colors text-center"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
