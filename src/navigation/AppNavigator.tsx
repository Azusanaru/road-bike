import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../theme/theme';

import RidingScreen from '../screens/RidingScreen';
import NavigationScreen from '../screens/NavigationScreen';
import RoutesScreen from '../screens/RoutesScreen';
import MarketScreen from '../screens/MarketScreen';
import AIScreen from '../screens/AIScreen';

const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            switch (route.name) {
              case '骑行':
                iconName = 'directions-bike';
                break;
              case '导航':
                iconName = 'map';
                break;
              case '路线':
                iconName = 'timeline';
                break;
              case '市场':
                iconName = 'shopping-cart';
                break;
              case 'AI助手':
                iconName = 'chat';
                break;
              default:
                iconName = 'error';
            }
            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.grey,
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.white,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen name="骑行" component={RidingScreen} />
        <Tab.Screen name="导航" component={NavigationScreen} />
        <Tab.Screen name="路线" component={RoutesScreen} />
        <Tab.Screen name="市场" component={MarketScreen} />
        <Tab.Screen name="AI助手" component={AIScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 