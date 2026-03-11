const { Engine, Runner, Bodies, Body, World, Mouse, MouseConstraint, Events } = Matter;

const NAV_H = 96;

const CARD_DEFS = [
  { id: 'card-1', fw: 700, fh: 600, icon: '👩🏻‍🍳' },
  { id: 'card-2', fw: 550, fh: 500, icon: '🧩'  },
  { id: 'card-3', fw: 380, fh: 572, icon: '🚧'  },
  { id: 'card-4', fw: 394, fh: 259, icon: '👋'  },
];

const CARD_LINKS = {
  'card-1': 'fdl-case-study.html',
  'card-2': 'fdl-design-system.html',
  'card-4': 'about.html',
};

const isMobile = window.innerWidth <= 768;

// =============================================
//  MOBILE — layout estático, tap to navigate
// =============================================
if (isMobile) {
  const SW = window.innerWidth;
  const stage = document.getElementById('stage');
  stage.classList.add('stage--mobile');
  document.documentElement.style.overflow = 'auto';
  document.documentElement.style.height = 'auto';
  document.body.style.overflow = 'auto';
  document.body.style.height = 'auto';

  const mobileW = Math.min(SW * 0.88, 380);

  CARD_DEFS.forEach((def, i) => {
    const el = document.getElementById(def.id);
    const cardW = def.id === 'card-3' ? Math.round(mobileW * 0.65) : mobileW;
    const mobileH = Math.round(cardW * def.fh / def.fw);
    el.style.width  = cardW + 'px';
    el.style.height = mobileH + 'px';
    el.style.opacity = '0';
    setTimeout(() => {
      el.style.transition = 'opacity 0.4s ease';
      el.style.opacity = '1';
    }, 100 + i * 200);

    if (CARD_LINKS[def.id]) {
      el.addEventListener('click', () => {
        window.location.href = CARD_LINKS[def.id];
      });
    } else {
      const notif      = document.getElementById('notif');
      const notifIcon  = document.getElementById('notif-icon');
      const notifTitle = document.getElementById('notif-title');
      const notifSub   = document.getElementById('notif-sub');
      let notifTimeout = null;

      el.addEventListener('click', () => {
        notifIcon.textContent  = el.dataset.icon  || '✦';
        notifTitle.textContent = el.dataset.title || '';
        notifSub.textContent   = el.dataset.sub   || '';
        notif.classList.add('visible');
        clearTimeout(notifTimeout);
        notifTimeout = setTimeout(() => notif.classList.remove('visible'), 2500);
      });
    }
  });

// =============================================
//  DESKTOP — física real, DOM sincronizado
// =============================================
} else {
  const SW = window.innerWidth;
  const SH = window.innerHeight - NAV_H;

  const mainCards = CARD_DEFS.filter(d => d.id !== 'card-4');
  const totalFW = mainCards.reduce((s, d) => s + d.fw, 0) + 24 * (mainCards.length - 1);
  const maxScale = SW > 1600 ? 0.88 : 0.7;
  const scale = Math.min(
    maxScale,
    (SH * 0.85) / Math.max(...CARD_DEFS.map(d => d.fh)),
    (SW * 0.92) / totalFW
  );

  const engine = Engine.create({ gravity: { x: 0, y: 2 } });
  const world = engine.world;

  function makeWalls(sw, sh) {
    return [
      Bodies.rectangle(sw / 2, sh + 30, sw * 4, 60, { isStatic: true, friction: 0.8, restitution: 0.05 }),
      Bodies.rectangle(-30, sh / 2, 60, sh * 4, { isStatic: true }),
      Bodies.rectangle(sw + 30, sh / 2, 60, sh * 4, { isStatic: true }),
    ];
  }
  let walls = makeWalls(SW, SH);
  World.add(world, walls);

  let totalW = CARD_DEFS.reduce((s, d) => s + Math.round(d.fw * scale), 0) + 24 * (CARD_DEFS.length - 1);
  let startX = (SW - totalW) / 2;

  const cardItems = CARD_DEFS.map((def, i) => {
    const el = document.getElementById(def.id);
    const isBio = def.id === 'card-4';
    const w  = isBio ? def.fw : Math.round(def.fw * scale);
    const h  = isBio ? def.fh : Math.round(def.fh * scale);

    el.style.width = w + 'px';
    if (!isBio) el.style.height = h + 'px';
    el.style.opacity = '1';

    const actualH = isBio ? el.offsetHeight : h;
    const cx = isBio ? SW * 0.38 : startX + w / 2 + (Math.random() - 0.5) * 80;
    const cy = -h / 2 - 60 - i * 220;
    if (!isBio) startX += w + 24;

    const randomAngle = (Math.random() - 0.5) * (isBio ? 0.2 : 0.3);
    const body = Bodies.rectangle(cx, cy, w, actualH, {
      restitution: 0.3, friction: 0.6, frictionAir: 0.018,
      density: 0.003, angle: randomAngle, render: { visible: false },
    });

    Body.setVelocity(body, { x: isBio ? 0.5 : (Math.random() - 0.5) * 3, y: 0 });
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.06);

    World.add(world, body);
    return { el, body, w, h: actualH, def, isDragging: false };
  });

  const stage = document.getElementById('stage');
  const mouse = Mouse.create(stage);
  mouse.offset = { x: 0, y: NAV_H };

  const mc = MouseConstraint.create(engine, {
    mouse,
    constraint: { stiffness: 0.2, damping: 0.2, render: { visible: false } },
  });
  World.add(world, mc);

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
    if (mc.body) {
      const item = cardItems.find(c => c.body === mc.body);
      if (item) item.el.style.zIndex = 999;
    }
  });
  Events.on(mc, 'enddrag', () => { draggingNow = false; });

  cardItems.forEach(({ el, def }) => {
    let mouseDownPos = null;
    el.addEventListener('mousedown', (e) => { mouseDownPos = { x: e.clientX, y: e.clientY }; });
    el.addEventListener('mouseup', (e) => {
      if (!mouseDownPos) return;
      const dx = e.clientX - mouseDownPos.x;
      const dy = e.clientY - mouseDownPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      mouseDownPos = null;
      if (dist < 5 && CARD_LINKS[def.id]) window.location.href = CARD_LINKS[def.id];
    });
  });

  // ── CAT SYSTEM ──────────────────────────────
  const CAT_SRCS = [
    'images/Rosi/Rosi-01.png',
    'images/Rosi/Rosi-02.png',
    'images/Rosi/Rosi-03.png',
    'images/Rosi/Rosi-04.png',
    'images/Rosi/Rosi-05.png',
    'images/Rosi/Rosi-06.png',
    'images/Rosi/Rosi-07.png',
  ];
  const catItems = [];
  let catIndex = 0;
  let clickCount = 0;
  const CAT_W = 180;

  const multiplyWrap = document.querySelector('#card-4 .bio-multiply-wrap');
  const multiplyBtn  = multiplyWrap && multiplyWrap.querySelector('.bio-multiply-btn');

  function updateBtnText() {
    if (!multiplyBtn) return;
    if (catIndex >= CAT_SRCS.length) {
      multiplyBtn.textContent = "Okay, that's enough cats.";
    } else if (clickCount >= 4) {
      multiplyBtn.textContent = 'Still want more?';
    } else {
      multiplyBtn.textContent = 'Show me the cat';
    }
  }

  function resetCats() {
    catItems.forEach(({ el, body }) => { World.remove(world, body); el.remove(); });
    catItems.length = 0;
    catIndex = 0;
    clickCount = 0;
    updateBtnText();
  }

  function spawnCat() {
    if (catIndex >= CAT_SRCS.length) return;
    const thisIndex = catIndex;
    const zoneW = SW / CAT_SRCS.length;
    const x = zoneW * thisIndex + zoneW / 2 + (Math.random() - 0.5) * zoneW * 0.4;

    const el = document.createElement('div');
    el.className = 'cat-drop';
    el.style.zIndex = '1000';
    el.style.width  = CAT_W + 'px';
    const img = document.createElement('img');
    img.src = CAT_SRCS[catIndex++];
    img.alt = '';
    img.style.width  = '100%';
    img.style.height = 'auto';
    img.style.display = 'block';
    el.appendChild(img);
    el.style.left = '-9999px';
    el.style.top  = '-9999px';
    stage.appendChild(el);

    img.onload = () => {
      const catH = el.offsetHeight;
      el.style.left = '';
      el.style.top  = '';

      const body = Bodies.rectangle(x, -catH / 2 - 60, CAT_W, catH, {
        restitution: 0.45, friction: 0.5, frictionAir: 0.015,
        density: 0.001, render: { visible: false },
      });
      Body.setVelocity(body, { x: (Math.random() - 0.5) * 3, y: 1 });
      World.add(world, body);
      catItems.push({ el, body, w: CAT_W, size: catH });
    };
  }

  if (multiplyWrap) {
    multiplyWrap.addEventListener('mousedown', (e) => e.stopPropagation());
    multiplyWrap.addEventListener('click', (e) => {
      e.stopPropagation();
      if (catIndex >= CAT_SRCS.length) { resetCats(); return; }
      spawnCat();
      clickCount++;
      updateBtnText();
    });
  }
  // ────────────────────────────────────────────

  function sync() {
    cardItems.forEach(({ el, body, w, h }) => {
      const { x, y } = body.position;
      el.style.left      = (x - w / 2) + 'px';
      el.style.top       = (y - h / 2) + 'px';
      el.style.transform = `rotate(${body.angle}rad)`;
    });
    catItems.forEach(({ el, body, w, size }) => {
      const { x, y } = body.position;
      el.style.left      = (x - w / 2) + 'px';
      el.style.top       = (y - size / 2) + 'px';
      el.style.transform = `rotate(${body.angle}rad)`;
    });
    requestAnimationFrame(sync);
  }

  const runner = Runner.create();
  Runner.run(runner, engine);
  sync();

  window.addEventListener('resize', () => {
    const nSW = window.innerWidth;
    const nSH = window.innerHeight - NAV_H;
    walls.forEach(w => World.remove(world, w));
    walls = makeWalls(nSW, nSH);
    World.add(world, walls);
  });
}
