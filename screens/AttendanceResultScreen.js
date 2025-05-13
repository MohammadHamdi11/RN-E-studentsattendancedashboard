// screens/AttendanceResultScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Animated } from 'react-native';
import { Text, Surface, Title, Button, ActivityIndicator, Snackbar, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';

// Status colors - more modern and cohesive palette
const STATUS_COLORS = {
  'Pass': '#4CAF50',      // Green
  'Fail': '#F44336',      // Red
  'High Risk': '#FF5722', // Deep Orange
  'Moderate Risk': '#FF9800', // Orange
  'Low Risk': '#FFC107',  // Amber
  'No Risk': '#2196F3'    // Blue
};

const { width } = Dimensions.get('window');

const AttendanceResultScreen = ({ route, navigation }) => {
  const { attendanceData, studentId, academicYear, moduleName } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState({
    totalRequired: 0,
    totalAttended: 0,
    attendancePercentage: '0%',
    status: 'Unknown',
    statusColor: '#757575',
    sessionsNeeded: 0
  });
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [subjectData, setSubjectData] = useState([]);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Animation values
  const progressAnimation = useState(new Animated.Value(0))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    processAttendanceData();
  }, []);

  useEffect(() => {
    if (!loading) {
      // Animate progress bar
      Animated.timing(progressAnimation, {
        toValue: parseFloat(attendanceStats.attendancePercentage) / 100,
        duration: 1000,
        useNativeDriver: false
      }).start();

      // Fade in content
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }).start();
    }
  }, [loading]);

  const processAttendanceData = () => {
    try {
      if (!attendanceData || !Array.isArray(attendanceData)) {
        throw new Error('Invalid attendance data format');
      }
      
      const student = attendanceData.find(item => 
        String(item['Student ID']).trim() === String(studentId).trim()
      );
      
      if (!student) {
        setError(`Student ID ${studentId} not found in this module's attendance records.`);
        setSnackbarVisible(true);
        setLoading(false);
        return;
      }
        
      setStudentData(student);
      
      // Process attendance data
      const required = Number(student['Total Required'] || 0);
      const attended = Number(student['Total Attended'] || 0);
      const percentage = student['Percentage'] || '0%';
      const status = student['Status'] || 'Unknown';
      const sessionsNeeded = Number(student['Sessions Needed'] || 0);
      
      setAttendanceStats({
        totalRequired: required,
        totalAttended: attended,
        attendancePercentage: percentage.replace('%', ''),
        status: status,
        statusColor: STATUS_COLORS[status] || '#757575',
        sessionsNeeded: sessionsNeeded
      });

      const subjects = extractSubjectData(student);
      setSubjectData(subjects);
      
      setLoading(false);
    } catch (error) {
      console.error('Error processing attendance data:', error);
      setError(error.message || 'Failed to process attendance data');
      setSnackbarVisible(true);
      setLoading(false);
    }
  };

  // Extract subject-specific attendance data
  const extractSubjectData = (student) => {
    const subjects = [];
    const subjectKeys = new Set();

    Object.keys(student).forEach(key => {
      if (key.includes('Required') && key.includes('Total)')) {
        const match = key.match(/Required\s+([a-z]+)\s+\(Total\)/i);
        if (match && match[1]) {
          subjectKeys.add(match[1].toLowerCase());
        }
      }
    });

    subjectKeys.forEach(subject => {
      const requiredKey = `Required ${subject} (Total)`;
      const attendedKey = `Attended ${subject} (Total)`;
      
      if (student[requiredKey] !== undefined && student[attendedKey] !== undefined) {
        const required = Number(student[requiredKey] || 0);
        const attended = Number(student[attendedKey] || 0);
        const percentage = required > 0 ? (attended / required) * 100 : 0;
        
        // Get session details for this subject
        const sessions = [];
        for (let i = 1; i <= 12; i++) {
          const reqKey = `${subject} S${i} (Req)`;
          const attKey = `${subject} S${i} (Att)`;
          
          if (student[reqKey] !== undefined && student[attKey] !== undefined) {
            sessions.push({
              number: i,
              required: Number(student[reqKey] || 0),
              attended: Number(student[attKey] || 0)
            });
          }
        }
        
        subjects.push({
          name: subject.charAt(0).toUpperCase() + subject.slice(1),
          required,
          attended,
          percentage: percentage.toFixed(1),
          sessions
        });
      }
    });
    
    return subjects;
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Pass':
        return 'check-circle';
      case 'Fail':
        return 'close-circle';
      case 'High Risk':
        return 'alert-circle';
      case 'Moderate Risk':
        return 'alert';
      case 'Low Risk':
        return 'information';
      case 'No Risk':
        return 'shield-check';
      default:
        return 'help-circle';
    }
  };

  const getStatusMessage = (status, sessionsNeeded) => {
    switch(status) {
      case 'Pass':
        return 'You have met the attendance requirements!';
      case 'Fail':
        return 'Below required minimum of 75%. Contact your advisor.';
      case 'High Risk':
        return `Need ${sessionsNeeded} more session${sessionsNeeded > 1 ? 's' : ''} to reach 75%`;
      case 'Moderate Risk':
        return `Need ${sessionsNeeded} more session${sessionsNeeded > 1 ? 's' : ''} to reach 75%`;
      case 'Low Risk':
        return `Just ${sessionsNeeded} more session${sessionsNeeded > 1 ? 's' : ''} needed`;
      case 'No Risk':
        return 'On track to meet requirements';
      default:
        return 'Status unavailable';
    }
  };

  const toggleSubjectExpansion = (index) => {
    if (expandedSubject === index) {
      setExpandedSubject(null);
    } else {
      setExpandedSubject(index);
    }
  };

  const toggleBreakdown = () => {
    setShowBreakdown(!showBreakdown);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#24325f" />
        <Text style={styles.loadingText}>Processing attendance data...</Text>
      </View>
    );
  }

  if (!studentData) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="account-alert" size={60} color="#F44336" />
        <Text style={styles.errorText}>Student not found</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.goBack()}
          style={styles.button}
        >
          Go Back
        </Button>
      </View>
    );
  }

  const progressWidth = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <ScrollView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header Section */}
<Surface style={styles.headerCard}>
  <View style={styles.headerContent}>
    <View>
      <Text style={styles.studentName}>{studentData.Name || 'Student'}</Text>
      <View style={styles.infoRow}>
        <Text style={styles.secondaryText}>ID: {studentId}</Text>
        <Text style={styles.dotSeparator}>•</Text>
        <Text style={styles.secondaryText}>Year {academicYear}</Text>
        {studentData.Group && (
          <>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.secondaryText}>Group {studentData.Group}</Text>
          </>
        )}
      </View>
    </View>
  </View>
</Surface>

{/* Module Name Card */}
<Surface style={styles.moduleCard}>
  <Text style={styles.moduleTitle}>Module</Text>
  <Text style={styles.moduleName}>{moduleName}</Text>
</Surface>

        {/* Attendance Status Card */}
        <Surface style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <MaterialCommunityIcons 
              name={getStatusIcon(attendanceStats.status)} 
              size={24} 
              color={attendanceStats.statusColor} 
            />
            <Text style={[styles.statusText, {color: attendanceStats.statusColor}]}>
              {attendanceStats.status}
            </Text>
          </View>

          <Text style={styles.statusMessage}>
            {getStatusMessage(attendanceStats.status, attendanceStats.sessionsNeeded)}
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <Animated.View 
                style={[
                  styles.progressFill, 
                  { 
                    width: progressWidth,
                    backgroundColor: attendanceStats.statusColor 
                  }
                ]}
              />
            </View>
            <Text style={styles.percentageText}>
              {attendanceStats.attendancePercentage}%
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{attendanceStats.totalAttended}</Text>
              <Text style={styles.statLabel}>Attended</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{attendanceStats.totalRequired}</Text>
              <Text style={styles.statLabel}>Required</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{attendanceStats.sessionsNeeded}</Text>
              <Text style={styles.statLabel}>Needed</Text>
            </View>
          </View>
        </Surface>

        {/* Subject Breakdown Section */}
        <Surface style={styles.breakdownCard}>
<TouchableOpacity 
  style={styles.breakdownHeader}
  onPress={toggleBreakdown}
  activeOpacity={0.7}
>
  <View>
    <Title style={styles.breakdownTitle}>Subject Breakdown</Title>
    {showBreakdown && (
      <Text style={styles.breakdownHint}>Tap on a subject to view details</Text>
    )}
  </View>
  <IconButton
    icon={showBreakdown ? "chevron-up" : "chevron-down"}
    size={24}
    color="#24325f"
  />
</TouchableOpacity>

          {showBreakdown && (
            <View style={styles.subjectsContainer}>
              {subjectData.map((subject, index) => (
                <View key={index} style={styles.subjectItem}>
                  <TouchableOpacity 
                    style={styles.subjectHeader}
                    onPress={() => toggleSubjectExpansion(index)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.subjectName}>{subject.name}</Text>
                    <View style={styles.subjectStats}>
                      <Text style={styles.subjectPercentage}>
                        {subject.percentage}%
                      </Text>
                      <IconButton
                        icon={expandedSubject === index ? "chevron-up" : "chevron-right"}
                        size={18}
                        color="#24325f"
                        style={styles.expandIcon}
                      />
                    </View>
                  </TouchableOpacity>
                  
                  <View style={styles.subjectProgressContainer}>
                    <View style={styles.subjectProgressBackground}>
                      <View 
                        style={[
                          styles.subjectProgressFill, 
                          { 
                            width: `${Math.min(subject.percentage, 100)}%`,
                            backgroundColor: subject.percentage >= 75 ? STATUS_COLORS.Pass : STATUS_COLORS['Moderate Risk']
                          }
                        ]}
                      />
                    </View>
                  </View>

                  {expandedSubject === index && (
                    <View style={styles.sessionDetails}>
                      <View style={styles.sessionRow}>
                        <Text style={styles.sessionLabel}>Required:</Text>
                        <Text style={styles.sessionValue}>{subject.required}</Text>
                      </View>
                      <View style={styles.sessionRow}>
                        <Text style={styles.sessionLabel}>Attended:</Text>
                        <Text style={styles.sessionValue}>{subject.attended}</Text>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </Surface>

        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          labelStyle={styles.buttonLabel}
          icon="keyboard-backspace"
        >
          Check Another Module
        </Button>
      </Animated.View>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {error}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#24325f',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    marginVertical: 20,
  },
  headerCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#24325f',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: 14,
    color: '#6E7191',
  },
  dotSeparator: {
    marginHorizontal: 6,
    color: '#6E7191',
  },
  moduleLabel: {
    fontSize: 14,
    backgroundColor: '#24325f',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statusCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statusMessage: {
    fontSize: 14,
    color: '#6E7191',
    marginBottom: 16,
  },
  progressContainer: {
    marginVertical: 16,
  },
  progressBackground: {
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#24325f',
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#24325f',
  },
  statLabel: {
    fontSize: 12,
    color: '#6E7191',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E9ECEF',
    marginHorizontal: 16,
  },
  breakdownCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 1,
    backgroundColor: '#FFFFFF',
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#24325f',
  },
  subjectsContainer: {
    paddingBottom: 16,
  },
  subjectItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#24325f',
  },
  subjectStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectPercentage: {
    fontSize: 15,
    fontWeight: '500',
    color: '#24325f',
  },
  expandIcon: {
    margin: 0,
  },
  subjectProgressContainer: {
    marginTop: 2,
    marginBottom: 6,
  },
  subjectProgressBackground: {
    height: 4,
    backgroundColor: '#E9ECEF',
    borderRadius: 2,
    overflow: 'hidden',
  },
  subjectProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  sessionDetails: {
    backgroundColor: '#F9F9FB',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  sessionLabel: {
    fontSize: 14,
    color: '#6E7191',
  },
  sessionValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#24325f',
  },
  backButton: {
    marginTop: 16,
    marginBottom: 32,
    paddingVertical: 8,
    backgroundColor: '#24325f',
    borderRadius: 8,
    elevation: 0,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
moduleCard: {
  marginBottom: 16,
  borderRadius: 12,
  elevation: 1,
  backgroundColor: '#FFFFFF',
  padding: 16,
},
moduleTitle: {
  fontSize: 14,
  color: '#6E7191',
  marginBottom: 4,
},
moduleName: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#24325f',
},
breakdownHint: {
  fontSize: 12,
  fontStyle: 'italic',
  color: '#6E7191',
  marginTop: 2,
},
});

export default AttendanceResultScreen;