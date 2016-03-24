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
      entities[entity.config.position] = entity;
      map.collision[entity.config.position] = 1;
      map.trigger[entity.config.position + width] = {
        dialogue: entity.config.dialogue
      };
    };

    this.pan = function(dx, dy) {
        var newX = viewX + dx,
            newY = viewY + dy;
        viewX = Math.max(0,Math.min(newX, maxViewX));
        viewY = Math.max(0,Math.min(newY, maxViewY));
        this.render();
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
      return this.getView();
    };

    this.toCoords = function (n) {
      return {
        x: (n % width) * tileSize,
        y: (n / width | 0) * tileSize
      };
    };

    this.getTrigger = function (x, y, w, h) {
      var mapX = x / tileSize | 0;
      var mapY = y / tileSize | 0;
      var tileX = mapX * tileSize;
      var tileY = mapY * tileSize;
      var pos = mapY * width + mapX;
      if (tileX <= x && x + w < tileX + tileSize && tileY <= y && y + h < tileY + tileSize) {
        if (map.trigger[pos]) {
          return map.trigger[pos];
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
            }
        }
    };

    this.render();
}
