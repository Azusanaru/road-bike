import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import { Card, Text, Button, Icon } from '@rneui/themed';
import { theme } from '../theme/theme';
import Geolocation from 'react-native-geolocation-service';

interface Location {
  latitude: number;
  longitude: number;
  timestamp: number;
}

const RidingScreen: React.FC = () => {
  const [isRiding, setIsRiding] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [avgSpeed, setAvgSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [calories, setCalories] = useState(0);
  const [elevation, setElevation] = useState(0);
  const [route, setRoute] = useState<Location[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRiding) {
      timer = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRiding]);

  const handleStartStop = () => {
    setIsRiding(!isRiding);
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map}
        showsUserLocation
        followsUserLocation
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
});

export default RidingScreen; 