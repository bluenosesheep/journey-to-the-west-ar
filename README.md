# Journey to the West WebAR
## System Structure
#### 1. User Map
<img width="972" height="446" alt="image" src="https://github.com/user-attachments/assets/6a10f1f3-30c8-4e6f-9d2d-81a56abdcecf" />

```text

Child tells story

Set up scenes or scan scene card provided by AR (eg. CITY / PARK / MARKET）
        ↓
   if needs magic
        ↓
   scan magic card
        ↓
display and keep magic animate for 12-15s. Child continue to tell story, and feel free to scan same magic card or a new magic card
        ↓
finish interactive task if needs and then continue to tell story
       
```
#### 2. Project Structure
```text
journey-to-the-west-webar/
├── css/
│   ├── story-actor-demo.css       ← currently available for any demo entry
|
├──js/
|   ** classroom_city_story_scene_demo                    
│   ├── park-formal.js             ← park scene interactive implementation
│   ├── market-formal.js           ← market scene interactive implementation
│   ├── city-world-performance.js  ← city world interactive implementation
│   ├── magic-manager.js           ← magic interactive implementation
|   ** classroom_diy_story    
│   ├── diy-hand-calibration.js
│   ├── diy-camera-orientation.js
│   ├── diy-scene-adapter.js       
│   ├── diy-scene-manager.js
|   ** classroom_magic_only    
│   ├── magic-only-manager.js      ← magic only implementation
|   ** uniform entry setting 
|   ├── input-router.js
│   ** gesture tracking implementation 
│   └── hand-tracking-performance.js            
| 
├──targets/
│   └── citywithmagic.mind                       
|
├── index.html                                   ← uniform entry and uses citywithmagic.mind
├── classroom_city_story_scene_demo.html         ← 由统一入口进入AR预定义故事场景 使用citywithmagic.mind
├── classroom_magic_only.html                    ← 由统一入口进入到只是用magic 使用citywithmagic.mind
└── classroom_diy_story.html                     ← 由统一入口进入到DIY故事 使用citywithmagic.mind
|
├──preview/                                      ← preview AR animate， don't need AR scan
├── assets/                                      ← 所有AR资源文件
├── scenes/                                      ← 独立场景入口地址，以spider为例
|   ├──scenes/ 
│      ├── spider_interactive_standalone.html       ← spiderAR交互
│      ├── spider-scene.js                          ← spider交互实现
│      ├── spider-style.css                         ← spider场景布置定义
└── target-images/

```

#### 3. Current Provided AR Interactive
| Magic         | After Scan               | Interaction           | 
| ------------- | -------------------------| ------------- | 
|  **cloud**   | cloud moving animate      | - |
|  **fire**   | fire firing animate   | - |
|  **rain**   | raining animate   | - |
|  **grow**   | plant grow animate   | - |
|  **spider**   | big spider animate    | hit big spider. Finally big spider ran away and left small spiders, needs to drop and drag small spider to trash can |
|  **spider web cleanup**   | spider web animate   | all spiders are wiped out, then needs to clean up spider web |
|  **spider shadow**   | - | using gesture to control spider shadow sprite |

#### 4. Magic Cards
- cloud
- fire
- rain
- grow
- spider
- spider web

## Story Resource
- 实体木质角色 = Character
- 儿童搭建场景 = World
- AR = Magic / Motion / Atmosphere

## 资源文件规格说明
交互场景图片 ：256*256
