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
        shiftX, shiftY;

    backgroundCanvas.width = viewWidth;
    backgroundCanvas.height = viewHeight;
    foregroundCanvas.width = viewWidth;
    foregroundCanvas.height = viewHeight;

    var viewX = 0,
        viewY = 0;

    this.test = function test(x, y) {
      var bx = (viewX + x) / tileSize | 0;
      var by = (viewY + y) / tileSize | 0;
      return !map.collision[by * width + bx];
    };

    this.pan = function(dx, dy) {
        var newX = viewX + dx,
            newY = viewY + dy;
        viewX = Math.max(0,Math.min(newX, maxViewX));
        viewY = Math.max(0,Math.min(newY, maxViewY));
        this.render();
        return newX === viewX && newY === viewY;
    };

    this.getBGCanvas = function() {
        return backgroundCanvas;
    };

    this.getFGCanvas = function() {
        return foregroundCanvas;
    };

    this.getMapAtCursor = function (x, y) {
      var mx = (viewX + x) / tileSize | 0,
          my = (viewY + y) / tileSize | 0,
          idx = my * width + mx;
      return map[idx];
    }

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
