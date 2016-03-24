function KeyboardControls() {
    var self = this;
    this.keys = {};
    this.long = {};

    _.extend(self, {
        'LEFT'  : 37,
        'UP'    : 38,
        'RIGHT' : 39,
        'DOWN'  : 40,
        'SPACE' : 32
    });

    this.letter = function(l) {
        return self.keys[l.toUpperCase().charCodeAt(0)];
    };

    function setKey(code, status) {
        if (code) self.keys[code] = status;
    }

    this.poll = function () {
        this.long = {};
    }

    window.addEventListener('keydown', function(e) {
        setKey(e.keyCode, true);
        self.long[e.keyCode] = true;
    });
    window.addEventListener('keyup', function(e) {
        setKey(e.keyCode, false);
    });
}
