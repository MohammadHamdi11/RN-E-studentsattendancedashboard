// app.config.js - Extra configuration for Expo
import { ExpoConfig } from 'expo/config';

// Use the app.json as the default
import appJson from './app.json';

// Extend the app.json configuration
const config: ExpoConfig = {
  ...appJson.expo,
  extra: {
    eas: {
      projectId: "30393dc0-2ff7-4de9-9ec3-5c8cbfa6dd66"
    }
  },
  owner: "mohammadhamdi11",
  channel: "production",
  splash: {
    ...appJson.expo.splash,
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  android: {
    ...appJson.expo.android,
    permissions: [
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
    ],
  },
};

export default config;