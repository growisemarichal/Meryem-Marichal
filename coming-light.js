/*
  Escena 3D de la sección "Próximamente": terreno con relieve real y
  rejilla sutil, colinas suaves en el horizonte, y un panel de luz con
  la esquina superior cortada en ángulo (como un monolito), en los
  tonos de la marca. Se monta sola si existe #comingLightScene; si el
  usuario prefiere menos movimiento, no se ejecuta.
*/
import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';

(function () {
  const container = document.getElementById('comingLightScene');
  if (!container) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const BLUSH_GLOW = 0xf0a0bc;
  const DEEP = 0x0c0c0c;

  let width = container.clientWidth;
  let height = container.clientHeight;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(DEEP, 0.05);

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
  camera.position.set(0, 2.1, 10);
  camera.lookAt(0, 2, -6);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // ---------- terreno con relieve real: colinas suaves y anchas ----------
  function ridgeHeight(x) {
    return Math.max(0, Math.sin(x * 0.17 + 1) * 0.7 + Math.sin(x * 0.05 + 3) * 1.1 + 0.9);
  }
  const groundGeo = new THREE.PlaneGeometry(80, 50, 100, 60);
  groundGeo.rotateX(-Math.PI / 2);
  const gp = groundGeo.attributes.position;
  for (let i = 0; i < gp.count; i++) {
    const x = gp.getX(i);
    const z = gp.getZ(i);
    const dist = Math.max(0, -z);
    const falloff = Math.min(dist / 10, 1);
    gp.setY(i, ridgeHeight(x) * falloff * 2.6);
  }
  groundGeo.computeVertexNormals();
  const ground = new THREE.Mesh(
    groundGeo,
    new THREE.MeshStandardMaterial({ color: 0x0a0810, roughness: 0.95, metalness: 0.05 })
  );
  scene.add(ground);

  // ---------- rejilla sutil sobre el suelo ----------
  function gridTexture() {
    const size = 512;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    ctx.strokeStyle = 'rgba(240,160,188,0.5)';
    ctx.lineWidth = 1.5;
    const step = size / 16;
    for (let i = 0; i <= 16; i++) {
      ctx.beginPath(); ctx.moveTo(i * step, 0); ctx.lineTo(i * step, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * step); ctx.lineTo(size, i * step); ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(14, 9);
    return tex;
  }
  const gridPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 50),
    new THREE.MeshBasicMaterial({ map: gridTexture(), transparent: true, opacity: 0.16, depthWrite: false, fog: true })
  );
  gridPlane.rotation.x = -Math.PI / 2;
  gridPlane.position.y = 0.02;
  scene.add(gridPlane);

  // ---------- luces ----------
  scene.add(new THREE.HemisphereLight(0x4a2c3a, 0x030208, 1.1));

  const rim = new THREE.DirectionalLight(0x6a4050, 0.6);
  rim.position.set(-6, 5, 4);
  scene.add(rim);

  const pointLight = new THREE.PointLight(BLUSH_GLOW, 18, 32, 2);
  pointLight.position.set(0, 2.6, -5.2);
  scene.add(pointLight);

  const fillLight = new THREE.PointLight(BLUSH_GLOW, 6, 16, 2);
  fillLight.position.set(0, 0.2, -3.8);
  scene.add(fillLight);

  // ---------- textura de resplandor ----------
  function glowTexture(inner, mid) {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, inner);
    grad.addColorStop(0.35, mid);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }
  const haloTexture = glowTexture('rgba(255,255,255,0.9)', 'rgba(224,112,149,0.5)');

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: haloTexture, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.7
  }));
  halo.scale.set(7, 7, 1);
  halo.position.set(0, 2.4, -5.3);
  scene.add(halo);

  const groundGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: haloTexture, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.65
  }));
  groundGlow.scale.set(9, 2.4, 1);
  groundGlow.position.set(0, 0.1, -4.9);
  scene.add(groundGlow);

  // ---------- monolito: panel plano con la esquina superior cortada ----------
  const w = 1.0;
  const h = 4.6;
  const bevel = 0.55;
  const panelShape = new THREE.Shape();
  panelShape.moveTo(-w / 2, 0);
  panelShape.lineTo(-w / 2, h - bevel);
  panelShape.lineTo(-w / 2 + bevel, h);
  panelShape.lineTo(w / 2, h);
  panelShape.lineTo(w / 2, 0);
  panelShape.closePath();
  const panelGeo = new THREE.ExtrudeGeometry(panelShape, { depth: 0.16, bevelEnabled: false });
  panelGeo.translate(0, 0, -0.08);

  const panel = new THREE.Mesh(
    panelGeo,
    new THREE.MeshStandardMaterial({
      color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.6,
      roughness: 0.3, metalness: 0, fog: false
    })
  );
  panel.position.set(0, 0, -5.3);
  scene.add(panel);

  // ---------- animación ----------
  // Se renderiza siempre, sin pausarla al salir de pantalla: intentarlo
  // causaba que la escena se quedara en blanco en casos reales (la sección
  // se pausaba antes de que el usuario llegara a verla y no se despertaba
  // bien). Es una escena pequeña, el coste de dejarla siempre activa es mínimo.
  let t = 0;
  function animate() {
    t += 0.02;
    const breathe = 1 + Math.sin(t * 1.3) * 0.15;
    panel.scale.set(breathe, breathe, 1);
    halo.scale.set(7 * breathe, 7 * breathe, 1);
    pointLight.intensity = 16 + Math.sin(t * 1.3) * 8;
    camera.position.x = Math.sin(t * 0.35) * 1.4;
    camera.lookAt(0, 2, -6);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  window.addEventListener('resize', () => {
    width = container.clientWidth;
    height = container.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    // setSize limpia el lienzo; si la animación está en pausa (fuera de
    // pantalla) hace falta repintar ya o se quedaría en blanco.
    renderer.render(scene, camera);
  });
})();
