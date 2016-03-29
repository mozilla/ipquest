function Dialogue(tree, width, height) {
  var output = document.querySelector('.dialogue-out');
  var choiceEl = document.querySelector('.dialogue-choices');
  var textWidth = 30;
  var textHeight = 4;
  var kb = new KeyboardControls();
  var self = this;
  this.output = output;

  tree = parse(tree);

  function parse(data) {
    var lines = data.split('\n');
    var obj = {
    };
    var curChat;

    lines.forEach(function (line, n) {
      if (!line) return;
      if (line[0] === '[') {
        var parts = line.match(/\[([\w-]+)\]/);
        if (!parts) {
          throw "failed to parse dialogue on line " + n;
        }
        curChat = {
          lines: []
        };
        obj[parts[1]] = curChat;
        return;
      }
      if (line[0].match(/\s/)) {
        return;
      }
      if (line[0] === '*') {
        var parts = line.match(/\* ([^\[]+)\[([^\]]+)\]/);
        if (!parts) {
          throw "failed to parse dialogue on line " + n;
        }
        var text = parts[1];
        var outcome = parts[2];
        if (!curChat.choices) {
          curChat.choices = [];
        }
        if (outcome === 'END') {
          outcome = null;
        } else if (outcome === 'GAMEOVER') {
          outcome = 'GAMEOVER';
        } else if (outcome.match(/END->(.+)/)) {
          var parts = outcome.match(/END->(.+)/);
          curChat.choices.push([text, null, parts[1]]);
          return;
        }
        curChat.choices.push([text, outcome]);
        return;
      }
      curChat.lines.push(line);
    });

    return obj;
  }

  this.open = function () {
    output.style.display = 'block';
  };

  function chat(id, cb) {
    self.open();

    var convo = tree[id];
    var lines = convo.lines;
    var pos = 0;

    function nextLine() {
      self.write(lines[pos], function () {
        pos++;
        if (pos < lines.length) {
          waitFor(kb.SPACE, nextLine);
        } else if (convo.choices) {
          prompt(convo.choices, cb);
        } else {
          waitFor(kb.SPACE, function () {
            self.close();
            cb();
          })
        }
      });
    }

    nextLine();
  }
  this.chat = chat;

  function prompt(choices, cb) {
    choiceEl.innerHTML = '';
    var els = choices.map(function (c) {
      var el = document.createElement('div');
      el.innerHTML = c[0];
      choiceEl.appendChild(el);
      return el;
    });
    choiceEl.style.display = 'block';

    var selected = 0;

    update();

    function update() {
      for (var i=0; i < els.length; i++) {
        if (i === selected) {
          els[i].classList.add('highlight');
        } else {
          els[i].classList.remove('highlight');
        }
      }
    }

    function handler(e) {
      if (e.keyCode === kb.DOWN) {
        selected = selected + 1;
        if (selected > choices.length - 1) {
          selected = 0;
        }
        update();
      }
      if (e.keyCode === kb.UP) {
        selected = selected - 1;
        if (selected < 0) {
          selected = choices.length - 1;
        }
        update();
      }
      if (e.keyCode === kb.SPACE) {
        window.removeEventListener('keydown', handler, false);
        choiceEl.style.display = 'none';
        var choice = choices[selected];
        if (choice[1]) {
          if (choice[1] === 'GAMEOVER') {
            self.close();
            cb('GAMEOVER');
          } else {
            chat(choice[1], cb);
          }
        } else {
          self.close();
          cb(choice[2]);
        }
      }
    }

    window.addEventListener('keydown', handler, false);
  }

  function waitFor (key, cb) {
    function poll() {
      if (kb.keys[key]) {
        cb();
      } else {
        setTimeout(poll, 16);
      }
    }
    poll();
  };

  this.write = function (text, cb) {
    var xpos = 0;
    var ypos = 0;
    var spos = 0;
    output.innerHTML = '';
    var self = this;

    function nextChar() {
      output.innerHTML += text[spos];
      spos++;
      if (spos < text.length) {
        if (kb.keys[kb.DOWN]) {
          setTimeout(nextChar, 20);
        } else {
          setTimeout(nextChar, 50);
        }
      } else {
        cb();
      }
    }

    nextChar();
  };

  this.close = function () {
    output.style.display = 'none';
    choiceEl.style.display = 'none';
  };
}
