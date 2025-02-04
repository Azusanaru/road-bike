import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Icon } from '@rneui/themed';
import { useNavigation } from '@react-navigation/native';
import { getRidingRecords } from '../services/storage';
import { RidingRecord } from '../types/riding';
import { theme } from '../theme/theme';

const RidingHistoryScreen: React.FC = () => {
  const [records, setRecords] = useState<RidingRecord[]>([]);
  const navigation = useNavigation();

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    const data = await getRidingRecords();
    setRecords(data);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}小时${mins}分钟`;
  };

  const renderItem = ({ item }: { item: RidingRecord }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('RidingDetail', { record: item })}
    >
      <Card containerStyle={styles.recordCard}>
        <View style={styles.recordHeader}>
          <Text style={styles.dateText}>{formatDate(item.startTime)}</Text>
          <Icon name="chevron-right" color={theme.colors.grey} />
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.distance.toFixed(2)}</Text>
            <Text style={styles.statLabel}>公里</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatDuration(item.duration)}</Text>
            <Text style={styles.statLabel}>时长</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.avgSpeed.toFixed(1)}</Text>
            <Text style={styles.statLabel}>均速(km/h)</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={records}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContainer: {
    padding: theme.spacing.md,
  },
  recordCard: {
    borderRadius: 10,
    marginBottom: theme.spacing.md,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  dateText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.grey,
    marginTop: 4,
  },
});

export default RidingHistoryScreen; 