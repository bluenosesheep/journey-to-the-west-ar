# Journey to the West WebAR
## System Structure
#### 1. User Map
<img width="972" height="446" alt="image" src="https://github.com/user-attachments/assets/6a10f1f3-30c8-4e6f-9d2d-81a56abdcecf" />

```text

孩子讲故事

搭建场景或用扫描AR提供的场景（CITY / PARK / MARKET）
        │
需要魔法
        ↓
扫描魔法卡
        ↓
魔法立即出现，持续约 12–15 秒， 故事讲完 → 自动消失，还需要 → 再扫一次同一张卡 → 重新计时
        ↓
执行任务，完成任务，继续讲故事
       
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

#### 3. 当前 AR 交互
| Magic         | 扫卡后出现    | 轻交互           | 完成反馈         | 实现难度 |
| ------------- | -------- | ------------- | ------------ | ---- |
|  **cloud**   | cloud moving animate   | - |         |    |
|  **fire**   | fire firing animate   | - |         |    |
|  **rain**   | raining animate   | - |         |    |
|  **grow**   | plant grow animate   | - |         |    |
|  **shopping**   | p   | - |         |    |
| 🐸 **青蛙过河**   | 小青蛙在河边   | 把 3 块荷叶拖到河里搭路 | 青蛙蹦过去        | ⭐⭐   |
| 🐒 **救小猴子**   | 小猴被藤蔓缠住  | 用手连续“拨开”3 根藤蔓 | 猴子跳起来庆祝      | ⭐⭐   |
| 🥚 **孵化神秘蛋**  | 一颗晃动的蛋   | 用手轻点/摸蛋 3 次   | 蛋裂开，小动物跳出来   | ⭐    |
| 🌱 **魔法种子**   | 一颗种子     | 把雨滴拖到种子上 3 次  | 发芽→开花→长成树    | ⭐⭐   |
| 🐟 **救小鱼**    | 3 条鱼在浅水里 | 把鱼拖进池塘        | 鱼游起来、冒泡泡     | ⭐⭐   |
| 🌟 **抓星星**    | 星星慢慢飘过   | 捏住 3 颗放进魔法瓶   | 瓶子发光         | ⭐⭐   |
| 👻 **赶走小妖怪**  | 3 个小妖怪乱跑 | 用手拍/点它们       | `POOF!` 变烟消失 | ⭐    |
| 🍎 **帮猴子摘果子** | 树上几个果子   | 捏住果子放进篮子      | 猴子开心跳舞       | ⭐⭐   |
| 🧹 **清理魔法垃圾** | 地面散着几件东西 | 分类拖进两个箱子      | 地面闪亮 ✨       | ⭐⭐⭐  |
| 🐝 **蜜蜂回家**   | 3 只蜜蜂乱飞  | 抓住送回蜂巢        | 蜂巢冒爱心        | ⭐⭐   |

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
