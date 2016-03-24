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
    lastTick,
    x, y;

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
    var d = 2;
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
      if (trigger.dialogue) {
        stop();
        dialogue.chat(trigger.dialogue, start);
      }
      lastTrigger = trigger;
      leftTrigger = false;
    }
    if (!trigger) {
      leftTrigger = true;
    }

    lastTick = tick;
  }

  function fakeMap(width, height, fill) {
    var map = [];
    for (var i = 0; i < width * height; i++) {
      map[i] = fill || ~~(Math.random() * sheet.tileCount);
    }
    return map;
  }

  function mapRect(map, px, py, s, w, h) {
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        map[(x + px) + (y + py) * 256] = (s + x + y * 20);
      }
    }
  }

  function start() {
    running = true;
    lastTick = (new Date()).getTime();
    loop();
  }

  function loop() {
    tick();
    render();
    if (running) {
      requestFrame(loop, canvas);
    }
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

  function init() {
    console.log('all did');
    x = 0;
    y = 0;

    buffer = document.createElement('canvas');
    buffer.width = WIDTH * SCALE;
    buffer.height = HEIGHT * SCALE;

    canvas = document.createElement('canvas');
    canvas.width = WIDTH * SCALE;
    canvas.height = HEIGHT * SCALE;
    outCtx = canvas.getContext('2d');


    sheet = new SpriteSheet(Loader.get('tiles'), 16);
    chars = new SpriteSheet(Loader.get('characters'), 16);
    dude = new Dude(chars, 0);

    dialogue = new Dialogue(Loader.get('dialogue'), WIDTH, HEIGHT);
    // setTimeout(function () {
    //   stop();
    //   dialogue.chat('legion-1', start);
    // }, 3000);

    var map = Loader.get('map');

    board = new Screen(map, 16, WIDTH, HEIGHT, sheet);

    Loader.get('entities').forEach(function (e) {
      board.addEntity(new Entity(chars, e));
    });

    context = buffer.getContext('2d');
    context.mozImageSmoothingEnabled = false;
    context.scale(SCALE, SCALE);

    var gameEl = document.querySelector('#game');
    game.appendChild(canvas);
    game.style.width = SCALE * WIDTH + 'px';
    game.style.height = SCALE * HEIGHT + 'px';

    window.map = map;
    start();
  }

  window.addEventListener('load', function() {
    Loader.load([
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
    ], console.log.bind(console)).then(init).catch(console.error.bind(console));
  });
})();
