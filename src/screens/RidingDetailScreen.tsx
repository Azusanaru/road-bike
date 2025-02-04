import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Card, Text, Divider, Icon } from '@rneui/themed';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { LineChart } from 'react-native-chart-kit';
import Share from 'react-native-share';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RidingRecord, Location } from '../types/riding';
import { theme } from '../theme/theme';

type RidingDetailRouteProp = RouteProp<{
  RidingDetail: { record: RidingRecord };
}, 'RidingDetail'>;

const RidingDetailScreen: React.FC = () => {
  const route = useRoute<RidingDetailRouteProp>();
  const { record } = route.params;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}小时${mins}分钟${secs}秒`;
  };

  const getMapRegion = () => {
    if (record.route.length === 0) return null;

    let minLat = record.route[0].latitude;
    let maxLat = record.route[0].latitude;
    let minLng = record.route[0].longitude;
    let maxLng = record.route[0].longitude;

    record.route.forEach(point => {
      minLat = Math.min(minLat, point.latitude);
      maxLat = Math.max(maxLat, point.latitude);
      minLng = Math.min(minLng, point.longitude);
      maxLng = Math.max(maxLng, point.longitude);
    });

    const padding = 0.01;
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: (maxLat - minLat) + padding,
      longitudeDelta: (maxLng - minLng) + padding,
    };
  };

  // 计算速度数据点
  const speedData = useMemo(() => {
    return record.route.map(point => point.speed * 3.6); // 转换为 km/h
  }, [record.route]);

  // 计算海拔数据点
  const elevationData = useMemo(() => {
    return record.route.map(point => point.altitude || 0);
  }, [record.route]);

  // 分享功能
  const handleShare = async () => {
    const shareOptions = {
      title: '分享骑行记录',
      message: `我完成了一次${record.distance.toFixed(2)}公里的骑行！
平均速度: ${record.avgSpeed.toFixed(1)}km/h
最高速度: ${record.maxSpeed.toFixed(1)}km/h
消耗热量: ${Math.round(record.calories)}kcal
累计爬升: ${record.elevation.toFixed(0)}m`,
      url: 'https://your-app-download-link.com',
    };

    try {
      await Share.open(shareOptions);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card containerStyle={styles.mapCard}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={getMapRegion() || undefined}
        >
          <Polyline
            coordinates={record.route}
            strokeColor={theme.colors.primary}
            strokeWidth={3}
          />
        </MapView>
      </Card>

      <Card containerStyle={styles.dataCard}>
        <Text style={styles.title}>骑行数据</Text>
        <Text style={styles.dateText}>{formatDate(record.startTime)}</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{record.distance.toFixed(2)}</Text>
            <Text style={styles.statLabel}>总距离(km)</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatDuration(record.duration)}</Text>
            <Text style={styles.statLabel}>骑行时间</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{record.avgSpeed.toFixed(1)}</Text>
            <Text style={styles.statLabel}>平均速度(km/h)</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{record.maxSpeed.toFixed(1)}</Text>
            <Text style={styles.statLabel}>最高速度(km/h)</Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.round(record.calories)}</Text>
            <Text style={styles.statLabel}>消耗热量(kcal)</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{record.elevation.toFixed(0)}</Text>
            <Text style={styles.statLabel}>累计爬升(m)</Text>
          </View>
        </View>
      </Card>

      <Card containerStyle={styles.analysisCard}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>骑行分析</Text>
          <TouchableOpacity onPress={handleShare}>
            <Icon
              name="share"
              type="material"
              color={theme.colors.primary}
              size={24}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.chartTitle}>速度变化</Text>
        <LineChart
          data={{
            labels: Array(6).fill(''),
            datasets: [{
              data: speedData.length > 0 ? speedData : [0],
            }],
          }}
          width={Dimensions.get('window').width - 50}
          height={220}
          chartConfig={{
            backgroundColor: theme.colors.white,
            backgroundGradientFrom: theme.colors.white,
            backgroundGradientTo: theme.colors.white,
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(30, 136, 229, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={styles.chart}
        />

        <Text style={styles.chartTitle}>海拔变化</Text>
        <LineChart
          data={{
            labels: Array(6).fill(''),
            datasets: [{
              data: elevationData.length > 0 ? elevationData : [0],
            }],
          }}
          width={Dimensions.get('window').width - 50}
          height={220}
          chartConfig={{
            backgroundColor: theme.colors.white,
            backgroundGradientFrom: theme.colors.white,
            backgroundGradientTo: theme.colors.white,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={styles.chart}
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  mapCard: {
    padding: 0,
    margin: theme.spacing.md,
    borderRadius: 10,
  },
  map: {
    height: Dimensions.get('window').height * 0.3,
    borderRadius: 10,
  },
  dataCard: {
    margin: theme.spacing.md,
    borderRadius: 10,
    padding: theme.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  dateText: {
    fontSize: 14,
    color: theme.colors.grey,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: theme.spacing.sm,
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginVertical: theme.spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.grey,
    marginTop: 4,
  },
  divider: {
    marginVertical: theme.spacing.md,
  },
  analysisCard: {
    margin: theme.spacing.md,
    borderRadius: 10,
    padding: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginVertical: theme.spacing.sm,
  },
  chart: {
    marginVertical: theme.spacing.md,
    borderRadius: 16,
  },
});

export default RidingDetailScreen; 