// 创建导航配置文件
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import RidingScreen from '../screens/RidingScreen';
import NavigationScreen from '../screens/NavigationScreen';
import AIScreen from '../screens/AIScreen';

const Tab = createBottomTabNavigator();

export const Navigation = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="骑行" component={RidingScreen} />
      <Tab.Screen name="导航" component={NavigationScreen} />
      <Tab.Screen name="AI助手" component={AIScreen} />
    </Tab.Navigator>
  );
}; 