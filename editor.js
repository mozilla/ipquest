const http = require('http');
const urllib = require('url');
const fs = require('fs');

// Create an HTTP tunneling proxy
var server = http.createServer( (req, res) => {
  var url = urllib.parse(req.url);

  if (url.path === '/') {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(fs.readFileSync(__dirname + '/editor/index.html'));
    return;
  }
  if (url.path === '/tiles') {
    res.writeHead(200, {'Content-Type': 'image/png'});
    res.end(fs.readFileSync(__dirname + '/img/tilesheet.png'));
    return;
  }
  if (url.path === '/map') {
    res.writeHead(200, {'Content-Type': 'application.json'});
    res.end(fs.readFileSync(__dirname + '/map.json'));
    return;
  }

  if (url.path === '/save' && req.method === 'POST') {
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

  res.writeHead(404, {'Content-Type': 'text/plain'});
  res.end('Not Found: ' + req.url);
});

// now that server is running
server.listen(1337, '127.0.0.1', () => {
  console.log('running!');
});
