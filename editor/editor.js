var tileSize = 16;

var WIDTH = 64;
var HEIGHT = 64;
var ZOOM = 3;

var canvas = document.querySelector('.out');
var ctx = canvas.getContext('2d');

var visibleMode = false;
var paintMode = false;

var selectedLayer = document.querySelector('[name="layer"][checked]').value;
var menuEl = document.querySelector('.menu');
menuEl.addEventListener('click', function (e) {
  if (e.target.name && e.target.name === 'layer') {
    selectedLayer = e.target.value;
    console.log(selectedLayer);
  }
});

var map;
var entities;

var tiles = document.querySelector('.tiles img');
var characters;
var sheetWidth;

var selectedTile = 0;

function init () {
  map = Loader.get('map');
  if (false && !map) {
    console.log('invalid map');
    map = {
      width: 256,
      height: 256,
    };
    var size = map.width * map.height;
    map.background = Array(size).fill(0);
    map.terrain = Array(size).fill(0);
    map.foreground = Array(size).fill(0);
    map.collision = Array(size).fill(0);

  }

  if (!map.trigger || map.trigger.length) {
    map.trigger = {};
  }

  WIDTH = map.width;
  HEIGHT = map.height;

  sheetWidth = tiles.width / 16 | 0;

  canvas.width = WIDTH * tileSize;
  canvas.style.width = canvas.width * ZOOM + 'px';
  canvas.height = HEIGHT * tileSize;
  canvas.style.height = canvas.height * ZOOM + 'px';

  characters = Loader.get('characters');
  entities = {};
  Loader.get('entities').forEach(function (e) {
    entities[WIDTH * e.position[1] + e.position[0]] = e;
  });
  console.log(entities);

  renderRegion();
}

function render(x, y, w, h) {
  ctx.fillStyle = '#000';
  ctx.fillRect(x * tileSize, y * tileSize, w * tileSize, h * tileSize);

  var i, t, sx, sy;
  for (var dy = y; dy < y + h + 1; dy++) {
    for (var dx = x; dx < x + w + 1; dx++) {
      i = dy * WIDTH + dx;
      t = map.background[i];
      sx = t % sheetWidth;
      sy = t / sheetWidth | 0;
      if (!visibleMode || selectedLayer === 'background') {
        ctx.drawImage(tiles, sx * tileSize, sy * tileSize, tileSize, tileSize, dx * tileSize, dy * tileSize, tileSize, tileSize);
      }

      t = map.terrain[i];
      sx = t % sheetWidth;
      sy = t / sheetWidth | 0;
      if (!visibleMode || selectedLayer === 'terrain') {
        ctx.drawImage(tiles, sx * tileSize, sy * tileSize, tileSize, tileSize, dx * tileSize, dy * tileSize, tileSize, tileSize);
      }

      t = map.foreground[i];
      sx = t % sheetWidth;
      sy = t / sheetWidth | 0;
      if (!visibleMode || selectedLayer === 'foreground') {
        ctx.drawImage(tiles, sx * tileSize, sy * tileSize, tileSize, tileSize, dx * tileSize, dy * tileSize, tileSize, tileSize);
      }

      t = map.collision[i];
      if (!visibleMode || selectedLayer === 'collision') {
        ctx.fillStyle = 'rgba(255,0,0,.3)';
        if (t) ctx.fillRect(dx * tileSize, dy * tileSize, tileSize, tileSize);
      }

      t = map.trigger[i];
      if (!visibleMode || selectedLayer === 'trigger') {
        ctx.fillStyle = 'rgba(0,0,255,.3)';
        if (t) ctx.fillRect(dx * tileSize, dy * tileSize, tileSize, tileSize);
      }
    }
  }
  if (!visibleMode || selectedLayer === 'entities') {
    for (var dy = y; dy < y + h + 1; dy++) {
      for (var dx = x; dx < x + w + 1; dx++) {
        i = dy * WIDTH + dx;
        t = entities[i];
        if (t && t.sprite) {
          sx = t.sprite % (characters.width / 16);
          sy = t.sprite / (characters.width / 16) | 0;
          ctx.drawImage(characters, sx * tileSize, sy * tileSize, tileSize, tileSize, dx * tileSize, dy * tileSize, tileSize, tileSize);
          ctx.strokeRect(dx * tileSize + 1, dy * tileSize + 1, tileSize - 2, tileSize - 2);
          if (t.region) {
            ctx.fillStyle = 'rgba(255,255,0,.3)';
            ctx.fillRect(t.region[0] * tileSize, t.region[1] * tileSize, t.region[2] * tileSize, t.region[3] * tileSize);
          }
        }
      }
    }
  }
}

var mapEl = document.querySelector('.map div');
var sample = 0;
var startX, startY;
var triggerSetWaiting = false;
function draw(e) {
  var x = e.offsetX / tileSize / ZOOM | 0;
  var y = e.offsetY / tileSize / ZOOM | 0;
  selectedOffset = y * WIDTH + x;
  if (selectedLayer === 'collision') {
    map.collision[selectedOffset] = 1 - map.collision[selectedOffset];
  } else if (selectedLayer === 'trigger') {
    if (!triggerSetWaiting && map.trigger[selectedOffset]) {
      delete map.trigger[selectedOffset];
    } else {
      if (triggerSetWaiting) {
        if (!triggerSetWaiting.destination) {
          triggerSetWaiting.destination = selectedOffset;
        } else if (!triggerSetWaiting.center) {
          triggerSetWaiting.center = selectedOffset;
          triggerSetWaiting = false;
        } else {
          // this shouldn't happen but meh
          triggerSetWaiting = false;
        }
      } else {
        map.trigger[selectedOffset] = {};
        triggerSetWaiting = map.trigger[selectedOffset];
      }
    }
  } else {
    if (paintMode) {
      var newTile = selectedTile + (x - startX) + (y- startY) * 20;
      map[selectedLayer][selectedOffset] = newTile;
    } else {
      map[selectedLayer][selectedOffset] = selectedTile;
    }
  }
  save();
  renderRegion();
}

var drawing = false;
var debugEl = document.querySelector('.info');
mapEl.addEventListener('mousemove', function (e) {
  var x = e.offsetX / tileSize / ZOOM | 0;
  var y = e.offsetY / tileSize / ZOOM | 0;
  var selectedOffset = y * WIDTH + x;
  debugEl.innerHTML = 'x: ' + x + " y: " + y + " pos: " + selectedOffset;
  debugEl.innerHTML += ' tile: ' + selectedTile;
  if (paintMode) {
    debugEl.innerHTML += ' PAINT';
  }
  if (drawing) {
    if (selectedLayer === 'collision') {
      map.collision[selectedOffset] = sample;
      save();
      renderRegion();
    } else if (selectedLayer === 'trigger') {
      return;
    } else {
      draw(e);
    }
  }
});
mapEl.addEventListener('mousedown', function (e) {
  if (!drawing) {
    var x = e.offsetX / tileSize / ZOOM | 0;
    var y = e.offsetY / tileSize / ZOOM | 0;
    startX = x;
    startY = y;
    selectedOffset = y * WIDTH + x;
    sample = 1 - map.collision[selectedOffset];
    drawing = true;
  }
});
mapEl.addEventListener('mouseup', function (e) {
  drawing = false;
});
mapEl.addEventListener('click', draw);

var saveTimeout;
function save() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(doSave, 1000);
}

function doSave() {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/editor/save");
  xhr.setRequestHeader("Content-type", "application/json");
  xhr.send(JSON.stringify(map));
}

var highlight = document.querySelector('.highlight');
tiles.addEventListener('click', function (e) {
  var x = e.offsetX / tileSize | 0;
  var y = e.offsetY / tileSize | 0;
  highlight.style.left = x * tileSize + tiles.offsetLeft + 'px';
  highlight.style.top = y * tileSize + tiles.offsetTop + 'px';
  selectedTile = x + y * sheetWidth;
});

window.addEventListener('keydown', function (e) {
  if (!(e.shiftKey || e.metaKey || e.ctrlKey)) {
    if (e.key === '1') {
      document.querySelector('[name="layer"][value="background"]').checked = true;
      selectedLayer = 'background';
    }
    if (e.key === '2') {
      document.querySelector('[name="layer"][value="terrain"]').checked = true;
      selectedLayer = 'terrain';
    }
    if (e.key === '3') {
      document.querySelector('[name="layer"][value="foreground"]').checked = true;
      selectedLayer = 'foreground';
    }
    if (e.key === '4') {
      document.querySelector('[name="layer"][value="collision"]').checked = true;
      selectedLayer = 'collision';
    }
    if (e.key === '5') {
      document.querySelector('[name="layer"][value="trigger"]').checked = true;
      selectedLayer = 'trigger';
    }

    if (e.key === 'w') {
      selectedTile -= sheetWidth;
    }
    if (e.key === 's') {
      selectedTile += sheetWidth;
    }
    if (e.key === 'a') {
      selectedTile -= 1;
    }
    if (e.key === 'd') {
      selectedTile += 1;
    }

    if (e.key === 'g') {
      paintMode = !paintMode;
    }

    if (e.key === 'v') {
      visibleMode = !visibleMode;
      renderRegion();
    }

    var x = selectedTile % sheetWidth;
    var y = selectedTile / sheetWidth | 0;
    highlight.style.left = x * tileSize + tiles.offsetLeft + 'px';
    highlight.style.top = y * tileSize + tiles.offsetTop + 'px';
  }
});

Loader.load([
  {
    name: 'tiles',
    type: 'image',
    url: '../img/tilesheet.png'
  },
  {
    name: 'characters',
    type: 'image',
    url: '../img/characters.png'
  },
  {
    name: 'map',
    type: 'json',
    url: '../map.json'
  },
  {
    name: 'dialogue',
    type: 'dlg',
    url: '../tree.dlg'
  },
  {
    name: 'entities',
    type: 'json',
    url: '../entities.json'
  }
]).then(init).catch(console.error.bind(console));


var mapScrollEl = document.querySelector('.map');
var renderRegion = (function () {
  var x, y, w, h;
  var needsRender = true;
  var needsPos = true;
  function update() {
    x = mapScrollEl.scrollLeft / tileSize / ZOOM | 0;
    y = mapScrollEl.scrollTop / tileSize / ZOOM | 0;
    w = mapScrollEl.offsetWidth / tileSize / ZOOM | 0;
    h = mapScrollEl.offsetHeight / tileSize / ZOOM | 0;
  }
  function renderRegion (e) {
    render(x, y, w + 2, h + 2);
    if (!needsRender) return;
    needsRender = false;
    update();
    setTimeout(function () {
      needsRender = true;
      update();
      render(x, y, w + 2, h + 2);
    }, 100);
  }
  return renderRegion;
})();
mapScrollEl.addEventListener('scroll', renderRegion);
