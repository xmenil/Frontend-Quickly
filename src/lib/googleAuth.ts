/**
 * Google Identity Services Helper for Quickly Delivery
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (notification?: (notification: any) => void) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number;
              locale?: string;
            }
          ) => void;
        };
      };
    };
  }
}

export function getGoogleClientId(): string {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
}

export function isGoogleAuthAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean(window.google?.accounts?.id);
}

export function promptGoogleLogin(
  onSuccess: (credential: string) => void,
  onNeedConfig: () => void,
) {
  const clientId = getGoogleClientId();

  if (!clientId) {
    onNeedConfig();
    return;
  }

  if (!isGoogleAuthAvailable()) {
    console.warn('Google Identity Services SDK aún no ha cargado en la página.');
    onNeedConfig();
    return;
  }

  try {
    window.google!.accounts.id.initialize({
      client_id: clientId,
      callback: (res) => {
        if (res.credential) {
          onSuccess(res.credential);
        }
      },
    });

    window.google!.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        console.log('Google One Tap no mostrado o saltado:', notification.getNotDisplayedReason?.());
      }
    });
  } catch (err) {
    console.error('Error iniciando Google Prompt:', err);
    onNeedConfig();
  }
}
