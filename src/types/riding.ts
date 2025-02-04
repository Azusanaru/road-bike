export interface Location {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed: number;
  altitude?: number;
  heading?: number;
}

export interface RidingRecord {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  distance: number;
  avgSpeed: number;
  maxSpeed: number;
  calories: number;
  elevation: number;
  route: Location[];
} 