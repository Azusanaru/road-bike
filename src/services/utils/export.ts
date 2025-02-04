import { RidingRecord, Location } from '../types/riding';
import { PermissionsAndroid, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

// GPX 格式导出
const generateGPX = (record: RidingRecord): string => {
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="RoadBikeApp">
  <metadata>
    <time>${new Date(record.startTime).toISOString()}</time>
  </metadata>
  <trk>
    <name>骑行记录 ${new Date(record.startTime).toLocaleDateString()}</name>
    <trkseg>`;

  const points = record.route.map(point => `
    <trkpt lat="${point.latitude}" lon="${point.longitude}">
      <ele>${point.altitude || 0}</ele>
      <time>${new Date(point.timestamp).toISOString()}</time>
      <speed>${point.speed}</speed>
    </trkpt>`).join('');

  const footer = `
    </trkseg>
  </trk>
</gpx>`;

  return header + points + footer;
};

// CSV 格式导出
const generateCSV = (record: RidingRecord): string => {
  const header = '时间,纬度,经度,海拔,速度\n';
  const rows = record.route.map(point => 
    `${new Date(point.timestamp).toISOString()},${point.latitude},${point.longitude},${point.altitude || 0},${point.speed}`
  ).join('\n');
  return header + rows;
};

// 导出功能
export const exportRidingData = async (record: RidingRecord, format: 'gpx' | 'csv' = 'gpx') => {
  try {
    // 检查写入权限
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new Error('需要存储权限才能导出数据');
      }
    }

    // 生成文件内容
    const content = format === 'gpx' ? generateGPX(record) : generateCSV(record);
    const fileName = `riding_${record.id}.${format}`;
    const path = `${RNFS.DocumentDirectoryPath}/${fileName}`;

    // 写入文件
    await RNFS.writeFile(path, content, 'utf8');

    // 分享文件
    await Share.open({
      title: '导出骑行数据',
      url: `file://${path}`,
      type: format === 'gpx' ? 'application/gpx+xml' : 'text/csv',
      subject: `骑行记录 ${new Date(record.startTime).toLocaleDateString()}`,
    });

    return path;
  } catch (error) {
    console.error('导出数据失败:', error);
    throw error;
  }
};

// 批量导出
export const exportMultipleRecords = async (records: RidingRecord[], format: 'gpx' | 'csv' = 'gpx') => {
  try {
    const results = await Promise.all(records.map(record => exportRidingData(record, format)));
    return results;
  } catch (error) {
    console.error('批量导出失败:', error);
    throw error;
  }
}; 