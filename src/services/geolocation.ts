/**
 * Represents a geographical coordinate with latitude and longitude.
 */
export interface Coordinate {
  /**
   * The latitude of the location.
   */
  latitude: number;
  /**
   * The longitude of the location.
   */
  longitude: number;
}

/**
 * Asynchronously retrieves the current geographical location of the user using the browser's Geolocation API.
 *
 * @returns A promise that resolves to a Coordinate object containing the latitude and longitude.
 * @throws {Error} If the browser does not support Geolocation or the user denies permission, or if retrieval fails.
 */
export async function getCurrentLocation(): Promise<Coordinate> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error("Geolocation is not supported by your browser."));
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let message = "Failed to retrieve location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location permission denied. Please enable it in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            message = "The request to get user location timed out.";
            break;
          default:
             message = `An unknown error occurred (Code: ${error.code}).`;
             break;
        }
         console.error("Geolocation error:", error.message);
         reject(new Error(message));
      },
      {
        // Optional options
        enableHighAccuracy: true, // Request more accurate position
        timeout: 10000, // Wait 10 seconds
        maximumAge: 0, // Don't use a cached position
      }
    );
  });
}
