import { Location } from '../types/riding';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAmjOFytLq1s9O0ckIWEiNu2jLwmetnKks';

interface DirectionsResult {
  distance: number;
  duration: number;
  polyline: Location[];
  instructions: string[];
}

export type TravelMode = 'bicycling' | 'walking';

interface RouteOptions {
  mode: TravelMode;
  avoidHighways: boolean;
  avoidTolls: boolean;
  alternatives: boolean;
}

const DEFAULT_OPTIONS: RouteOptions = {
  mode: 'bicycling',
  avoidHighways: true,
  avoidTolls: true,
  alternatives: true,
};

export const searchPlaces = async (query: string) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    return data.results.map((place: any) => ({
      id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      location: {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
      },
    }));
  } catch (error) {
    console.error('Error searching places:', error);
    throw error;
  }
};

export const getDirections = async (
  origin: Location,
  destination: Location,
  options: Partial<RouteOptions> = {}
): Promise<DirectionsResult> => {
  try {
    const routeOptions = { ...DEFAULT_OPTIONS, ...options };
    
    // 构建 URL 参数
    const params = new URLSearchParams({
      origin: `${origin.latitude},${origin.longitude}`,
      destination: `${destination.latitude},${destination.longitude}`,
      mode: routeOptions.mode,
      avoid: [
        routeOptions.avoidHighways ? 'highways' : '',
        routeOptions.avoidTolls ? 'tolls' : '',
      ].filter(Boolean).join('|'),
      alternatives: routeOptions.alternatives.toString(),
      key: GOOGLE_MAPS_API_KEY,
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`
    );
    
    const data = await response.json();
    
    if (!data.routes[0]) {
      throw new Error('No route found');
    }

    // 选择最适合的路线（这里选择第一条，可以根据需要修改选择逻辑）
    const route = data.routes[0];
    const leg = route.legs[0];
    
    // 解析路线指示
    const instructions = leg.steps.map(step => {
      // 移除 HTML 标签
      const instruction = step.html_instructions.replace(/<[^>]*>/g, '');
      return instruction;
    });

    // 解码路线点
    const points = decodePolyline(route.overview_polyline.points);

    return {
      distance: leg.distance.value / 1000, // 转换为公里
      duration: leg.duration.value, // 秒
      polyline: points,
      instructions,
    };
  } catch (error) {
    console.error('Error getting directions:', error);
    throw error;
  }
};

// 搜索自行车友好的地点
export const searchBikeFriendlyPlaces = async (query: string) => {
  try {
    const params = new URLSearchParams({
      query: `${query} bicycle friendly`,
      type: 'route',
      key: GOOGLE_MAPS_API_KEY,
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`
    );
    
    const data = await response.json();
    return data.results.map((place: any) => ({
      id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      location: {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
      },
      rating: place.rating,
      isBikeFriendly: place.types.some((type: string) => 
        ['bicycle_store', 'park', 'route'].includes(type)
      ),
    }));
  } catch (error) {
    console.error('Error searching places:', error);
    throw error;
  }
};

// 解码 Google Maps 编码的路线点
function decodePolyline(encoded: string): Location[] {
  const points: Location[] = [];
  let index = 0, lat = 0, lng = 0;

  while (index < encoded.length) {
    let shift = 0, result = 0;
    
    do {
      let b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (result & 0x20);
    
    lat += ((result & 1) ? ~(result >> 1) : (result >> 1));
    
    shift = 0;
    result = 0;
    
    do {
      let b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (result & 0x20);
    
    lng += ((result & 1) ? ~(result >> 1) : (result >> 1));

    points.push({
      latitude: lat * 1e-5,
      longitude: lng * 1e-5,
      timestamp: Date.now(),
      speed: 0,
    });
  }

  return points;
} 