import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '@rneui/themed';
import { theme } from './theme/theme';
import { Navigation } from './navigation';
import { initializeWeatherCache } from './services/api/weather';

const App = () => {
  useEffect(() => {
    initializeWeatherCache().catch(console.error);
  }, []);

  return (
    <NavigationContainer>
      <ThemeProvider theme={theme}>
        <Navigation />
      </ThemeProvider>
    </NavigationContainer>
  );
};

export default App; 