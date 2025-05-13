// services/webRoutingFix.js
import { Platform } from 'react-native';

// This function handles different behaviors for web vs native
export const getNavigationLinking = () => {
  // Only use these settings for web platforms
  if (Platform.OS === 'web') {
    return {
      prefixes: [
        'https://mohammadhamdi11.github.io/RN-E-studentsattendancedashboard',
        'https://mohammadhamdi11.github.io', 
        'http://localhost'
      ],
      config: {
        screens: {
          Welcome: '',
          AttendanceInput: 'attendance-input',
          AttendanceResult: 'attendance-result',
        },
      },
    };
  }
  // Return null for native platforms
  return null;
};