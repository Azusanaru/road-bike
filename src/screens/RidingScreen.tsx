import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Platform, PermissionsAndroid, Alert } from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Card, Text, Button, Icon } from '@rneui/themed';
import { theme } from '../theme/theme';
import Geolocation from '@react-native-community/geolocation';
import { RidingRecord, Location } from '../types/riding';
import { saveRidingRecord } from '../services/storage/storage';
import { uploadToWechatSport } from '../services/api/wechatSport';
import { isWXAppInstalled } from '../services/api/wechat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { debounce, throttle } from 'lodash';
import { getWeatherInfo, WeatherInfo } from '../services/api/weather';
import { exportRidingData } from '../services/utils/export';

const RidingScreen: React.FC = () => {
  // === 状态管理 ===
  const [isRiding, setIsRiding] = useState(false);          // 骑行状态
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);  // 当前位置
  const [route, setRoute] = useState<Location[]>([]);       // 骑行路线
  const [currentSpeed, setCurrentSpeed] = useState(0);      // 当前速度(km/h)
  const [distance, setDistance] = useState(0);              // 总距离(km)
  const [duration, setDuration] = useState(0);              // 骑行时长(s)
  const [avgSpeed, setAvgSpeed] = useState(0);              // 平均速度(km/h)
  const [maxSpeed, setMaxSpeed] = useState(0);              // 最高速度(km/h)
  const [calories, setCalories] = useState(0);              // 消耗卡路里(kcal)
  const [elevation, setElevation] = useState(0);            // 累计爬升(m)
  const [watchId, setWatchId] = useState<number | undefined>(undefined);  // 位置监听ID
  const [isRecovering, setIsRecovering] = useState(false);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [lastWeatherUpdate, setLastWeatherUpdate] = useState(0);

  // === 权限管理 ===
  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      try {
        await Geolocation.requestAuthorization();
        return true;
      } catch (err) {
        return false;
      }
    }

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "需要位置权限",
            message: "骑行记录需要访问您的位置信息",
            buttonNeutral: "稍后询问",
            buttonNegative: "取消",
            buttonPositive: "确定"
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('权限请求失败:', err);
        return false;
      }
    }
    return false;
  };

  // === 工具函数 ===
  // 计算两点间距离(米)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // 地球半径（米）
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // 格式化时间显示
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // === 数据验证 ===
  const validateLocation = (location: Location): boolean => {
    // 检查坐标是否在合理范围内
    if (location.latitude < -90 || location.latitude > 90) return false;
    if (location.longitude < -180 || location.longitude > 180) return false;
    
    // 检查速度是否合理 (0-100 m/s)
    if (location.speed < 0 || location.speed > 100) return false;
    
    // 检查时间戳是否合理
    const now = Date.now();
    if (location.timestamp > now || location.timestamp < now - 60000) return false;
    
    return true;
  };

  // === 位置追踪 ===
  // 开始位置追踪
  const startTracking = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert('权限错误', '需要位置权限才能记录骑行数据');
      return;
    }

    const watchID = Geolocation.watchPosition(
      (position) => {
        // 处理位置更新
        const { latitude, longitude, speed, altitude } = position.coords;
        const timestamp = position.timestamp;

        // 创建位置对象
        const location: Location = {
          latitude,
          longitude: longitude !== null ? longitude : 0,
          speed: speed !== null ? speed : 0,
          altitude: altitude !== null ? altitude : 0,
          timestamp: timestamp !== null ? timestamp : Date.now()
        };

        // 更新路线
        setRoute(prev => [...prev, location]);
        
        // 更新速度数据
        const speedKmh = (speed || 0) * 3.6;
        setCurrentSpeed(speedKmh);
        setMaxSpeed(prev => Math.max(prev, speedKmh));

        // 更新距离
        if (route.length > 0) {
          const lastPoint = route[route.length - 1];
          const newDistance = calculateDistance(
            lastPoint.latitude,
            lastPoint.longitude,
            latitude,
            longitude
          );
          setDistance(prev => prev + newDistance / 1000);
        }

        // 更新平均速度
        if (duration > 0) {
          setAvgSpeed(distance / (duration / 3600));
        }

        // 更新爬升高度
        updateElevation(location);

        // 更新卡路里（简单估算：40kcal/km）
        setCalories(distance * 40);
      },
      (error) => {
        console.error('位置追踪错误:', error);
        Alert.alert('错误', '获取位置信息失败');
      },
      {
        enableHighAccuracy: true,  // 高精度模式
        distanceFilter: 5,         // 最小位置变化（米）
        interval: 1000,            // 更新间隔（毫秒）
        fastestInterval: 500       // 最快更新间隔
      }
    ) as number;

    setWatchId(watchID);
  };

  // 停止位置追踪
  const stopTracking = () => {
    if (watchId !== undefined) {
      Geolocation.clearWatch(watchId);
      setWatchId(undefined);
    }
  };

  // 在位置更新处理中使用验证
  const handleLocationUpdate = (position: GeolocationPosition) => {
    const location = createLocationFromPosition(position);
    if (!validateLocation(location)) {
      console.warn('Invalid location data received:', location);
      return;
    }
    
    // 每15分钟更新一次天气
    if (!weather || Date.now() - lastWeatherUpdate > 900000) {
      updateWeather(location);
      setLastWeatherUpdate(Date.now());
    }
    
    // ... 其他位置更新逻辑
  };

  // === 骑行控制 ===
  // 开始/结束骑行
  const handleStartStop = async () => {
    if (!isRiding) {
      // 开始骑行
      startTracking();
    } else {
      // 结束骑行
      stopTracking();
      
      // 创建骑行记录
      const record: RidingRecord = {
        id: Date.now().toString(),
        startTime: route[0]?.timestamp || Date.now(),
        endTime: Date.now(),
        duration,
        distance,
        avgSpeed,
        maxSpeed,
        calories,
        elevation,
        route,
      };
      
      try {
        // 保存到本地
        await saveRidingRecord(record);
        
        // 尝试同步到微信运动
        const isInstalled = await isWXAppInstalled();
        if (isInstalled) {
          await uploadToWechatSport(record);
          Alert.alert('成功', '骑行数据已同步到微信运动');
        }
      } catch (error) {
        console.error('数据保存/上传错误:', error);
        Alert.alert('错误', '数据保存或上传失败');
      }
    }
    setIsRiding(!isRiding);
  };

  // === 副作用 ===
  // 计时器
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRiding) {
      timer = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRiding]);

  // 检查并恢复骑行状态
  const checkAndRecoverRiding = async () => {
    try {
      const lastRide = await AsyncStorage.getItem('current_ride');
      if (lastRide) {
        const rideData = JSON.parse(lastRide);
        if (Date.now() - rideData.lastUpdate < 300000) { // 5分钟内
          setIsRecovering(true);
          Alert.alert(
            '发现未完成的骑行',
            '是否恢复上次的骑行记录？',
            [
              {
                text: '放弃',
                onPress: () => {
                  AsyncStorage.removeItem('current_ride');
                  setIsRecovering(false);
                }
              },
              {
                text: '恢复',
                onPress: () => {
                  setRoute(rideData.route);
                  setDistance(rideData.distance);
                  setDuration(rideData.duration);
                  startTracking();
                  setIsRecovering(false);
                }
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('恢复骑行状态失败:', error);
    }
  };

  // 定期保存当前骑行状态
  useEffect(() => {
    if (isRiding && !isRecovering) {
      const saveInterval = setInterval(async () => {
        try {
          await AsyncStorage.setItem('current_ride', JSON.stringify({
            route,
            distance,
            duration,
            lastUpdate: Date.now()
          }));
        } catch (error) {
          console.error('保存骑行状态失败:', error);
        }
      }, 30000); // 每30秒保存一次

      return () => clearInterval(saveInterval);
    }
  }, [isRiding, route, distance, duration, isRecovering]);

  // === 性能优化 ===
  const debouncedSetRoute = useMemo(
    () => debounce((newLocation: Location) => {
      setRoute(prev => [...prev, newLocation]);
    }, 1000),
    []
  );

  const throttledUpdateStats = useMemo(
    () => throttle((location: Location) => {
      updateSpeed(location);
      updateDistance(location);
      updateElevation(location);
    }, 2000),
    []
  );

  // 清理函数
  useEffect(() => {
    return () => {
      debouncedSetRoute.cancel();
      throttledUpdateStats.cancel();
    };
  }, []);

  // === 错误处理 ===
  const handleError = (error: any, context: string) => {
    console.error(`${context}:`, error);
    
    // 根据错误类型显示不同的提示
    if (error.code === 1) {
      Alert.alert('位置权限错误', '请在设置中允许访问位置信息');
    } else if (error.code === 2) {
      Alert.alert('位置服务错误', '请检查GPS是否开启');
    } else if (error.code === 3) {
      Alert.alert('超时', '获取位置信息超时，请重试');
    } else {
      Alert.alert('错误', '发生未知错误，请重试');
    }
    
    // 如果正在骑行，尝试保存当前数据
    if (isRiding) {
      handleStartStop().catch(e => 
        console.error('保存骑行数据失败:', e)
      );
    }
  };

  // 添加天气更新函数
  const updateWeather = async (location: Location) => {
    try {
      const weatherInfo = await getWeatherInfo(location.latitude, location.longitude);
      setWeather(weatherInfo);
    } catch (error) {
      console.error('更新天气失败:', error);
    }
  };

  // 添加导出函数
  const handleExport = async (format: 'gpx' | 'csv' = 'gpx') => {
    if (route.length === 0) {
      Alert.alert('提示', '没有可导出的骑行数据');
      return;
    }

    try {
      const record: RidingRecord = {
        id: Date.now().toString(),
        startTime: route[0].timestamp,
        endTime: Date.now(),
        duration,
        distance,
        avgSpeed,
        maxSpeed,
        calories,
        elevation,
        route,
      };

      await exportRidingData(record, format);
      Alert.alert('成功', '数据导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      Alert.alert('错误', '数据导出失败');
    }
  };

  const createLocationFromPosition = (position: GeolocationPosition): Location => {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      speed: position.coords.speed || 0,
      altitude: position.coords.altitude || 0,
      timestamp: position.timestamp,
    };
  };

  const updateSpeed = (location: Location) => {
    const speedKmh = location.speed * 3.6;
    setCurrentSpeed(speedKmh);
    setMaxSpeed(prev => Math.max(prev, speedKmh));
    if (duration > 0) {
      setAvgSpeed(distance / (duration / 3600));
    }
  };

  const updateDistance = (location: Location) => {
    if (route.length > 0) {
      const lastPoint = route[route.length - 1];
      const newDistance = calculateDistance(
        lastPoint.latitude,
        lastPoint.longitude,
        location.latitude,
        location.longitude
      );
      setDistance(prev => prev + newDistance / 1000);
    }
  };

  const updateElevation = (location: Location) => {
    // 如果没有路线数据，直接返回
    if (route.length === 0) return;
    
    // 获取上一个点的海拔高度
    const prevLocation = route[route.length - 1];
    const prevAltitude = prevLocation?.altitude || 0;
    const currentAltitude = location?.altitude || 0;

    // 只有在上升时才累加高度差
    if (currentAltitude > prevAltitude) {
      const elevationGain = currentAltitude - prevAltitude;
      setElevation(prev => prev + elevationGain);
    }
  };

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        followsUserLocation
        initialRegion={currentLocation ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        } : undefined}
      >
        {route.length > 0 && (
          <Polyline
            coordinates={route}
            strokeColor={theme.colors.primary}
            strokeWidth={3}
          />
        )}
      </MapView>
      
      <View style={styles.dataContainer}>
        <Card containerStyle={styles.mainDataCard}>
          <View style={styles.speedContainer}>
            <Text style={styles.speedValue}>{currentSpeed.toFixed(1)}</Text>
            <Text style={styles.speedUnit}>km/h</Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{distance.toFixed(2)}</Text>
              <Text style={styles.statLabel}>公里</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatDuration(duration)}</Text>
              <Text style={styles.statLabel}>时间</Text>
            </View>
          </View>
        </Card>

        <Card containerStyle={styles.secondaryDataCard}>
          <View style={styles.statsGrid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridValue}>{avgSpeed.toFixed(1)}</Text>
              <Text style={styles.gridLabel}>平均速度</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridValue}>{maxSpeed.toFixed(1)}</Text>
              <Text style={styles.gridLabel}>最高速度</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridValue}>{calories}</Text>
              <Text style={styles.gridLabel}>卡路里</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridValue}>{elevation}</Text>
              <Text style={styles.gridLabel}>爬升(m)</Text>
            </View>
          </View>
        </Card>

        <Card containerStyle={styles.weatherCard}>
          {weather && (
            <View style={styles.weatherContainer}>
              <Text style={styles.weatherTemp}>{weather.temperature.toFixed(1)}°C</Text>
              <Text style={styles.weatherDesc}>{weather.description}</Text>
              <View style={styles.weatherDetails}>
                <Text style={styles.weatherText}>
                  湿度: {weather.humidity}%
                </Text>
                <Text style={styles.weatherText}>
                  {weather.windDirection}风 {weather.windSpeed.toFixed(1)}m/s
                </Text>
              </View>
            </View>
          )}
        </Card>

        <Button
          title={isRiding ? "停止骑行" : "开始骑行"}
          icon={
            <Icon
              name={isRiding ? "stop" : "play-arrow"}
              color="white"
              size={24}
              style={{ marginRight: 8 }}
            />
          }
          buttonStyle={[
            styles.actionButton,
            { backgroundColor: isRiding ? theme.colors.secondary : theme.colors.primary }
          ]}
          onPress={handleStartStop}
        />

        <View style={styles.exportContainer}>
          <Button
            title="导出 GPX"
            onPress={() => handleExport('gpx')}
            buttonStyle={styles.exportButton}
          />
          <Button
            title="导出 CSV"
            onPress={() => handleExport('csv')}
            buttonStyle={styles.exportButton}
          />
        </View>
      </View>
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
  dataContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.md,
  },
  mainDataCard: {
    borderRadius: 15,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  speedContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  speedValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  speedUnit: {
    fontSize: 16,
    color: theme.colors.grey,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.grey,
  },
  secondaryDataCard: {
    borderRadius: 15,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    alignItems: 'center',
    marginVertical: theme.spacing.xs,
  },
  gridValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  gridLabel: {
    fontSize: 12,
    color: theme.colors.grey,
  },
  actionButton: {
    borderRadius: 25,
    paddingVertical: theme.spacing.md,
  },
  weatherCard: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
  },
  weatherContainer: {
    alignItems: 'center',
  },
  weatherTemp: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  weatherDesc: {
    fontSize: 16,
    color: theme.colors.grey,
    marginVertical: 5,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  weatherText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  exportContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  exportButton: {
    backgroundColor: theme.colors.grey,
    borderRadius: 8,
    paddingHorizontal: 20,
  },
});

export default RidingScreen; 