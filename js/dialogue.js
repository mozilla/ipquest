function Dialogue(tree, width, height) {
  var output = document.querySelector('.dialogue-out');
  var choiceEl = document.querySelector('.dialogue-choices');
  var textWidth = 30;
  var textHeight = 4;
  var kb = new KeyboardControls();
  var self = this;
  this.output = output;

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

    function poll() {
      if (kb.keys[kb.DOWN]) {
        selected = selected + 1;
        if (selected > choices.length - 1) {
          selected = 0;
        }
        update();
      }
      if (kb.keys[kb.UP]) {
        selected = selected - 1;
        if (selected < 0) {
          selected = choices.length - 1;
        }
        update();
      }
      if (kb.keys[kb.SPACE]) {
        choiceEl.style.display = 'none';
        if (choices[selected][1]) {
          chat(choices[selected][1], cb);
        } else {
          self.close();
          cb();
        }
      } else {
        setTimeout(poll, 200);
      }
    }

    poll();
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
