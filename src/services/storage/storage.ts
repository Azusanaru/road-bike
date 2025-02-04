import AsyncStorage from '@react-native-async-storage/async-storage';
import { RidingRecord } from '../types/riding';

const RIDING_RECORDS_KEY = 'riding_records';

export const saveRidingRecord = async (record: RidingRecord) => {
  try {
    const existingRecords = await getRidingRecords();
    const updatedRecords = [record, ...existingRecords];
    await AsyncStorage.setItem(RIDING_RECORDS_KEY, JSON.stringify(updatedRecords));
  } catch (error) {
    console.error('Error saving riding record:', error);
    throw error;
  }
};

export const getRidingRecords = async (): Promise<RidingRecord[]> => {
  try {
    const records = await AsyncStorage.getItem(RIDING_RECORDS_KEY);
    return records ? JSON.parse(records) : [];
  } catch (error) {
    console.error('Error getting riding records:', error);
    return [];
  }
}; 