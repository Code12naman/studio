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
 * Represents a location with coordinates and an optional address.
 */
export interface LocationInfo extends Coordinate {
    /**
     * The street address associated with the coordinates, if available.
     */
    address?: string;
}

/**
 * Asynchronously retrieves the current geographical location of the user using the browser's Geolocation API.
 *
 * @returns A promise that resolves to a Coordinate object containing the latitude and longitude.
 * @throws {Error} If the browser does not support Geolocation or the user denies permission, or if retrieval fails.
 */
export async function getCurrentCoordinates(): Promise<Coordinate> {
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
        timeout: 15000, // Increased timeout to 15 seconds
        maximumAge: 60000, // Allow cached position up to 1 minute old
      }
    );
  });
}

/**
 * Simulates fetching a street address based on latitude and longitude.
 * In a real application, this would call a reverse geocoding API (e.g., Google Maps Geocoding API, OpenStreetMap Nominatim).
 *
 * @param latitude - The latitude of the location.
 * @param longitude - The longitude of the location.
 * @returns A promise that resolves to a string containing the mock address.
 */
export async function getAddressFromCoordinates(latitude: number, longitude: number): Promise<string> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return a mock address including coordinates for demonstration
    // In a real scenario, you'd parse the response from a geocoding service.
    return `Mock Address near ${latitude.toFixed(4)}, ${longitude.toFixed(4)}, Cityville`;
}

/**
 * Asynchronously retrieves the current geographical location (coordinates and address) of the user.
 *
 * @returns A promise that resolves to a LocationInfo object containing latitude, longitude, and address.
 * @throws {Error} If coordinates or address retrieval fails.
 */
export async function getCurrentLocationInfo(): Promise<LocationInfo> {
    try {
        const coords = await getCurrentCoordinates();
        const address = await getAddressFromCoordinates(coords.latitude, coords.longitude);
        return {
            ...coords,
            address: address,
        };
    } catch (error) {
        // Rethrow or handle specific errors as needed
        throw error;
    }
}
