function Dude(spritesheet, col) {

  var state = {
    facing: 0,
    walking: 0
  };

  this.face = function (dir) {
    state.facing = dir;
  }

  this.walk = function (isWalking) {
    state.walking = isWalking;
  }

  this.render = function (ctx, x, y) {
    var mod = (Date.now() / 100 | 0) % 2;
    var row = state.facing * 3 + state.walking;
    if (state.walking) {
      row = row + mod;
    }
    var idx = row * spritesheet.sheetWidth + col;
    spritesheet.put(ctx, x, y, idx);
  }
}

function Entity(spritesheet, config) {
  this.config = config;

  this.render = function (ctx, x, y) {
    // Animation!
    if (config.sprite instanceof Array) {
      var n = (Date.now() / config.speed) % config.sprite.length | 0;
      spritesheet.put(ctx, x, y, config.sprite[n]);
    } else {
      spritesheet.put(ctx, x, y, config.sprite);
    }
    if (this.prompt) {
      spritesheet.put(ctx, x, y - 16, 15);
    }
  }
}
