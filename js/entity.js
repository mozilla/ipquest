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
    spritesheet.put(ctx, x, y, config.sprite);
  }
}
