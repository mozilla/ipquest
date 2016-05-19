(function() {
  var WIDTH = 256,
    HEIGHT = 144,
    SCALE = 3,
    HORIZON = 48,
    running = false,
    kb = new KeyboardControls(),
    buffer, boardCanvas, context, outCtx,
    dialogue,
    board,
    viewX = 0,
    viewY = 0,
    sheet, chars,
    dude,
    x, y;

  var gameEl = document.querySelector('#game');
  gameEl.style.width = SCALE * WIDTH + 'px';
  gameEl.style.height = SCALE * HEIGHT + 'px';

  var requestFrame = (function() {
    return window.requestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      function(callback) {
        setTimeout(callback, 30);
      };
  })();

  var lastTrigger = 0;
  var leftTrigger = true;
  var dialogueCoolDown = 0;

  function tick() {
    if (!running) return;

    var ox = x;
    var oy = y;
    var tick = (new Date()).getTime();
    var d = 1;
    var walk = 0;
    var dir = 0;
    var view = board.getView();

    dude.walk(0);

    if (kb.keys[kb.LEFT]) {
      dude.face(1);
      dude.walk(1);
      if (board.test(x + 3 - d, y + 8) && board.test(x + 3 - d, y + 15)) {
        x -= d;
      }
    }
    if (kb.keys[kb.RIGHT]) {
      dude.face(3);
      dude.walk(1);
      if (board.test(x + 12 + d, y + 8) && board.test(x + 12 + d, y + 15)) {
        x += d;
      }
    }
    if (kb.keys[kb.DOWN]) {
      dude.face(0);
      dude.walk(1);
      if (board.test(x + 3, y + 15 + d) && board.test(x + 12, y + 15 + d)) {
        y += d;
      }
    }
    if (kb.keys[kb.UP]) {
      dude.face(2);
      dude.walk(1);
      if (board.test(x + 3, y + 8 - d) && board.test(x + 12, y + 8 - d)) {
        y -= d;
      }
    }

    // This is a hack so some interiors and dungeons don't pan.
    if (x < 192 * 16) {
      if (x > board.viewX() + WIDTH - HORIZON - 16) {
        board.pan(d, 0);
      }
      if (y > board.viewY() + HEIGHT - HORIZON - 16) {
        board.pan(0, d);
      }
      if (x < board.viewX() + HORIZON) {
        board.pan(-d, 0);
      }
      if (y < board.viewY() + HORIZON) {
        board.pan(0, -d);
      }
    }

    board.update();

    if (dialogueCoolDown > 0) {
      dialogueCoolDown--;
    }

    var trigger = board.getTrigger(x + 3, y + 8, 9, 7);
    if (trigger) {
      if (trigger.destination && (trigger !== lastTrigger || leftTrigger) && leftTrigger) {
        board.centerTo(trigger.center);
        var pos = board.toCoords(trigger.destination);
        x = pos.x;
        y = pos.y;
      }
      if (trigger.dialogue && trigger.dialogue !== 'NOOP') {
        if (trigger.entity && !trigger.auto) {
          trigger.entity.prompt = true;
        }
        if (trigger.auto || (kb.keys[kb.SPACE] && dialogueCoolDown === 0)) {
          stop();
          dialogue.chat(trigger.dialogue, function (change) {
            dialogueCoolDown = 20;
            trigger.entity.prompt = null;
            if (change === 'GAMEOVER') {
              stop();
              setTimeout(titleScreen, 0);
              return;
            }
            if (change) {
              trigger.dialogue = change;
            }
            start();
          });
        }
      }
      lastTrigger = trigger;
      leftTrigger = false;
    }
    if (!trigger) {
      leftTrigger = true;
      if (lastTrigger && lastTrigger.entity) {
        lastTrigger.entity.prompt = null;
      }
    }

    lastTick = tick;
  }


  function mapRect(map, px, py, s, w, h) {
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        map[(x + px) + (y + py) * 256] = (s + x + y * 20);
      }
    }
  }

  var startTime;
  var tickCount = 0;
  var isPaused = false;
  function start() {
    if (running) return;
    running = true;
    tickCount = 0;
    startTime = Date.now();
    loop();
  }

  function loop() {
    if (document.hidden) {
      pause();
      return;
    }
    var time = Date.now();
    var tickGoal = (time - startTime) / 10;
    while (tickCount < tickGoal) {
      tick();
      tickCount++;
    }
    render();
    if (running) {
      requestFrame(loop, canvas);
    }
  }

  function pause() {
    console.log('pause');
    stop();
    isPaused = true;
    function poll() {
      if (document.hidden) {
        setTimeout(poll, 100);
      } else {
        console.log('unpause');
        isPaused = false;
        start();
      }
    }
    poll();
  }

  function stop() {
    running = false;
  }

  function render() {
    board.render();
    context.fillRect(0,0,WIDTH*SCALE,HEIGHT*SCALE);
    context.drawImage(board.getBGCanvas(), 0, 0);
    var view = board.getView();
    dude.render(context, x - view.x, y - view.y);
    context.drawImage(board.getFGCanvas(), 0, 0);
    outCtx.drawImage(buffer, 0, 0);
  }

  function setup() {
    buffer = document.createElement('canvas');
    buffer.width = WIDTH * SCALE;
    buffer.height = HEIGHT * SCALE;

    canvas = document.createElement('canvas');
    canvas.width = WIDTH * SCALE;
    canvas.height = HEIGHT * SCALE;
    outCtx = canvas.getContext('2d');

    context = buffer.getContext('2d');
    context.mozImageSmoothingEnabled = false;
    context.scale(SCALE, SCALE);

    gameEl.appendChild(canvas);
  }

  function startGame() {
    x = 47 * 16;
    y = 50 * 16;



    sheet = new SpriteSheet(Loader.get('tiles'), 16);
    chars = new SpriteSheet(Loader.get('characters'), 16);
    dude = new Dude(chars, 0);

    dialogue = new Dialogue(Loader.get('dialogue'), WIDTH, HEIGHT);

    var map = Loader.get('map');

    board = new Screen(map, 16, WIDTH, HEIGHT, sheet);
    board.centerTo(x / 16, y / 16);

    Loader.get('entities').forEach(function (e) {
      if (e.speed) {
        board.addEntity(new Entity(sheet, e));
      } else {
        board.addEntity(new Entity(chars, e));
      }
    });


    start();
  }

  function wait(ms) {
    return function () {
      return new Promise(function (resolve, reject) {
        setTimeout(resolve, ms);
      });
    };
  }

  var progressEl = document.querySelector('.progress-inner');
  function loadProgress(a, b) {
    var pct = a / b * 100;
    progressEl.style.width = pct + '%';
  }

  function titleScreen() {
    var splashEl = document.querySelector('.splash');
    splashEl.style.display = 'block';
    splashEl.classList.add('ready');
    return new Promise(function (resolve, reject) {
      function handle(e) {
        if (e.keyCode === kb.SPACE) {
          window.removeEventListener('keydown', handle, false);
          splashEl.classList.add('crazy');
          resolve();
        }
      }
      window.addEventListener('keydown', handle, false);
    }).then(wait(500)).then(function () {
      splashEl.style.display = 'none';
      splashEl.classList.remove('crazy');
    }).then(startGame).catch(console.error.bind(console));
  }

  if (window.location.search === '?debug') {
    window.DEBUG = true;
  }

  window.addEventListener('load', function() {
    var data = "data:audio/ogg;base64,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";
    var audio = new Audio(data);
    audio.play();
    var loading = Loader.load([
      {
        name: 'tiles',
        type: 'image',
        url: 'img/tilesheet.png'
      },
      {
        name: 'characters',
        type: 'image',
        url: 'img/characters.png'
      },
      {
        name: 'map',
        type: 'json',
        url: 'map.json'
      },
      {
        name: 'dialogue',
        type: 'dlg',
        url: 'tree.dlg'
      },
      {
        name: 'entities',
        type: 'json',
        url: 'entities.json'
      }
    ], loadProgress);

    Promise.all([
      wait(1000)(),
      loading
    ]).then(setup).then(titleScreen).catch(console.error.bind(console));
  });
})();
