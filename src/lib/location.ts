
interface Coordinates {
    lat: number;
    lng: number;
}

// Store location (Guanambi Center approx)
const STORE_LOCATION: Coordinates = {
    lat: -14.2227,
    lng: -42.7806
};

// Cache for geocoding to avoid spamming the API
const cache = new Map<string, Coordinates>();

export const getCoordinates = async (address: string): Promise<Coordinates | null> => {
    if (cache.has(address)) return cache.get(address)!;

    try {
        // Append "Guanambi BA" to ensure better accuracy
        const query = encodeURIComponent(`${address}, Guanambi, Bahia, Brazil`);
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`, {
            headers: {
                // Important to identify our app to Nominatim
                'User-Agent': 'CestaFacilApp/1.0'
            }
        });

        const data = await response.json();
        if (data && data.length > 0) {
            const coords = {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
            cache.set(address, coords);
            return coords;
        }
    } catch (error) {
        console.error("Geocoding error:", error);
    }
    return null;
};

// Calculate distance in km (Haversine formula)
export const calculateDistance = (coord1: Coordinates, coord2: Coordinates): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(coord2.lat - coord1.lat);
    const dLon = deg2rad(coord2.lng - coord1.lng);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(coord1.lat)) * Math.cos(deg2rad(coord2.lat)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

export const getStoreLocation = () => STORE_LOCATION;
