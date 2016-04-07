function Screen(map, tileSize, viewWidth, viewHeight, spriteSheet) {
    var sheetSize = spriteSheet.size,
        spriteCtx = spriteSheet.data,
        width = map.width,
        height = map.height,
        maxViewX = map.width * tileSize - viewWidth,
        maxViewY = map.height * tileSize - viewHeight,
        mapIndex, x, y,
        backgroundCanvas = document.createElement('canvas'),
        backgroundContext = backgroundCanvas.getContext('2d'),
        foregroundCanvas = document.createElement('canvas'),
        foregroundContext = foregroundCanvas.getContext('2d'),
        shiftX, shiftY,
        entities = {};

    backgroundCanvas.width = viewWidth;
    backgroundCanvas.height = viewHeight;
    foregroundCanvas.width = viewWidth;
    foregroundCanvas.height = viewHeight;

    var viewX = 0,
        viewY = 0;

    this.test = function test(x, y) {
      var bx = x / tileSize | 0;
      var by = y / tileSize | 0;
      return !map.collision[by * width + bx];
    };

    this.viewX = function () {
      return viewX;
    };

    this.viewY = function () {
      return viewY;
    };

    this.getView = function () {
      return {
        x: viewX,
        y: viewY,
        w: viewWidth,
        h: viewHeight
      };
    }

    this.addEntity = function (entity) {
      var config = entity.config;
      var pos = config.position[0] + width * config.position[1];
      entities[pos] = entity;
      map.collision[pos] = 1;
      if (config.dialogue) {
        if (config.region) {
          pos = config.region[0] + config.region[1] * width;
          map.trigger[pos] = {
            x: config.position[0],
            y: config.position[1],
            width: config.region[2],
            height: config.region[3],
            dialogue: config.dialogue
          };
        } else {
          map.trigger[pos - 1] = {
            x: config.position[0] - 1,
            y: config.position[1],
            width: 3,
            height: 2,
            dialogue: config.dialogue
          };
        }
      }
    };

    this.pan = function(dx, dy) {
        var newX = viewX + dx,
            newY = viewY + dy;
        viewX = Math.max(0,Math.min(newX, maxViewX));
        viewY = Math.max(0,Math.min(newY, maxViewY));
        this.render();
        this.updateTriggers();
        return newX === viewX && newY === viewY;
    };

    this.centerTo = function(x, y) {
      if (!y) {
        y = x / width | 0;
        x = x % width;
      }
      var newX = x * tileSize - viewWidth / 2 + 8;
      var newY = y * tileSize - viewHeight / 2 + 8;
      viewX = Math.max(0,Math.min(newX, maxViewX));
      viewY = Math.max(0,Math.min(newY, maxViewY));
      this.render();
      this.updateTriggers();
      return this.getView();
    };

    this.triggersInView = [];

    this.updateTriggers = function () {
      var triggers = [];
      var gridX = viewX / tileSize | 0;
      var gridY = viewY / tileSize | 0;
      for (var y=0; y <= (viewHeight / tileSize); y++) {
        for (var x=0; x <= (viewWidth / tileSize); x++) {
          var pos = gridX + x + (gridY + y) * width;
          var t = map.trigger[pos];
          if (t) {
            if (!t.x) {
              t.x = pos % width;
              t.y = pos / width | 0;
              t.width = 1;
              t.height = 1;
            }
            triggers.push(t);
          }
        }
      }
      this.triggersInView = triggers;
    };

    this.toCoords = function (n) {
      return {
        x: (n % width) * tileSize,
        y: (n / width | 0) * tileSize
      };
    };

    this.getTrigger = function (x, y, w, h) {
      for (var i = 0; i < this.triggersInView.length; i++) {
        var t = this.triggersInView[i];
        var tx1 = t.x * tileSize;
        var ty1 = t.y * tileSize;
        var tx2 = (t.x + t.width) * tileSize;
        var ty2 = (t.y + t.height) * tileSize;
        if (tx1 < x && x + w < tx2 && ty1 < y && y + h < ty2) {
          return t;
        }
      }
    }

    this.getBGCanvas = function() {
        return backgroundCanvas;
    };

    this.getFGCanvas = function() {
        return foregroundCanvas;
    };

    this.render = function() {
      this._render();
    }

    this._render = function(ox, oy) {
        backgroundContext.clearRect(0, 0, viewWidth, viewHeight);
        foregroundContext.clearRect(0, 0, viewWidth, viewHeight);
        ox = ox || viewX;
        oy = oy || viewY;
        var gridX = ox / tileSize | 0;
        var gridY = oy / tileSize | 0;
        var shiftX = -ox % tileSize;
        var shiftY = -oy % tileSize;
        for (y = 0; y <= (viewHeight / tileSize) + 1; y++) {
            for (x = 0; x <= (viewWidth / tileSize); x++) {
                mapIndex = map.background[(y * width + x + gridY * width + gridX)];
                spriteSheet.put(backgroundContext,
                                shiftX + (x * tileSize),
                                shiftY + (y * tileSize),
                                mapIndex);
                mapIndex = map.terrain[(y * width + x + gridY * width + gridX)];
                spriteSheet.put(backgroundContext,
                                shiftX + (x * tileSize),
                                shiftY + (y * tileSize),
                                mapIndex);
                var entity = entities[y * width + x + gridY * width + gridX];
                if (entity) {
                  entity.render(backgroundContext, shiftX + x * tileSize, shiftY + y * tileSize);
                }
                mapIndex = map.foreground[(y * width + x + gridY * width + gridX)];
                spriteSheet.put(foregroundContext,
                                shiftX + (x * tileSize),
                                shiftY + (y * tileSize),
                                mapIndex);
                // mapIndex = map.trigger[(y * width + x + gridY * width + gridX)];
                // if (mapIndex) {
                //   foregroundContext.fillStyle = 'rgba(0,0,255,.4)';
                //   if (mapIndex.width) {
                //     foregroundContext.fillRect(x * tileSize + shiftX, y * tileSize + shiftY, mapIndex.width * tileSize, mapIndex.height * tileSize);
                //   } else {
                //     foregroundContext.fillRect(x * tileSize + shiftX, y * tileSize + shiftY, tileSize, tileSize);
                //   }
                // }
            }
        }
    };

    this.render();
}
