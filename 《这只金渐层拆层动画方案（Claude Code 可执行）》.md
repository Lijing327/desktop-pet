《这只金渐层拆层动画方案（Claude Code 可执行）》
一、执行目标

请基于当前已生成的金渐层形象，完成一套适用于桌面宠物 v1 的拆层动画方案，要求满足：

现有静态图可作为首发待机形象使用
支持最小拆层动画
优先实现：
idle 待机
wait 注视
follow 跟随
react 点击反馈
sleep / run 可先通过补图或弱动画过渡
保持当前角色风格不崩坏
方案应便于 Claude Code 接入到现有 Electron + Vue3 项目
二、先给结论：这张图怎么拆，最合理

这张图不建议拆成太多碎片。
因为它本身是完整插画，毛发和体积感比较强，拆太碎会很容易穿帮。

推荐拆层级别：中低复杂度

建议拆成这几层：

1. 身体主体（含四肢大部分）
2. 头部整体
3. 左耳
4. 右耳
5. 左眼
6. 右眼
7. 尾巴
8. 嘴巴/鼻口区域（可选）
9. 前景小特效层（可选，不必须）
不建议单独拆的部分
四条腿分别独立拆
脖子细分
胡须独立拆
毛发大面积逐段拆
身体左右半边拆开

原因很简单：
这张图更适合“桌宠轻动画”，不是“复杂角色 rig”。

三、拆层总体策略
方案目标分级
A 级：当前必须做

用于让它活起来：

头部轻微摆动
眼睛跟随鼠标
眨眼
尾巴摆动
耳朵抖动
身体呼吸起伏
B 级：建议做

用于增强反馈：

点击时头部轻压缩
弹跳反馈
表情切换
开心时尾巴快速摆动
C 级：后续再做
奔跑完整逐帧
睡觉完整新姿态
坐下姿态
生气/委屈情绪包
四、拆层详细说明
1. 身体主体层 body
包含内容
脖子以下主体
四肢
身体大部分毛发
不含头部
不含尾巴
不含眼睛可动层
用途
做呼吸起伏
做整体轻微上下浮动
做点击压缩
做跟随移动时整体前倾
锚点建议
pivot: 身体中心偏下
动画用途
idle 呼吸
react 压缩回弹
follow 前倾
2. 头部整体层 head
包含内容
脸
脑袋轮廓
毛发
默认不含独立眼球层时可含眼白基底
不含耳朵独立层时可留耳朵底部连接
用途
歪头
注视方向微调
点击反馈点头
等待状态轻微看向鼠标
锚点建议
pivot: 脖颈连接处
动画用途
wait 模式头部轻微旋转
idle 小幅摆动
react 点头
follow 时朝向变化
3. 左耳 / 右耳 earL / earR
包含内容
单独耳朵
建议保留一点底部连接过渡
用途
轻抖
听到动静时立起
wait 模式朝鼠标轻微转向
锚点建议
pivot: 耳朵根部
动画用途
idle 随机耳朵抖动
wait 朝向变化
react 受惊轻抖
4. 左眼 / 右眼 eyeL / eyeR
推荐拆法

不要直接把整个眼睛挖成一个大洞。
建议拆成：

眼睛底图保留在 head 上
单独做“瞳孔/高光层”移动
或者单独准备一套“睁眼/闭眼/半闭眼”覆盖层
最低成本推荐

两种资源即可：

open eyes
closed eyes

再叠加瞳孔偏移。

用途
眨眼
看向鼠标
开心放大
睡觉闭眼
锚点建议

每只眼单独局部坐标控制即可。

5. 尾巴 tail
这是最重要的独立层之一

这张图的尾巴非常值钱，必须独立拆。

包含内容
整条尾巴
尾巴根部尽量自然过渡
用途
idle 慢摆
开心快速摆
follow 时摆幅增加
wait 时轻微停顿摆
react 时快速一甩
锚点建议
pivot: 尾巴根部
动画建议

不要只左右硬摆。
要做：

旋转 + 轻微曲线感
摆动节奏由慢到快
6. 嘴巴/鼻口区域 mouth（可选）
是否必须

不是必须。
当前版本可以不拆。

适合做什么
惊讶小嘴
开心小嘴
困困小嘴
委屈嘴
建议

如果美术成本有限，先不做独立嘴巴骨骼。
可以直接准备几张表情贴图覆盖。

五、资源目录规范

建议这样组织：

src/assets/pets/golden-tabby/
  meta.json
  base/
    body.png
    head.png
    ear-left.png
    ear-right.png
    tail.png
    eye-left-open.png
    eye-left-close.png
    eye-right-open.png
    eye-right-close.png
    mouth-default.png
  expressions/
    mouth-happy.png
    mouth-wow.png
    blush.png
    star-eyes.png
  poses/
    idle-full.png
    sleep-full.png
    sit-full.png
    run-1.png
    run-2.png
    run-3.png
    run-4.png
六、meta.json 设计建议
{
  "id": "golden-tabby",
  "name": "金渐层",
  "type": "layered",
  "anchor": { "x": 0.5, "y": 0.95 },
  "scale": 1,
  "canvasSize": { "width": 1024, "height": 1024 },
  "parts": {
    "body": { "path": "base/body.png", "x": 0, "y": 0, "pivot": { "x": 0.5, "y": 0.7 } },
    "head": { "path": "base/head.png", "x": 0, "y": -40, "pivot": { "x": 0.5, "y": 0.85 } },
    "earL": { "path": "base/ear-left.png", "x": -85, "y": -165, "pivot": { "x": 0.5, "y": 0.95 } },
    "earR": { "path": "base/ear-right.png", "x": 90, "y": -165, "pivot": { "x": 0.5, "y": 0.95 } },
    "tail": { "path": "base/tail.png", "x": -220, "y": -80, "pivot": { "x": 0.9, "y": 0.95 } }
  },
  "eyes": {
    "left": {
      "open": "base/eye-left-open.png",
      "close": "base/eye-left-close.png",
      "origin": { "x": -55, "y": -85 },
      "range": { "x": 8, "y": 5 }
    },
    "right": {
      "open": "base/eye-right-open.png",
      "close": "base/eye-right-close.png",
      "origin": { "x": 55, "y": -85 },
      "range": { "x": 8, "y": 5 }
    }
  }
}
七、动画方案设计
1. Idle 待机动画
目标

让宠物什么都不做时也显得活着。

动画组成
body 呼吸缩放：scaleY 0.985 ~ 1.015
body 上下浮动：translateY -2px ~ 2px
head 微摆：rotate -2° ~ 2°
tail 缓慢摆动：rotate -8° ~ 10°
ear 随机轻抖：-4° ~ 4°
每 4~8 秒随机眨眼一次
实现建议
使用单独 animation controller
通过时间轴 / requestAnimationFrame 更新
不建议完全依赖 CSS keyframes，状态切换不够灵活
2. Wait 等待注视动画
目标

原地不动，但会“看你”。

组成
head 根据鼠标方向轻微旋转
瞳孔在小范围内偏移
ear 朝鼠标方向轻偏
tail 摆动频率下降
约束
头部旋转不要超过 ±6°
瞳孔移动范围控制在 ±6~8px
避免整张脸大幅移动，容易穿帮
感知重点

用户最想看到的是：

它在盯我
它有注意力
3. Follow 跟随动画
目标

不是做真四足跑，而是做“桌宠感”的移动。

v1 推荐方案

不要强行拿当前站姿图做完整跑步骨骼。
当前版本建议：

移动时
整体位置移动
body 前倾 4° ~ 8°
head 微前探
body 做轻微上下弹跳
tail 摆幅增加
可切换到简化 run pose 图更好
两个实现层级
低成本版

直接用当前站姿 + 位移 + 弹跳 + 前倾

推荐版

额外补 2~4 张 run pose 图，形成跑步循环

4. React 点击反馈
目标

点击后明确有反馈，但不要太吵。

组成
body 先压缩 scaleY 0.94
再回弹 scaleY 1.04
head 点一下
tail 快速甩一次
可加小星星特效
时长建议

300ms ~ 500ms

5. Sleep 睡觉动画
重点提醒

当前这张站立图不适合硬改成睡觉。
会很假。

正确做法

单独补一张睡觉姿态图：

蜷缩
闭眼
尾巴绕身
身体团起来
动画只做
呼吸
Zzz 气泡
偶发耳朵抖动
八、Claude Code 实现建议
组件拆分建议
PetLayeredCharacter.vue
  ├─ BodyLayer
  ├─ HeadLayer
  ├─ EarLayerLeft
  ├─ EarLayerRight
  ├─ TailLayer
  ├─ EyeLayerLeft
  ├─ EyeLayerRight
  └─ EffectLayer
composables 建议
usePetRig.ts
负责部件坐标、旋转、缩放

usePetBlink.ts
负责眨眼调度

usePetLookAt.ts
负责头部和眼睛跟随鼠标

usePetIdleMotion.ts
负责待机呼吸、尾巴摆动、耳朵轻抖

usePetReactMotion.ts
负责点击回弹动作
状态驱动建议
idle   -> usePetIdleMotion + blink
wait   -> usePetIdleMotion + lookAt
follow -> move + lean + bounce + tailFast
react  -> short squash and stretch
sleep  -> sleep pose + breathing
九、给 Claude Code 的正式执行清单

下面这段可以直接给 Claude Code。

《Claude Code 执行清单：金渐层拆层动画接入 v1》

请基于当前桌面宠物项目，对首发金渐层角色接入“拆层轻动画系统”，要求如下：

1. 目标

把现有金渐层静态图改造成可做桌宠 idle / wait / react / follow 轻动画的 layered pet character。

2. 实现边界

本次不做复杂 Live2D，不做完整骨骼系统，不做高精度四足跑步 rig。
只做低成本高收益的轻动画方案。

3. 资源结构

按以下部件模型预留：

body
head
earL
earR
tail
eyeL open/close
eyeR open/close
expressions optional

并使用 meta.json 描述各部件位置和 pivot。

4. 组件改造

新增一个支持分层渲染的角色组件，例如：

src/modules/pet/components/PetLayeredCharacter.vue

要求：

能按 meta.json 加载部件
能接收当前状态
能接收鼠标方向数据
能根据状态驱动不同局部动画
5. 动画要求

至少接入以下效果：

idle
body 呼吸
head 微摆
tail 慢摆
ear 随机轻抖
随机眨眼
wait
在 idle 基础上增加 look-at
head 小角度朝鼠标方向转动
瞳孔小范围跟随
react
点击后压缩回弹
tail 快速甩动
动作结束后恢复原状态
follow
当前可先不做真实逐帧跑步
先实现整体前倾 + 上下弹跳 + tail 快摆
若后续补 run pose 图，再扩展
6. 代码结构

新增 composables：

usePetRig
usePetBlink
usePetLookAt
usePetIdleMotion
usePetReactMotion

要求逻辑清晰，不要全部堆在组件内。

7. 配置规范

所有部件位置、pivot、眼球偏移范围、默认缩放，都从配置读取。
不要硬编码写死在组件里。

8. 交付输出

完成后请输出：

新增/修改文件清单
每个 composable 的职责说明
当前支持的动画能力
尚未完成但建议下一步补充的内容
十、资源制作建议

你现在最需要的不是更多随机图，而是这 3 类资源：

第一类：拆层版当前站姿

这是最优先的。

第二类：睡觉姿态单图

用于 sleep。

第三类：2~4 张简化跑步姿态

用于 follow 升级。

十一、你当前最现实的路线
当前马上做
用这张图拆层
接 idle / wait / react
follow 先做轻位移动画
下一步再做
睡觉图
跑步图
坐下图

这才是最快出效果的路线。