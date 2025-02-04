import React from 'react';
import { View, FlatList } from 'react-native';
import { Card, Text, Image, Button } from '@rneui/themed';
import { theme } from '../theme/theme';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  condition: string;
}

const MarketScreen: React.FC = () => {
  const products: Product[] = [
    {
      id: '1',
      name: 'Giant TCR 碳纤维车架',
      price: 3999,
      image: 'https://placeholder.com/150',
      condition: '95新',
    },
    {
      id: '2',
      name: 'SHIMANO 105套件',
      price: 1999,
      image: 'https://placeholder.com/150',
      condition: '全新',
    },
  ];

  const renderItem = ({ item }: { item: Product }) => (
    <Card containerStyle={{
      borderRadius: 10,
      marginHorizontal: theme.spacing.md,
      padding: theme.spacing.md,
    }}>
      <Card.Image
        source={{ uri: item.image }}
        style={{ height: 200, borderRadius: 8 }}
      />
      <Text style={{ 
        fontSize: 18, 
        fontWeight: 'bold',
        marginTop: theme.spacing.sm,
        color: theme.colors.text 
      }}>
        {item.name}
      </Text>
      <Text style={{ 
        fontSize: 20,
        color: theme.colors.primary,
        marginVertical: theme.spacing.xs 
      }}>
        ¥{item.price}
      </Text>
      <Text style={{ color: theme.colors.grey }}>{item.condition}</Text>
      <Button
        title="联系卖家"
        buttonStyle={{
          backgroundColor: theme.colors.primary,
          borderRadius: 8,
          marginTop: theme.spacing.sm,
        }}
      />
    </Card>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: theme.spacing.md }}
      />
    </View>
  );
};

export default MarketScreen; 