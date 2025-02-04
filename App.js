import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from './src/theme/theme';
import { View, Text } from 'react-native';

// 导入屏幕组件
const RidingScreen = () => (
  <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
    <Text>骑行</Text>
  </View>
);
const NavigationScreen = () => <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>导航</Text></View>;
const RoutesScreen = () => <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>路线</Text></View>;
const MarketScreen = () => <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>市场</Text></View>;
const AIScreen = () => <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>AI助手</Text></View>;

const Tab = createBottomTabNavigator();

const App = () => {
  return (
    <SafeAreaProvider>
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
              return <MaterialIcons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#1E88E5',
            tabBarInactiveTintColor: '#95A5A6',
          })}
        >
          <Tab.Screen name="骑行" component={RidingScreen} />
          <Tab.Screen name="导航" component={NavigationScreen} />
          <Tab.Screen name="路线" component={RoutesScreen} />
          <Tab.Screen name="市场" component={MarketScreen} />
          <Tab.Screen name="AI助手" component={AIScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App; 