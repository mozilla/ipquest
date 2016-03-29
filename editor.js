const http = require('http');
const urllib = require('url');
const fs = require('fs');
const path = require('path');

const MIMES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.png': 'image/png',
  '.json': 'application/json'
};

// Create an HTTP tunneling proxy
var server = http.createServer( (req, res) => {
  var url = urllib.parse(req.url);

  if (url.path === '/editor/') {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(fs.readFileSync(__dirname + '/editor/index.html'));
    return;
  }
  if (url.path === '/editor/tiles') {
    res.writeHead(200, {'Content-Type': 'image/png'});
    res.end(fs.readFileSync(__dirname + '/img/tilesheet.png'));
    return;
  }
  if (url.path === '/editor/map') {
    res.writeHead(200, {'Content-Type': 'application.json'});
    res.end(fs.readFileSync(__dirname + '/map.json'));
    return;
  }

  if (url.path === '/editor/save' && req.method === 'POST') {
    console.log("[200] " + req.method + " to " + req.url);
    var body = '';
    req.on('data', function(chunk) {
      console.log("Received body data:");
      body += chunk.toString();
    });
    req.on('end', function() {
      var obj;
      try {
        obj = JSON.parse(body);
        fs.writeFileSync(__dirname + '/map.json', JSON.stringify(obj));
      } catch (e) {
      }
      // empty 200 OK response for now
      res.writeHead(200, "OK", {'Content-Type': 'text/html'});
      res.end();
    });
    return;
  }

  var localPath = path.join(__dirname, url.pathname);
  var extname = path.extname(url.pathname);
  var mime = MIMES[extname] || 'text/plain';

  try {
    fs.accessSync(localPath);
    console.log('gotcha!');
    res.writeHead(200, {'Content-Type': mime});
    res.end(fs.readFileSync(localPath));
  } catch (e) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end('Not Found: ' + req.url);
  }

});

// now that server is running
server.listen(1337, '127.0.0.1', () => {
  console.log('running!');
});
