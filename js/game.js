(function() {
  var WIDTH = 256,
    HEIGHT = 144,
    SCALE = 3,
    running = false,
    kb = new KeyboardControls(),
    buffer, boardCanvas, context, outCtx,
    board,
    viewX = 0,
    viewY = 0,
    sprite,
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

  function tick() {
    var ox = x,
      oy = y,
      tick = (new Date()).getTime(),
      d = 2;
    if (kb.keys[kb.LEFT] && board.test(x + 3 - d, y + 3) && board.test(x + 3 - d, y + 12)) {
      x -= d;
    }
    if (kb.keys[kb.RIGHT] && board.test(x + 12 + d, y + 3) && board.test(x + 12 + d, y + 12)) {
      x += d;
    }
    if (kb.keys[kb.DOWN] && board.test(x + 3, y + 12 + d) && board.test(x + 12, y + 12 + d)) {
      y += d;
    }
    if (kb.keys[kb.UP] && board.test(x + 3, y + 3 - d) && board.test(x + 12, y + 3 - d)) {
      y -= d;
    }

    if (x + 32 > WIDTH) {
      if (board.pan(d, 0)) {
        x = WIDTH - 32;
      }
    }
    if (y + 32 > HEIGHT) {
      if (board.pan(0, d)) {
        y = HEIGHT - 32;
      }
    }
    if (x < 16) {
      if (board.pan(-d, 0)) {
        x = 16;
      }
    }
    if (y < 16) {
      if (board.pan(0, -d)) {
        y = 16;
      }
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
    context.fillStyle = "#000";
    context.beginPath();
    context.fillRect(x + 3, y, 10, 14);
    context.fill();
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

    var map = Loader.get('map');

    board = new Screen(map, 16, WIDTH, HEIGHT, sheet);

    context = buffer.getContext('2d');
    context.mozImageSmoothingEnabled = false;
    context.scale(SCALE, SCALE);

    $(window).keydown(function() {
      if (kb.letter('q'))
        board.incMapAtCursor(x, y);
    });
    $("#game").append(canvas);

    window.map = map;
    start();
  }

  $(function() {
    Loader.load([
      {
        name: 'tiles',
        type: 'image',
        url: 'img/tilesheet.png'
      },
      {
        name: 'map',
        type: 'json',
        url: 'map.json'
      }
    ]).then(init).catch(console.error.bind(console));
  });
})();
