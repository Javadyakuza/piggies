import {
  backButton,
  viewport,
  themeParams,
  miniApp,
  initData,
  setDebug,
  init as initSDK,
} from "@telegram-apps/sdk-react";

let _isInitialized = false;

/**
 * Initializes the application and configures its dependencies.
 */
export function init(debug: boolean): void {
  if (_isInitialized) return;
  _isInitialized = true;

  setDebug(debug);

  // Initialize special event handlers for Telegram Desktop, Android, iOS, etc.
  // Also, configure the package.
  initSDK();

  // Mount all components used in the project.
  backButton.isSupported() && backButton.mount();
  miniApp.mountSync();
  themeParams.mountSync();
  initData.restore();

  void viewport
    .mount()
    .then(() => {
      viewport.bindCssVars();
    })
    .catch((e) => {
      console.error("Something went wrong mounting the viewport", e);
    });

  miniApp.bindCssVars();
  themeParams.bindCssVars();

  debug &&
    import("eruda").then((lib) => lib.default.init()).catch(console.error);
}
