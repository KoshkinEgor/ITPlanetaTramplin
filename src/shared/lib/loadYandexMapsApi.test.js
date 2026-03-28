import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadYandexMapsApi, resetYandexMapsApiLoaderForTests } from "./loadYandexMapsApi";

describe("loadYandexMapsApi", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetYandexMapsApiLoaderForTests();
    delete window.ymaps3;
  });

  afterEach(() => {
    vi.useRealTimers();
    resetYandexMapsApiLoaderForTests();
    delete window.ymaps3;
    document.getElementById("yandex-maps-js-api-v3")?.remove();
  });

  it("rejects when the script never finishes loading", async () => {
    const promise = loadYandexMapsApi({
      apiKey: "test-key",
      timeoutMs: 50,
      timeoutErrorMessage: "Timed out waiting for Yandex Maps",
    });
    const expectation = expect(promise).rejects.toThrow("Timed out waiting for Yandex Maps");

    await vi.advanceTimersByTimeAsync(60);

    await expectation;
  });

  it("shares the base loader but runs onReady for every caller", async () => {
    const onReadyFirst = vi.fn();
    const onReadySecond = vi.fn();

    const firstPromise = loadYandexMapsApi({
      apiKey: "test-key",
      timeoutMs: 50,
      onReady: onReadyFirst,
    });
    const secondPromise = loadYandexMapsApi({
      apiKey: "test-key",
      timeoutMs: 50,
      onReady: onReadySecond,
    });

    const script = document.getElementById("yandex-maps-js-api-v3");

    expect(script).not.toBeNull();
    expect(document.querySelectorAll("#yandex-maps-js-api-v3")).toHaveLength(1);

    window.ymaps3 = {
      ready: Promise.resolve(),
    };

    script.dispatchEvent(new Event("load"));
    await Promise.all([firstPromise, secondPromise]);

    expect(onReadyFirst).toHaveBeenCalledWith(window.ymaps3);
    expect(onReadySecond).toHaveBeenCalledWith(window.ymaps3);
  });
});
