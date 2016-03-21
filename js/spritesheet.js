function SpriteSheet(data, tileSize) {
  this.tileSize = tileSize;
  this.data = data;

  var tileWidth = this.tileWidth;
  var sheetWidth = data.width / tileSize | 0;
  var sheetHeight = data.height / tileSize | 0;

  this.tileCount = sheetWidth * sheetHeight;

  console.log(sheetWidth, this.tileCount);

  this.put = function(ctx, x, y, n) {
    ctx.drawImage(
      data,
      (n % sheetWidth) * tileSize,
      (n / sheetWidth | 0) * tileSize,
      tileSize, tileSize,
      x, y,
      tileSize, tileSize
    );
  };
}
