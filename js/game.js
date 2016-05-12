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

  function tick() {
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

    var trigger = board.getTrigger(x + 3, y + 8, 9, 7);
    if (trigger && (trigger !== lastTrigger || leftTrigger) && leftTrigger) {
      if (trigger.destination) {
        board.centerTo(trigger.center);
        var pos = board.toCoords(trigger.destination);
        x = pos.x;
        y = pos.y;
      }
      if (trigger.dialogue && trigger.dialogue !== 'NOOP') {
        stop();
        dialogue.chat(trigger.dialogue, function (change) {
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
      lastTrigger = trigger;
      leftTrigger = false;
    }
    if (!trigger) {
      leftTrigger = true;
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
	
	// possible new starting values
	x = 74 * 16;
	y = 54 * 16;
	
	
    sheet = new SpriteSheet(Loader.get('tiles'), 16);
    chars = new SpriteSheet(Loader.get('characters'), 16);
    dude = new Dude(chars, 0);

    dialogue = new Dialogue(Loader.get('dialogue'), WIDTH, HEIGHT);

    var map = Loader.get('map');

    board = new Screen(map, 16, WIDTH, HEIGHT, sheet);
    board.centerTo(x / 16, y / 16);

    Loader.get('entities').forEach(function (e) {
      board.addEntity(new Entity(chars, e));
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
      wait(1000),
      loading
    ]).then(setup).then(titleScreen).catch(console.error.bind(console));
  });
})();
