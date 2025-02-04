import { RidingRecord } from '../types/riding';

// 微信运动数据上传接口
interface WechatSportData {
  timestamp: number;
  step: number;
  distance: number;
  duration: number;
  calorie: number;
}

export const uploadToWechatSport = async (record: RidingRecord) => {
  try {
    // 转换为微信运动数据格式
    const sportData: WechatSportData = {
      timestamp: record.endTime,
      step: Math.floor(record.distance * 1300), // 估算步数：1公里约1300步
      distance: Math.floor(record.distance * 1000), // 转换为米
      duration: record.duration,
      calorie: Math.floor(record.calories),
    };

    // 调用微信SDK上传数据
    // 注意：需要先安装并配置微信SDK
    return await WechatSDK.uploadSportData(sportData);
  } catch (error) {
    console.error('Error uploading to WeChat Sport:', error);
    throw error;
  }
}; 