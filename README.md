# Journey to the West WebAR template

这是一个 MindAR + A-Frame 的轻量 WebAR 模板，当前先跑通「筋斗云」故事卡。

## 1. 先生成 targets.mind
MindAR 需要把识别卡编译成 `.mind` 文件。

打开官方 Target Compiler：
https://hiukim.github.io/mind-ar-js-doc/tools/compile

上传：
`target-images/jingdouyun-card.png`

下载编译结果后，把文件命名为：
`targets.mind`

然后放到项目根目录，与 `index.html` 同一级。

## 2. 项目结构
```text
journey-to-the-west-webar/
├── index.html
├── preview.html
├── targets.mind          ← 你编译后放这里
├── assets/
│   ├── cloud.png
│   ├── wind_01.png
│   ├── wind_02.png
│   └── sparkles.png
└── target-images/
    └── jingdouyun-card.png
```

## 3. GitHub Pages
1. GitHub 新建 repository，比如 `journey-to-the-west-ar`
2. 上传本文件夹全部内容
3. Settings → Pages
4. Deploy from a branch
5. 选择 `main` 和 `/ (root)`
6. 保存
7. 手机打开 GitHub Pages 的 HTTPS 地址并允许摄像头

## 4. 当前 AR 效果
识别筋斗云卡后：
- cloud 上下漂浮
- wind_01 左右掠过
- wind_02 旋转和呼吸
- sparkles 闪烁

这些动画直接由 A-Frame 循环控制，不需要 GIF，也不需要 AE。

## 5. 后续扩展成 4 张故事卡
将 4 张识别卡一起放入 Target Compiler，一次生成同一个 `targets.mind`：
- targetIndex 0：筋斗云
- targetIndex 1：三昧真火
- targetIndex 2：水浪
- targetIndex 3：七十二变

然后在 `index.html` 复制 `<a-entity mindar-image-target="targetIndex:0">...</a-entity>`，
把 targetIndex 改成 1 / 2 / 3，并换成对应 AR 素材即可。

## 设计建议
实体木质角色 = Character
儿童搭建场景 = World
AR = Magic / Motion / Atmosphere

这样 AR 是儿童故事的“动态层”，而不是固定剧情播放器。
