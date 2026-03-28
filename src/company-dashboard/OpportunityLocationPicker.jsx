import { useEffect, useMemo, useRef, useState } from "react";
import { normalizeSelectedAddressLabel, reverseGeocodeAddress } from "../api/addresses";
import { getFallbackCityOption } from "../api/cities";
import { loadYandexMapsApi } from "../shared/lib/loadYandexMapsApi";
import { AddressAutocomplete, Button, FormField, Input } from "../shared/ui";

const mapScriptId = "yandex-maps-js-api-v3";
const markerSourceId = "company-location-picker-marker-source";
const defaultCenter = [37.617635, 55.755814];
const selectionDeduplicationWindowMs = 250;

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

function normalizeCoordinate(value) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function isCoordinatePair(value) {
  return Array.isArray(value)
    && value.length === 2
    && value.every((coordinate) => Number.isFinite(Number(coordinate)));
}

function formatCoordinateValue(value) {
  const normalizedValue = normalizeCoordinate(value);
  return normalizedValue == null ? "" : String(normalizedValue);
}

function formatCoordinatesLabel(latitude, longitude) {
  const normalizedLatitude = normalizeCoordinate(latitude);
  const normalizedLongitude = normalizeCoordinate(longitude);

  if (normalizedLatitude == null || normalizedLongitude == null) {
    return "Точка на карте еще не выбрана";
  }

  return `${normalizedLatitude.toFixed(6)}, ${normalizedLongitude.toFixed(6)}`;
}

function sanitizeCoordinatePair(latitude, longitude) {
  const normalizedLatitude = normalizeCoordinate(latitude);
  const normalizedLongitude = normalizeCoordinate(longitude);

  if (normalizedLatitude === 0 && normalizedLongitude === 0) {
    return { latitude: null, longitude: null };
  }

  return {
    latitude: normalizedLatitude,
    longitude: normalizedLongitude,
  };
}

function normalizeCityLabel(value) {
  return String(value ?? "")
    .trim()
    .replace(/^(г\.?|город)\s+/iu, "")
    .trim();
}

function buildMapLocation(centerCoordinates, markerCoordinates) {
  if (isCoordinatePair(markerCoordinates)) {
    return {
      center: [Number(markerCoordinates[0]), Number(markerCoordinates[1])],
      zoom: 15.8,
    };
  }

  if (isCoordinatePair(centerCoordinates)) {
    return {
      center: [Number(centerCoordinates[0]), Number(centerCoordinates[1])],
      zoom: 11.6,
    };
  }

  return {
    center: defaultCenter,
    zoom: 10.8,
  };
}

function createMarkerElement() {
  const marker = document.createElement("div");
  marker.className = "ui-map-marker ui-map-marker--pin ui-map-marker--lg ui-map-marker--blue company-dashboard-location-picker__marker";
  marker.setAttribute("aria-hidden", "true");

  const markerPin = document.createElement("span");
  markerPin.className = "ui-map-marker__pin";

  const markerShape = document.createElement("span");
  markerShape.className = "ui-map-marker__pin-shape";
  markerPin.append(markerShape);

  marker.append(markerPin);
  return marker;
}

function loadYandexMaps() {
  return loadYandexMapsApi({
    apiKey: getApiKey(),
    scriptId: mapScriptId,
  });
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

function normalizeMapEventCoordinates(object, mapEvent) {
  const candidates = [
    mapEvent?.coordinates,
    mapEvent?.lngLat,
    object?.coordinates,
  ];

  for (const candidate of candidates) {
    if (isCoordinatePair(candidate)) {
      return [Number(candidate[0]), Number(candidate[1])];
    }
  }

  return null;
}

function formatCoordinateSignature(coordinates) {
  if (!isCoordinatePair(coordinates)) {
    return "";
  }

  return `${Number(coordinates[0]).toFixed(6)}:${Number(coordinates[1]).toFixed(6)}`;
}

function LocationSelectionMap({ centerCoordinates, markerCoordinates, onSelectCoordinates }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const markerConstructorRef = useRef(null);
  const locationRef = useRef(null);
  const markerCoordinatesRef = useRef(null);
  const onSelectCoordinatesRef = useRef(onSelectCoordinates);
  const lastSelectionRef = useRef({ signature: "", timestamp: 0 });
  const [status, setStatus] = useState(getApiKey() ? "loading" : "missing-key");
  const [errorMessage, setErrorMessage] = useState("");
  const centerLongitude = isCoordinatePair(centerCoordinates) ? Number(centerCoordinates[0]) : null;
  const centerLatitude = isCoordinatePair(centerCoordinates) ? Number(centerCoordinates[1]) : null;
  const markerLongitude = isCoordinatePair(markerCoordinates) ? Number(markerCoordinates[0]) : null;
  const markerLatitude = isCoordinatePair(markerCoordinates) ? Number(markerCoordinates[1]) : null;
  const resolvedMarkerCoordinates = useMemo(
    () => (markerLongitude != null && markerLatitude != null ? [markerLongitude, markerLatitude] : null),
    [markerLatitude, markerLongitude]
  );
  const mapLocation = useMemo(
    () => buildMapLocation(
      centerLongitude != null && centerLatitude != null ? [centerLongitude, centerLatitude] : null,
      resolvedMarkerCoordinates
    ),
    [centerLatitude, centerLongitude, resolvedMarkerCoordinates]
  );

  useEffect(() => {
    onSelectCoordinatesRef.current = onSelectCoordinates;
  }, [onSelectCoordinates]);

  useEffect(() => {
    locationRef.current = mapLocation;
  }, [mapLocation]);

  useEffect(() => {
    markerCoordinatesRef.current = resolvedMarkerCoordinates;
  }, [resolvedMarkerCoordinates]);

  useEffect(() => {
    const mapInstance = mapRef.current;

    if (!mapInstance) {
      return;
    }

    updateMapLocation(mapInstance, mapLocation);
  }, [mapLocation]);

  useEffect(() => {
    const mapInstance = mapRef.current;
    const MarkerConstructor = markerConstructorRef.current;

    if (!mapInstance || !MarkerConstructor) {
      return;
    }

    if (!resolvedMarkerCoordinates) {
      if (markerRef.current) {
        mapInstance.removeChild?.(markerRef.current);
        markerRef.current = null;
      }
      return;
    }

    if (markerRef.current && typeof markerRef.current.update === "function") {
      markerRef.current.update({
        coordinates: resolvedMarkerCoordinates,
        source: markerSourceId,
      });
      return;
    }

    if (markerRef.current) {
      mapInstance.removeChild?.(markerRef.current);
    }

    const nextMarker = new MarkerConstructor(
      {
        coordinates: resolvedMarkerCoordinates,
        source: markerSourceId,
      },
      createMarkerElement()
    );

    mapInstance.addChild(nextMarker);
    markerRef.current = nextMarker;
  }, [resolvedMarkerCoordinates]);

  useEffect(() => {
    let cancelled = false;
    const containerElement = containerRef.current;

    async function initMap() {
      if (!containerElement) {
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

        if (cancelled || !containerElement) {
          return;
        }

        const handleMapSelect = (object, mapEvent) => {
          const nextCoordinates = normalizeMapEventCoordinates(object, mapEvent);

          if (!nextCoordinates) {
            return;
          }

          const signature = formatCoordinateSignature(nextCoordinates);
          const timestamp = Date.now();

          if (
            signature
            && lastSelectionRef.current.signature === signature
            && timestamp - lastSelectionRef.current.timestamp < selectionDeduplicationWindowMs
          ) {
            return;
          }

          lastSelectionRef.current = { signature, timestamp };
          onSelectCoordinatesRef.current?.(nextCoordinates);
        };

        containerElement.innerHTML = "";

        const mapInstance = new YMap(containerElement, {
          location: locationRef.current ?? mapLocation,
        });

        mapRef.current = mapInstance;
        markerConstructorRef.current = YMapMarker;

        mapInstance.addChild(new YMapDefaultSchemeLayer({ type: "ground" }));
        mapInstance.addChild(new YMapFeatureDataSource({ id: markerSourceId }));
        mapInstance.addChild(new YMapLayer({ source: markerSourceId, type: "markers", zIndex: 1200 }));
        mapInstance.addChild(
          new YMapListener({
            layer: "any",
            onClick: handleMapSelect,
            onFastClick: handleMapSelect,
          })
        );

        if (markerCoordinatesRef.current) {
          const initialMarker = new YMapMarker(
            {
              coordinates: markerCoordinatesRef.current,
              source: markerSourceId,
            },
            createMarkerElement()
          );

          mapInstance.addChild(initialMarker);
          markerRef.current = initialMarker;
        }

        updateMapLocation(mapInstance, locationRef.current ?? mapLocation);

        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            if (cancelled || mapRef.current !== mapInstance) {
              return;
            }

            updateMapLocation(mapInstance, locationRef.current ?? mapLocation);
          });
        });

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

      if (mapRef.current) {
        mapRef.current.destroy?.();
      }

      mapRef.current = null;
      markerRef.current = null;
      markerConstructorRef.current = null;

      if (containerElement) {
        containerElement.innerHTML = "";
      }
    };
  }, []);

  return (
    <div className="company-dashboard-location-picker__map-shell">
      <div ref={containerRef} className="company-dashboard-location-picker__map-canvas" />
      {status !== "ready" ? (
        <div className="company-dashboard-location-picker__map-overlay" role="status" aria-live="polite">
          <strong>
            {status === "loading"
              ? "Подключаем карту"
              : status === "missing-key"
                ? "Не найден ключ карты"
                : "Карта временно недоступна"}
          </strong>
          <p>
            {status === "loading"
              ? "Загружаем слой Яндекс Карт и готовим выбор точки."
              : status === "missing-key"
                ? "Добавьте VITE_YANDEX_MAPS_API_KEY в .env.local и перезапустите frontend."
                : errorMessage || "Попробуйте обновить страницу позже."}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function OpportunityLocationPicker({
  locationCity,
  locationAddress,
  latitude,
  longitude,
  onFieldChange,
}) {
  const { latitude: resolvedLatitude, longitude: resolvedLongitude } = sanitizeCoordinatePair(latitude, longitude);
  const hasCoordinates = resolvedLatitude != null && resolvedLongitude != null;
  const hasMapApiKey = Boolean(getApiKey());
  const markerCoordinates = useMemo(
    () => (resolvedLatitude != null && resolvedLongitude != null ? [resolvedLongitude, resolvedLatitude] : null),
    [resolvedLatitude, resolvedLongitude]
  );
  const [mapLookupState, setMapLookupState] = useState({ status: "idle", error: "", suggestions: [] });

  useEffect(() => {
    if (normalizeCoordinate(latitude) === 0 && normalizeCoordinate(longitude) === 0) {
      onFieldChange("latitude", "");
      onFieldChange("longitude", "");
    }
  }, [latitude, longitude, onFieldChange]);

  const centerCoordinates = useMemo(() => {
    if (markerCoordinates) {
      return markerCoordinates;
    }

    const fallbackCity = getFallbackCityOption(locationCity);
    if (fallbackCity?.longitude != null && fallbackCity?.latitude != null) {
      return [fallbackCity.longitude, fallbackCity.latitude];
    }

    return defaultCenter;
  }, [locationCity, markerCoordinates]);

  function updateCoordinates(nextLatitude, nextLongitude) {
    onFieldChange("latitude", formatCoordinateValue(nextLatitude));
    onFieldChange("longitude", formatCoordinateValue(nextLongitude));
  }

  function applySuggestion(option) {
    if (!option) {
      return;
    }

    const nextAddress = normalizeSelectedAddressLabel(option);
    if (nextAddress) {
      onFieldChange("locationAddress", nextAddress);
    }

    if (option.city) {
      const normalizedCity = normalizeCityLabel(option.city);
      onFieldChange("locationCity", normalizedCity);
    }

    if (option.latitude != null && option.longitude != null) {
      updateCoordinates(option.latitude, option.longitude);
    }
  }

  async function handleMapSelect(nextCoordinates) {
    if (!isCoordinatePair(nextCoordinates)) {
      return;
    }

    const [nextLongitude, nextLatitude] = nextCoordinates;
    updateCoordinates(nextLatitude, nextLongitude);
    setMapLookupState({ status: "loading", error: "", suggestions: [] });

    try {
      const lookupResult = await reverseGeocodeAddress({
        latitude: nextLatitude,
        longitude: nextLongitude,
      });
      const nextSuggestions = Array.isArray(lookupResult?.suggestions) ? lookupResult.suggestions : [];

      if (nextSuggestions[0]) {
        applySuggestion(nextSuggestions[0]);
      }

      setMapLookupState({
        status: "ready",
        error: "",
        suggestions: nextSuggestions,
      });
    } catch (error) {
      setMapLookupState({
        status: "error",
        error: error?.message ?? "Не удалось определить адрес по выбранной точке.",
        suggestions: [],
      });
    }
  }

  return (
    <div className="company-dashboard-location-picker">
      <FormField
        label="Адрес"
        hint="Начните с улицы: список покажет похожие адреса и ближайшие дома. Город определим автоматически из выбранной подсказки."
      >
        <AddressAutocomplete
          value={locationAddress}
          city={locationCity}
          latitude={resolvedLatitude ?? null}
          longitude={resolvedLongitude ?? null}
          onValueChange={(value) => {
            onFieldChange("locationAddress", value);
            if (String(value).trim() !== String(locationAddress).trim()) {
              onFieldChange("locationCity", "");
              if (hasCoordinates) {
                updateCoordinates(null, null);
              }
            }
          }}
          onSelectOption={applySuggestion}
        />
      </FormField>

      {hasMapApiKey ? (
        <>
          <div className="company-dashboard-location-picker__map-card">
            <div className="company-dashboard-location-picker__map-head">
              <div>
                <strong>Точка на карте</strong>
                <p>Кликните по карте, чтобы заполнить координаты и подтянуть ближайший адрес.</p>
              </div>
              <div className="company-dashboard-location-picker__map-meta">
                <span>{formatCoordinatesLabel(resolvedLatitude, resolvedLongitude)}</span>
                {hasCoordinates ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      updateCoordinates(null, null);
                      setMapLookupState({ status: "idle", error: "", suggestions: [] });
                    }}
                  >
                    Сбросить точку
                  </Button>
                ) : null}
              </div>
            </div>

            <LocationSelectionMap
              centerCoordinates={centerCoordinates}
              markerCoordinates={markerCoordinates}
              onSelectCoordinates={handleMapSelect}
            />

            {mapLookupState.status === "loading" ? (
              <p className="company-dashboard-location-picker__map-note">Определяем ближайшие адреса к выбранной точке...</p>
            ) : null}

            {mapLookupState.status === "error" ? (
              <p className="company-dashboard-location-picker__map-note company-dashboard-location-picker__map-note--error">
                {mapLookupState.error}
              </p>
            ) : null}

            {mapLookupState.status === "ready" && mapLookupState.suggestions.length > 1 ? (
              <div className="company-dashboard-location-picker__suggestions">
                <span className="company-dashboard-location-picker__suggestions-title">Рядом с выбранной точкой</span>
                <div className="company-dashboard-location-picker__suggestions-list">
                  {mapLookupState.suggestions.slice(0, 4).map((option) => (
                    <button
                      key={option.fiasId || option.unrestrictedValue || option.label}
                      type="button"
                      className="company-dashboard-location-picker__suggestion-chip"
                      onClick={() => applySuggestion(option)}
                    >
                      <strong>{option.label}</strong>
                      {option.details ? <span>{option.details}</span> : null}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
            <FormField label="Широта" hint="Можно поправить вручную, если нужна точная координата.">
              <Input value={latitude} onValueChange={(value) => onFieldChange("latitude", value)} placeholder="56.123456" />
            </FormField>
            <FormField label="Долгота" hint="После ручного ввода точка сразу отобразится на карте.">
              <Input value={longitude} onValueChange={(value) => onFieldChange("longitude", value)} placeholder="47.654321" />
            </FormField>
          </div>
        </>
      ) : (
        <p className="company-dashboard-location-picker__map-note">
          Карта в этой сборке недоступна. Публикацию можно сохранить только по адресу.
        </p>
      )}
    </div>
  );
}
