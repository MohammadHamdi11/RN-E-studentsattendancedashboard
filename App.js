// App.js - Main entry point for the Student Attendance Dashboard
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import screens
import WelcomeScreen from './screens/WelcomeScreen';
import AttendanceInputScreen from './screens/AttendanceInputScreen';
import AttendanceResultScreen from './screens/AttendanceResultScreen';

// Import web routing helper
import { getNavigationLinking } from './services/webRoutingFix';

const Stack = createStackNavigator();

// Define theme to match the recorder app
const paperTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#24325f',
    accent: '#951d1e',
    background: '#ffffff',
    surface: '#ffffff',
    text: '#000000',
    disabled: '#cccccc',
    placeholder: '#3d3d3d',
  },
  dark: false, // Force light mode
};

// Navigation theme
const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#ffffff',
    card: '#ffffff',
    text: '#000000',
    border: '#e0e0e0',
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <NavigationContainer 
          theme={navigationTheme}
          linking={getNavigationLinking()}
        >
          <Stack.Navigator
            initialRouteName="Welcome"
            screenOptions={{
              headerStyle: {
                backgroundColor: paperTheme.colors.primary,
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen 
              name="Welcome" 
              component={WelcomeScreen} 
              options={{ title: 'Student Attendance Dashboard' }}
            />
            <Stack.Screen 
              name="AttendanceInput" 
              component={AttendanceInputScreen}
              options={{ title: 'Enter Your Details' }}
            />
            <Stack.Screen 
              name="AttendanceResult" 
              component={AttendanceResultScreen}
              options={{ title: 'Your Attendance' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="light" />
      </PaperProvider>
    </SafeAreaProvider>
  );
}