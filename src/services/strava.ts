const STRAVA_CLIENT_ID = 'your_client_id';
const STRAVA_CLIENT_SECRET = 'your_client_secret';

export const uploadToStrava = async (record: RidingRecord) => {
  try {
    // 将数据转换为 GPX 格式
    const gpxData = convertToGPX(record);
    
    // 上传到 Strava
    const response = await fetch('https://www.strava.com/api/v3/uploads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await getStravaToken()}`,
        'Content-Type': 'multipart/form-data',
      },
      body: createFormData(gpxData),
    });
    
    return response.json();
  } catch (error) {
    console.error('Error uploading to Strava:', error);
    throw error;
  }
};

const convertToGPX = (record: RidingRecord) => {
  // 转换为 GPX 格式的代码
};

const createFormData = (gpxData: string) => {
  const formData = new FormData();
  formData.append('file', {
    uri: gpxData,
    type: 'application/gpx+xml',
    name: 'activity.gpx',
  });
  formData.append('data_type', 'gpx');
  return formData;
}; 