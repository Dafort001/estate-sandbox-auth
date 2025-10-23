// PWA Service Worker Registration
// Register service worker for offline functionality and PWA features

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      // Wait for page to load before registering
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });

          console.log('[PWA] Service worker registered successfully:', registration.scope);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check every hour

          // Handle service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available, prompt user to refresh
                  console.log('[PWA] New version available! Refresh to update.');
                  
                  // You could show a toast notification here
                  if (confirm('Eine neue Version ist verfügbar. Jetzt aktualisieren?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        } catch (error) {
          console.error('[PWA] Service worker registration failed:', error);
        }
      });
    } catch (error) {
      console.error('[PWA] Service worker not supported:', error);
    }
  } else {
    console.log('[PWA] Service workers are not supported in this browser.');
  }
}

// Install prompt (for "Add to Home Screen")
let deferredPrompt: any = null;

export function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    console.log('[PWA] Install prompt available');
    
    // Show custom install button (optional)
    showInstallButton();
  });

  // Track when the app was installed
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully');
    deferredPrompt = null;
    hideInstallButton();
  });
}

export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    console.log('[PWA] Install prompt not available');
    return false;
  }

  // Show the install prompt
  deferredPrompt.prompt();

  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.userChoice;
  
  console.log(`[PWA] User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} the install prompt`);
  
  // Clear the deferred prompt
  deferredPrompt = null;
  
  return outcome === 'accepted';
}

// Helper functions for showing/hiding install button
function showInstallButton() {
  const installButton = document.getElementById('pwa-install-button');
  if (installButton) {
    installButton.style.display = 'block';
  }
}

function hideInstallButton() {
  const installButton = document.getElementById('pwa-install-button');
  if (installButton) {
    installButton.style.display = 'none';
  }
}

// Check if app is installed
export function isPWAInstalled(): boolean {
  // Check if app is running in standalone mode (iOS)
  if ((window.navigator as any).standalone === true) {
    return true;
  }
  
  // Check if app is running in standalone mode (Android/Desktop)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  return false;
}

// Initialize PWA features
export function initializePWA() {
  registerServiceWorker();
  setupInstallPrompt();
  
  console.log('[PWA] Initialized. Installed:', isPWAInstalled());
}
