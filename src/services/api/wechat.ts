import * as WeChat from 'react-native-wechat-lib';

export const initWeChat = async () => {
  try {
    await WeChat.registerApp('你的微信AppID', '你的Universal Link');
    return true;
  } catch (error) {
    console.error('WeChat init error:', error);
    return false;
  }
};

export const isWXAppInstalled = async () => {
  return await WeChat.isWXAppInstalled();
}; 