// Singleton loader for AMap JS API 2.0. Resolves when window.AMap is ready.
// NOTE: Grafana uses an AMD module loader (SystemJS). AMap's UMD wrapper would
// register itself as an anonymous AMD module (leaving window.AMap undefined).
// We temporarily hide window.define.amd while the SDK script executes.
let loaderPromise: Promise<any> | null = null;
let loadedKey: string | null = null;
let loadedSecurity: string | null = null;

declare global {
  interface Window {
    AMap?: any;
    _AMapSecurityConfig?: { securityJsCode: string };
    __amapPanelCb?: () => void;
    define?: any;
  }
}

export function loadAMap(key: string, security: string): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('no window'));
  }
  if (window.AMap && loadedKey === key && loadedSecurity === security) {
    return Promise.resolve(window.AMap);
  }
  if (window.AMap && loadedKey && (loadedKey !== key || loadedSecurity !== security)) {
    return Promise.reject(new Error('AMap SDK is already loaded with different credentials; reload the Grafana page to change them'));
  }
  if (window.AMap && !loadedKey) {
    return Promise.resolve(window.AMap);
  }
  if (loaderPromise && loadedKey === key && loadedSecurity === security) {
    return loaderPromise;
  }
  if (loaderPromise) {
    return Promise.reject(new Error('AMap SDK is currently loading with different credentials; reload the Grafana page'));
  }
  loadedKey = key;
  loadedSecurity = security;
  loaderPromise = new Promise((resolve, reject) => {
    if (security) {
      window._AMapSecurityConfig = { securityJsCode: security };
    } else {
      delete window._AMapSecurityConfig;
    }

    // Hide AMD detection so AMap attaches to window without removing define itself.
    const savedDefine = window.define;
    const savedDefineAmd = savedDefine?.amd;
    let restored = false;
    const restore = () => {
      if (!restored) {
        if (savedDefine) {
          savedDefine.amd = savedDefineAmd;
        }
        restored = true;
      }
    };
    if (savedDefine?.amd) {
      savedDefine.amd = undefined;
    }

    const script = document.createElement('script');
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let settled = false;

    const cleanup = () => {
      restore();
      if (timeout) {
        clearTimeout(timeout);
      }
      delete window.__amapPanelCb;
    };

    const fail = (error: Error) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      script.remove();
      loaderPromise = null;
      loadedKey = null;
      loadedSecurity = null;
      reject(error);
    };

    const finish = () => {
      if (settled) {
        return;
      }
      if (window.AMap) {
        settled = true;
        cleanup();
        resolve(window.AMap);
      } else {
        fail(new Error('AMap loaded but window.AMap missing'));
      }
    };

    window.__amapPanelCb = finish;
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}&callback=__amapPanelCb`;
    script.async = true;
    script.onerror = () => {
      fail(new Error('Failed to load AMap SDK (check key / securityJsCode / domain whitelist)'));
    };
    document.head.appendChild(script);
    timeout = setTimeout(() => {
      if (!window.AMap) {
        fail(new Error('AMap SDK load timeout (15s)'));
      }
    }, 15000);
  });
  return loaderPromise;
}
