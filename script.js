// =============================================
//  MATTER.JS — física real, DOM sincronizado
//  Igual que Natalie: cuerpos rígidos con masa,
//  colisiones reales, drag con spring natural
// =============================================

const { Engine, Runner, Bodies, Body, World, Mouse, MouseConstraint, Events, Composite } = Matter;

const NAV_H = 96;

const CARD_DEFS = [
  { id: 'card-1', fw: 700, fh: 600, icon: '👩🏻‍🍳' },
  { id: 'card-2', fw: 550, fh: 500, icon: '🧩'  },
  { id: 'card-3', fw: 380, fh: 572, icon: '🚧'  },
];

// =============================================
//  CALCULAR ESCALA
// =============================================
const SW = window.innerWidth;
const SH = window.innerHeight - NAV_H;

const scale = Math.min(
  0.7,
  (SH * 0.85) / Math.max(...CARD_DEFS.map(d => d.fh)),
  (SW * 0.38) / Math.max(...CARD_DEFS.map(d => d.fw))
);

// =============================================
//  ENGINE
// =============================================
const engine = Engine.create({
  gravity: { x: 0, y: 2 }
});
const world = engine.world;

// Suelo y paredes — estáticos, invisibles
function makeWalls(sw, sh) {
  return [
    Bodies.rectangle(sw / 2, sh + 30, sw * 4, 60, { isStatic: true, friction: 0.8, restitution: 0.05 }),   // suelo
    Bodies.rectangle(-30, sh / 2, 60, sh * 4, { isStatic: true }),   // pared izq
    Bodies.rectangle(sw + 30, sh / 2, 60, sh * 4, { isStatic: true }), // pared der
  ];
}
let walls = makeWalls(SW, SH);
World.add(world, walls);

// =============================================
//  CARDS — cuerpos físicos + DOM
// =============================================
let totalW = CARD_DEFS.reduce((s, d) => s + Math.round(d.fw * scale), 0) + 24 * (CARD_DEFS.length - 1);
let startX = (SW - totalW) / 2;

const cardItems = CARD_DEFS.map((def, i) => {
  const el = document.getElementById(def.id);
  const w  = Math.round(def.fw * scale);
  const h  = Math.round(def.fh * scale);

  el.style.width  = w + 'px';
  el.style.height = h + 'px';
  el.style.opacity = '0';
  setTimeout(() => {
    el.style.transition = 'opacity 0.4s ease';
    el.style.opacity = '1';
  }, 100 + i * 180);

  // Posición inicial: justo por debajo del borde inferior visible,
  // con gravedad negativa suben un poco antes de asentarse
  // → en realidad las ponemos encima del suelo y les damos impulso hacia arriba
  const cx = startX + w / 2;
  const cy = SH - h / 2 - 5;  // justo en el suelo
  startX += w + 24;

  const randomAngle = (Math.random() - 0.5) * 0.25;
  const body = Bodies.rectangle(cx, cy, w, h, {
    restitution: 0.05,
    friction: 0.8,
    frictionAir: 0.03,
    density: 0.003,
    angle: randomAngle,
    render: { visible: false },
  });

  // Impulso inicial: salen disparadas desde abajo y caen
  Body.setVelocity(body, {
    x: (Math.random() - 0.5) * 5,
    y: -(8 + Math.random() * 4),  // impulso hacia arriba
  });
  Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.08);

  World.add(world, body);
  return { el, body, w, h, def, isDragging: false };
});

// =============================================
//  MOUSE CONSTRAINT — drag con spring
// =============================================
const stage = document.getElementById('stage');

const mouse = Mouse.create(stage);
// CRÍTICO: compensar el offset del nav
mouse.offset = { x: 0, y: NAV_H };

const mc = MouseConstraint.create(engine, {
  mouse,
  constraint: {
    stiffness: 0.2,   // sigue al ratón con un poco de inercia
    damping: 0.2,
    render: { visible: false },
  },
});
World.add(world, mc);

// =============================================
//  HOVER — notificación y opacidad
// =============================================
const notif      = document.getElementById('notif');
const notifIcon  = document.getElementById('notif-icon');
const notifTitle = document.getElementById('notif-title');
const notifSub   = document.getElementById('notif-sub');

let draggingNow = false;

function setOpacity(activeEl) {
  cardItems.forEach(c => {
    c.el.style.transition = 'opacity 0.25s ease';
    c.el.style.opacity = c.el === activeEl ? '1' : '0.2';
  });
}
function clearOpacity() {
  cardItems.forEach(c => {
    c.el.style.transition = 'opacity 0.25s ease';
    c.el.style.opacity = '1';
  });
}

cardItems.forEach(({ el, def }) => {
  el.addEventListener('mouseenter', () => {
    if (draggingNow) return;
    notifIcon.textContent  = def.icon || '✦';
    notifTitle.textContent = el.dataset.title || '';
    notifSub.textContent   = el.dataset.sub   || '';
    notif.classList.add('visible');
    setOpacity(el);
  });
  el.addEventListener('mouseleave', () => {
    if (draggingNow) return;
    notif.classList.remove('visible');
    clearOpacity();
  });
});

Events.on(mc, 'startdrag', () => {
  draggingNow = true;
  notif.classList.remove('visible');
  clearOpacity();
  // Subir z-index del cuerpo arrastrado
  if (mc.body) {
    const item = cardItems.find(c => c.body === mc.body);
    if (item) item.el.style.zIndex = 999;
  }
});

Events.on(mc, 'enddrag', () => {
  draggingNow = false;
});

// =============================================
//  CLICK TO NAVIGATE — only if not dragged
// =============================================
const CARD_LINKS = {
  'card-1': 'fdl-case-study.html',
  'card-2': 'fdl-design-system.html',
};

cardItems.forEach(({ el, def }) => {
  let mouseDownPos = null;

  el.addEventListener('mousedown', (e) => {
    mouseDownPos = { x: e.clientX, y: e.clientY };
  });

  el.addEventListener('mouseup', (e) => {
    if (!mouseDownPos) return;
    const dx = e.clientX - mouseDownPos.x;
    const dy = e.clientY - mouseDownPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    mouseDownPos = null;
    if (dist < 5 && CARD_LINKS[def.id]) {
      window.location.href = CARD_LINKS[def.id];
    }
  });
});

// =============================================
//  LOOP — sincronizar DOM con física
// =============================================
let zBase = 10;

function sync() {
  cardItems.forEach(({ el, body, w, h }) => {
    const { x, y } = body.position;
    el.style.left      = (x - w / 2) + 'px';
    el.style.top       = (y - h / 2) + 'px';
    el.style.transform = `rotate(${body.angle}rad)`;
  });
  requestAnimationFrame(sync);
}

// =============================================
//  ARRANCAR
// =============================================
const runner = Runner.create();
Runner.run(runner, engine);
sync();

// =============================================
//  RESIZE
// =============================================
window.addEventListener('resize', () => {
  const nSW = window.innerWidth;
  const nSH = window.innerHeight - NAV_H;
  walls.forEach(w => World.remove(world, w));
  walls = makeWalls(nSW, nSH);
  World.add(world, walls);
});