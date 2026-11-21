// 데모 3 첫 화면 3D 책상 장면 (Three.js)
// 빌드: npx esbuild demo3/src/hero3d.src.js --bundle --minify --format=iife --outfile=demo3/assets/hero3d.js
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const host = document.querySelector('[data-scene]');
const params = new URLSearchParams(location.search);
const POSTER = params.get('poster'); // 'd' | 'm' : 대체 이미지 촬영용
const MOBILE = !POSTER && (matchMedia('(pointer: coarse)').matches || innerWidth <= 760);
const rand = mulberry(7);
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R = (a, b) => a + (b - a) * rand();

const FONT = '"Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
start();

async function start() {
  try { await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1200))]); } catch (e) {}

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!POSTER });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, POSTER ? 1 : MOBILE ? 1.25 : 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0a09);
  scene.fog = new THREE.Fog(0x0b0a09, 1.9, 3.3);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.12;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 10);
  const camBase = new THREE.Vector3(0.1, 0.74, 1.72);
  const lookBase = new THREE.Vector3(0.1, 0.03, -0.12);

  // ---------- 재질 ----------
  const woodTex = makeWood(1024, '#6a4528', '#24150c', 26);
  woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping; woodTex.repeat.set(1.4, 1);
  const deskMat = new THREE.MeshPhysicalMaterial({ map: woodTex, roughness: 0.48, clearcoat: 0.35, clearcoatRoughness: 0.35 });
  const shelfWood = makeWood(512, '#2b1a10', '#160d07', 14);
  const shelfMat = new THREE.MeshStandardMaterial({ map: shelfWood, roughness: 0.7 });
  const paperMat = new THREE.MeshStandardMaterial({ color: 0xd6cfc0, roughness: 0.92 });
  const blackMetal = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.38, metalness: 0.75 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xc9a25a, roughness: 0.22, metalness: 1 });
  const interactive = [];

  // ---------- 벽과 책상 ----------
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), new THREE.MeshStandardMaterial({ color: 0x2a2520, roughness: 0.95 }));
  wall.position.set(0, 0.6, -1.05); wall.receiveShadow = true; scene.add(wall);

  const desk = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.05, 1.5), deskMat);
  desk.position.set(0, -0.025, -0.05); desk.receiveShadow = true; scene.add(desk);

  // ---------- 책장 ----------
  buildShelf();

  // ---------- 서류 뭉치 ----------
  const TITLES = ['행정심판 청구서', '집행정지 신청서', '법인 설립허가 신청서', '사업자 등록 신청서', '영업 신고서', '고용추천서 신청서'];
  let docN = 0;
  const main = paperStack(0.20, -0.02, 34, -0.07, newDoc(true));   // 빨간 펜 표시가 있는 서류
  paperStack(0.03, -0.42, 52, 0.12, newDoc(false));                 // 스탠드 아래 뒤쪽
  const done = paperStack(0.52, -0.36, 14, -0.22, newDoc(false, true)); // '완료' 함
  buildTray(done);
  const sealImg = makeSealTexture().image;

  // ---------- 서류철 ----------
  const folder = buildFolder(-0.08, 0.2, 0.22);
  interactive.push(folder);

  // ---------- 펜 ----------
  const pen = buildPen();
  pen.position.set(0.43, 0.0056, 0.1); pen.rotation.y = 1.15;
  interactive.push(pen);
  const pen2 = buildPencil();
  pen2.position.set(0.31, 0.004, 0.26); pen2.rotation.y = 0.35;
  interactive.push(pen2);
  const hitMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  const hitBox = (o, w, h, d, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hitMat); m.position.y = y || 0; o.add(m); };
  hitBox(pen, 0.17, 0.035, 0.04); hitBox(pen2, 0.16, 0.035, 0.04);

  // ---------- 도장과 인주 ----------
  const stamp = buildStamp();
  stamp.position.set(0.47, 0, 0.3); hitBox(stamp, 0.05, 0.09, 0.05, 0.04);
  interactive.push(stamp);
  const pad = buildPad(); pad.position.set(0.57, 0, 0.23); scene.add(pad);

  // ---------- 머그 ----------
  const mug = buildMug(); mug.position.set(0.6, 0, -0.14); interactive.push(mug);

  // ---------- 스탠드 ----------
  const lamp = buildLamp();
  interactive.push(lamp.group);

  // ---------- 보조 조명 (창가의 푸른 빛) ----------
  const moon = new THREE.DirectionalLight(0x8fa6c8, 0.22);
  moon.position.set(-1.6, 1.4, 1.2); scene.add(moon);
  const rim = new THREE.PointLight(0xffb070, 0.25, 0, 2); rim.position.set(0.9, 0.5, -0.6); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0x46505e, 0x2a1a10, 0.3));

  // ---------- 빛 속 먼지 ----------
  const dust = buildDust();

  // ---------- 후처리 ----------
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: MOBILE ? 2 : 4 }));
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.45, 0.6, 0.97);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const finish = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime; uniform vec2 uRes; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      void main(){
        vec2 d = vUv - .5; float r = dot(d,d);
        vec2 off = d * r * .006;
        vec3 c = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
        c *= smoothstep(.85, .18, r * 1.35);
        c = mix(c, c * vec3(1.04, 1., .93), .5);
        c += (h(vUv * uRes + fract(uTime) * 91.) - .5) * .045;
        gl_FragColor = vec4(c, 1.);
      }`
  });
  composer.addPass(finish);

  // ---------- 크기 ----------
  let W = 1, H = 1;
  function resize() {
    W = host.clientWidth; H = host.clientHeight;
    renderer.setSize(W, H, false);
    composer.setSize(W, H);
    bloom.setSize(W, H);
    finish.uniforms.uRes.value.set(W, H);
    camera.aspect = W / H;
    // 넓은 화면에서는 장면을 오른쪽으로 밀어 글자 자리를 비움
    const shift = W > 900 && POSTER !== 'm' ? -W * 0.18 : 0;
    camera.fov = W / H < 1 ? 40 : 31;
    if (shift) camera.setViewOffset(W, H, shift, 0, W, H); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(host);

  // ---------- 마우스 ----------
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  const ndc = new THREE.Vector2(9, 9);
  let lastMove = -9, down = null;
  const now = () => performance.now() / 1000;
  const clamp = v => Math.max(-1, Math.min(1, v));
  const setNdc = e => { const r = host.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
  // 마우스: 화면 어디서든 시점이 마우스를 따라감
  window.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    if (down && (down.lamp || down.pen)) return; // 스탠드·만년필을 끄는 동안 시점 고정
    mouse.x = e.clientX / window.innerWidth * 2 - 1; mouse.y = e.clientY / window.innerHeight * 2 - 1;
    setNdc(e); lastMove = now();
  }, { passive: true });
  // 손가락: 끄는 방향으로 장면이 따라옴, 짧게 누르면 물건 작동
  host.addEventListener('pointerdown', e => {
    setNdc(e);
    const o = pick();
    down = { x: e.clientX, y: e.clientY, t: now(), mx: mouse.x, my: mouse.y, moved: 0, lamp: o === lamp.group, pen: o === pen, tilt: lampTilt };
    if (down.lamp || down.pen) { try { host.setPointerCapture(e.pointerId); } catch (er) {} }
    if (down.pen && !penGrab()) down.pen = false;
    lastMove = now();
  });
  host.addEventListener('pointermove', e => {
    if (down && down.pen) { setNdc(e); down.moved = Math.max(down.moved, Math.hypot(e.clientX - down.x, e.clientY - down.y)); penDrag(); return; }
    if (!down || !down.lamp) return;
    const dy = e.clientY - down.y; down.moved = Math.max(down.moved, Math.abs(dy), Math.abs(e.clientX - down.x));
    lampTilt = Math.max(-0.15, Math.min(0.15, down.tilt + dy / 160 * 0.15)); // 약 ±8도
  });
  host.addEventListener('touchmove', e => { if (down && (down.lamp || down.pen) && e.cancelable) e.preventDefault(); }, { passive: false });
  host.addEventListener('touchmove', e => {
    if (!down || down.lamp || down.pen) return; const t = e.touches[0], r = host.getBoundingClientRect();
    const dx = t.clientX - down.x, dy = t.clientY - down.y; down.moved = Math.max(down.moved, Math.hypot(dx, dy));
    mouse.x = clamp(down.mx - dx / r.width * 2.4); mouse.y = clamp(down.my - dy / r.height * 1.2); lastMove = now();
  }, { passive: true });
  host.addEventListener('pointerup', e => {
    if (!down) return; const d = down; down = null;
    if (d.pen) { penRelease(); return; }
    if (Math.max(d.moved, Math.hypot(e.clientX - d.x, e.clientY - d.y)) > 12 || (!d.lamp && now() - d.t > 0.6)) return;
    setNdc(e); const o = pick(); if (o && o.userData.onClick && (!d.lamp || o === lamp.group)) o.userData.onClick();
  });
  host.addEventListener('pointercancel', () => { if (down && down.pen) penRelease(); down = null; });
  if (MOBILE) { const hint = document.querySelector('.scene-hint'); if (hint) hint.textContent = '손가락으로 밀어 보고, 도장과 스탠드를 눌러 보세요'; }
  host.addEventListener('pointerleave', () => ndc.set(9, 9));
  const ray = new THREE.Raycaster();
  let hovered = null;

  function pick() {
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(interactive, true);
    if (!hits.length) return null;
    let o = hits[0].object; while (o && !o.userData.label) o = o.parent;
    return o;
  }


  // ---------- 서류 캔버스: 원본 + 서명 + 도장 ----------
  function redraw(doc) {
    const x = doc.ctx, w = 724;
    x.drawImage(doc.base, 0, 0);
    if (doc.sign > 0) {
      x.save(); x.globalAlpha = doc.signFade ?? 1; x.beginPath(); x.rect(440, 940, 260 * doc.sign, 90); x.clip();
      x.fillStyle = '#18233a'; x.font = `64px "Nanum Pen Script", ${FONT}`; x.fillText('백 현', 480, 1004);
      x.lineWidth = 3; x.strokeStyle = '#18233a'; x.beginPath(); x.moveTo(470, 1010); x.bezierCurveTo(540, 1000, 600, 1022, 680, 996); x.stroke();
      x.restore();
    }
    if (doc.sealed) { x.save(); x.translate(552, 770); x.rotate(0.18); x.globalAlpha = 0.92; x.drawImage(sealImg, -104, -104, 208, 208); x.restore(); }
    doc.tex.needsUpdate = true;
  }
  function newDoc(marks, sealed) {
    const tex = makeDocTexture(TITLES[docN++ % TITLES.length], marks);
    const cv = tex.image, base = document.createElement('canvas'); base.width = cv.width; base.height = cv.height; base.getContext('2d').drawImage(cv, 0, 0);
    const doc = { tex, ctx: cv.getContext('2d'), base, sign: 0, sealed: false };
    if (sealed) { doc.sealed = true; doc.sign = 1; Promise.resolve().then(() => redraw(doc)); }
    return doc;
  }
  const SEAL_AT = new THREE.Vector3((552 / 724 - 0.5) * 0.21, (0.5 - 770 / 1024) * 0.297, 0);
  const toWorld = (sheet, v2) => sheet.localToWorld(v2.clone());

  // ---------- 도장 ----------
  let stampT = -1, busy = false;
  stamp.userData.onClick = () => { if (stampT < 0 && !busy && !main.top.userData.doc.sealed) { stampT = 0; busy = true; } };
  const stampHome = stamp.position.clone();
  function updateStamp(dt) {
    if (stampT < 0) return;
    stampT += dt;
    const sw = toWorld(main.top, SEAL_AT);
    const t = stampT;
    const to = new THREE.Vector3(sw.x, sw.y + 0.0005, sw.z);
    let p = stampHome.clone(), lift = 0;
    if (t >= 0.6 && !main.top.userData.doc.sealed) { main.top.userData.doc.sealed = true; redraw(main.top.userData.doc); }
    if (t < 0.45) { const k = ease(t / 0.45); p.lerpVectors(stampHome, to, k); lift = Math.sin(k * Math.PI) * 0.12 + k * 0.03; }
    else if (t < 0.6) { p.copy(to); lift = 0.03 * (1 - ease((t - 0.45) / 0.15)); }
    else if (t < 0.8) { p.copy(to); lift = 0; }
    else if (t < 1.35) { const k = ease((t - 0.8) / 0.55); p.lerpVectors(to, stampHome, k); lift = Math.sin(k * Math.PI) * 0.1; }
    else { stampT = -1; p.copy(stampHome); setTimeout(() => sendToDone(), 350); }
    stamp.position.set(p.x, p.y + lift, p.z);
  }

  // ---------- 완료 함으로 날아가는 서류 ----------
  // 다섯 가지 공기 흐름: 종이가 휘는 정도(bend: 길이 방향, bendW: 폭 방향), 비틀림, 물결, 경로
  const FLIGHTS = [
    { dur: 1.9, arc: 0.11, side: 0.00, bend: 0.010, bendW: 0.002, twist: 0.000, wave: 0.0018, freq: 1.2, pitch: 0.10, roll: 0.03, yaw: 0.25 },
    { dur: 2.1, arc: 0.09, side: 0.03, bend: 0.006, bendW: 0.004, twist: 0.004, wave: 0.0025, freq: 1.6, pitch: 0.16, roll: 0.06, yaw: -0.2 },
    { dur: 2.0, arc: 0.13, side: -0.03, bend: 0.008, bendW: 0.000, twist: -0.005, wave: 0.0015, freq: 1.0, pitch: 0.06, roll: -0.08, yaw: 0.35 },
    { dur: 2.3, arc: 0.12, side: 0.02, bend: 0.012, bendW: 0.003, twist: 0.002, wave: 0.0030, freq: 2.0, pitch: 0.12, roll: 0.04, yaw: -0.3 },
    { dur: 2.0, arc: 0.10, side: -0.015, bend: 0.005, bendW: 0.005, twist: -0.003, wave: 0.0020, freq: 1.4, pitch: 0.09, roll: -0.05, yaw: 0.15 },
  ];
  let fly = null;
  function sendToDone() {
    const sheet = main.top, F = FLIGHTS[(rand() * FLIGHTS.length) | 0];
    const q0 = sheet.getWorldQuaternion(new THREE.Quaternion()), p0 = sheet.getWorldPosition(new THREE.Vector3());
    scene.attach(sheet);
    // 다음 서류를 뭉치 위로
    if (main.n > 12) { main.n--; main.inst.count = main.n; main.height = main.t * main.n; }
    main.top = makeSheet(sheet.geometry, newDoc(rand() < 0.5));
    main.top.geometry.attributes.position.array.set(main.top.geometry.userData.rest = Float32Array.from(sheet.geometry.userData.rest));
    main.top.position.y = main.height + 0.0009; main.group.add(main.top);
    // 도착 자리
    const local = new THREE.Object3D(); local.position.set(R(-0.004, 0.004), done.height + 0.0009, R(-0.004, 0.004)); local.rotation.set(-Math.PI / 2, 0, R(-0.05, 0.05));
    done.group.add(local); done.group.updateMatrixWorld(true);
    const p1 = local.getWorldPosition(new THREE.Vector3()), q1 = local.getWorldQuaternion(new THREE.Quaternion());
    fly = { sheet, F, t: 0, p0, p1, q0, q1, local, phase: rand() * 6.28, sway: R(0.6, 1.0) };
  }
  const flyQ = new THREE.Quaternion(), flyE = new THREE.Euler(), flyP = new THREE.Vector3(), flyC = new THREE.Vector3();
  function updateFly(dt, time) {
    if (!fly) return;
    const f = fly, F = f.F; f.t += dt;
    const s = Math.min(1, f.t / F.dur);
    const k = s < 0.5 ? 2 * s * s : 1 - Math.pow(-2 * s + 2, 2) / 2; // 부드럽게 출발, 부드럽게 내려앉음
    const env = Math.sin(Math.PI * s); // 공중에서만 휘어짐
    // 경로: 위로 둥글게, 옆으로 약간 흘러감 (내려올 때 살짝 늦게)
    flyC.lerpVectors(f.p0, f.p1, 0.5); flyC.y = Math.max(f.p0.y, f.p1.y) + F.arc * 2;
    const dir = new THREE.Vector3().subVectors(f.p1, f.p0); const perp = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
    flyC.addScaledVector(perp, F.side * 2);
    const a = 1 - k;
    flyP.set(a * a * f.p0.x + 2 * a * k * flyC.x + k * k * f.p1.x, a * a * f.p0.y + 2 * a * k * flyC.y + k * k * f.p1.y, a * a * f.p0.z + 2 * a * k * flyC.z + k * k * f.p1.z);
    flyP.y += Math.sin(s * Math.PI * 3 + f.phase) * 0.004 * env * f.sway; // 공기 위에서 살짝 뜨고 가라앉음
    f.sheet.position.copy(flyP);
    // 자세: 처음→끝 자세 사이를 돌며, 공중에서만 약간 기울고 돎
    f.sheet.quaternion.slerpQuaternions(f.q0, f.q1, k);
    flyE.set(F.pitch * env * Math.sin(s * Math.PI * 1.5 + f.phase) * f.sway, F.roll * env * Math.sin(s * Math.PI * 2 + f.phase * 0.7), F.yaw * env);
    f.sheet.quaternion.multiply(flyQ.setFromEuler(flyE));
    // 격자 변형: 종이 평면의 각 점을 밀어 올리거나 내림
    const pos = f.sheet.geometry.attributes.position, rest = f.sheet.geometry.userData.rest;
    const tt = time * F.freq * 2.4;
    for (let i = 0; i < pos.count; i++) {
      const X = rest[i * 3] / 0.105, Y = rest[i * 3 + 1] / 0.1485;
      const lead = (Y + 1) * 0.5;
      const z = F.bend * Y * Y + F.bendW * X * X + F.twist * X * Y
        + F.wave * Math.sin(Y * 2.6 - tt + f.phase) * lead + F.wave * 0.4 * Math.sin(X * 2.2 - tt * 0.8) * lead;
      pos.array[i * 3 + 2] = rest[i * 3 + 2] * (1 - env) + z * env * f.sway;
    }
    pos.needsUpdate = true;
    if (s >= 1) {
      f.sheet.geometry.attributes.position.array.set(rest); f.sheet.geometry.attributes.position.needsUpdate = true;
      f.sheet.geometry.computeVertexNormals();
      f.local.add(f.sheet); f.sheet.position.set(0, 0, 0); f.sheet.quaternion.identity();
      done.height += done.t; fly = null; busy = false;
    } else if ((f.t * 60 | 0) % 3 === 0) f.sheet.geometry.computeVertexNormals();
  }

  // ---------- 만년필: 서류로 가서 서명 ----------
  let penT = -1;
  const penHome = { p: pen.position.clone(), q: pen.quaternion.clone() };
  const NIB = new THREE.Vector3(0.066, 0, 0);
  const SIGN = [[470, 1000], [690, 998]]; // 캔버스 좌표
  const canvasToLocal = (cx, cy) => new THREE.Vector3((cx / 724 - 0.5) * 0.21, (0.5 - cy / 1024) * 0.297, 0.0012);
  let penStart = null, penFloat = null;
  const floatPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.07), floatHit = new THREE.Vector3();
  function penGrab() { if (penT >= 0 || busy) return false; busy = true; pen.userData.anim = true; penFloat = { p: pen.position.clone(), aim: pen.position.clone(), t: 0 }; return true; }
  function penDrag() { if (!penFloat) return; ray.setFromCamera(ndc, camera); if (ray.ray.intersectPlane(floatPlane, floatHit)) { floatHit.x = Math.max(-0.3, Math.min(0.75, floatHit.x)); floatHit.z = Math.max(-0.35, Math.min(0.4, floatHit.z)); penFloat.aim.copy(floatHit); } }
  function penRelease() {
    if (!penFloat) { if (!penGrab()) return; }
    penFloat = null; penStart = { p: pen.position.clone(), q: pen.quaternion.clone() }; penT = 0;
    const doc = main.top.userData.doc; doc.sign = 0; doc.signedAt = 0; doc.signFade = 1;
  }
  pen.userData.onClick = () => penRelease();
  function updatePenFloat(dt, time) {
    if (!penFloat) return;
    penFloat.t += dt;
    const lift = Math.min(1, penFloat.t / 0.6), e = 1 - Math.pow(1 - lift, 3);
    const target = penFloat.aim.clone(); target.y = penHome.p.y + (0.07 - penHome.p.y) * e + Math.sin(time * 1.6) * 0.004 * e;
    pen.position.lerp(target, Math.min(1, dt * 4));
    const qF = penHome.q.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.sin(time * 1.1) * 0.05 * e, 0, (-0.25 + Math.sin(time * 0.9) * 0.04) * e)));
    pen.quaternion.slerp(qF, Math.min(1, dt * 4));
  }
  const signed = new Set();
  function updatePen(dt, time) {
    if (penT < 0) return;
    penT += dt;
    const doc = main.top.userData.doc, t = penT;
    const yaw = main.group.rotation.y + 0.5;
    const qW = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, -0.75, 'YZX'));
    const nibAt = (k) => {
      const cx = SIGN[0][0] + (SIGN[1][0] - SIGN[0][0]) * k, cy = SIGN[0][1] + Math.sin(k * 26) * 14 * (1 - k * 0.3) - 10 * Math.sin(k * 7);
      return main.top.localToWorld(canvasToLocal(cx, cy));
    };
    let pos, q;
    const placeFor = (nibW, qq, up) => nibW.clone().sub(NIB.clone().applyQuaternion(qq)).add(new THREE.Vector3(0, up, 0));
    if (t < 0.7) { const k = ease(t / 0.7); q = penStart.q.clone().slerp(qW, k); pos = penStart.p.clone().lerp(placeFor(nibAt(0), qW, 0), k); pos.y += Math.sin(k * Math.PI) * 0.02; }
    else if (t < 2.1) { const k = (t - 0.7) / 1.4; q = qW; pos = placeFor(nibAt(k), qW, Math.max(0, Math.sin(k * 52)) * 0.0015); doc.sign = k; if ((t * 60 | 0) % 2 === 0) redraw(doc); }
    else if (t < 2.9) { if (doc.sign < 1) { doc.sign = 1; doc.signedAt = time; signed.add(doc); redraw(doc); } const k = ease((t - 2.1) / 0.8); q = qW.clone().slerp(penHome.q, k); pos = placeFor(nibAt(1), qW, 0).lerp(penHome.p, k); pos.y += Math.sin(k * Math.PI) * 0.06; }
    else { penT = -1; busy = false; pen.userData.anim = false; pos = penHome.p.clone(); q = penHome.q.clone(); }
    pen.position.copy(pos); pen.quaternion.copy(q);
  }

  // ---------- 빨간 펜: 굴러가기 ----------
  pen2.rotation.order = 'YXZ';
  const pencil = { home: pen2.position.clone(), s: 0, from: 0, to: 0, t: -1, yaw: pen2.rotation.y };
  const pencilPerp = new THREE.Vector3(Math.sin(pencil.yaw), 0, Math.cos(pencil.yaw));
  pen2.userData.onClick = () => {
    const faces = 7 + ((rand() * 6) | 0), d = faces * 0.004;
    let dir = rand() < 0.5 ? -1 : 1; if (Math.abs(pencil.s + dir * d) > 0.07) dir = -dir;
    pencil.from = pencil.s; pencil.to = pencil.s + dir * d; pencil.t = 0;
  };
  function updatePencil(dt) {
    if (pencil.t < 0) return;
    pencil.t += dt; const k = Math.min(1, pencil.t / 1.1);
    const e = 1 - Math.pow(1 - k, 3); // 마찰로 서서히 멈춤
    pencil.s = pencil.from + (pencil.to - pencil.from) * e;
    pen2.position.x = pencil.home.x + pencilPerp.x * pencil.s; pen2.position.z = pencil.home.z + pencilPerp.z * pencil.s;
    pen2.rotation.x = pencil.s / 0.004 * (Math.PI / 3);
    if (k >= 1) pencil.t = -1;
  }

  // ---------- 스탠드: 누르면 끄고 켜기, 위아래로 끌면 각도 조절 ----------
  const lampQ0 = lamp.head.quaternion.clone(), lampAxis = new THREE.Vector3(1, 0, 0);
  let lampTilt = 0, lampTiltS = 0;
  lamp.group.userData.onClick = () => { lamp.on = !lamp.on; document.documentElement.dataset.lamp = lamp.on ? 'on' : 'off'; };
  folder.userData.onClick = () => { folder.userData.open = !folder.userData.open; };
  mug.userData.onClick = () => { mug.userData.spin = 1; };

  // ---------- 화면에 보일 때만 그리기 ----------
  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(host);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clock = new THREE.Clock();
  let lampLevel = 1, first = true, autoStamp = POSTER ? -1 : 1.6;
  if (POSTER) { main.top.userData.doc.sealed = true; redraw(main.top.userData.doc); }
  const tmp = new THREE.Vector3();

  function frame() {
    requestAnimationFrame(frame);
    if ((!visible || document.hidden) && !first) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;

    if (autoStamp > 0) { autoStamp -= dt; if (autoStamp <= 0) stamp.userData.onClick(); }

    // 시점
    const k = 1; // 사용자가 직접 움직이는 시점이라 동작 줄이기 설정과 무관하게 따라감
    // 휴대폰: 손대지 않으면 천천히 시점이 흔들림
    if (MOBILE && !reduce && !down && now() - lastMove > 4) { mouse.x = Math.sin(time * 0.35) * 0.6; mouse.y = Math.sin(time * 0.22) * 0.25; }
    mouse.sx += (mouse.x * k - mouse.sx) * Math.min(1, dt * 3);
    mouse.sy += (mouse.y * k - mouse.sy) * Math.min(1, dt * 3);
    const sc = Math.min(1, Math.max(0, -host.getBoundingClientRect().top / H));
    camera.position.set(camBase.x + mouse.sx * 0.3, camBase.y - mouse.sy * 0.12 - sc * 0.08, camBase.z - sc * 0.18 + Math.abs(mouse.sx) * 0.02);
    tmp.set(lookBase.x + mouse.sx * 0.05, lookBase.y - mouse.sy * 0.02, lookBase.z);
    camera.lookAt(tmp);

    // 마우스 올림
    const h = ndc.x < 2 ? pick() : null;
    if (h !== hovered) {
      hovered = h;
      host.style.cursor = h ? 'pointer' : '';
    }
    for (const o of interactive) {
      const base = o.userData.baseY ?? (o.userData.baseY = o.position.y);
      o.userData.lift = (o.userData.lift || 0) + (((o === hovered && o !== lamp.group) ? 1 : 0) - (o.userData.lift || 0)) * Math.min(1, dt * 10);
      if ((o === stamp && stampT >= 0) || o.userData.anim) continue;
      o.position.y = base + o.userData.lift * 0.012;
      if (o.userData.spin) {
        o.userData.spin = Math.max(0, o.userData.spin - dt * 1.4);
        o.rotation.y += ease(o.userData.spin) * dt * 5;
      }
    }
    // 서류철: 표지가 경첩을 축으로 넘어가 책상 왼쪽에 눕기
    const fu = folder.userData; fu.k = Math.max(0, Math.min(1, (fu.k || 0) + (fu.open ? dt : -dt) / 0.9));
    const fk = fu.k < 0.5 ? 4 * fu.k ** 3 : 1 - Math.pow(-2 * fu.k + 2, 3) / 2;
    fu.cover.rotation.z = 0.012 + fk * (Math.PI - 0.07);
    fu.coverMesh.position.y = Math.sin(fk * Math.PI) * 0.0015; // 넘길 때 살짝 휘는 느낌

    updateStamp(dt); updateFly(dt, time); updatePen(dt, time); updatePenFloat(dt, time);
    for (const d of signed) { const age = time - d.signedAt; if (age > 15) { d.signFade = Math.max(0, 1 - (age - 15) / 2.5); if ((time * 60 | 0) % 3 === 0 || d.signFade === 0) redraw(d); if (d.signFade === 0) { d.sign = 0; signed.delete(d); redraw(d); } } } updatePencil(dt);
    lampTiltS += (lampTilt - lampTiltS) * Math.min(1, dt * 12);
    lamp.head.quaternion.copy(lampQ0).multiply(flyQ.setFromAxisAngle(lampAxis, lampTiltS));
    lamp.head.getWorldPosition(dust.material.uniforms.uLp.value); lamp.head.getWorldDirection(dust.material.uniforms.uLd.value);

    // 스탠드 빛의 미세한 떨림
    lampLevel += ((lamp.on ? 1 : 0) - lampLevel) * Math.min(1, dt * (lamp.on ? 6 : 10));
    const flick = 1 + (Math.sin(time * 23.0) * Math.sin(time * 7.3) * 0.012) + (Math.sin(time * 1.3) * 0.01);
    const L = lampLevel * flick;
    lamp.spot.intensity = 2.0 * L;
    lamp.fill.intensity = 0.16 * L;
    lamp.bulb.material.emissiveIntensity = 3.5 * L;
    lamp.inner.material.emissiveIntensity = 0.35 * L;
    lamp.cone.material.uniforms.uLevel.value = L;
    dust.material.uniforms.uTime.value = time;
    dust.material.uniforms.uLevel.value = L;
    finish.uniforms.uTime.value = time;

    composer.render();
    if (first) { first = false; host.classList.add('ready'); document.documentElement.dataset.sceneReady = '1'; }
  }
  frame();
  if (params.has('debug')) window.__h = { camera, pen, pen2, stamp, lamp, main, done, folder, host, THREE, get fly() { return fly; } };

  // ======================================================
  // 모델들
  // ======================================================
  function makeSheet(baseGeo, doc) {
    const geo = baseGeo.clone();
    geo.userData.rest = Float32Array.from(geo.attributes.position.array);
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: doc.tex, roughness: 0.88, side: THREE.DoubleSide, color: 0xd9d2c4, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
    m.rotation.set(-Math.PI / 2, 0, R(-0.03, 0.03));
    m.castShadow = m.receiveShadow = true;
    m.userData.doc = doc;
    return m;
  }
  function paperStack(x, z, n, rot, doc) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g);
    const t = 0.0017;
    const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.21, t, 0.297), paperMat, n + 40);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
    for (let i = 0; i < n + 40; i++) {
      e.set(0, R(-0.035, 0.035), 0); q.setFromEuler(e);
      m.compose(new THREE.Vector3(R(-0.004, 0.004), t * (i + 0.5), R(-0.004, 0.004)), q, new THREE.Vector3(1, 1, 1));
      inst.setMatrixAt(i, m);
      const tone = R(0.72, 0.84); c.setRGB(tone, tone * R(0.96, 0.99), tone * R(0.88, 0.94)); inst.setColorAt(i, c);
    }
    inst.count = n; inst.castShadow = inst.receiveShadow = true; g.add(inst);
    // 맨 위 한 장 (살짝 휘어진 종이)
    const geo = new THREE.PlaneGeometry(0.21, 0.297, 24, 24);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) / 0.105, v = p.getY(i) / 0.1485;
      const curl = Math.max(0, u * 0.6 + -v * 0.4 - 0.55);
      p.setZ(i, curl * curl * 0.012 + (1 - Math.cos(u * 2.2)) * 0.0004);
    }
    geo.computeVertexNormals();
    const st = { group: g, inst, n, t, top: null, height: t * n };
    st.top = makeSheet(geo, doc); st.top.position.y = t * n + 0.0009; g.add(st.top);
    g.userData.label = '서류';
    interactive.push(g);
    return st;
  }

  function buildTray(st) {
    const g = st.group; g.position.y = 0.006;
    const wood = new THREE.MeshPhysicalMaterial({ color: 0x4a2c18, roughness: 0.5, clearcoat: 0.3 });
    const W = 0.25, D = 0.335, H = 0.028, T = 0.008;
    const tray = new THREE.Group(); tray.position.copy(g.position); tray.position.y = 0; tray.rotation.y = g.rotation.y; scene.add(tray);
    const add = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wood); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; tray.add(m); };
    add(W, 0.006, D, 0, 0.003, 0);
    add(W, H, T, 0, H / 2, D / 2 - T / 2); add(W, H, T, 0, H / 2, -D / 2 + T / 2);
    add(T, H, D, W / 2 - T / 2, H / 2, 0); add(T, H, D, -W / 2 + T / 2, H / 2, 0);
    const card = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.026), new THREE.MeshStandardMaterial({ map: makeLabel('완료'), roughness: 0.9 }));
    card.position.set(0, H * 0.55, D / 2 + 0.0005); tray.add(card);
  }
  function buildFolder(x, z, rot) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g);
    g.userData.label = '서류철: 눌러서 열기';
    const manila = new THREE.MeshStandardMaterial({ color: 0xb98d52, roughness: 0.85 });
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.0025, 0.31), manila);
    back.position.y = 0.00125; back.castShadow = back.receiveShadow = true; g.add(back);
    const tab = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.0025, 0.03), manila);
    tab.position.set(-0.06, 0.00125, -0.165); g.add(tab);
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.0016, 0.29), paperMat);
      s.position.set(R(-0.004, 0.004) + 0.004, 0.003 + i * 0.0017, R(-0.002, 0.006)); s.rotation.y = R(-0.03, 0.03);
      s.castShadow = s.receiveShadow = true; g.add(s);
    }
    // 앞표지 (경첩: 왼쪽 모서리)
    const hinge = new THREE.Group(); hinge.position.set(-0.12, 0.014, 0); g.add(hinge);
    const cover = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.0025, 0.31), manila);
    cover.position.x = 0.12; cover.castShadow = cover.receiveShadow = true; hinge.add(cover);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.035), new THREE.MeshStandardMaterial({ map: makeLabel('2026 · 진행 중'), roughness: 0.9 }));
    label.rotation.x = -Math.PI / 2;
    hinge.rotation.z = 0.012;
    g.userData.cover = hinge; g.userData.coverMesh = cover; cover.add(label); label.position.set(0, 0.0013, -0.1);
    return g;
  }

  function buildPen() {
    const g = new THREE.Group(); scene.add(g); g.userData.label = '만년필';
    const lacquer = new THREE.MeshPhysicalMaterial({ color: 0x0b1a14, roughness: 0.18, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.005, 0.1, 24), lacquer); body.rotation.z = Math.PI / 2; g.add(body);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0058, 0.0058, 0.055, 24), lacquer); cap.rotation.z = Math.PI / 2; cap.position.x = -0.07; g.add(cap);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.004, 24), brass); ring.rotation.z = Math.PI / 2; ring.position.x = -0.044; g.add(ring);
    const end = new THREE.Mesh(new THREE.SphereGeometry(0.0058, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), lacquer); end.rotation.z = Math.PI / 2; end.position.x = -0.0975; g.add(end);
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.0015, 0.002), brass); clip.position.set(-0.07, 0.0062, 0); g.add(clip);
    const nib = new THREE.Mesh(new THREE.ConeGeometry(0.004, 0.016, 20), brass); nib.rotation.z = -Math.PI / 2; nib.position.x = 0.058; g.add(nib);
    g.traverse(o => { o.castShadow = true; o.receiveShadow = true; });
    return g;
  }

  function buildPencil() {
    const g = new THREE.Group(); scene.add(g); g.userData.label = '빨간 펜';
    const red = new THREE.MeshPhysicalMaterial({ color: 0xa3241c, roughness: 0.3, clearcoat: 0.6 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.13, 6), red); body.rotation.z = Math.PI / 2; g.add(body);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.004, 0.014, 6), new THREE.MeshStandardMaterial({ color: 0xd9c09a, roughness: 0.8 })); tip.rotation.z = -Math.PI / 2; tip.position.x = 0.072; g.add(tip);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0042, 0.0042, 0.012, 16), new THREE.MeshStandardMaterial({ color: 0xe8e2d6, roughness: 0.4, metalness: 0.5 })); cap.rotation.z = Math.PI / 2; cap.position.x = -0.068; g.add(cap);
    g.traverse(o => { o.castShadow = true; o.receiveShadow = true; });
    return g;
  }

  function buildStamp() {
    const g = new THREE.Group(); scene.add(g); g.userData.label = '도장: 눌러서 찍기';
    const wood = new THREE.MeshPhysicalMaterial({ color: 0x5a1a12, roughness: 0.35, clearcoat: 0.7 });
    const pts = [[0, 0], [0.016, 0], [0.016, 0.012], [0.011, 0.02], [0.009, 0.045], [0.013, 0.055], [0.012, 0.062], [0, 0.066]].map(p => new THREE.Vector2(p[0], p[1]));
    const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 32), wood); g.add(body);
    const face = new THREE.Mesh(new THREE.CylinderGeometry(0.0158, 0.0158, 0.002, 32), new THREE.MeshStandardMaterial({ color: 0xb3261e, roughness: 0.7 })); face.position.y = 0.001; g.add(face);
    g.traverse(o => { o.castShadow = true; o.receiveShadow = true; });
    return g;
  }

  function buildPad() {
    const g = new THREE.Group();
    const caseM = new THREE.MeshPhysicalMaterial({ color: 0x1d1b19, roughness: 0.3, metalness: 0.4, clearcoat: 0.5 });
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.014, 40), caseM); c.position.y = 0.007; g.add(c);
    const ink = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.031, 0.002, 40), new THREE.MeshStandardMaterial({ color: 0x8c1510, roughness: 0.55 })); ink.position.y = 0.0145; g.add(ink);
    g.traverse(o => { o.castShadow = true; o.receiveShadow = true; });
    return g;
  }

  function buildMug() {
    const g = new THREE.Group(); scene.add(g); g.userData.label = '커피 한 잔';
    const cer = new THREE.MeshPhysicalMaterial({ color: 0xe9e2d4, roughness: 0.32, clearcoat: 0.6 });
    const pts = [[0, 0], [0.034, 0], [0.036, 0.004], [0.038, 0.09], [0.035, 0.09], [0.033, 0.008], [0, 0.008]].map(p => new THREE.Vector2(p[0], p[1]));
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), cer); g.add(m);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.005, 12, 24, Math.PI * 1.1), cer);
    handle.position.set(0.038, 0.048, 0); handle.rotation.z = -Math.PI * 0.55; g.add(handle);
    const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.034, 32), new THREE.MeshPhysicalMaterial({ color: 0x1a0d06, roughness: 0.05, clearcoat: 1 }));
    coffee.rotation.x = -Math.PI / 2; coffee.position.y = 0.075; g.add(coffee);
    g.rotation.y = 2.4;
    g.traverse(o => { o.castShadow = true; o.receiveShadow = true; });
    return g;
  }

  function rod(a, b, r, mat) {
    const len = a.distanceTo(b);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 16), mat);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    m.castShadow = true;
    return m;
  }

  function buildLamp() {
    const g = new THREE.Group(); g.position.set(-0.34, 0, -0.24); scene.add(g);
    g.userData.label = '스탠드: 눌러서 끄고 켜기';
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.022, 48), blackMetal);
    base.position.y = 0.011; base.castShadow = base.receiveShadow = true; g.add(base);
    const baseRing = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.0025, 8, 48), brass); baseRing.rotation.x = Math.PI / 2; baseRing.position.y = 0.022; g.add(baseRing);
    const B = new THREE.Vector3(0, 0.022, 0), J = new THREE.Vector3(0.04, 0.37, -0.03), Hd = new THREE.Vector3(0.27, 0.43, 0.14);
    g.add(rod(B, J, 0.0055, blackMetal), rod(B.clone().add(new THREE.Vector3(0.012, 0, 0)), J.clone().add(new THREE.Vector3(0.012, 0, 0)), 0.0025, brass));
    g.add(rod(J, Hd, 0.005, blackMetal), rod(J.clone().add(new THREE.Vector3(0, 0.012, 0)), Hd.clone().add(new THREE.Vector3(-0.02, 0.008, 0)), 0.0022, brass));
    for (const p of [B, J]) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.011, 20, 12), brass); s.position.copy(p); s.castShadow = true; g.add(s); }
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.02, 20), brass); knob.position.copy(J); knob.rotation.x = Math.PI / 2; g.add(knob);

    const head = new THREE.Group(); head.position.copy(Hd); g.add(head);
    const target = new THREE.Vector3(0.2, 0, -0.02);
    scene.updateMatrixWorld(true);
    head.lookAt(target);
    const prof = [[0.012, 0.02], [0.022, 0.012], [0.03, -0.01], [0.052, -0.06], [0.074, -0.105], [0.076, -0.11]].map(p => new THREE.Vector2(p[0], p[1]));
    const sg = new THREE.LatheGeometry(prof, 48); sg.rotateX(-Math.PI / 2);
    const outer = new THREE.Mesh(sg, new THREE.MeshPhysicalMaterial({ color: 0x1f3a2e, roughness: 0.3, metalness: 0.6, clearcoat: 0.8, side: THREE.BackSide }));
    const inner = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ color: 0xf2e6cc, emissive: 0xffd9a0, emissiveIntensity: 0.9, roughness: 0.6, side: THREE.FrontSide }));
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.002, 8, 48), brass); lip.position.z = 0.11;
    head.add(outer, inner, lip);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.02, 24, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffd79a, emissiveIntensity: 7 }));
    bulb.position.z = 0.04; head.add(bulb);
    const spot = new THREE.SpotLight(0xffc98a, 7.5, 0, 0.78, 0.75, 1.6);
    spot.position.set(0, 0, 0.05); head.add(spot);
    const tObj = new THREE.Object3D(); tObj.position.set(0, 0, Hd.distanceTo(target.clone().sub(g.position))); head.add(tObj); spot.target = tObj;
    spot.castShadow = true; spot.shadow.mapSize.setScalar(MOBILE ? 1024 : 2048); spot.shadow.bias = -0.0002; spot.shadow.normalBias = 0.012; spot.shadow.camera.near = 0.03; spot.shadow.camera.far = 2.5; spot.shadow.radius = 4;
    const fill = new THREE.PointLight(0xffb36b, 0.16, 0, 2); fill.position.set(0, 0, -0.05); head.add(fill);

    // 빛기둥
    const len = 0.62, rad = Math.tan(0.6) * len;
    const coneGeo = new THREE.ConeGeometry(rad, len, 48, 1, true); coneGeo.translate(0, -len / 2, 0); coneGeo.rotateX(-Math.PI / 2);
    const cone = new THREE.Mesh(coneGeo, new THREE.ShaderMaterial({
      uniforms: { uLevel: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: 'varying vec3 vN; varying vec3 vV; varying float vZ; void main(){ vec4 w = modelMatrix * vec4(position,1.); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); vZ = position.z; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `uniform float uLevel; varying vec3 vN; varying vec3 vV; varying float vZ;
        void main(){ float f = pow(abs(dot(normalize(vN), vV)), 2.5); float a = f * smoothstep(0., .08, vZ) * (1. - smoothstep(.2, ${len.toFixed(2)}, vZ)); gl_FragColor = vec4(vec3(1., .78, .5) * a * .07 * uLevel, 1.); }`
    }));
    cone.position.z = 0.06; cone.raycast = () => {}; head.add(cone);
    [outer, inner, bulb, lip].forEach(o => o.castShadow = false);
    return { group: g, spot, fill, bulb, inner, cone, head, on: true };
  }

  function buildDust() {
    const n = 520, pos = new Float32Array(n * 3), seed = new Float32Array(n);
    for (let i = 0; i < n; i++) { pos[i * 3] = R(-0.4, 0.45); pos[i * 3 + 1] = R(0.01, 0.48); pos[i * 3 + 2] = R(-0.35, 0.3); seed[i] = rand(); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
    const lp = new THREE.Vector3(), ld = new THREE.Vector3();
    lamp.head.getWorldPosition(lp); lamp.head.getWorldDirection(ld);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uLevel: { value: 1 }, uLp: { value: lp }, uLd: { value: ld }, uPR: { value: renderer.getPixelRatio() } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute float seed; uniform float uTime, uPR; uniform vec3 uLp, uLd; varying float vA;
        void main(){
          vec3 p = position;
          float t = uTime * (.015 + seed * .02);
          p.x += sin(t * 6.28 + seed * 40.) * .03; p.z += cos(t * 5. + seed * 17.) * .03;
          p.y = mod(p.y + t * .5, .5);
          vec3 d = p - uLp; float c = dot(normalize(d), uLd);
          float inCone = smoothstep(.72, .86, c) * smoothstep(1.1, .2, length(d));
          float tw = pow(.5 + .5 * sin(uTime * (1.5 + seed * 3.) + seed * 60.), 6.);
          vA = inCone * (.25 + tw * 1.4);
          vec4 mv = modelViewMatrix * vec4(p, 1.);
          gl_PointSize = (1.4 + tw * 2.2) * uPR * (1. / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `uniform float uLevel; varying float vA; void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, 0., d); gl_FragColor = vec4(vec3(1., .86, .62) * a * vA * uLevel, 1.); }`
    });
    const pts = new THREE.Points(geo, mat); scene.add(pts);
    return pts;
  }

  function buildShelf() {
    const g = new THREE.Group(); g.position.set(0.05, 0, -0.82); scene.add(g);
    const w = 2.4, d = 0.3, levels = [-0.02, 0.36, 0.74, 1.12];
    for (const y of levels) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.025, d), shelfMat); b.position.y = y; b.receiveShadow = b.castShadow = true; g.add(b); }
    for (const x of [-w / 2, -0.4, 0.4, w / 2]) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.025, 1.3, d), shelfMat); s.position.set(x, 0.55, 0); s.castShadow = s.receiveShadow = true; g.add(s); }
    const back = new THREE.Mesh(new THREE.PlaneGeometry(w, 1.3), new THREE.MeshStandardMaterial({ color: 0x1c140e, roughness: 0.9 })); back.position.set(0, 0.55, -d / 2); back.receiveShadow = true; g.add(back);
    const colors = [0x2f4a3a, 0x5a2420, 0x23304a, 0x8a6a3a, 0xd8cfbd, 0x3b2b22, 0x6b5a45, 0x1f2a24, 0x7d7464];
    const N = 150, geo = new THREE.BoxGeometry(1, 1, 1);
    const books = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.7 }), N);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
    let i = 0;
    for (const y of levels.slice(0, 3)) {
      let x = -w / 2 + 0.03;
      while (x < w / 2 - 0.05 && i < N) {
        if (Math.abs(x + 0.4) < 0.03 || Math.abs(x - 0.4) < 0.03) { x += 0.04; continue; }
        if (rand() < 0.08) { x += R(0.05, 0.15); continue; }
        const binder = rand() < 0.3;
        const bw = binder ? R(0.05, 0.075) : R(0.018, 0.04), bh = binder ? 0.31 : R(0.2, 0.3), bd = binder ? 0.26 : R(0.16, 0.22);
        const lean = rand() < 0.06 ? 0.18 : 0;
        q.setFromEuler(new THREE.Euler(0, 0, -lean));
        m.compose(new THREE.Vector3(x + bw / 2 + lean * 0.1, y + 0.0125 + bh / 2, -d / 2 + bd / 2 + 0.02), q, new THREE.Vector3(bw, bh, bd));
        books.setMatrixAt(i, m);
        c.setHex(binder ? [0x8f8676, 0x2f4a3a, 0x23304a][(rand() * 3) | 0] : colors[(rand() * colors.length) | 0]).multiplyScalar(R(0.5, 0.85));
        books.setColorAt(i, c);
        x += bw + R(0.001, 0.004); i++;
      }
    }
    books.count = i; books.castShadow = books.receiveShadow = true; g.add(books);
    return g;
  }

  // ======================================================
  // 캔버스 텍스처
  // ======================================================
  function canvasTex(w, h, draw) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    draw(cv.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  }
  function makeWood(s, light, dark, rings) {
    return canvasTex(s, s, (x, w, h) => {
      x.fillStyle = dark; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) {
        const y = rand() * h, a = R(0.02, 0.12);
        x.strokeStyle = rand() < 0.5 ? light : dark; x.globalAlpha = a; x.lineWidth = R(0.5, 3) * s / 512;
        x.beginPath(); x.moveTo(0, y);
        for (let px = 0; px <= w; px += 32) x.lineTo(px, y + Math.sin(px / w * Math.PI * 2 * R(0.5, 1.5) + i) * rings * 0.3 + R(-1, 1));
        x.stroke();
      }
      x.globalAlpha = 1;
    });
  }
  function makeDocTexture(title, marks) {
    return canvasTex(724, 1024, (x, w, h) => {
      x.fillStyle = '#f7f2e8'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#1d1b18'; x.font = `700 44px ${FONT}`; x.textAlign = 'center'; x.fillText(title, w / 2, 120);
      x.fillRect(80, 150, w - 160, 3);
      x.textAlign = 'left'; x.font = `500 22px ${FONT}`; x.fillStyle = '#3a3630';
      const rows = ['성  명', '주  소', '연 락 처', '처분 내용'];
      rows.forEach((r, i) => { const y = 200 + i * 56; x.strokeStyle = '#8a8378'; x.lineWidth = 1.5; x.strokeRect(80, y, w - 160, 56); x.fillText(r, 100, y + 36); x.beginPath(); x.moveTo(230, y); x.lineTo(230, y + 56); x.stroke(); });
      x.fillStyle = '#6a645a';
      for (let i = 0; i < 13; i++) { const y = 470 + i * 34; const len = (i % 4 === 3) ? R(180, 380) : R(460, 560); x.fillRect(90, y, len, 7); }
      x.font = `500 22px ${FONT}`; x.fillStyle = '#3a3630'; x.fillText('2026년  11월  21일', w - 330, 940);
      if (marks) {
        x.strokeStyle = '#c8372d'; x.lineWidth = 5; x.lineCap = 'round';
        x.beginPath(); x.moveTo(90, 718); x.bezierCurveTo(250, 735, 420, 736, 600, 730); x.stroke();
        x.beginPath(); x.ellipse(70, 572, 30, 22, -0.2, 0, Math.PI * 2); x.stroke();
        x.font = `48px "Nanum Pen Script", ${FONT}`; x.fillStyle = '#c8372d'; x.fillText('기한 내 제출!', 380, 680);
      }
    });
  }
  function makeSealTexture() {
    return canvasTex(256, 256, (x, w) => {
      x.clearRect(0, 0, w, w);
      x.strokeStyle = 'rgba(200,40,32,.95)'; x.fillStyle = 'rgba(200,40,32,.95)';
      x.lineWidth = 10; x.beginPath(); x.arc(128, 128, 110, 0, Math.PI * 2); x.stroke();
      x.lineWidth = 4; x.beginPath(); x.arc(128, 128, 92, 0, Math.PI * 2); x.stroke();
      x.textAlign = 'center'; x.font = `800 58px ${FONT}`; x.fillText('접수', 128, 120); x.fillText('완료', 128, 182);
      // 잉크 얼룩
      x.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 260; i++) { x.globalAlpha = R(0.1, 0.6); x.beginPath(); x.arc(R(0, 256), R(0, 256), R(1, 5), 0, 7); x.fill(); }
    });
  }
  function makeLabel(text) {
    return canvasTex(330, 105, (x, w, h) => {
      x.fillStyle = '#efe8da'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#2a2722'; x.font = `48px "Nanum Pen Script", ${FONT}`; x.textAlign = 'center'; x.fillText(text, w / 2, 68);
    });
  }
  function ease(t) { t = Math.min(1, Math.max(0, t)); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
}
