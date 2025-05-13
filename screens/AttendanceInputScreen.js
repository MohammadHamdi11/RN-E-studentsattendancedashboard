// screens/AttendanceInputScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { TextInput, Button, Text, ActivityIndicator, Snackbar, Portal, Dialog, RadioButton, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { fetchAttendanceData, fetchAvailableModules } from '../services/attendanceService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AttendanceInputScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [studentId, setStudentId] = useState('');
  const [academicYear, setAcademicYear] = useState('1');
  const [module, setModule] = useState('');
  const [modules, setModules] = useState([]);
  const [selectedModuleName, setSelectedModuleName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [yearDialogVisible, setYearDialogVisible] = useState(false);
  const [moduleDialogVisible, setModuleDialogVisible] = useState(false);

  // Update available modules when academic year changes
  useEffect(() => {
    const getModules = async () => {
      try {
        const availableModules = await fetchAvailableModules(academicYear);
        setModules(availableModules);
        if (availableModules.length > 0) {
          setModule(availableModules[0].id);
          setSelectedModuleName(availableModules[0].name);
        } else {
          setModule('');
          setSelectedModuleName('');
        }
      } catch (error) {
        console.error('Error loading modules:', error);
        setError('Failed to load modules');
        setSnackbarVisible(true);
      }
    };
    
    getModules();
  }, [academicYear]);

  const handleYearSelection = (selectedYear) => {
    setAcademicYear(selectedYear);
    setYearDialogVisible(false);
  };

  const handleModuleSelection = (selectedModuleId, selectedModuleName) => {
    setModule(selectedModuleId);
    setSelectedModuleName(selectedModuleName);
    setModuleDialogVisible(false);
  };

  const handleViewAttendance = async () => {
    if (!studentId || !module) {
      setError('Please enter all fields');
      setSnackbarVisible(true);
      return;
    }

    setLoading(true);
    
    try {
      const jsonData = await fetchAttendanceData(academicYear, module);
      
      navigation.navigate('AttendanceResult', {
        attendanceData: jsonData,
        studentId,
        academicYear,
        moduleName: selectedModuleName
      });
    } catch (error) {
      console.error('Fetch error:', error);
      setError(`Failed to fetch data: ${error.message}`);
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  // Function to dismiss keyboard
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />
          
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Attendance Check</Text>
          </View>
          
          <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
            <View>
              <View style={styles.inputContainer}>
                <TextInput
                  label="Student ID"
                  value={studentId}
                  onChangeText={text => setStudentId(text)}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="numeric"
                  placeholder="Enter your student ID"
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#24325f"
                  dense
                  returnKeyType="done"
                  onSubmitEditing={dismissKeyboard}
                />
                {studentId.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => {
                      setStudentId('');
                      Keyboard.dismiss();
                    }}
                  >
                    <MaterialIcons name="clear" size={20} color="#757575" />
                  </TouchableOpacity>
                )}
              </View>
              
              <Text style={styles.sectionLabel}>Academic Year</Text>
              <TouchableOpacity 
                style={styles.selector} 
                onPress={() => {
                  dismissKeyboard();
                  setYearDialogVisible(true);
                }}
              >
                <Text style={styles.selectorText}>Year {academicYear}</Text>
                <MaterialIcons name="expand-more" size={24} color="#24325f" />
              </TouchableOpacity>
              
              <Text style={styles.sectionLabel}>Module</Text>
              <TouchableOpacity 
                style={styles.selector} 
                onPress={() => {
                  dismissKeyboard();
                  setModuleDialogVisible(true);
                }}
              >
                <Text style={styles.selectorText} numberOfLines={1} ellipsizeMode="tail">
                  {selectedModuleName || 'Select a module'}
                </Text>
                <MaterialIcons name="expand-more" size={24} color="#24325f" />
              </TouchableOpacity>
            </View>
          </ScrollView>
          
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={() => {
                dismissKeyboard();
                handleViewAttendance();
              }}
              style={styles.button}
              labelStyle={styles.buttonLabel}
              loading={loading}
              disabled={loading}
            >
              Check Attendance
            </Button>
          </View>
          
          {/* Year Selection Dialog */}
          <Portal>
            <Dialog 
              visible={yearDialogVisible} 
              onDismiss={() => setYearDialogVisible(false)}
              style={styles.dialog}
            >
              <Dialog.Title style={styles.dialogTitle}>Select Year</Dialog.Title>
              <Dialog.Content>
                {['1', '2', '3', '4', '5'].map((year) => (
                  <TouchableOpacity 
                    key={year}
                    style={styles.radioItem}
                    onPress={() => handleYearSelection(year)}
                  >
                    <RadioButton
                      value={year}
                      status={academicYear === year ? 'checked' : 'unchecked'}
                      color="#24325f"
                      uncheckedColor="#BDBDBD"
                    />
                    <Text style={styles.radioLabel}>Year {year}</Text>
                  </TouchableOpacity>
                ))}
              </Dialog.Content>
              <Dialog.Actions>
                <Button 
                  onPress={() => setYearDialogVisible(false)}
                  textColor="#24325f"
                >
                  Cancel
                </Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>

          {/* Module Selection Dialog */}
          <Portal>
            <Dialog 
              visible={moduleDialogVisible} 
              onDismiss={() => setModuleDialogVisible(false)}
              style={styles.dialog}
            >
              <Dialog.Title style={styles.dialogTitle}>Select Module</Dialog.Title>
              <Dialog.ScrollArea style={styles.dialogScrollArea}>
                {modules.map((mod) => (
                  <View key={mod.id}>
                    <TouchableOpacity 
                      style={styles.radioItem}
                      onPress={() => handleModuleSelection(mod.id, mod.name)}
                    >
                      <RadioButton
                        value={mod.id}
                        status={module === mod.id ? 'checked' : 'unchecked'}
                        color="#24325f"
                        uncheckedColor="#BDBDBD"
                      />
                      <Text style={styles.radioLabel}>{mod.name}</Text>
                    </TouchableOpacity>
                    <Divider style={styles.divider} />
                  </View>
                ))}
              </Dialog.ScrollArea>
              <Dialog.Actions>
                <Button 
                  onPress={() => setModuleDialogVisible(false)}
                  textColor="#24325f"
                >
                  Cancel
                </Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
                
          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={3000}
            style={styles.snackbar}
            action={{
              label: 'DISMISS',
              onPress: () => setSnackbarVisible(false),
            }}
          >
            {error}
          </Snackbar>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#24325f',
  },
  formContainer: {
    paddingHorizontal: 24,
    flex: 1,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#ffffff',
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: 16,
    padding: 4,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#24325f',
    marginBottom: 8,
    marginLeft: 4,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 24,
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 1,
  },
  selectorText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  button: {
    paddingVertical: 6,
    backgroundColor: '#24325f',
    borderRadius: 4,
    elevation: 2,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  dialog: {
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  dialogTitle: {
    color: '#24325f',
  },
  dialogScrollArea: {
    maxHeight: 300,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  radioLabel: {
    fontSize: 16,
    marginLeft: 8,
    color: '#424242',
  },
  divider: {
    backgroundColor: '#EEEEEE',
  },
  snackbar: {
    backgroundColor: '#333333',
  },
});

export default AttendanceInputScreen;