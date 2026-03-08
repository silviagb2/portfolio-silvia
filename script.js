const { Engine, Runner, Bodies, Body, World, Mouse, MouseConstraint, Events } = Matter;

const NAV_H = 96;

const CARD_DEFS = [
  { id: 'card-1', fw: 700, fh: 600, icon: '👩🏻‍🍳' },
  { id: 'card-2', fw: 550, fh: 500, icon: '🧩'  },
  { id: 'card-3', fw: 380, fh: 572, icon: '🚧'  },
];

const CARD_LINKS = {
  'card-1': 'fdl-case-study.html',
  'card-2': 'fdl-design-system.html',
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

  const scale = Math.min(
    0.7,
    (SH * 0.85) / Math.max(...CARD_DEFS.map(d => d.fh)),
    (SW * 0.38) / Math.max(...CARD_DEFS.map(d => d.fw))
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
    const w  = Math.round(def.fw * scale);
    const h  = Math.round(def.fh * scale);

    el.style.width  = w + 'px';
    el.style.height = h + 'px';
    el.style.opacity = '0';
    setTimeout(() => {
      el.style.transition = 'opacity 0.4s ease';
      el.style.opacity = '1';
    }, 100 + i * 180);

    const cx = startX + w / 2;
    const cy = SH - h / 2 - 5;
    startX += w + 24;

    const randomAngle = (Math.random() - 0.5) * 0.25;
    const body = Bodies.rectangle(cx, cy, w, h, {
      restitution: 0.05, friction: 0.8, frictionAir: 0.03,
      density: 0.003, angle: randomAngle, render: { visible: false },
    });

    Body.setVelocity(body, { x: (Math.random() - 0.5) * 5, y: -(8 + Math.random() * 4) });
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.08);

    World.add(world, body);
    return { el, body, w, h, def, isDragging: false };
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

  function sync() {
    cardItems.forEach(({ el, body, w, h }) => {
      const { x, y } = body.position;
      el.style.left      = (x - w / 2) + 'px';
      el.style.top       = (y - h / 2) + 'px';
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
