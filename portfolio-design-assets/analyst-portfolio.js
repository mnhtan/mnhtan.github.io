const exhibit = document.querySelector('#exhibit');
const canvas = document.querySelector('#space');
const context = canvas.getContext('2d');
const sceneImage = document.querySelector('#scene-image');
const sceneChart = document.querySelector('#scene-chart');
const sceneSales = document.querySelector('#scene-sales');
const sceneLink = document.querySelector('#scene-link');
const motionControl = document.querySelector('#motion-control');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const sceneChoices = [...document.querySelectorAll('button[data-scene]')];
const projectPlanes = [...document.querySelectorAll('.project-plane')];

const scenes = {
  sales: { asset: null, link: 'Thử quy trình ↗', href: '#sales-demo', rgb: '209,250,117' },
  vision: { asset: new URL('./traffic-detection-demo.png', import.meta.url).href, alt: 'Ứng dụng nhận diện phương tiện trong đề tài YOLOv8',
    link: 'Xem đề tài giao thông ↗', href: '#thi-giac', rgb: '112,237,223' },
  bi: { asset: new URL('./superstore-overview.png', import.meta.url).href, alt: 'Dashboard Global Superstore trên Power BI',
    link: 'Xem dự án Power BI ↗', href: '#power-bi', rgb: '167,196,255' },
  python: { asset: null, link: 'Xem phân tích Fit.ly ↗', href: '#fitly', rgb: '255,197,132' }
};

const models = {
  nano: ['77,9%', '164,76 ms'],
  medium: ['80,4%', '1.103,60 ms']
};
const fitModes = {
  count: ['28,5%', 'Khách rời dịch vụ'],
  revenue: ['25,1%', 'Doanh thu niêm yết mất do churn']
};

let scene = scenes.sales;
let paused = false;
let visible = false;
let frame = 0;
let previousTime = 0;
let phase = 0.2;
let width = 0;
let height = 0;

function select(buttons, selected) {
  buttons.forEach(button => button.setAttribute('aria-pressed', String(button === selected)));
}

function setComparison(attribute, values, outputIds) {
  const buttons = [...document.querySelectorAll('button[data-' + attribute + ']')];
  buttons.forEach(button => button.addEventListener('click', () => {
    select(buttons, button);
    values[button.dataset[attribute]].forEach((value, index) => {
      document.getElementById(outputIds[index]).textContent = value;
    });
  }));
}

setComparison('model', models, ['model-score', 'model-latency']);
setComparison('fit', fitModes, ['fit-score', 'fit-label']);

function drawSpace() {
  if (!context || !width || !height) return;
  context.clearRect(0, 0, width, height);
  const unit = Math.min(width, height) * 0.38;
  const turn = phase * 0.85 + 0.28;
  const cosY = Math.cos(turn);
  const sinY = Math.sin(turn);
  const cosX = Math.cos(0.71);
  const sinX = Math.sin(0.71);

  function project(x, y, z) {
    const rx = x * cosY - z * sinY;
    const rz = x * sinY + z * cosY;
    const ry = y * cosX - rz * sinX;
    const depth = y * sinX + rz * cosX;
    const zoom = 3.7 / (3.7 - depth);
    return [width * 0.58 + rx * unit * zoom, height * 0.45 + ry * unit * zoom];
  }

  for (let band = 0; band < 14; band++) {
    const radius = 0.44 + band * 0.075;
    context.beginPath();
    for (let step = 0; step <= 70; step++) {
      const a = step / 70 * 2 * Math.PI;
      const point = project(Math.cos(a) * radius, Math.sin(a * 2 + phase) * 0.12, Math.sin(a) * radius);
      if (step === 0) context.moveTo(...point);
      else context.lineTo(...point);
    }
    context.strokeStyle = 'rgba(' + scene.rgb + ',' + (band % 4 === 0 ? '0.49' : '0.19') + ')';
    context.lineWidth = band % 4 === 0 ? 1.3 : 0.75;
    context.stroke();
  }

  for (let ray = 0; ray < 22; ray++) {
    const a = ray * 2 * Math.PI / 22;
    const from = project(Math.cos(a) * 0.44, 0, Math.sin(a) * 0.44);
    const to = project(Math.cos(a) * 1.45, 0, Math.sin(a) * 1.45);
    context.strokeStyle = 'rgba(' + scene.rgb + ',0.15)';
    context.beginPath();
    context.moveTo(...from);
    context.lineTo(...to);
    context.stroke();

    const orbit = a + phase * 1.7;
    const point = project(Math.cos(orbit) * 1.58, Math.sin(orbit * 2) * 0.2, Math.sin(orbit) * 1.58);
    context.fillStyle = 'rgba(' + scene.rgb + ',0.72)';
    context.beginPath();
    context.arc(...point, ray % 5 === 0 ? 2.4 : 1.25, 0, Math.PI * 2);
    context.fill();
  }
}

function activeMotion() {
  return !paused && !reduced.matches;
}

function animate(time) {
  frame = 0;
  if (!activeMotion() || !visible || document.hidden) return;
  const elapsed = previousTime ? Math.min(time - previousTime, 40) : 0;
  previousTime = time;
  phase = (phase + elapsed * 0.00034) % (Math.PI * 2);
  drawSpace();
  frame = requestAnimationFrame(animate);
}

function syncMotion() {
  motionControl.hidden = !context || reduced.matches;
  motionControl.textContent = paused ? 'Bật chuyển động' : 'Tạm dừng chuyển động';
  if (!activeMotion()) {
    exhibit.style.removeProperty('--tilt-x');
    exhibit.style.removeProperty('--tilt-y');
    projectPlanes.forEach(plane => {
      plane.style.removeProperty('--px');
      plane.style.removeProperty('--py');
    });
  }
  if (!context || !activeMotion() || !visible || document.hidden) {
    cancelAnimationFrame(frame);
    frame = 0;
    drawSpace();
  } else if (!frame) {
    previousTime = 0;
    frame = requestAnimationFrame(animate);
  }
}

sceneChoices.forEach(button => button.addEventListener('click', () => {
  select(sceneChoices, button);
  exhibit.dataset.scene = button.dataset.scene;
  scene = scenes[button.dataset.scene];
  sceneImage.hidden = !scene.asset;
  sceneChart.hidden = scene !== scenes.python;
  sceneSales.hidden = scene !== scenes.sales;
  if (scene.asset) {
    sceneImage.src = scene.asset;
    sceneImage.alt = scene.alt;
  }
  sceneLink.href = scene.href;
  sceneLink.textContent = scene.link;
  drawSpace();
}));

function tilt(element, xProperty, yProperty, degrees) {
  element.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !activeMotion()) return;
    const bounds = element.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    element.style.setProperty(xProperty, -y * degrees + 'deg');
    element.style.setProperty(yProperty, x * degrees + 'deg');
  });
  element.addEventListener('pointerleave', () => {
    element.style.removeProperty(xProperty);
    element.style.removeProperty(yProperty);
  });
}

tilt(exhibit, '--tilt-x', '--tilt-y', 23);
projectPlanes.forEach(plane => tilt(plane, '--px', '--py', 11));

if (context) {
  new ResizeObserver(() => {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawSpace();
  }).observe(canvas);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    syncMotion();
  }).observe(exhibit);
  document.addEventListener('visibilitychange', syncMotion);
}
motionControl.addEventListener('click', () => { paused = !paused; syncMotion(); });
reduced.addEventListener('change', syncMotion);
syncMotion();
