export interface GeoLocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export function getCurrentCoordinates(): Promise<GeoLocationCoords> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        let msg = "Could not detect location.";
        if (err.code === 1) {
          msg = "Location permission denied. Please allow location access in your browser settings to view your local weather.";
        } else if (err.code === 2) {
          msg = "Location unavailable. Please check your GPS or network connection.";
        } else if (err.code === 3) {
          msg = "Location request timed out. Please try again or select your district manually.";
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}

export function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lonDir = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}° ${latDir}, ${Math.abs(lon).toFixed(2)}° ${lonDir}`;
}
