// screens/WelcomeScreen.js
import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Image 
          source={require('../assets/app-icon.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        
        <Text style={styles.title}>Student Attendance</Text>
        
        <Text style={styles.description}>
          Track and manage your academic attendance records
        </Text>
      </View>
      
      <Button
        mode="contained"
        onPress={() => navigation.navigate('AttendanceInput')}
        style={styles.button}
        labelStyle={styles.buttonLabel}
      >
        View Attendance
      </Button>
      
      <Text style={styles.footnote}>
        Faculty of Medicine, Ain Shams University
      </Text>
      
      <StatusBar style="light" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#24325f',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    maxWidth: '80%',
  },
  button: {
    width: '100%',
    borderRadius: 8,
    marginBottom: 24,
    backgroundColor: '#24325f',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 4,
    letterSpacing: 0.5,
  },
  footnote: {
    marginBottom: 16,
    color: '#888',
    fontSize: 14,
  },
});

export default WelcomeScreen;