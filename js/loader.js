var Loader = (function () {

  function progressPromise(promises, tickCallback) {
    var len = promises.length;
    var progress = 0;

    function tick(promise) {
      promise.then(function () {
        progress++;
        tickCallback(progress, len);
      });
      return promise;
    }

    return Promise.all(promises.map(tick));
  }

  function Loader() {
    this.assets = {};
  }

  Loader.prototype.loadJSON = function (name, url) {
    var self = this;
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('get', url + '?' + Date.now());
      xhr.onload = function () {
        try {
          self.assets[name] = JSON.parse(this.responseText);
          resolve();
        } catch (e) {
          reject('failed to load ' + url);
        }
      };
      xhr.onerror = function () {
        reject('failed to load ' + url);
      };
      xhr.send();
    });
  };

  Loader.prototype.loadText = function (name, url) {
    var self = this;
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('get', url + '?' + Date.now());
      xhr.onload = function () {
        try {
          self.assets[name] = this.responseText;
          resolve();
        } catch (e) {
          reject('failed to load ' + url);
        }
      };
      xhr.onerror = function () {
        reject('failed to load ' + url);
      };
      xhr.onerror = reject;
      xhr.send();
    });
  };

  Loader.prototype.loadImage = function (name, url) {
    var self = this;
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        self.assets[name] = img;
        resolve();
      }
      img.onerror = function () {
        reject('failed to load ' + url);
      }
      img.src = url;
    });
  };

  Loader.prototype.load = function (assets, tickCb) {
    var self = this;
    var reqs = assets.map(function (asset) {
      if (asset.type === 'image') {
        return self.loadImage(asset.name, asset.url);
      }
      if (asset.type === 'json') {
        return self.loadJSON(asset.name, asset.url);
      }
      return self.loadText(asset.name, asset.url);
    });
    return progressPromise(reqs, tickCb);
  };

  Loader.prototype.get = function (name) {
    return this.assets[name];
  };

  return new Loader();
})();
