// services/attendanceService.js
import { Alert } from 'react-native';
import { decodeBase64 } from './base64utils';
import * as FileSystem from 'expo-file-system';

// GitHub configuration
const GITHUB_OWNER = 'MohammadHamdi11';
const GITHUB_REPO = 'RN-E-studentsattendancedashboard';
const GITHUB_BRANCH = 'main';
const GITHUB_TOKEN_PREFIX = 'github_pat_';
const GITHUB_TOKEN_SUFFIX = '11BREVRNQ0rzSg1iqU2jIF_PaQBXFrAdlIvJ3hOndFayCFGYfIqnuHWYE5osOwBBcNMMLT42VEuWQLwn8s';

/**
 * Get the local file path for a given attendance file
 * @param {string} academicYear - The academic year
 * @param {string} moduleId - The module ID
 * @returns {string} - Local file path
 */
const getLocalFilePath = (academicYear, moduleId) => {
  return `${FileSystem.documentDirectory}Y${academicYear}_${moduleId}_attendance.json`;
};

/**
 * Check if local file exists and is not outdated
 * @param {string} filePath - Path to the local file
 * @param {number} maxAgeMs - Maximum age of the file in milliseconds (default 24h)
 * @returns {Promise<boolean>} - Whether the file exists and is recent
 */
const isLocalFileValid = async (filePath, maxAgeMs = 24 * 60 * 60 * 1000) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    
    if (!fileInfo.exists) {
      return false;
    }
    
    // Check if file is not too old (default 24 hours)
    if (maxAgeMs > 0) {
      const fileTimestamp = (await FileSystem.getInfoAsync(filePath, { md5: false })).modificationTime * 1000;
      const now = new Date().getTime();
      if (now - fileTimestamp > maxAgeMs) {
        console.log('Local file is outdated');
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking local file:', error);
    return false;
  }
};

/**
 * Read data from local file
 * @param {string} filePath - Path to the local file
 * @returns {Promise<Object>} - JSON data
 */
const readLocalFile = async (filePath) => {
  try {
    const fileContent = await FileSystem.readAsStringAsync(filePath);
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading local file:', error);
    throw error;
  }
};

/**
 * Save data to local file
 * @param {string} filePath - Path to save the file
 * @param {Object} data - Data to save
 * @returns {Promise<void>}
 */
const saveToLocalFile = async (filePath, data) => {
  try {
    const jsonString = JSON.stringify(data);
    await FileSystem.writeAsStringAsync(filePath, jsonString);
    console.log('Data saved to local file:', filePath);
  } catch (error) {
    console.error('Error saving to local file:', error);
    throw error;
  }
};

/**
 * Fetch attendance data, prioritizing local files and downloading from GitHub if needed
 * @param {string} academicYear - The academic year
 * @param {string} moduleId - The module ID
 * @param {boolean} forceRefresh - Whether to force a refresh from the server
 * @returns {Promise<Object>} - JSON data of attendance records
 */
export const fetchAttendanceData = async (academicYear, moduleId, forceRefresh = false) => {
  try {
    const localFilePath = getLocalFilePath(academicYear, moduleId);
    
    // Check if we have a valid local copy and should use it
    if (!forceRefresh && await isLocalFileValid(localFilePath)) {
      console.log('Using cached local file:', localFilePath);
      return await readLocalFile(localFilePath);
    }
    
    // If we don't have a valid local copy or forceRefresh is true, download from GitHub
    console.log('Downloading from GitHub...');
    const data = await downloadFromGitHub(academicYear, moduleId);
    
    // Save the downloaded data to local file
    await saveToLocalFile(localFilePath, data);
    
    return data;
  } catch (error) {
    console.error('Error in fetchAttendanceData:', error);
    throw error;
  }
};

/**
 * Download attendance data from GitHub repository
 * @param {string} academicYear - The academic year
 * @param {string} moduleId - The module ID
 * @returns {Promise<Object>} - JSON data of attendance records
 */
const downloadFromGitHub = async (academicYear, moduleId) => {
  try {
    const githubToken = `${GITHUB_TOKEN_PREFIX}${GITHUB_TOKEN_SUFFIX}`;
    const filePath = `Y${academicYear}_${moduleId}_attendance.json`;
    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`;
    
    console.log('Fetching from GitHub API URL:', apiUrl);
    
    // Make the API request with authentication
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3.raw' // Request raw content instead of JSON
      }
    });
    
    if (!response.ok) {
      // Try the backup repository if main repo fails
      return await downloadFromBackupRepo(academicYear, moduleId);
    }
    
    // Since we requested raw content, we can directly get the text
    const jsonContent = await response.text();
    
    // Parse the JSON content
    return JSON.parse(jsonContent);
  } catch (error) {
    console.error('Error fetching from GitHub API:', error);
    throw error;
  }
};

/**
 * Download attendance data from backup GitHub repository
 * @param {string} academicYear - The academic year
 * @param {string} moduleId - The module ID
 * @returns {Promise<Object>} - JSON data of attendance records
 */
const downloadFromBackupRepo = async (academicYear, moduleId) => {
  try {
    const githubToken = `${GITHUB_TOKEN_PREFIX}${GITHUB_TOKEN_SUFFIX}`;
    
    // Try the backup repository (RN-E-attendancerecorderapp)
    const backupRepo = 'RN-E-attendancerecorderapp';
    const filePath = `Y${academicYear}_${moduleId}_attendance.json`;
    const backupApiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${backupRepo}/contents/${filePath}?ref=${GITHUB_BRANCH}`;
    
    console.log('Trying backup GitHub API URL:', backupApiUrl);
    
    const response = await fetch(backupApiUrl, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      // If backup also fails, throw specific error with both paths
      throw new Error(`Attendance data not found in either repository. 
      Tried paths: 
      - ${GITHUB_REPO}/${filePath}
      - ${backupRepo}/${filePath}`);
    }
    
    const data = await response.json();
    const base64Content = data.content.replace(/\n/g, '').trim();
    // Use the imported decodeBase64 function
    const decodedContent = decodeBase64(base64Content);
    
    return JSON.parse(decodedContent);
  } catch (error) {
    console.error('Error fetching from backup GitHub API:', error);
    throw error;
  }
};

/**
 * Get list of available modules for an academic year
 * @param {string} academicYear - The academic year
 * @returns {Promise<Array>} - Array of module objects with id and name
 */
export const fetchAvailableModules = async (academicYear) => {
  // This is a placeholder function - in a real app, you would fetch this from the server
  // For now, we'll return the locally defined modules
  const modulesByYear = {
    '1': [
      { id: 'Introduction_to_Anatomy', name: 'Introduction to Anatomy' },
      { id: 'Introduction_to_Histology', name: 'Introduction to Histology' },
      { id: 'Introduction_to_Biochemistry', name: 'Introduction to Biochemistry' },
      { id: 'Introduction_to_Physiology', name: 'Introduction to Physiology' },
      { id: 'Immunology', name: 'Immunology' },
      { id: 'Genetics', name: 'Genetics' },
      { id: 'Introduction_to_Pathology', name: 'Introduction to Pathology' },
      { id: 'Introduction_to_Pharmacology', name: 'Introduction to Pharmacology' },
      { id: 'Infection', name: 'Infection' },
      { id: 'Locomotor', name: 'Locomotor' }
    ],
    '2': [
      { id: 'Blood_&_lymphatics', name: 'Blood & Lymphatics' },
      { id: 'Respiratory', name: 'Respiratory' },
      { id: 'CVS', name: 'CVS' },
      { id: 'CNS', name: 'CNS' },
      { id: 'Special_senses', name: 'Special Senses' },
      { id: 'Endocrine_&_Metabolism', name: 'Endocrine & Metabolism' }
    ],
    '3': [
      { id: 'GIT_&_Liver', name: 'GIT & Liver' },
      { id: 'Urogenital', name: 'Urogenital' },
      { id: 'Foundation_of_internal', name: 'Foundation of Internal' },
      { id: 'ENT', name: 'ENT' },
      { id: 'Community_&_Occupational', name: 'Community & Occupational' },
      { id: 'Forensics_&_Toxicology', name: 'Forensics & Toxicology' }
    ],
    '4': [
      { id: 'General_&_special_internal_1', name: 'General & Special Internal 1' },
      { id: 'General_&_special_internal_2', name: 'General & Special Internal 2' },
      { id: 'Family_Medicine', name: 'Family Medicine' },
      { id: 'Pediatrics', name: 'Pediatrics' }
    ],
    '5': [
      { id: 'Ophthalmology', name: 'Ophthalmology' },
      { id: 'General_&_Special_surgery_1', name: 'General & Special Surgery 1' },
      { id: 'General_&_Special_surgery_2', name: 'General & Special Surgery 2' },
      { id: 'Emergency_&_trauma_1', name: 'Emergency & Trauma 1' },
      { id: 'Emergency_&_trauma_2', name: 'Emergency & Trauma 2' },
      { id: 'Obstetrics_&_gynecology', name: 'Obstetrics & Gynecology' }
    ]
  };
  
  return modulesByYear[academicYear] || [];
};

/**
 * Clear all cached attendance data files
 * @returns {Promise<void>}
 */
export const clearAttendanceCache = async () => {
  try {
    const directory = FileSystem.documentDirectory;
    const files = await FileSystem.readDirectoryAsync(directory);
    
    // Only delete attendance JSON files
    const attendanceFiles = files.filter(file => file.includes('_attendance.json'));
    
    for (const file of attendanceFiles) {
      await FileSystem.deleteAsync(`${directory}${file}`);
      console.log(`Deleted: ${file}`);
    }
    
    return attendanceFiles.length;
  } catch (error) {
    console.error('Error clearing attendance cache:', error);
    throw error;
  }
};