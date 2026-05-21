const ANDROID_TWA_REFERRER_PREFIX = "android-app://";

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

export function detectStandaloneMode(win: Window = window) {
  const navigatorWithStandalone = win.navigator as NavigatorWithStandalone;
  const isIosStandalone = navigatorWithStandalone.standalone === true;
  const isDisplayModeStandalone = win.matchMedia(
    "(display-mode: standalone)",
  ).matches;
  const isDisplayModeFullscreen = win.matchMedia(
    "(display-mode: fullscreen)",
  ).matches;
  const isAndroidTwa = win.document.referrer.startsWith(
    ANDROID_TWA_REFERRER_PREFIX,
  );

  return (
    isIosStandalone ||
    isDisplayModeStandalone ||
    isDisplayModeFullscreen ||
    isAndroidTwa
  );
}

export const STANDALONE_MODE_INIT_SCRIPT = `(() => {
  try {
    const isIosStandalone = window.navigator.standalone === true;
    const isDisplayModeStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const isDisplayModeFullscreen = window.matchMedia("(display-mode: fullscreen)").matches;
    const isAndroidTwa = document.referrer.startsWith("android-app://");
    const isStandalone = isIosStandalone || isDisplayModeStandalone || isDisplayModeFullscreen || isAndroidTwa;
    const root = document.documentElement;
    root.dataset.displayMode = isStandalone ? "standalone" : "browser";
    root.classList.toggle("pwa-standalone", isStandalone);
  } catch {}
})();`;
