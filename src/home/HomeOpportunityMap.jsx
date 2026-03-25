import { useEffect, useMemo, useRef, useState } from "react";
import { buildOpportunityDetailRoute } from "../app/routes";
import { OpportunityMiniCard } from "../shared/ui";

const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY;
const scriptId = "yandex-maps-js-api-v3";
const defaultCenter = [37.617635, 55.755814];
const cityCenters = {
  "Москва": [37.617635, 55.755814],
  "Чебоксары": [47.251942, 56.1439],
  "Казань": [49.106414, 55.796127],
  "Санкт-Петербург": [30.315877, 59.939099],
  "Нижний Новгород": [44.005986, 56.326887],
  "Екатеринбург": [60.597465, 56.838011],
  "Новосибирск": [82.92043, 55.030204],
};
let yandexMapsPromise;

function getFallbackCenter(selectedCity) {
  return cityCenters[selectedCity] ?? defaultCenter;
}

function buildLocation(points, fallbackCenter) {
  if (!points.length) {
    return {
      center: fallbackCenter,
      zoom: 10.4,
    };
  }

  if (points.length === 1) {
    return {
      center: points[0].coordinates,
      zoom: 12.4,
    };
  }

  const total = points.reduce(
    (accumulator, point) => ({
      lng: accumulator.lng + point.coordinates[0],
      lat: accumulator.lat + point.coordinates[1],
    }),
    { lng: 0, lat: 0 }
  );

  return {
    center: [total.lng / points.length, total.lat / points.length],
    zoom: 10.2,
  };
}

function loadYandexMaps() {
  if (!apiKey) {
    return Promise.reject(new Error("missing-api-key"));
  }

  if (typeof window === "undefined") {
    return Promise.reject(new Error("window-is-unavailable"));
  }

  if (window.ymaps3?.ready) {
    return window.ymaps3.ready.then(() => window.ymaps3);
  }

  if (!yandexMapsPromise) {
    yandexMapsPromise = new Promise((resolve, reject) => {
      const onLoad = () => {
        window.ymaps3.ready.then(() => resolve(window.ymaps3)).catch(reject);
      };

      const onError = () => {
        reject(new Error("Не удалось загрузить API Яндекс Карт."));
      };

      const existingScript = document.getElementById(scriptId);

      if (existingScript) {
        existingScript.addEventListener("load", onLoad, { once: true });
        existingScript.addEventListener("error", onError, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.src = `https://api-maps.yandex.ru/v3/?apikey=${apiKey}&lang=ru_RU`;
      script.addEventListener("load", onLoad, { once: true });
      script.addEventListener("error", onError, { once: true });
      document.head.append(script);
    }).catch((error) => {
      yandexMapsPromise = null;
      throw error;
    });
  }

  return yandexMapsPromise;
}

function getMarkerTone(item) {
  const eyebrow = String(item.eyebrow ?? "").toLowerCase();

  if (eyebrow.includes("стаж")) {
    return "green";
  }

  if (eyebrow.includes("меропр")) {
    return "orange";
  }

  return "blue";
}

export function HomeOpportunityMap({ items, selectedCity }) {
  const containerRef = useRef(null);
  const [status, setStatus] = useState(apiKey ? "loading" : "missing-key");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeId, setActiveId] = useState(() => items[0]?.id ?? null);

  const points = useMemo(
    () => items.map((item) => ({
      ...item,
      markerTone: getMarkerTone(item),
    })),
    [items]
  );

  const fallbackCenter = useMemo(() => getFallbackCenter(selectedCity), [selectedCity]);
  const activeItem = useMemo(
    () => points.find((point) => point.id === activeId) ?? points[0] ?? null,
    [activeId, points]
  );

  useEffect(() => {
    if (!points.length) {
      setActiveId(null);
      return;
    }

    if (!points.some((point) => point.id === activeId)) {
      setActiveId(points[0].id);
    }
  }, [activeId, points]);

  useEffect(() => {
    let cancelled = false;
    let mapInstance = null;

    async function initMap() {
      if (!containerRef.current) {
        return;
      }

      if (!apiKey) {
        setStatus("missing-key");
        return;
      }

      setStatus("loading");
      setErrorMessage("");

      try {
        const ymaps3 = await loadYandexMaps();

        if (cancelled || !containerRef.current) {
          return;
        }

        containerRef.current.innerHTML = "";

        const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker } = ymaps3;

        mapInstance = new YMap(containerRef.current, {
          location: buildLocation(points, fallbackCenter),
          mode: "vector",
        });

        mapInstance.addChild(new YMapDefaultSchemeLayer());
        mapInstance.addChild(new YMapDefaultFeaturesLayer());

        points.forEach((point) => {
          const marker = document.createElement("button");
          marker.type = "button";
          marker.className = `home-yandex-map__marker home-yandex-map__marker--${point.markerTone}`;
          marker.setAttribute("aria-label", point.title);

          const markerCore = document.createElement("span");
          markerCore.className = "home-yandex-map__marker-core";

          const markerLabel = document.createElement("span");
          markerLabel.className = "home-yandex-map__marker-label";
          markerLabel.textContent = point.title;

          marker.append(markerCore, markerLabel);
          marker.addEventListener("click", () => setActiveId(point.id));

          mapInstance.addChild(new YMapMarker({ coordinates: point.coordinates }, marker));
        });

        setStatus("ready");
      } catch (error) {
        if (cancelled) {
          return;
        }

        setStatus("error");

        if (error instanceof Error && error.message === "missing-api-key") {
          setErrorMessage("В .env.local не найден VITE_YANDEX_MAPS_API_KEY.");
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Карта не загрузилась.");
      }
    }

    initMap();

    return () => {
      cancelled = true;

      if (mapInstance) {
        mapInstance.destroy?.();
      }

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [fallbackCenter, points]);

  const overlayState = status === "error"
    ? {
        title: "Карта сейчас недоступна",
        description: errorMessage || "Проверьте ключ, referer и статус активации API.",
      }
    : status === "missing-key"
      ? {
          title: "Не найден API-ключ",
          description: "Добавьте VITE_YANDEX_MAPS_API_KEY в .env.local и перезапустите Vite.",
        }
      : status === "loading"
        ? {
            title: "Подключаем Яндекс Карту",
            description: "Загружаем слой карты и расставляем точки возможностей.",
          }
        : !points.length
          ? {
              title: "Нет точек по текущим фильтрам",
              description: "Сбросьте часть фильтров или выберите другой город.",
            }
          : null;

  return (
    <div className="home-yandex-map">
      <div ref={containerRef} className="home-yandex-map__canvas" />

      {status === "ready" && activeItem ? (
        <div className="home-yandex-map__preview">
          <OpportunityMiniCard
            item={activeItem}
            className="home-yandex-map__preview-card"
            detailAction={{
              href: activeItem.detailHref ?? activeItem.href ?? buildOpportunityDetailRoute(activeItem.id),
              label: "Подробнее",
            }}
          />
        </div>
      ) : null}

      {overlayState ? (
        <div className="home-yandex-map__overlay" role="status" aria-live="polite">
          <strong>{overlayState.title}</strong>
          <p>{overlayState.description}</p>
        </div>
      ) : null}
    </div>
  );
}
