export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

export function watchPosition(
  onPosition: (coords: Coordinates) => void,
  onError?: (err: GeolocationPositionError) => void,
): () => void {
  if (!navigator.geolocation) return () => {};
  const id = navigator.geolocation.watchPosition(
    (pos) =>
      onPosition({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
    onError,
    { enableHighAccuracy: true, maximumAge: 10000 },
  );
  return () => navigator.geolocation.clearWatch(id);
}

export function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function isInsideGeofence(
  lat: number,
  lon: number,
  centerLat: number,
  centerLon: number,
  radius: number,
): boolean {
  return distanceMeters(lat, lon, centerLat, centerLon) <= radius;
}
