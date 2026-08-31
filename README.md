# Journey to the West WebAR
## System Structure
#### 1. 逻辑定义
```text
UNIFORM ENTRY

index.html
│
├── 🏞️ AR STORY WORLD
│      ↓
│   classroom_city_story_actor_magic_demo.html
│   （currently only City scene）
│
└── ✨ MY OWN STORY
       ↓
    classroom_magic_only.html
       │
       ├── ☁️ Cloud
       ├── 🔥 Fire
       ├── 🌧️ Rain
       └── 🌱 Grow
```
```text
CITY SCENE WORKFLOW

CITY / PARK / MARKET
        │
孩子继续讲故事
        │
需要魔法
        ↓
扫描魔法卡
☁️ CLOUD / 🔥 FIRE / 🌧️ RAIN / 🌱 GROW
        ↓
魔法立即出现
        ↓
持续约 12–15 秒
        │
        ├─ 故事讲完 → 自动消失
        │
        └─ 还需要 → 再扫一次同一张卡
                    ↓
                 重新计时
```
#### 2. 项目结构
```text
journey-to-the-west-webar/
├── css/
│   ├── story-actor-demo.css       ← currently available for any demo entry
|
├──js/
|   ** classroom_city_story_scene_demo   使用                 
│   ├── park-formal.js             ← Magic Demo 正式图片 + Performance 优化版
│   ├── market-formal.js           ← Magic Demo 正式图片 + Performance 优化版
│   ├── city-world-performance.js  ← Performance Demo 使用
│   ├── magic-manager.js           ← Performance Demo + 提供AR场景使用
|   ** classroom_diy_story   使用 
│   ├── diy-hand-calibration.js
│   ├── diy-camera-orientation.js
│   ├── diy-scene-adapter.js       
│   ├── diy-scene-manager.js
|   ** classroom_magic_only   使用 
│   ├── magic-only-manager.js      ← Performance Demo + 不提供AR场景使用
|   ** 统一入口后，选项设置使用
|   ├── input-router.js
│   ** 手势识别   使用 
│   └── hand-tracking-performance.js            ← Performance Demo 使用
| 
├──targets/
│   └── citywithmagic.mind                       ← Magic Demo 识别target + Performance 优化版
|
├── index.html                                   ← 统一入口 使用citywithmagic.mind
├── classroom_city_story_scene_demo.html         ← 由统一入口进入AR预定义故事场景 使用citywithmagic.mind
├── classroom_magic_only.html                    ← 由统一入口进入到只是用magic 使用citywithmagic.mind
└── classroom_diy_story.html                     ← 由统一入口进入到DIY故事 使用citywithmagic.mind
|
├──preview/                                      ← preview AR animate， don't need AR scan
├── assets/                                      ← 所有AR资源文件
├── scenes/                                      ← 独立场景入口地址，以market为例
│   ├── market_story_interactive.html            ← market完整大场景+AR交互
│   ├── market_interactive.html                  ← marketAR交互
│   ├── market.html                              ← market完整大场景
│   ├── cloud.html                               ← 提示页面，进行preload
│   ├── cloud_ar.html                            ← cloud magic AR识别，可二维码扫码识别
└── target-images/

```

#### 3. 当前 AR 效果
例如识别筋斗云卡后：
- cloud 上下漂浮
- wind_01 左右掠过
- wind_02 旋转和呼吸
- sparkles 闪烁

这些动画直接由 A-Frame 循环控制，不需要 GIF，也不需要 AE。

#### 4. 4 张魔法卡
- cloud
- fire
- rain
- grow

## Story Resource
- 实体木质角色 = Character
- 儿童搭建场景 = World
- AR = Magic / Motion / Atmosphere

## 资源文件规格说明
交互场景图片 ：256*256
