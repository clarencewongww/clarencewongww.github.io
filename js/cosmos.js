/*!
 * Chalkboard Cosmos — WebGL chalk constellation scene
 *
 * Loaded AFTER js/vendor/three.min.js (global `THREE`). The canvas
 * (`#cosmos`) sits fixed behind the page content; the CSS chalkboard
 * green shows through the transparent renderer.
 *
 * Plain vanilla JS — no modules, no build step, ES5-compatible syntax.
 * Degrades gracefully to the flat board when WebGL is unavailable or
 * the user prefers reduced motion.
 */
(function () {
  'use strict';

  var canvas = document.getElementById('cosmos');

  /* ------------------------------------------------------------------
   * 1. Boot & capability detection
   * ------------------------------------------------------------------ */

  if (typeof THREE === 'undefined') {
    document.documentElement.classList.add('no-webgl');
    return;
  }

  if (!canvas) {
    document.documentElement.classList.add('no-webgl');
    return;
  }

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true
    });
  } catch (err) {
    document.documentElement.classList.add('no-webgl');
    return;
  }

  document.documentElement.classList.add('webgl');

  var viewW = window.innerWidth;
  var viewH = window.innerHeight;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(viewW, viewH, false); /* updateStyle=false: CSS owns layout */
  renderer.setClearColor(0x000000, 0);   /* fully transparent — board shows through */

  /* Chalk palette */
  var CHALK = 0xf3efe2; /* chalk white   */
  var DUST = 0x8f9b93;  /* dust gray     */
  var AMBER = 0xe8a33d; /* data / accent */

  var reducedMotion = !!(
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  /* ------------------------------------------------------------------
   * 2. Scene & camera
   * ------------------------------------------------------------------ */

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x16271d, 0.035); /* chalk-dust haze */

  var camera = new THREE.PerspectiveCamera(55, viewW / viewH, 0.1, 100);
  camera.position.set(0, 0, 16);
  camera.lookAt(0, 0, 0);

  /* ------------------------------------------------------------------
   * 3. Helpers
   * ------------------------------------------------------------------ */

  /* Box-Muller normal random — gives the scatter cloud its loose,
     clumped (rather than uniform) 3D distribution. */
  function randNormal() {
    var u = 0;
    var v = 0;
    while (u === 0) { u = Math.random(); }
    while (v === 0) { v = Math.random(); }
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /* Circle of points in the XZ plane (normal +Y). Used for the orbit
     rings and the dashed ring; individual planes are tilted afterwards
     via applyQuaternion. */
  function circleGeometryXZ(radius, segments) {
    var geo = new THREE.BufferGeometry();
    var arr = new Float32Array(segments * 3);
    for (var i = 0; i < segments; i++) {
      var a = (i / segments) * Math.PI * 2;
      arr[i * 3] = Math.cos(a) * radius;
      arr[i * 3 + 1] = 0;
      arr[i * 3 + 2] = Math.sin(a) * radius;
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    return geo;
  }

  /* Quaternion tilting the canonical +Y plane normal onto an arbitrary axis. */
  function planeQuaternion(x, y, z) {
    var axis = new THREE.Vector3(x, y, z).normalize();
    return new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      axis
    );
  }

  /* Flat chalk mesh. Transparent so the per-section opacity emphasis can
     brighten / dim it; baseOpacity is its resting opacity. */
  function chalkMesh(radius, color, baseOpacity) {
    var mat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: baseOpacity
    });
    mat.userData.baseOpacity = baseOpacity;
    return new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), mat);
  }

  /* Flat chalk line material, same emphasis-friendly convention. */
  function chalkLineMat(color, baseOpacity) {
    var mat = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: baseOpacity
    });
    mat.userData.baseOpacity = baseOpacity;
    return mat;
  }

  /* ------------------------------------------------------------------
   * 4. Chalk dust particles
   * ------------------------------------------------------------------ */

  var dustCount = viewW >= 768 ? 1600 : 700;
  var dustGeometry = new THREE.BufferGeometry();
  var dustPositions = new Float32Array(dustCount * 3);
  var dustColors = new Float32Array(dustCount * 3);
  var i;

  for (i = 0; i < dustCount; i++) {
    /* Keep a clearing zone behind the hero name: retry up to 25 times per
       point to stay out of the central band, then accept whatever remains
       so the particle count target is still reached. */
    var px, py, pz, attempts;
    for (attempts = 0; attempts < 25; attempts++) {
      px = (Math.random() * 2 - 1) * 17;  /* box: 34 wide   */
      py = (Math.random() * 2 - 1) * 11;  /* box: 22 tall */
      pz = (Math.random() * 2 - 1) * 8;   /* box: 16 deep */
      if (!(Math.abs(px) < 3.4 && Math.abs(py) < 3.2)) { break; }
    }
    dustPositions[i * 3] = px;
    dustPositions[i * 3 + 1] = py;
    dustPositions[i * 3 + 2] = pz;

    var roll = Math.random();
    var color;
    if (roll < 0.07) { color = AMBER; }          /* ~7% amber accents  */
    else if (roll < 0.5) { color = DUST; }       /* rest: white/gray mix */
    else { color = CHALK; }
    var c = new THREE.Color(color);
    dustColors[i * 3] = c.r;
    dustColors[i * 3 + 1] = c.g;
    dustColors[i * 3 + 2] = c.b;
  }

  dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
  dustGeometry.setAttribute('color', new THREE.Float32BufferAttribute(dustColors, 3));

  var dustMaterial = new THREE.PointsMaterial({
    size: 0.055,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
    depthWrite: false
  });
  var dust = new THREE.Points(dustGeometry, dustMaterial);
  scene.add(dust);

  /* Base positions are kept for a potential per-point drift pass; the loop
     currently tumbles the whole cloud (rotation only), which is cheap and
     reads as chalk-dust shimmering in the air. */
  var baseDustPositions = dustPositions.slice();

  /* ------------------------------------------------------------------
   * 5. Constellation groups (flat chalk look — fog applies to all)
   * ------------------------------------------------------------------ */

  var atomGroup;
  var scatterGroup;
  var chainGroup;
  var orbitGroup;

  /* -- 5.1 Atom: nucleus + two tilted orbits with riding electrons -------- */
  atomGroup = new THREE.Group();
  atomGroup.position.set(-6.6, 2.2, -4);
  atomGroup.userData.opacityBase = 1.0;
  atomGroup.userData.materials = [];

  var nucleus = chalkMesh(0.3, AMBER, 1.0);
  atomGroup.add(nucleus);
  atomGroup.userData.materials.push(nucleus.material);

  /* Builds one tilted ring plus the electron that rides it. The electron's
     animated position is the canonical circle point rotated by the ring's
     plane quaternion — the ring and electron can never desync. */
  function addOrbit(radius, axisX, axisY, axisZ, speed, phase, opacity) {
    var quat = planeQuaternion(axisX, axisY, axisZ);

    var ringMat = chalkLineMat(CHALK, opacity);
    var ring = new THREE.LineLoop(circleGeometryXZ(radius, 96), ringMat);
    ring.geometry.applyQuaternion(quat);
    atomGroup.add(ring);
    atomGroup.userData.materials.push(ringMat);

    var electron = chalkMesh(0.12, CHALK, 1.0);
    atomGroup.add(electron);
    atomGroup.userData.materials.push(electron.material);

    if (!atomGroup.userData.orbits) {
      atomGroup.userData.orbits = [];
    }
    atomGroup.userData.orbits.push({
      electron: electron,
      quat: quat,
      radius: radius,
      speed: speed,
      phase: phase
    });
  }

  addOrbit(1.2, 0.35, 0.80, 0.48, 1.1, 0.0, 0.3);
  addOrbit(1.6, -0.55, 0.20, 0.81, 0.7, 2.1, 0.3);

  /* -- 5.2 Scatter: data cloud + amber regression line -------------------- */
  scatterGroup = new THREE.Group();
  scatterGroup.position.set(6.8, 1.0, -5);
  scatterGroup.userData.opacityBase = 1.0;
  scatterGroup.userData.materials = [];

  var SCATTER_N = 38;
  for (i = 0; i < SCATTER_N; i++) {
    var cloudMesh = chalkMesh(0.1 + Math.random() * 0.06, Math.random() < 0.7 ? CHALK : DUST, 1.0);
    cloudMesh.position.set(
      randNormal() * 2.2,
      randNormal() * 1.6,
      randNormal() * 1.8
    );
    scatterGroup.add(cloudMesh);
    scatterGroup.userData.materials.push(cloudMesh.material);
  }

  /* Amber regression line slicing diagonally through the cloud. */
  var regressPts = [];
  for (i = 0; i < 4; i++) {
    var frac = (i / 3) * 2 - 1; /* -1 .. 1 */
    regressPts.push(new THREE.Vector3(
      frac * 2.3,
      frac * 1.55 - 0.05,
      frac * 0.8
    ));
  }
  var regressGeo = new THREE.BufferGeometry().setFromPoints(regressPts);
  var regressMat = chalkLineMat(AMBER, 1.0);
  scatterGroup.add(new THREE.Line(regressGeo, regressMat));
  scatterGroup.userData.materials.push(regressMat);

  /* -- 5.3 Chain: wavy molecular bond chain, one amber link --------------- */
  chainGroup = new THREE.Group();
  chainGroup.position.set(0, -3.8, -7);
  chainGroup.userData.opacityBase = 0.9;
  chainGroup.userData.materials = [];

  var linkPts = [];
  for (i = 0; i < 6; i++) {
    linkPts.push(new THREE.Vector3(
      (i - 2.5) * 0.9,
      Math.sin(i * 1.1) * 0.35,
      Math.cos(i * 0.9) * 0.25
    ));
    var linkMesh = chalkMesh(0.18, i === 3 ? AMBER : CHALK, 0.9);
    linkMesh.position.copy(linkPts[i]);
    chainGroup.add(linkMesh);
    chainGroup.userData.materials.push(linkMesh.material);
  }
  for (i = 0; i < linkPts.length - 1; i++) {
    var bondGeo = new THREE.BufferGeometry().setFromPoints([linkPts[i], linkPts[i + 1]]);
    var bondMat = chalkLineMat(CHALK, 0.5);
    chainGroup.add(new THREE.Line(bondGeo, bondMat));
    chainGroup.userData.materials.push(bondMat);
  }

  /* -- 5.4 Orbit: large dashed ring --------------------------------------- */
  orbitGroup = new THREE.Group();
  orbitGroup.position.set(0, 4.2, -8);
  orbitGroup.userData.opacityBase = 0.7;
  orbitGroup.userData.materials = [];

  var dashedMat = new THREE.LineDashedMaterial({
    color: DUST,
    dashSize: 0.25,
    gapSize: 0.18,
    transparent: true,
    opacity: 0.5
  });
  dashedMat.userData.baseOpacity = 0.5;
  var dashedRing = new THREE.LineLoop(circleGeometryXZ(3, 90), dashedMat);
  dashedRing.computeLineDistances(); /* required for dashed rendering */
  orbitGroup.add(dashedRing);
  orbitGroup.userData.materials.push(dashedMat);

  /* Register the four groups and their resting emphasis state. */
  var groups = [atomGroup, scatterGroup, chainGroup, orbitGroup];
  for (i = 0; i < groups.length; i++) {
    scene.add(groups[i]);
    groups[i].userData.boost = 0;
  }

  /* ------------------------------------------------------------------
   * 6. Per-section emphasis
   * ------------------------------------------------------------------ */

  /* Section id -> group that brightens while that section is on screen. */
  var groupForSection = {
    about: scatterGroup,
    resume: chainGroup,
    skills: atomGroup,
    projects: orbitGroup
  };
  var sections = ['about', 'resume', 'skills', 'projects', 'contact'];
  var sectionEls = [];
  for (i = 0; i < sections.length; i++) {
    sectionEls.push(document.getElementById(sections[i]));
  }

  /* Reverse lookup (group -> section) via each object's unique uuid. */
  var sectionForGroup = {};
  for (var key in groupForSection) {
    if (Object.prototype.hasOwnProperty.call(groupForSection, key)) {
      sectionForGroup[groupForSection[key].uuid] = key;
    }
  }

  /* Recompute, from live layout, which section spans the current scroll
     progress; contact is the finale and brightens every group to full. */
  function setEmphasisTargets() {
    var total = document.documentElement.scrollHeight - window.innerHeight;
    var finale = false;
    var active = {};
    var j, el, top, start, end, id;

    for (j = 0; j < sectionEls.length; j++) {
      el = sectionEls[j];
      if (!el) { continue; }
      top = el.getBoundingClientRect().top + window.scrollY;
      if (total > 0) {
        start = top / total;
        end = (top + el.offsetHeight) / total;
      } else {
        start = 0;
        end = 1;
      }
      if (progress >= start && progress <= end) {
        id = sections[j];
        if (id === 'contact') { finale = true; }
        else { active[id] = true; }
      }
    }

    for (j = 0; j < groups.length; j++) {
      var grp = groups[j];
      if (finale) {
        grp.userData.boost = 0.95; /* finale: all chalk to full brightness */
      } else {
        var sec = sectionForGroup[grp.uuid];
        grp.userData.boost = sec && active[sec] ? 0.35 : 0;
      }
    }
  }

  /* Ease every emphasis material's opacity toward base + group boost. */
  function lerpOpacities() {
    var j, k, grp, mats, mat, target;
    for (j = 0; j < groups.length; j++) {
      grp = groups[j];
      mats = grp.userData.materials;
      for (k = 0; k < mats.length; k++) {
        mat = mats[k];
        if (!mat.transparent) { continue; }
        target = Math.min(1, mat.userData.baseOpacity + grp.userData.boost);
        mat.opacity += (target - mat.opacity) * 0.06;
      }
    }
  }

  /* ------------------------------------------------------------------
   * 7. Animation state
   * ------------------------------------------------------------------ */

  var clock = new THREE.Clock();
  var t = 0;            /* scene clock time (seconds)      */
  var progress = 0;     /* smoothed 0..1 overall scroll    */
  var targetProgress = 0; /* raw scroll fraction, clamped 0..1 */
  var scrollVel = 0;    /* smoothed per-frame progress velocity */
  var mx = 0;           /* normalized pointer x, -1..1     */
  var my = 0;           /* normalized pointer y, -1..1     */
  var running = false;
  var rafId = 0;

  /* Electrons ride their tilted orbit planes; the ring and electron share
     the same quaternion so the ride always stays on the drawn ring. */
  function updateElectrons(time) {
    var orbits = atomGroup.userData.orbits;
    for (var j = 0; j < orbits.length; j++) {
      var o = orbits[j];
      var a = time * o.speed + o.phase;
      o.electron.position.set(
        Math.cos(a) * o.radius,
        0,
        Math.sin(a) * o.radius
      ).applyQuaternion(o.quat);
    }
  }

  /* One animated frame. */
  function tick() {
    var delta = Math.min(clock.getDelta(), 0.05); /* cap: no jumps after tab switch */
    t += delta;

    /* Smooth scroll progress toward the raw target, and track its velocity. */
    var prev = progress;
    progress += (targetProgress - progress) * 0.08;
    scrollVel += (progress - prev - scrollVel) * 0.08;

    /* Chalk dust tumbles slowly; scrolling gives it a little extra life. */
    dust.rotation.y += 0.0003 + Math.abs(scrollVel) * 0.02;

    /* Electrons orbiting their nucleus. */
    updateElectrons(t);

    /* Gentle camera circuit around the board, plus pointer parallax. */
    var cx = Math.sin(progress * Math.PI * 2) * 2.4 + mx * 0.8;
    var cy = Math.cos(progress * Math.PI * 3) * 1.2 + my * 0.5;
    var cz = 16 + Math.sin(progress * Math.PI) * 1.5;
    camera.position.x += (cx - camera.position.x) * 0.06;
    camera.position.y += (cy - camera.position.y) * 0.06;
    camera.position.z += (cz - camera.position.z) * 0.06;
    camera.lookAt(0, 0, 0);

    /* Per-section chalk brightening. */
    setEmphasisTargets();
    lerpOpacities();

    renderer.render(scene, camera);
  }

  /* rAF loop with start/stop so the tab can sleep in the background. */
  function frame() {
    if (!running) { return; }
    rafId = requestAnimationFrame(frame);
    tick();
  }

  function startLoop() {
    if (running || reducedMotion) { return; }
    running = true;
    clock.getDelta(); /* discard time accumulated while paused */
    frame();
  }

  function stopLoop() {
    running = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  /* ------------------------------------------------------------------
   * 8. Lifecycle, input & reduced motion
   * ------------------------------------------------------------------ */

  function onScroll() {
    var total = document.documentElement.scrollHeight - window.innerHeight;
    targetProgress = total > 0
      ? Math.max(0, Math.min(1, window.scrollY / total))
      : 0;
  }

  function onPointerMove(e) {
    mx = (e.clientX / window.innerWidth) * 2 - 1;
    my = -((e.clientY / window.innerHeight) * 2 - 1);
  }

  function onResize() {
    viewW = window.innerWidth;
    viewH = window.innerHeight;
    camera.aspect = viewW / viewH;
    camera.updateProjectionMatrix();
    renderer.setSize(viewW, viewH, false);
    if (reducedMotion) {
      renderStaticFrame();
    }
  }

  function onVisibility() {
    if (document.hidden) { stopLoop(); }
    else { startLoop(); }
  }

  /* Reduced motion: exactly one pleasing static frame (default camera,
     t = 0.3 puts the electrons in a nice spot), no rAF loop, no parallax. */
  function renderStaticFrame() {
    t = 0.3;
    camera.position.set(0, 0, 14);
    camera.lookAt(0, 0, 0);
    updateElectrons(t);
    renderer.render(scene, camera);
  }

  /* ------------------------------------------------------------------
   * 9. Boot
   * ------------------------------------------------------------------ */

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('visibilitychange', onVisibility, false);
  if (!reducedMotion) {
    window.addEventListener('pointermove', onPointerMove, { passive: true });
  }

  onScroll(); /* sync targetProgress if the page loads mid-scroll */

  if (reducedMotion) {
    renderStaticFrame();
  } else {
    startLoop();
  }
})();
