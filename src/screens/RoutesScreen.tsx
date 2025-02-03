import React from 'react';
import { View, FlatList } from 'react-native';
import { Card, Text, Icon } from '@rneui/themed';
import { theme } from '../theme/theme';

interface Route {
  id: string;
  name: string;
  distance: number;
  elevation: number;
}

const RoutesScreen: React.FC = () => {
  const routes: Route[] = [
    { id: '1', name: '外滩环线', distance: 15.5, elevation: 45 },
    { id: '2', name: '世纪公园路线', distance: 8.2, elevation: 20 },
  ];

  const renderItem = ({ item }: { item: Route }) => (
    <Card containerStyle={{
      borderRadius: 10,
      marginHorizontal: theme.spacing.md,
      elevation: 2,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Icon
          name="directions-bike"
          color={theme.colors.primary}
          size={24}
          style={{ marginRight: theme.spacing.sm }}
        />
        <View>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.text }}>
            {item.name}
          </Text>
          <Text style={{ color: theme.colors.grey, marginTop: 5 }}>
            距离: {item.distance}km | 爬升: {item.elevation}m
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={routes}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingVertical: theme.spacing.md }}
      />
    </View>
  );
};

export default RoutesScreen; 