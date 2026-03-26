import { useEffect, useMemo, useRef, useState } from "react";
import { buildOpportunityDetailRoute } from "../app/routes";
import { OpportunityMiniCard } from "../shared/ui";

const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY;
const scriptId = "yandex-maps-js-api-v3";
const clustererPackageName = "@yandex/ymaps3-clusterer";
const clustererPackageVersion = "@yandex/ymaps3-clusterer@0.0";
const clustererCdnUrl = "https://cdn.jsdelivr.net/npm/{package}";
const markerSourceId = "home-opportunity-markers";
const markerClusterGridSize = 128;
const markerClusterMaxZoom = 13;
const markerLabelZoomThreshold = 13.2;
const markerLabelMaxLength = 16;
const markerLabelMaxWords = 2;
const defaultCenter = [37.617635, 55.755814];
const cityCenters = {
  Москва: [37.617635, 55.755814],
  Чебоксары: [47.251942, 56.1439],
  Казань: [49.106414, 55.796127],
  "Санкт-Петербург": [30.315877, 59.939099],
  "Нижний Новгород": [44.005986, 56.326887],
  Екатеринбург: [60.597465, 56.838011],
  Новосибирск: [82.92043, 55.030204],
};

let yandexMapsPromise;
let yandexPackagesRegistered = false;

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

function registerYandexPackages(ymaps3) {
  if (yandexPackagesRegistered || typeof ymaps3.import?.registerCdn !== "function") {
    return;
  }

  ymaps3.import.registerCdn(clustererCdnUrl, [clustererPackageVersion]);
  yandexPackagesRegistered = true;
}

function loadYandexMaps() {
  if (!apiKey) {
    return Promise.reject(new Error("missing-api-key"));
  }

  if (typeof window === "undefined") {
    return Promise.reject(new Error("window-is-unavailable"));
  }

  if (window.ymaps3?.ready) {
    return window.ymaps3.ready.then(() => {
      registerYandexPackages(window.ymaps3);
      return window.ymaps3;
    });
  }

  if (!yandexMapsPromise) {
    yandexMapsPromise = new Promise((resolve, reject) => {
      const onLoad = () => {
        window.ymaps3.ready
          .then(() => {
            registerYandexPackages(window.ymaps3);
            resolve(window.ymaps3);
          })
          .catch(reject);
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

function buildMarkerLabel(title) {
  const normalizedTitle = String(title ?? "").replace(/\s+/g, " ").trim();

  if (!normalizedTitle) {
    return "";
  }

  if (normalizedTitle.length <= markerLabelMaxLength) {
    return normalizedTitle;
  }

  const words = normalizedTitle.split(" ");
  let shortenedTitle = "";

  for (const word of words.slice(0, markerLabelMaxWords)) {
    const nextValue = shortenedTitle ? `${shortenedTitle} ${word}` : word;

    if (nextValue.length > markerLabelMaxLength - 1) {
      break;
    }

    shortenedTitle = nextValue;
  }

  const labelBase = shortenedTitle || normalizedTitle.slice(0, markerLabelMaxLength - 1).trimEnd();
  return `${labelBase.trimEnd()}…`;
}

function buildPointFeature(point) {
  return {
    type: "Feature",
    id: point.id,
    geometry: {
      type: "Point",
      coordinates: point.coordinates,
    },
    properties: {
      point,
    },
  };
}

function createMarkerElement(point, isActive, onSelectPoint) {
  const marker = document.createElement("button");
  marker.type = "button";
  marker.className = `ui-map-marker ui-map-marker--pin ui-map-marker--md ui-map-marker--${point.markerTone} ui-map-marker--with-label home-yandex-map__marker`;
  marker.setAttribute("aria-label", point.title);
  marker.setAttribute("aria-pressed", isActive ? "true" : "false");
  marker.dataset.pointId = String(point.id);
  marker.addEventListener("click", (event) => {
    event.stopPropagation();
    onSelectPoint?.(point.id);
  });

  const markerPin = document.createElement("span");
  markerPin.className = "ui-map-marker__pin";

  const markerShape = document.createElement("span");
  markerShape.className = "ui-map-marker__pin-shape";
  markerPin.append(markerShape);

  const markerLabel = document.createElement("span");
  markerLabel.className = "ui-map-marker__label";
  markerLabel.textContent = point.markerLabel;

  marker.append(markerPin, markerLabel);

  return marker;
}

function createClusterElement(count) {
  const cluster = document.createElement("div");
  cluster.className = "ui-map-marker ui-map-marker--cluster ui-map-marker--md home-yandex-map__marker home-yandex-map__cluster";
  cluster.setAttribute("aria-label", `Группа из ${count} точек`);

  const clusterCount = document.createElement("span");
  clusterCount.className = "ui-map-marker__cluster-count";
  clusterCount.textContent = String(count);

  cluster.append(clusterCount);

  return cluster;
}

export function HomeOpportunityMap({ items, selectedCity, activeId = null, onSelectItem }) {
  const rootRef = useRef(null);
  const containerRef = useRef(null);
  const onSelectItemRef = useRef(onSelectItem);
  const activeIdRef = useRef(activeId);
  const markerElementsRef = useRef(new Map());
  const [status, setStatus] = useState(apiKey ? "loading" : "missing-key");
  const [errorMessage, setErrorMessage] = useState("");
  const fallbackCenter = useMemo(() => getFallbackCenter(selectedCity), [selectedCity]);

  const points = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        markerTone: getMarkerTone(item),
        markerLabel: buildMarkerLabel(item.title),
      })),
    [items]
  );

  const mapLocation = useMemo(() => buildLocation(points, fallbackCenter), [fallbackCenter, points]);
  const pointFeatures = useMemo(() => points.map(buildPointFeature), [points]);
  const activeItem = useMemo(
    () => points.find((point) => point.id === activeId) ?? null,
    [activeId, points]
  );
  const [currentZoom, setCurrentZoom] = useState(mapLocation.zoom);

  useEffect(() => {
    onSelectItemRef.current = onSelectItem;
  }, [onSelectItem]);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    setCurrentZoom(mapLocation.zoom);
  }, [mapLocation.zoom]);

  useEffect(() => {
    const rootElement = rootRef.current;

    if (!rootElement) {
      return undefined;
    }

    const handleRootClick = (event) => {
      if (!activeIdRef.current) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      if (target.closest(".home-yandex-map__marker") || target.closest(".home-yandex-map__preview")) {
        return;
      }

      onSelectItemRef.current?.(null);
    };

    rootElement.addEventListener("click", handleRootClick);

    return () => {
      rootElement.removeEventListener("click", handleRootClick);
    };
  }, []);

  useEffect(() => {
    markerElementsRef.current.forEach((markerElement, pointId) => {
      markerElement.setAttribute("aria-pressed", pointId === activeId ? "true" : "false");
    });
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
        const {
          YMap,
          YMapDefaultSchemeLayer,
          YMapFeatureDataSource,
          YMapLayer,
          YMapListener,
          YMapMarker,
        } = ymaps3;
        const { YMapClusterer, clusterByGrid } = await ymaps3.import(clustererPackageName);

        if (cancelled || !containerRef.current) {
          return;
        }

        containerRef.current.innerHTML = "";
        markerElementsRef.current = new Map();

        mapInstance = new YMap(containerRef.current, {
          location: mapLocation,
          mode: "vector",
        });

        mapInstance.addChild(new YMapDefaultSchemeLayer());
        mapInstance.addChild(new YMapFeatureDataSource({ id: markerSourceId }));
        mapInstance.addChild(new YMapLayer({ source: markerSourceId, type: "markers", zIndex: 1800 }));
        mapInstance.addChild(
          new YMapListener({
            layer: "any",
            onUpdate: ({ location }) => {
              if (cancelled) {
                return;
              }

              setCurrentZoom((previousZoom) =>
                Math.abs(previousZoom - location.zoom) < 0.01 ? previousZoom : location.zoom
              );
            },
          })
        );
        mapInstance.addChild(
          new YMapClusterer({
            method: clusterByGrid({ gridSize: markerClusterGridSize }),
            maxZoom: markerClusterMaxZoom,
            features: pointFeatures,
            marker: (feature) => {
              const point = feature.properties.point;
              const markerElement = createMarkerElement(
                point,
                point.id === activeIdRef.current,
                (nextId) => onSelectItemRef.current?.(nextId)
              );

              markerElementsRef.current.set(point.id, markerElement);

              return new YMapMarker(
                {
                  coordinates: feature.geometry.coordinates,
                  source: markerSourceId,
                },
                markerElement
              );
            },
            cluster: (coordinates, features) =>
              new YMapMarker(
                {
                  coordinates,
                  source: markerSourceId,
                },
                createClusterElement(features.length)
              ),
          })
        );

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

      markerElementsRef.current = new Map();

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [mapLocation, pointFeatures]);

  const overlayState =
    status === "error"
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
    <div
      ref={rootRef}
      className={`home-yandex-map${currentZoom >= markerLabelZoomThreshold ? " is-marker-labels-visible" : ""}`}
    >
      <div ref={containerRef} className="home-yandex-map__canvas" />

      {status === "ready" && activeItem ? (
        <div className="home-yandex-map__preview">
          <OpportunityMiniCard
            item={activeItem}
            variant="compact"
            className="home-yandex-map__preview-card"
            dismissAction={{
              label: "Закрыть карточку",
              onClick: () => onSelectItemRef.current?.(null),
            }}
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
