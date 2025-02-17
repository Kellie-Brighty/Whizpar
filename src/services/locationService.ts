// import axios from "axios";
import * as Location from "expo-location";

interface LocationResponse {
  city: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
}

const ILE_IFE_COORDINATES = {
  latitude: 7.4773,
  longitude: 4.5418,
  radiusKm: 25, // Increased radius to cover greater Ile-Ife area
};

export const checkUserLocation = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      console.log("Location permission denied");
      return false;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const { latitude, longitude } = location.coords;

    // Debug logging
    console.log("Device GPS location:", {
      latitude,
      longitude,
      accuracy: location.coords.accuracy,
    });

    const distance = calculateDistance(
      latitude,
      longitude,
      ILE_IFE_COORDINATES.latitude,
      ILE_IFE_COORDINATES.longitude
    );

    console.log("Distance from Ile-Ife:", distance, "km");
    console.log("Is within radius:", distance <= ILE_IFE_COORDINATES.radiusKm);

    return distance <= ILE_IFE_COORDINATES.radiusKm;
  } catch (error) {
    console.error("Error checking location:", error);
    return false;
  }
};

// Haversine formula to calculate distance between coordinates
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (value: number): number => (value * Math.PI) / 180;
