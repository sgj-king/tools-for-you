<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';

const canvasContainer = ref<HTMLDivElement>();
const particleCount = ref(5000);
const rotationSpeed = ref(0.1);
const colorScheme = ref<'galaxy' | 'ocean' | 'fire' | 'neon'>('galaxy');
const mouseInteraction = ref(true);
const showControls = ref(true);

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let particleSystem: THREE.Points;
let particleMaterial: THREE.ShaderMaterial;
let animationId: number;
let clock: THREE.Clock;
let mouse: THREE.Vector2;
let targetMouse: THREE.Vector2;

const colorSchemes = {
  galaxy: {
    colors: [0x667eea, 0x764ba2, 0xf093fb, 0x4facfe],
  },
  ocean: {
    colors: [0x00d2ff, 0x3a7bd5, 0x00c6ff, 0x0072ff],
  },
  fire: {
    colors: [0xff512f, 0xf5af19, 0xff6b6b, 0xffa500],
  },
  neon: {
    colors: [0x00ff87, 0x60efff, 0xf72585, 0x7209b7],
  },
};

function createParticles() {
  if (!canvasContainer.value) return;

  // 清除旧的粒子系统
  if (particleSystem) {
    scene.remove(particleSystem);
    particleSystem.geometry.dispose();
  }

  const particles = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount.value * 3);
  const colors = new Float32Array(particleCount.value * 3);
  const sizes = new Float32Array(particleCount.value);

  const scheme = colorSchemes[colorScheme.value];
  const colorObjs = scheme.colors.map(c => new THREE.Color(c));

  // 创建螺旋星系图案
  for (let i = 0; i < particleCount.value; i++) {
    const i3 = i * 3;

    // 螺旋星系模式
    const radius = Math.random() * 10;
    const theta = (radius * 0.5) % (Math.PI * 2);
    const spiralRadius = radius * (0.5 + Math.random() * 0.5);
    const spiralTheta = theta + Math.random() * 0.3;

    positions[i3] = Math.cos(spiralTheta) * spiralRadius;
    positions[i3 + 1] = (Math.random() - 0.5) * 2;
    positions[i3 + 2] = Math.sin(spiralTheta) * spiralRadius;

    // 基于位置的颜色渐变
    const distance = Math.sqrt(
      positions[i3] ** 2 +
      positions[i3 + 1] ** 2 +
      positions[i3 + 2] ** 2
    );
    const normalizedDistance = distance / 10;

    let color;
    if (normalizedDistance < 0.33) {
      color = colorObjs[0].clone().lerp(colorObjs[1], normalizedDistance * 3);
    } else if (normalizedDistance < 0.66) {
      color = colorObjs[1].clone().lerp(colorObjs[2], (normalizedDistance - 0.33) * 3);
    } else {
      color = colorObjs[2].clone().lerp(colorObjs[3], (normalizedDistance - 0.66) * 3);
    }

    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;

    sizes[i] = Math.random() * 3 + 1;
  }

  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  // 着色器材质
  particleMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      mouse: { value: new THREE.Vector2(0, 0) },
      mouseEnabled: { value: mouseInteraction.value ? 1.0 : 0.0 },
    },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      uniform float time;
      uniform vec2 mouse;
      uniform float mouseEnabled;
      
      void main() {
        vColor = color;
        
        vec3 pos = position;
        
        // 鼠标交互
        if (mouseEnabled > 0.5) {
          vec2 mouseEffect = mouse * 0.5;
          float mouseDist = distance(pos.xy, mouseEffect);
          float mouseStrength = 1.0 / (1.0 + mouseDist * 0.5);
          pos.xy += normalize(pos.xy - mouseEffect) * mouseStrength * 0.3;
        }
        
        // 波浪动画
        pos.y += sin(time + pos.x * 0.5) * 0.1;
        pos.x += cos(time + pos.z * 0.5) * 0.1;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      
      void main() {
        float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
        float alpha = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);
        
        // 发光效果
        vec3 glowColor = vColor * 2.0;
        gl_FragColor = vec4(glowColor, alpha * 0.8);
      }
    `,
    transparent: true,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  particleSystem = new THREE.Points(particles, particleMaterial);
  scene.add(particleSystem);
}

function init() {
  if (!canvasContainer.value) return;

  // 场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);

  // 相机
  camera = new THREE.PerspectiveCamera(
    75,
    canvasContainer.value.clientWidth / canvasContainer.value.clientHeight,
    0.1,
    1000
  );
  camera.position.z = 5;

  // 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(canvasContainer.value.clientWidth, canvasContainer.value.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  canvasContainer.value.appendChild(renderer.domElement);

  // 添加环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  // 点光源
  const light1 = new THREE.PointLight(0x667eea, 1, 100);
  light1.position.set(5, 5, 5);
  scene.add(light1);

  const light2 = new THREE.PointLight(0x764ba2, 1, 100);
  light2.position.set(-5, -5, -5);
  scene.add(light2);

  // 鼠标交互
  mouse = new THREE.Vector2();
  targetMouse = new THREE.Vector2();

  clock = new THREE.Clock();

  // 创建粒子
  createParticles();

  // 事件监听
  window.addEventListener('resize', onResize);
  renderer.domElement.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('touchmove', onTouchMove);

  // 开始动画
  animate();
}

function animate() {
  animationId = requestAnimationFrame(animate);

  const time = clock.getElapsedTime();

  // 平滑鼠标插值
  mouse.lerp(targetMouse, 0.05);

  // 更新着色器
  if (particleMaterial) {
    particleMaterial.uniforms.time.value = time;
    particleMaterial.uniforms.mouse.value = mouse;
    particleMaterial.uniforms.mouseEnabled.value = mouseInteraction.value ? 1.0 : 0.0;
  }

  // 旋转粒子系统
  if (particleSystem) {
    particleSystem.rotation.y = time * rotationSpeed.value;
    particleSystem.rotation.x = Math.sin(time * 0.05) * 0.1;
  }

  // 相机自动旋转
  camera.position.x = Math.sin(time * 0.2) * 0.5 + (mouseInteraction.value ? mouse.x * 0.1 : 0);
  camera.position.y = Math.cos(time * 0.15) * 0.5 + (mouseInteraction.value ? mouse.y * 0.1 : 0);
  camera.position.z = 5 + Math.sin(time * 0.1) * 0.5;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}

function onResize() {
  if (!canvasContainer.value) return;
  camera.aspect = canvasContainer.value.clientWidth / canvasContainer.value.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(canvasContainer.value.clientWidth, canvasContainer.value.clientHeight);
}

function onMouseMove(event: MouseEvent) {
  if (!mouseInteraction.value) return;
  targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  targetMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  targetMouse.x *= 5;
  targetMouse.y *= 5;
}

function onTouchMove(event: TouchEvent) {
  if (!mouseInteraction.value) return;
  event.preventDefault();
  const touch = event.touches[0];
  targetMouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
  targetMouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
  targetMouse.x *= 5;
  targetMouse.y *= 5;
}

function cleanup() {
  cancelAnimationFrame(animationId);
  window.removeEventListener('resize', onResize);
  if (renderer) {
    renderer.dispose();
    renderer.domElement.removeEventListener('mousemove', onMouseMove);
    renderer.domElement.removeEventListener('touchmove', onTouchMove);
  }
}

function resetScene() {
  createParticles();
}

onMounted(() => {
  init();
});

onUnmounted(() => {
  cleanup();
});
</script>

<template>
  <div class="particle-galaxy-container">
    <!-- Canvas 容器 -->
    <div ref="canvasContainer" class="canvas-wrapper"></div>

    <!-- 控制面板 -->
    <div v-if="showControls" class="control-panel">
      <div class="panel-header">
        <h3>🌌 粒子星系控制</h3>
        <button class="toggle-btn" @click="showControls = false">✕</button>
      </div>

      <div class="control-group">
        <label>粒子数量: {{ particleCount.toLocaleString() }}</label>
        <input
          type="range"
          v-model.number="particleCount"
          min="1000"
          max="20000"
          step="500"
          @change="resetScene"
        />
      </div>

      <div class="control-group">
        <label>旋转速度: {{ rotationSpeed.toFixed(2) }}</label>
        <input
          type="range"
          v-model.number="rotationSpeed"
          min="0.01"
          max="0.5"
          step="0.01"
        />
      </div>

      <div class="control-group">
        <label>配色方案</label>
        <div class="color-buttons">
          <button
            :class="{ active: colorScheme === 'galaxy' }"
            @click="colorScheme = 'galaxy'; resetScene()"
          >🌌 星系</button>
          <button
            :class="{ active: colorScheme === 'ocean' }"
            @click="colorScheme = 'ocean'; resetScene()"
          >🌊 海洋</button>
          <button
            :class="{ active: colorScheme === 'fire' }"
            @click="colorScheme = 'fire'; resetScene()"
          >🔥 火焰</button>
          <button
            :class="{ active: colorScheme === 'neon' }"
            @click="colorScheme = 'neon'; resetScene()"
          >💜 霓虹</button>
        </div>
      </div>

      <div class="control-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="mouseInteraction" />
          鼠标交互
        </label>
      </div>
    </div>

    <!-- 显示控制按钮（当面板隐藏时） -->
    <button
      v-if="!showControls"
      class="show-controls-btn"
      @click="showControls = true"
    >⚙️</button>

    <!-- 信息提示 -->
    <div class="info-overlay">
      <span>{{ particleCount.toLocaleString() }} particles</span>
      <span>移动鼠标与星系互动</span>
    </div>
  </div>
</template>

<style scoped>
.particle-galaxy-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #0a0a0a;
}

.canvas-wrapper {
  width: 100%;
  height: 100%;
}

.control-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(15, 15, 25, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  min-width: 280px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-header h3 {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.toggle-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.control-group {
  margin-bottom: 18px;
}

.control-group label {
  display: block;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  margin-bottom: 8px;
}

.control-group input[type="range"] {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
}

.control-group input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s;
}

.control-group input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.color-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.color-buttons button {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
}

.color-buttons button:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.color-buttons button.active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
  border-color: rgba(102, 126, 234, 0.5);
  color: #fff;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #667eea;
  cursor: pointer;
}

.show-controls-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(15, 15, 25, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}

.show-controls-btn:hover {
  background: rgba(102, 126, 234, 0.3);
  transform: scale(1.05);
}

.info-overlay {
  position: absolute;
  bottom: 20px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-overlay span {
  background: rgba(15, 15, 25, 0.8);
  backdrop-filter: blur(10px);
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

@media (max-width: 768px) {
  .control-panel {
    top: auto;
    bottom: 80px;
    right: 10px;
    left: 10px;
    min-width: auto;
  }

  .info-overlay {
    bottom: 20px;
    left: 10px;
  }
}
</style>
