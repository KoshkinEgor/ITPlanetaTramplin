import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getFallbackCityOption } from "../api/cities";
import { buildOpportunityDetailRoute } from "../app/routes";
import { loadYandexMapsApi } from "../shared/lib/loadYandexMapsApi";
import { OpportunityMiniCard } from "../shared/ui";
import "./HomeOpportunityMap.css";

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
const markerFocusZoom = 16.5;
const clusterZoomStep = 2;
const clusterFocusMaxZoom = 17;
const mapAnimationDuration = 280;
const previewGap = 14;
const previewSafePadding = 16;
const previewShiftTolerance = 3;
const maxPreviewShiftAttempts = 4;
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

let yandexPackagesRegistered = false;

function getApiKey() {
  return import.meta.env.VITE_YANDEX_MAPS_API_KEY;
}

function shouldSuggestLocalhostForYandexMaps(error) {
  return (
    error instanceof Error
    && error.message !== "missing-api-key"
    && typeof window !== "undefined"
    && window.location.hostname === "127.0.0.1"
  );
}

function getLocalhostYandexMapsMessage() {
  if (typeof window === "undefined") {
    return "Откройте приложение через localhost: ключ Яндекс Карт может быть привязан к localhost, а не к 127.0.0.1.";
  }

  const { protocol, port, pathname, search, hash } = window.location;
  const nextPort = port ? `:${port}` : "";
  return `Откройте приложение через ${protocol}//localhost${nextPort}${pathname}${search}${hash}: текущий ключ Яндекс Карт может быть привязан к localhost и отклоняться на 127.0.0.1.`;
}

function clamp(value, min, max) {
  if (max < min) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function roundToTwo(value) {
  return Math.round(value * 100) / 100;
}

function isFiniteCoordinateValue(value) {
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
}

function getFallbackCenter(selectedCity, selectedCityCoordinates) {
  if (
    Array.isArray(selectedCityCoordinates)
    && selectedCityCoordinates.length === 2
    && selectedCityCoordinates.every((coordinate) => isFiniteCoordinateValue(coordinate))
  ) {
    return [Number(selectedCityCoordinates[0]), Number(selectedCityCoordinates[1])];
  }

  const fallbackCity = getFallbackCityOption(selectedCity);

  if (fallbackCity?.longitude != null && fallbackCity?.latitude != null) {
    return [fallbackCity.longitude, fallbackCity.latitude];
  }

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
      center: fallbackCenter,
      zoom: 11.2,
    };
  }

  return {
    center: fallbackCenter,
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
  return loadYandexMapsApi({
    apiKey: getApiKey(),
    scriptId,
    onReady: registerYandexPackages,
  });
}

function getMarkerTone(item) {
  const semanticTone = String(item?.typeTone ?? "").trim().toLowerCase();

  if (["blue", "green", "orange", "teal"].includes(semanticTone)) {
    return semanticTone;
  }

  const typeKey = String(item?.typeKey ?? item?.opportunityType ?? "").trim().toLowerCase();

  if (typeKey === "internship") {
    return "green";
  }

  if (typeKey === "event") {
    return "orange";
  }

  if (typeKey === "mentoring") {
    return "teal";
  }

  const eyebrow = String(item.eyebrow ?? "").toLowerCase();

  if (eyebrow.includes("стаж")) {
    return "green";
  }

  if (eyebrow.includes("меропр")) {
    return "orange";
  }

  if (eyebrow.includes("ментор") || eyebrow.includes("РјРµРЅС‚РѕСЂ")) {
    return "teal";
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

function sortPointsForMap(points) {
  return [...points].sort((left, right) => String(left.id).localeCompare(String(right.id)));
}

function getPointFavoriteState(point) {
  if (point?.isFavoriteOpportunity ?? point?.isFavorite) {
    return "favorite";
  }

  if (point?.isFavoriteCompanyOpportunity) {
    return "company-favorite";
  }

  return "regular";
}

export function buildPointCollectionSignature(points) {
  return sortPointsForMap(points)
    .map((point) => {
      const [longitude, latitude] = point.coordinates;
      return [
        String(point.id),
        roundToTwo(Number(longitude)),
        roundToTwo(Number(latitude)),
        point.markerTone ?? "",
        getPointFavoriteState(point),
        point.markerLabel ?? "",
        point.title ?? "",
      ].join(":");
    })
    .join("|");
}

function toLocalBox(rect, rootRect) {
  return {
    left: rect.left - rootRect.left,
    top: rect.top - rootRect.top,
    width: rect.width,
    height: rect.height,
    right: rect.right - rootRect.left,
    bottom: rect.bottom - rootRect.top,
  };
}

function getPreviewMaxWidth(mapWidth, safePadding) {
  return Math.max(0, mapWidth - safePadding * 2);
}

export function computeAnchoredPreviewLayout({
  mapSize,
  markerBox,
  previewSize,
  safePadding = previewSafePadding,
  gap = previewGap,
}) {
  const maxWidth = getPreviewMaxWidth(mapSize.width, safePadding);
  const width = Math.min(previewSize.width, maxWidth);
  const height = previewSize.height;
  const markerCenterX = markerBox.left + markerBox.width / 2;
  const preferredLeft = markerCenterX - width / 2;
  const left = clamp(preferredLeft, safePadding, mapSize.width - safePadding - width);
  const topPlacementTop = markerBox.top - gap - height;
  const bottomPlacementTop = markerBox.bottom + gap;
  const fitsTop = topPlacementTop >= safePadding;
  const fitsBottom = bottomPlacementTop + height <= mapSize.height - safePadding;

  let placement = "top";

  if (!fitsTop && fitsBottom) {
    placement = "bottom";
  } else if (!fitsTop && !fitsBottom) {
    const availableTop = markerBox.top - safePadding - gap;
    const availableBottom = mapSize.height - markerBox.bottom - safePadding - gap;
    placement = availableTop >= availableBottom ? "top" : "bottom";
  }

  const preferredTop = placement === "top" ? topPlacementTop : bottomPlacementTop;
  const top = clamp(preferredTop, safePadding, mapSize.height - safePadding - height);
  const anchorLeft = clamp(markerCenterX - left, 24, Math.max(24, width - 24));

  return {
    placement,
    left,
    top,
    width,
    height,
    maxWidth,
    anchorLeft,
  };
}

export function computeViewportShift({
  mapSize,
  markerBox,
  previewSize,
  placement,
  safePadding = previewSafePadding,
  gap = previewGap,
}) {
  if (placement === "top") {
    const desiredMarkerTop = safePadding + previewSize.height + gap;
    return {
      x: 0,
      y: markerBox.top < desiredMarkerTop ? desiredMarkerTop - markerBox.top : 0,
    };
  }

  const desiredMarkerBottom = mapSize.height - safePadding - previewSize.height - gap;

  return {
    x: 0,
    y: markerBox.bottom > desiredMarkerBottom ? desiredMarkerBottom - markerBox.bottom : 0,
  };
}

export function shiftLocationByPixels(location, shift, mapSize) {
  if (!location?.bounds || !Array.isArray(location.center) || mapSize.width <= 0 || mapSize.height <= 0) {
    return null;
  }

  const [firstBound, secondBound] = location.bounds;

  if (!Array.isArray(firstBound) || !Array.isArray(secondBound)) {
    return null;
  }

  const west = Math.min(firstBound[0], secondBound[0]);
  const east = Math.max(firstBound[0], secondBound[0]);
  const south = Math.min(firstBound[1], secondBound[1]);
  const north = Math.max(firstBound[1], secondBound[1]);
  const longitudePerPixel = (east - west) / mapSize.width;
  const latitudePerPixel = (north - south) / mapSize.height;

  if (!Number.isFinite(longitudePerPixel) || !Number.isFinite(latitudePerPixel)) {
    return null;
  }

  return {
    center: [
      location.center[0] - shift.x * longitudePerPixel,
      location.center[1] + shift.y * latitudePerPixel,
    ],
    zoom: location.zoom,
  };
}

function isSameLayout(left, right) {
  if (left === right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  return (
    left.placement === right.placement
    && Math.abs(left.left - right.left) < 0.5
    && Math.abs(left.top - right.top) < 0.5
    && Math.abs(left.maxWidth - right.maxWidth) < 0.5
    && Math.abs(left.anchorLeft - right.anchorLeft) < 0.5
  );
}

function createMarkerElement(point, isActive, handlers = {}) {
  const favoriteState = getPointFavoriteState(point);
  const isFavorite = favoriteState === "favorite";
  const isCompanyFavorite = favoriteState === "company-favorite";
  const marker = document.createElement("button");
  marker.type = "button";
  marker.className = `ui-map-marker ui-map-marker--pin ui-map-marker--md ui-map-marker--${point.markerTone} ui-map-marker--with-label home-yandex-map__marker${isFavorite ? " home-yandex-map__marker--favorite" : ""}${isCompanyFavorite ? " home-yandex-map__marker--company-favorite" : ""}`;
  marker.setAttribute("aria-label", point.isFavorite ? `${point.title}, в избранном` : point.title);
  marker.setAttribute("aria-pressed", isActive ? "true" : "false");
  marker.setAttribute(
    "aria-label",
    isFavorite
      ? `${point.title}, в избранном`
      : isCompanyFavorite
        ? `${point.title}, в избранной компании`
        : point.title
  );
  marker.dataset.pointId = String(point.id);
  marker.dataset.favorite = favoriteState === "regular" ? "false" : "true";
  marker.dataset.favoriteState = favoriteState;
  marker.addEventListener("click", (event) => {
    event.stopPropagation();
    handlers.onTogglePoint?.(point.id);
  });
  marker.addEventListener("mouseenter", () => {
    handlers.onPreviewStart?.(point.id);
  });
  marker.addEventListener("mouseleave", () => {
    handlers.onPreviewEnd?.(point.id);
  });
  marker.addEventListener("focus", () => {
    handlers.onPreviewStart?.(point.id);
  });
  marker.addEventListener("blur", () => {
    handlers.onPreviewEnd?.(point.id);
  });

  const markerPin = document.createElement("span");
  markerPin.className = "ui-map-marker__pin";

  const markerShape = document.createElement("span");
  markerShape.className = "ui-map-marker__pin-shape";
  markerPin.append(markerShape);

  if (isFavorite) {
    const favoriteBadge = document.createElement("span");
    favoriteBadge.className = "home-yandex-map__marker-favorite-badge";
    favoriteBadge.setAttribute("aria-hidden", "true");
    favoriteBadge.innerHTML =
      '<svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 10.46 1.78 6.23A2.49 2.49 0 0 1 5.3 2.72L6 3.42l.7-.7a2.49 2.49 0 1 1 3.52 3.51L6 10.46Z" fill="currentColor"/></svg>';
    markerPin.append(favoriteBadge);
  }

  const markerLabel = document.createElement("span");
  markerLabel.className = "ui-map-marker__label";
  markerLabel.textContent = point.markerLabel;

  marker.append(markerPin, markerLabel);

  return marker;
}

function createClusterElement(count, onSelectCluster) {
  const cluster = document.createElement("button");
  cluster.type = "button";
  cluster.className = "ui-map-marker ui-map-marker--cluster ui-map-marker--md home-yandex-map__marker home-yandex-map__cluster";
  cluster.setAttribute("aria-label", `Группа из ${count} точек`);

  cluster.addEventListener("click", (event) => {
    event.stopPropagation();
    onSelectCluster?.();
  });

  const clusterCount = document.createElement("span");
  clusterCount.className = "ui-map-marker__cluster-count";
  clusterCount.textContent = String(count);

  cluster.append(clusterCount);

  return cluster;
}

function updateMapLocation(mapInstance, location) {
  if (!mapInstance) {
    return;
  }

  if (typeof mapInstance.update === "function") {
    mapInstance.update({ location });
    return;
  }

  if (typeof mapInstance.setLocation === "function") {
    mapInstance.setLocation(location);
  }
}

export function HomeOpportunityMap({ items, selectedCity, selectedCityCoordinates = null, activeId = null, onSelectItem }) {
  const rootRef = useRef(null);
  const containerRef = useRef(null);
  const previewRef = useRef(null);
  const previewCloseTimeoutRef = useRef(null);
  const onSelectItemRef = useRef(onSelectItem);
  const activeIdRef = useRef(activeId);
  const markerElementsRef = useRef(new Map());
  const mapInstanceRef = useRef(null);
  const mapViewportRef = useRef(null);
  const focusStateRef = useRef({ id: null, zoomApplied: false, shiftAttempts: 0 });
  const [status, setStatus] = useState(getApiKey() ? "loading" : "missing-key");
  const [errorMessage, setErrorMessage] = useState("");
  const [previewLayout, setPreviewLayout] = useState(null);
  const [viewportState, setViewportState] = useState({ zoom: 10.4, revision: 0 });
  const [measureRevision, setMeasureRevision] = useState(0);
  const [hoveredId, setHoveredId] = useState(null);

  const fallbackCenter = useMemo(
    () => getFallbackCenter(selectedCity, selectedCityCoordinates),
    [selectedCity, selectedCityCoordinates]
  );

  const points = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        markerTone: getMarkerTone(item),
        markerLabel: buildMarkerLabel(item.title),
      })),
    [items]
  );

  const mapPoints = useMemo(() => sortPointsForMap(points), [points]);
  const mapLocation = useMemo(() => buildLocation(mapPoints, fallbackCenter), [fallbackCenter, mapPoints]);
  const pointFeatures = useMemo(() => mapPoints.map(buildPointFeature), [mapPoints]);
  const mapDataSignature = useMemo(() => buildPointCollectionSignature(mapPoints), [mapPoints]);
  const previewActiveId = activeId ?? hoveredId;
  const activeItem = useMemo(
    () => points.find((point) => point.id === previewActiveId) ?? null,
    [points, previewActiveId]
  );
  const currentZoom = viewportState.zoom;

  useEffect(() => {
    onSelectItemRef.current = onSelectItem;
  }, [onSelectItem]);

  function clearPendingPreviewClose() {
    if (previewCloseTimeoutRef.current == null) {
      return;
    }

    window.clearTimeout(previewCloseTimeoutRef.current);
    previewCloseTimeoutRef.current = null;
  }

  function schedulePreviewClose(pointId = null) {
    clearPendingPreviewClose();

    previewCloseTimeoutRef.current = window.setTimeout(() => {
      if (activeIdRef.current) {
        return;
      }

      setHoveredId((current) => {
        if (pointId == null || String(current) === String(pointId)) {
          return null;
        }

        return current;
      });
      previewCloseTimeoutRef.current = null;
    }, 80);
  }

  function handleClusterSelect(coordinates) {
    const currentLocation = mapViewportRef.current ?? mapLocation;
    const currentZoom = Number.isFinite(currentLocation?.zoom) ? currentLocation.zoom : mapLocation.zoom;
    const nextZoom = Math.min(clusterFocusMaxZoom, currentZoom + clusterZoomStep);

    focusStateRef.current = { id: null, zoomApplied: false, shiftAttempts: 0 };
    setPreviewLayout(null);
    onSelectItemRef.current?.(null);
    updateMapLocation(mapInstanceRef.current, {
      center: coordinates,
      zoom: nextZoom,
      duration: mapAnimationDuration,
    });
  }

  function handlePreviewStart(pointId) {
    if (activeIdRef.current) {
      return;
    }

    clearPendingPreviewClose();
    setHoveredId(String(pointId));
  }

  function handlePreviewEnd(pointId) {
    if (activeIdRef.current) {
      return;
    }

    schedulePreviewClose(pointId);
  }

  function handleTogglePoint(pointId) {
    onSelectItemRef.current?.(String(activeIdRef.current) === String(pointId) ? null : pointId);
  }

  useEffect(() => {
    activeIdRef.current = activeId;
    clearPendingPreviewClose();

    if (activeId !== null && activeId !== undefined) {
      setHoveredId(null);
    }
  }, [activeId]);

  useEffect(() => () => clearPendingPreviewClose(), []);

  useEffect(() => {
    mapViewportRef.current = {
      ...(mapViewportRef.current ?? {}),
      center: mapLocation.center,
      zoom: mapLocation.zoom,
    };

    setViewportState((previousState) => ({
      zoom: mapLocation.zoom,
      revision: previousState.revision + 1,
    }));
  }, [mapLocation.center[0], mapLocation.center[1], mapLocation.zoom]);

  useEffect(() => {
    if (!activeId) {
      focusStateRef.current = { id: null, zoomApplied: false, shiftAttempts: 0 };
      setPreviewLayout(null);
      return;
    }

    if (focusStateRef.current.id !== activeId) {
      focusStateRef.current = { id: activeId, zoomApplied: false, shiftAttempts: 0 };
      setPreviewLayout(null);
    }
  }, [activeId]);

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
      markerElement.setAttribute("aria-pressed", pointId === previewActiveId ? "true" : "false");
    });
  }, [mapDataSignature, previewActiveId]);

  useEffect(() => {
    const handleResize = () => {
      setMeasureRevision((currentRevision) => currentRevision + 1);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const rootElement = rootRef.current;
    const previewElement = previewRef.current;

    if (!rootElement && !previewElement) {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      setMeasureRevision((currentRevision) => currentRevision + 1);
    });

    if (rootElement) {
      observer.observe(rootElement);
    }

    if (previewElement) {
      observer.observe(previewElement);
    }

    return () => {
      observer.disconnect();
    };
  }, [activeItem, status]);

  useEffect(() => {
    let cancelled = false;
    let mapInstance = null;

    async function initMap() {
      if (!containerRef.current) {
        return;
      }

      if (!getApiKey()) {
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
        mapInstanceRef.current = mapInstance;
        mapViewportRef.current = { ...mapLocation };

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

              mapViewportRef.current = location;
              setViewportState((previousState) => ({
                zoom: Number.isFinite(location?.zoom) ? location.zoom : previousState.zoom,
                revision: previousState.revision + 1,
              }));
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
                {
                  onTogglePoint: handleTogglePoint,
                  onPreviewStart: handlePreviewStart,
                  onPreviewEnd: handlePreviewEnd,
                }
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
                createClusterElement(features.length, () => handleClusterSelect(coordinates))
              ),
          })
        );

        setStatus("ready");
      } catch (error) {
        if (cancelled) {
          return;
        }

        setStatus("error");
        if (shouldSuggestLocalhostForYandexMaps(error)) {
          setErrorMessage(getLocalhostYandexMapsMessage());
          return;
        }

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

      if (mapInstanceRef.current === mapInstance) {
        mapInstanceRef.current = null;
      }

      markerElementsRef.current = new Map();

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [mapDataSignature, mapLocation.center[0], mapLocation.center[1], mapLocation.zoom]);

  useLayoutEffect(() => {
    if (status !== "ready" || !activeItem || !rootRef.current || !previewRef.current) {
      return;
    }

    if (focusStateRef.current.id !== activeItem.id) {
      focusStateRef.current = { id: activeItem.id, zoomApplied: false, shiftAttempts: 0 };
    }

    const markerElement = markerElementsRef.current.get(activeItem.id);
    const previewCardElement = previewRef.current.querySelector(".home-yandex-map__preview-card");

    if (!markerElement || !(previewCardElement instanceof HTMLElement)) {
      return;
    }

    const rootRect = rootRef.current.getBoundingClientRect();
    const markerRect = markerElement.getBoundingClientRect();
    const previewRect = previewCardElement.getBoundingClientRect();

    if (!rootRect.width || !rootRect.height || !previewRect.width || !previewRect.height) {
      return;
    }

    const localMarkerBox = toLocalBox(markerRect, rootRect);
    const mapSize = { width: rootRect.width, height: rootRect.height };
    const nextLayout = computeAnchoredPreviewLayout({
      mapSize,
      markerBox: localMarkerBox,
      previewSize: { width: previewRect.width, height: previewRect.height },
    });

    setPreviewLayout((currentLayout) => (isSameLayout(currentLayout, nextLayout) ? currentLayout : nextLayout));

    if (!activeId) {
      return;
    }

    const focusState = focusStateRef.current;
    const mapViewport = mapViewportRef.current;

    if (!mapViewport) {
      return;
    }

    if (!focusState.zoomApplied && Number.isFinite(mapViewport.zoom) && mapViewport.zoom < markerFocusZoom - 0.05) {
      focusState.zoomApplied = true;
      updateMapLocation(mapInstanceRef.current, {
        center: activeItem.coordinates,
        zoom: markerFocusZoom,
        duration: mapAnimationDuration,
      });
      return;
    }

    focusState.zoomApplied = true;

    const shift = computeViewportShift({
      mapSize,
      markerBox: localMarkerBox,
      previewSize: { width: nextLayout.width, height: nextLayout.height },
      placement: nextLayout.placement,
    });

    if (
      (Math.abs(shift.x) > previewShiftTolerance || Math.abs(shift.y) > previewShiftTolerance)
      && focusState.shiftAttempts < maxPreviewShiftAttempts
    ) {
      const shiftedLocation = shiftLocationByPixels(mapViewport, shift, mapSize);

      if (shiftedLocation) {
        focusState.shiftAttempts += 1;
        updateMapLocation(mapInstanceRef.current, {
          ...shiftedLocation,
          duration: mapAnimationDuration,
        });
        return;
      }
    }

    focusState.shiftAttempts = 0;
  }, [activeId, activeItem, measureRevision, status, viewportState.revision]);

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

  const previewStyle =
    previewLayout == null
      ? { visibility: "hidden" }
      : {
          left: `${previewLayout.left}px`,
          top: `${previewLayout.top}px`,
          maxWidth: `${previewLayout.maxWidth}px`,
          "--home-yandex-map-preview-anchor": `${previewLayout.anchorLeft}px`,
        };

  return (
    <div
      ref={rootRef}
      className={`home-yandex-map${currentZoom >= markerLabelZoomThreshold ? " is-marker-labels-visible" : ""}`}
    >
      <div ref={containerRef} className="home-yandex-map__canvas" />

      {status === "ready" && activeItem ? (
        <div
          ref={previewRef}
          className={`home-yandex-map__preview home-yandex-map__preview--${previewLayout?.placement ?? "top"}${previewLayout ? " is-positioned" : " is-measuring"}`}
          style={previewStyle}
          onMouseEnter={() => handlePreviewStart(activeItem.id)}
          onMouseLeave={() => handlePreviewEnd(activeItem.id)}
          onFocusCapture={() => handlePreviewStart(activeItem.id)}
          onBlurCapture={() => handlePreviewEnd(activeItem.id)}
        >
          <OpportunityMiniCard
            item={activeItem}
            variant="map-compact"
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
