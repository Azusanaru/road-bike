# RoadBike App

基于 React Native 的智能骑行记录应用。

## 功能特点

### 核心功能
- 🚴‍♂️ 实时骑行数据记录
  - 速度、距离、时间追踪
  - 海拔高度和爬升计算
  - 卡路里消耗估算
- 🗺️ 路线追踪
  - Google Maps 实时显示
  - 路线回放功能
  - 高精度 GPS 定位
- 🌤️ 实时天气信息
  - 温度、湿度监测
  - 风向风速显示
  - 天气预警提醒

### 数据管理
- 📊 数据导出功能
  - GPX 格式支持
  - CSV 格式支持
- 💾 自动保存恢复
  - 骑行状态自动保存
  - 意外中断恢复
  - 本地数据缓存

### 性能优化
- ⚡ 高性能实现
  - 数据节流和防抖
  - 缓存优化
  - 内存管理

## 技术栈

### 前端
- React Native 0.72.6
- TypeScript
- React Navigation
- React Native Elements

### 地图服务
- Google Maps API
- React Native Maps

### 数据存储
- AsyncStorage
- 文件系统存储

### API 集成
- Tomorrow.io 天气 API
- 位置服务 API

## 项目结构 
RoadBikeApp/
├── src/
│ ├── assets/ # 静态资源
│ │ ├── images/ # 图片资源
│ │ └── icons/ # 图标资源
│ ├── components/ # 可复用组件
│ │ ├── common/ # 通用组件
│ │ └── riding/ # 骑行组件
│ ├── screens/ # 页面组件
│ │ ├── RidingScreen.tsx # 骑行主界面
│ │ ├── NavigationScreen.tsx # 导航界面
│ │ └── AIScreen.tsx # AI助手界面
│ ├── services/ # 业务服务
│ │ ├── api/ # API服务
│ │ │ ├── weather.ts # 天气服务
│ │ │ └── wechat.ts # 微信服务
│ │ ├── storage/ # 存储服务
│ │ └── utils/ # 工具函数
│ │ └── utils/ # 工具函数
│ ├── navigation/ # 导航配置
│ ├── hooks/ # 自定义Hooks
│ ├── store/ # 状态管理
│ ├── types/ # 类型定义
│ ├── constants/ # 常量定义
│ └── theme/ # 主题配置


## 开发环境设置

### 必要条件
- Node.js >= 14
- JDK >= 11
- Android Studio
- React Native CLI

### 安装步骤

1. 克隆项目
bash
git clone [项目地址]
cd RoadBikeApp

2. 安装依赖
bash
npm install
bash


3. 配置环境变量
创建 .env 文件并添加必要的 API keys
GOOGLE_MAPS_API_KEY=AIzaSyAmjOFytLq1s9O0ckIWEiNu2jLwmetnKks
TOMORROW_API_KEY=sSE6Qq7cNeBPZYOXV5LeA33JbNnOjdaj


## API 配置

### Google Maps
- API Key: `AIzaSyAmjOFytLq1s9O0ckIWEiNu2jLwmetnKks`
- 用途：地图显示和路线追踪
- 配置位置: `android/app/src/main/AndroidManifest.xml`

### Tomorrow.io
- API Key: `sSE6Qq7cNeBPZYOXV5LeA33JbNnOjdaj`
- 用途：天气信息获取
- 配置位置: `src/services/api/weather.ts`

## 开发指南

### 代码规范
- 使用 TypeScript 强类型
- 遵循 ESLint 规则
- 使用函数组件和 Hooks
- 组件文件使用 .tsx 扩展名
- 服务文件使用 .ts 扩展名

### 性能优化
- 使用 useMemo 和 useCallback 优化渲染
- 实现数据缓存减少 API 调用
- 使用节流和防抖优化事件处理
- 优化列表渲染和大数据处理

### 调试技巧
- 使用 React Native Debugger
- 查看控制台日志
- 性能监控和分析
- 网络请求追踪

## 发布流程

### Android 发布
1. 生成签名密钥
2. 配置 gradle 构建文件
3. 生成发布版本
4. 上传到 Google Play

## 维护说明


### 版本控制
- 使用 Git 进行版本控制
- 遵循 Git Flow 工作流
- 使用语义化版本号

### 问题追踪
- 使用 GitHub Issues
- Bug 报告模板
- 功能请求模板

## 许可证

MIT License

## 作者

[作者信息]

## 更新日志

### v0.1.0 (2024-03-xx)
- 初始版本发布
- 基本骑行功能实现
- 天气集成
- 数据导出功能