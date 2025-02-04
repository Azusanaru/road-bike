import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE, Camera } from 'react-native-maps';
import { Card, Text, Icon, Button } from '@rneui/themed';
import Geolocation from '@react-native-community/geolocation';
import { searchPlaces, getDirections, TravelMode } from '../services/navigation';
import { Location } from '../types/riding';
import { theme } from '../theme/theme';

interface TestLocation {
  name: string;
  latitude: number;
  longitude: number;
}

const TEST_LOCATIONS: TestLocation[] = [
  {
    name: '东京塔',
    latitude: 35.6586,
    longitude: 139.7454,
  },
  {
    name: '浅草寺',
    latitude: 35.7147,
    longitude: 139.7966,
  },
  {
    name: '新宿御苑',
    latitude: 35.6852,
    longitude: 139.7100,
  },
];

const NavigationScreen: React.FC = () => {
  const mapRef = useRef<MapView>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [testMarker, setTestMarker] = useState<Location | null>(null);
  const [route, setRoute] = useState<Location[]>([]);
  const [routeInfo, setRouteInfo] = useState<{distance: number; duration: number; instructions: string[]} | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [nextInstruction, setNextInstruction] = useState<string>('');
  const [travelMode, setTravelMode] = useState<TravelMode>('bicycling');

  // 获取当前位置
  const getCurrentLocation = async () => {
    try {
      Geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: position.timestamp,
            speed: position.coords.speed || 0,
          };
          setCurrentLocation(location);
          Alert.alert('成功', '已获取当前位置');
        },
        (error) => {
          Alert.alert('错误', '获取位置失败: ' + error.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } catch (error) {
      Alert.alert('错误', '位置服务异常');
    }
  };

  // 测试特定地点
  const testLocation = async (location: TestLocation) => {
    try {
      setTestMarker({
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: Date.now(),
        speed: 0,
      });
      Alert.alert('成功', `已设置目标位置: ${location.name}`);
    } catch (error) {
      Alert.alert('错误', '设置位置失败');
    }
  };

  // 开始实时位置追踪
  const startLocationTracking = () => {
    const id = Geolocation.watchPosition(
      (position) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp,
          speed: position.coords.speed || 0,
        };
        setCurrentLocation(location);
        
        if (isNavigating) {
          // 更新地图视角
          updateMapCamera(location);
          // 检查是否偏离路线
          checkRouteDeviation(location);
          // 更新导航指示
          updateNavigationInstructions(location);
        }
      },
      (error) => {
        Alert.alert('错误', '位置追踪失败: ' + error.message);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // 每10米更新一次
        interval: 1000,
        fastestInterval: 500,
      }
    );
    setWatchId(id);
  };

  // 停止位置追踪
  const stopLocationTracking = () => {
    if (watchId !== null) {
      Geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  // 更新地图视角
  const updateMapCamera = (location: Location) => {
    if (mapRef.current) {
      const camera: Camera = {
        center: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        pitch: 45,
        heading: location.heading || 0,
        zoom: 17,
        altitude: 1000,
      };

      mapRef.current.animateCamera(camera, { duration: 1000 });
    }
  };

  // 检查是否偏离路线
  const checkRouteDeviation = (location: Location) => {
    if (route.length === 0) return;

    // 计算到最近路线点的距离
    let minDistance = Infinity;
    route.forEach(point => {
      const distance = calculateDistance(location, point);
      minDistance = Math.min(minDistance, distance);
    });

    // 如果偏离超过50米，提醒用户
    if (minDistance > 50) {
      Alert.alert('提示', '您已偏离规划路线，正在重新规划...');
      // 重新规划路线
      if (testMarker) {
        getDirections(location, testMarker, {
          mode: travelMode,
          avoidHighways: true,
          avoidTolls: true,
          alternatives: true,
        }).then(directions => {
          setRoute(directions.polyline);
          setRouteInfo({
            distance: directions.distance,
            duration: directions.duration,
            instructions: directions.instructions,
          });
        });
      }
    }
  };

  // 计算两点之间距离
  const calculateDistance = (point1: Location, point2: Location) => {
    const R = 6371e3; // 地球半径（米）
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // 更新导航指示
  const updateNavigationInstructions = (location: Location) => {
    if (route.length === 0) return;

    // 找到最近的路线点
    let minDistance = Infinity;
    let nextPointIndex = 0;
    route.forEach((point, index) => {
      const distance = calculateDistance(location, point);
      if (distance < minDistance) {
        minDistance = distance;
        nextPointIndex = index;
      }
    });

    // 计算下一个转向点
    if (nextPointIndex + 1 < route.length) {
      const nextPoint = route[nextPointIndex + 1];
      const bearing = calculateBearing(location, nextPoint);
      setNextInstruction(getDirectionInstruction(bearing));
    }
  };

  // 计算方位角
  const calculateBearing = (point1: Location, point2: Location) => {
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const λ1 = (point1.longitude * Math.PI) / 180;
    const λ2 = (point2.longitude * Math.PI) / 180;

    const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
    const θ = Math.atan2(y, x);
    return ((θ * 180) / Math.PI + 360) % 360;
  };

  // 获取方向指示
  const getDirectionInstruction = (bearing: number) => {
    if (bearing >= 337.5 || bearing < 22.5) return '向北';
    if (bearing >= 22.5 && bearing < 67.5) return "向东北";
    if (bearing >= 67.5 && bearing < 112.5) return "向东";
    if (bearing >= 112.5 && bearing < 157.5) return "向东南";
    if (bearing >= 157.5 && bearing < 202.5) return "向南";
    if (bearing >= 202.5 && bearing < 247.5) return "向西南";
    if (bearing >= 247.5 && bearing < 292.5) return "向西";
    return "向西北";
  };

  // 开始导航
  const startNavigation = async () => {
    if (!currentLocation || !testMarker) {
      Alert.alert('提示', '请先获取当前位置并选择目的地');
      return;
    }

    try {
      setIsNavigating(true);
      startLocationTracking();
      const directions = await getDirections(currentLocation, testMarker, {
        mode: travelMode,
        avoidHighways: true,
        avoidTolls: true,
        alternatives: true,
      });
      setRoute(directions.polyline);
      setRouteInfo({
        distance: directions.distance,
        duration: directions.duration,
        instructions: directions.instructions,
      });
    } catch (error) {
      Alert.alert('错误', '导航启动失败');
      setIsNavigating(false);
      stopLocationTracking();
    }
  };

  // 停止导航
  const stopNavigation = () => {
    setIsNavigating(false);
    stopLocationTracking();
    setNextInstruction('');
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        followsUserLocation={isNavigating}
        showsCompass
        showsScale
        initialRegion={{
          latitude: 35.6762,
          longitude: 139.6503,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {testMarker && (
          <Marker
            coordinate={testMarker}
            title="目的地"
            pinColor="red"
          />
        )}
        {route.length > 0 && (
          <Polyline
            coordinates={route}
            strokeColor={theme.colors.primary}
            strokeWidth={3}
          />
        )}
      </MapView>

      {isNavigating && nextInstruction && (
        <Card containerStyle={styles.instructionCard}>
          <Text style={styles.instructionText}>{nextInstruction}</Text>
        </Card>
      )}

      <ScrollView style={styles.controlContainer}>
        {!isNavigating ? (
          <>
            <Button
              title="获取当前位置"
              onPress={getCurrentLocation}
              buttonStyle={styles.button}
            />
            
            {TEST_LOCATIONS.map((location) => (
              <Button
                key={location.name}
                title={`目的地: ${location.name}`}
                onPress={() => testLocation(location)}
                buttonStyle={[styles.button, { backgroundColor: theme.colors.secondary }]}
              />
            ))}
            
            <View style={styles.modeContainer}>
              <Button
                title="自行车"
                onPress={() => setTravelMode('bicycling')}
                buttonStyle={[
                  styles.modeButton,
                  travelMode === 'bicycling' && styles.modeButtonActive
                ]}
              />
              <Button
                title="步行"
                onPress={() => setTravelMode('walking')}
                buttonStyle={[
                  styles.modeButton,
                  travelMode === 'walking' && styles.modeButtonActive
                ]}
              />
            </View>
            
            <Button
              title="开始导航"
              onPress={startNavigation}
              buttonStyle={styles.button}
              disabled={!currentLocation || !testMarker}
            />
          </>
        ) : (
          <>
            <Button
              title="结束导航"
              onPress={stopNavigation}
              buttonStyle={[styles.button, { backgroundColor: theme.colors.primary }]}
            />
            <Card containerStyle={styles.infoCard}>
              <Text style={styles.infoText}>距离: {routeInfo?.distance.toFixed(2)}km</Text>
              <Text style={styles.infoText}>预计时间: {Math.round(routeInfo?.duration || 0 / 60)}分钟</Text>
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  instructionCard: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 10,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: theme.colors.primary,
  },
  controlContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    maxHeight: 300,
  },
  button: {
    marginVertical: 5,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 12,
  },
  infoCard: {
    marginVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  infoText: {
    fontSize: 16,
    color: theme.colors.text,
    marginVertical: 2,
  },
  modeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  modeButton: {
    backgroundColor: theme.colors.secondary,
    borderRadius: 8,
    padding: 12,
  },
  modeButtonActive: {
    backgroundColor: theme.colors.primary,
  },
});

export default NavigationScreen; 