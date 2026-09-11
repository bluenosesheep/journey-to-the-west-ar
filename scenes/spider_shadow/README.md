# 蛛影小妖 · 独立自由皮影 Demo

这个页面完全独立。

## 启动

摄像头和 ES Module 需要通过 <https://bluenosesheep.github.io/journey-to-the-west-ar/scenes/spider_shadow/shadow_puppet_standalone.html> 访问。

## 操作

1. 点击“开始表演”并允许摄像头权限。
2. 手掌朝向镜头，张开五指保持约一秒完成校准。
3. 手掌控制身体；拇指控制头；食指和中指控制双手；无名指和小指控制双脚。
4. 可随时点击“重新校准”或“结束表演”。

## 文件

- `scenes/spider_shadow/shadow_puppet_standalone.html`：独立入口
- `scenes/spider_shadow/shadow-puppet-scene.js`：皮影绑定、校准、平滑和 Canvas 渲染
- `scenes/spider_shadow/shadow-hand-tracking.js`：独立的 21 点手势追踪，不影响原项目模块
- `scenes/spider_shadow/shadow-puppet-style.css`：页面样式
- `assets/spider_shadow/`：项目公共素材目录中的六张透明部件 PNG

页面中的素材基准路径是 `../../assets/spider_shadow/`。

首次启动仍需下载 MediaPipe 手势模型；浏览器缓存后再次进入会更快。
