const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

declare global {
  interface Window {
    __PAYPAL_CLIENT_ID__?: string;
    __PAYPAL_SDK_PROMISE__?: Promise<void>;
  }
}

function loadPayPalSdk(clientId: string): Promise<void> {
  if (window.paypal) return Promise.resolve();

  const existingScript = document.querySelector<HTMLScriptElement>('script[data-paypal-sdk="true"]');
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Existing PayPal SDK script failed to load.')), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const paypalScript = document.createElement('script');
    paypalScript.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture&components=buttons`;
    paypalScript.async = true;
    paypalScript.dataset.paypalSdk = 'true';
    paypalScript.onload = () => resolve();
    paypalScript.onerror = () => reject(new Error('PayPal SDK failed to load.'));
    document.head.appendChild(paypalScript);
  });
}

console.log('PAYPAL CLIENT ID EXISTS:', Boolean(paypalClientId));
console.log('PAYPAL CLIENT ID PREFIX:', paypalClientId?.slice(0, 8));

window.__PAYPAL_CLIENT_ID__ = paypalClientId || '';
window.__PAYPAL_SDK_PROMISE__ = paypalClientId
  ? loadPayPalSdk(paypalClientId).catch((error) => {
      console.error('PayPal SDK load error:', error);
      throw error;
    })
  : Promise.resolve();
