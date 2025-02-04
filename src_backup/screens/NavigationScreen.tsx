import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView from 'react-native-maps';

const NavigationScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map}
        initialRegion={{
          latitude: 31.2304,
          longitude: 121.4737,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      />
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
});

export default NavigationScreen; 