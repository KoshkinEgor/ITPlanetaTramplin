const DEFAULT_SCRIPT_ID = "yandex-maps-js-api-v3";
const DEFAULT_LANG = "ru_RU";
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_LOAD_ERROR_MESSAGE = "Не удалось загрузить API Яндекс Карт.";
const DEFAULT_TIMEOUT_ERROR_MESSAGE = "API Яндекс Карт не ответило вовремя.";
const SCRIPT_STATUS_DATASET_KEY = "yandexMapsLoaderStatus";

const loaderPromisesByScriptId = new Map();

function toError(error, fallbackMessage) {
  return error instanceof Error ? error : new Error(fallbackMessage);
}

function withTimeout(promise, timeoutMs, timeoutMessage) {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    Promise.resolve(promise)
      .then((value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      });
  });
}

function getScriptStatus(script) {
  return script.dataset[SCRIPT_STATUS_DATASET_KEY] ?? "loading";
}

function setScriptStatus(script, status) {
  script.dataset[SCRIPT_STATUS_DATASET_KEY] = status;
}

function buildSourceUrl(apiKey, lang) {
  return `https://api-maps.yandex.ru/v3/?apikey=${apiKey}&lang=${lang}`;
}

function waitForYandexMapsReady(timeoutMs, timeoutErrorMessage, loadErrorMessage) {
  if (!window.ymaps3?.ready) {
    throw new Error(loadErrorMessage);
  }

  return withTimeout(Promise.resolve(window.ymaps3.ready), timeoutMs, timeoutErrorMessage)
    .then(() => window.ymaps3);
}

function shouldReplaceScript(script, expectedSrc) {
  const readyState = typeof script.readyState === "string" ? script.readyState.toLowerCase() : "";
  const status = getScriptStatus(script);

  return (
    script.src !== expectedSrc
    || status === "error"
    || ((status === "loaded" || readyState === "loaded" || readyState === "complete") && !window.ymaps3?.ready)
  );
}

function ensureYandexMapsApiLoaded({
  apiKey,
  scriptId,
  lang,
  timeoutMs,
  loadErrorMessage,
  timeoutErrorMessage,
}) {
  if (window.ymaps3?.ready) {
    return waitForYandexMapsReady(timeoutMs, timeoutErrorMessage, loadErrorMessage);
  }

  const cachedPromise = loaderPromisesByScriptId.get(scriptId);

  if (cachedPromise) {
    return cachedPromise;
  }

  const sourceUrl = buildSourceUrl(apiKey, lang);
  const promise = new Promise((resolve, reject) => {
    let isSettled = false;
    let timeoutId = null;

    function cleanup(script, handleLoad, handleError) {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
      if (timeoutId != null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
    }

    function settleWithResult(result) {
      if (isSettled) {
        return;
      }

      isSettled = true;
      resolve(result);
    }

    function settleWithError(error) {
      if (isSettled) {
        return;
      }

      isSettled = true;
      reject(toError(error, loadErrorMessage));
    }

    function finishFromWindow() {
      try {
        waitForYandexMapsReady(timeoutMs, timeoutErrorMessage, loadErrorMessage)
          .then(settleWithResult)
          .catch(settleWithError);
      } catch (error) {
        settleWithError(error);
      }
    }

    function attachToScript(script) {
      const handleLoad = () => {
        setScriptStatus(script, "loaded");
        cleanup(script, handleLoad, handleError);
        finishFromWindow();
      };

      const handleError = () => {
        setScriptStatus(script, "error");
        cleanup(script, handleLoad, handleError);
        settleWithError(new Error(loadErrorMessage));
      };

      timeoutId = window.setTimeout(() => {
        setScriptStatus(script, "error");
        cleanup(script, handleLoad, handleError);
        settleWithError(new Error(timeoutErrorMessage));
      }, timeoutMs);

      script.addEventListener("load", handleLoad, { once: true });
      script.addEventListener("error", handleError, { once: true });

      const readyState = typeof script.readyState === "string" ? script.readyState.toLowerCase() : "";
      const status = getScriptStatus(script);

      if (status === "loaded" || readyState === "loaded" || readyState === "complete") {
        handleLoad();
      }
    }

    let script = document.getElementById(scriptId);

    if (script != null && !(script instanceof HTMLScriptElement)) {
      settleWithError(new Error(loadErrorMessage));
      return;
    }

    if (script instanceof HTMLScriptElement && shouldReplaceScript(script, sourceUrl)) {
      script.remove();
      script = null;
    }

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.src = sourceUrl;
      setScriptStatus(script, "loading");
      attachToScript(script);
      document.head.append(script);
      return;
    }

    attachToScript(script);
  }).catch((error) => {
    loaderPromisesByScriptId.delete(scriptId);
    throw error;
  });

  loaderPromisesByScriptId.set(scriptId, promise);

  return promise;
}

export function loadYandexMapsApi({
  apiKey,
  scriptId = DEFAULT_SCRIPT_ID,
  lang = DEFAULT_LANG,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  loadErrorMessage = DEFAULT_LOAD_ERROR_MESSAGE,
  timeoutErrorMessage = DEFAULT_TIMEOUT_ERROR_MESSAGE,
  onReady,
}) {
  if (!apiKey) {
    return Promise.reject(new Error("missing-api-key"));
  }

  if (typeof window === "undefined") {
    return Promise.reject(new Error("window-is-unavailable"));
  }

  return ensureYandexMapsApiLoaded({
    apiKey,
    scriptId,
    lang,
    timeoutMs,
    loadErrorMessage,
    timeoutErrorMessage,
  }).then((ymaps3) => {
    onReady?.(ymaps3);
    return ymaps3;
  });
}

export function resetYandexMapsApiLoaderForTests() {
  loaderPromisesByScriptId.clear();
}
