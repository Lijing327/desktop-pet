《这张金渐层图集 → Electron桌宠可直接开发版》

适配你当前项目（Electron + Vue3）。目标：

今天就能把这只金渐层跑起来，具备待机动画、眨眼、摆尾巴、拖拽。

一、项目结构（直接照着放）
src/
 ├─ renderer/
 │   ├─ components/
 │   │   └─ PetCat.vue
 │   ├─ assets/
 │   │   └─ pet/
 │   │        ├─ atlas.png      // 你的图集
 │   │        └─ atlas.json     // 坐标配置
 │   └─ composables/
 │        └─ usePetMotion.ts
二、atlas.json（图集坐标配置）

坐标为示例值，你按实际图再微调即可。

{
  "body":      { "x": 40,  "y": 160, "w": 380, "h": 320 },
  "head":      { "x": 500, "y": 70,  "w": 190, "h": 190 },
  "tail":      { "x": 780, "y": 20,  "w": 190, "h": 260 },

  "ear_l":     { "x": 520, "y": 300, "w": 120, "h": 120 },
  "ear_r":     { "x": 780, "y": 300, "w": 120, "h": 120 },

  "eye_l":     { "x": 60,  "y": 610, "w": 100, "h": 70 },
  "eye_r":     { "x": 250, "y": 610, "w": 100, "h": 70 },

  "blink_l":   { "x": 60,  "y": 860, "w": 100, "h": 50 },
  "blink_r":   { "x": 250, "y": 860, "w": 100, "h": 50 },

  "leg_fl":    { "x": 560, "y": 560, "w": 110, "h": 130 },
  "leg_fr":    { "x": 790, "y": 560, "w": 110, "h": 130 },
  "leg_bl":    { "x": 560, "y": 740, "w": 130, "h": 140 },
  "leg_br":    { "x": 790, "y": 740, "w": 130, "h": 140 },

  "shadow":    { "x": 620, "y": 930, "w": 320, "h": 70 }
}
三、PetCat.vue（组件结构）
<template>
  <div class="pet-root">

    <!-- 阴影 -->
    <Part name="shadow" class="shadow" />

    <!-- 身体 -->
    <Part name="body" class="body" :style="bodyStyle" />

    <!-- 尾巴 -->
    <Part name="tail" class="tail" :style="tailStyle" />

    <!-- 后腿 -->
    <Part name="leg_bl" class="leg leg-bl" :style="legBackStyle" />
    <Part name="leg_br" class="leg leg-br" :style="legBackStyle2" />

    <!-- 前腿 -->
    <Part name="leg_fl" class="leg leg-fl" :style="legFrontStyle" />
    <Part name="leg_fr" class="leg leg-fr" :style="legFrontStyle2" />

    <!-- 头 -->
    <Part name="head" class="head" :style="headStyle" />

    <!-- 耳朵 -->
    <Part name="ear_l" class="ear ear-l" :style="earLStyle" />
    <Part name="ear_r" class="ear ear-r" :style="earRStyle" />

    <!-- 睁眼 / 闭眼 -->
    <template v-if="!isBlink">
      <Part name="eye_l" class="eye eye-l" />
      <Part name="eye_r" class="eye eye-r" />
    </template>

    <template v-else>
      <Part name="blink_l" class="eye eye-l" />
      <Part name="blink_r" class="eye eye-r" />
    </template>

  </div>
</template>
四、动画系统（核心）
const t = ref(0)

setInterval(() => {
  t.value += 0.1
}, 16)
呼吸动画
const bodyStyle = computed(() => ({
  transform: `translateY(${Math.sin(t.value)*2}px)`
}))
摇头动画
const headStyle = computed(() => ({
  transform: `
    translateY(${Math.sin(t.value*0.8)*2}px)
    rotate(${Math.sin(t.value*0.7)*3}deg)
  `,
  transformOrigin: '50% 80%'
}))
尾巴摆动（最关键）
const tailStyle = computed(() => ({
  transform: `rotate(${Math.sin(t.value*2)*15}deg)`,
  transformOrigin: '15% 85%'
}))
耳朵轻抖
const earLStyle = computed(() => ({
  transform:`rotate(${Math.sin(t.value*3)*4}deg)`
}))
走路腿摆动
const legFrontStyle = computed(() => ({
  transform:`rotate(${Math.sin(t.value*3)*10}deg)`
}))

const legFrontStyle2 = computed(() => ({
  transform:`rotate(${Math.sin(t.value*3+Math.PI)*10}deg)`
}))
五、眨眼系统（高级感来源）
const isBlink = ref(false)

setInterval(() => {
  isBlink.value = true
  setTimeout(() => isBlink.value = false, 150)
}, 5000 + Math.random()*4000)

随机 5~9 秒眨一次眼。

六、桌宠行为状态机（建议）
idle   待机
walk   走两步
look   看左看右
sleep  睡觉
happy  点击反馈
随机行为逻辑
每10秒随机切状态
70% idle
20% walk
10% look
七、Electron层（你已有项目直接接）
窗口建议
transparent: true
frame: false
alwaysOnTop: true
resizable: false
hasShadow: false
拖拽桌宠
.pet-root {
  -webkit-app-region: drag;
}

按钮区域单独：

.no-drag {
  -webkit-app-region: no-drag;
}
八、首版交付效果（今晚能出）

启动后：

金渐层桌宠会：
呼吸
摆尾巴
眨眼
耳朵抖动
原地走步
可拖拽移动
记忆位置

这已经是成品级展示效果。

九、第二阶段升级（下周做）
增加：
点击喵叫
跟随鼠标看向光标
吃鱼干
睡觉打呼
屏幕边缘巡逻
天气变化反应
十、Claude Code 执行清单（直接给它）
基于现有 Electron + Vue3 桌宠项目，新增金渐层宠物模块：

1. 新建 PetCat.vue
2. 支持 atlas.png + atlas.json 图集读取
3. 按图层渲染 body/head/tail/eyes/ears/legs/shadow
4. 实现 idle 动画（呼吸/摆尾/摇头）
5. 实现随机眨眼
6. 实现 walk 原地踏步
7. 支持窗口拖拽
8. 保持透明背景
9. 代码结构清晰，组合式 API
10. 注释使用中文