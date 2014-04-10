var EventEmitter = require('events').EventEmitter,
    crypto = require('crypto');

module.exports = Suspender;

function Suspender(socket) {
    if(global == this) return new Stocking(Suspender);

    EventEmitter.constructor.call(this);

    this.handleOnce = { };
    this.handle = { };
    this.socket = socket;
        
    this.socket.on('data', (function(data) {
        try {
            var message = JSON.parse(data);
            var handler = null;

            handler = this.handleOnce[message.c];
            if(handler) delete this.handleOnce[message.c];
            else handler = read(this.handle, message.c);

            if(!handler) this.$emit('error', new Error('No handler for ' + message.c));

            if(message.r) message.a.push((function() {
                var args = Array.prototype.slice.call(arguments, 0);
                args.push(message.r);
                this.call.apply(this, args);
            }).bind(this));
        
            if(handler.length < message.a.length) {
                var done = message.a.pop();
                try {
                    done(handler.apply(this, message.a));
                } catch(err) {
                    this.call('error', err);
                }
            }
            else try {
                handler.apply(this, message.a);
            } catch(err) {
                this.call('error', err);
            }
        } catch(err) {
            this.call('error', err);
        }
    }).bind(this));
}

require('./inherit')(Suspender, EventEmitter);

Suspender.prototype.$emit = Suspender.prototype.emit;
Suspender.prototype.$on = Suspender.prototype.on;
Suspender.prototype.$once = Suspender.prototype.once;

Suspender.prototype.call = Suspender.prototype.emit = function(remote) {
    var args = Array.prototype.slice.call(arguments, 0);
    remote = args.shift();
    if(typeof args[args.length - 1] == 'function') {
        crypto.randomBytes(8, (function(err, bytes) {
            if(err) this.$emit('error', err);
            var returnCode = bytes.toString('hex');
            var handler = args.pop();
            
            this.once(returnCode, handler);

            return this.socket.write(JSON.stringify({ c: remote, a: args, r: returnCode }));
        }).bind(this));
    } else this.socket.write(JSON.stringify({ c: remote, a: args }));
};

Suspender.prototype.on = function(name, handler) {
    if(name == 'error' || name == 'data' || name == 'close') return this.$on(name, handler);

    write(this.handle, name, handler);
};

Suspender.prototype.once = function(name, handler) {
    if(name == 'error' || name == 'data' || name == 'close') return this.$once(name, handler);

    this.handleOnce[name] = handler;
};

function read(obj, path) {
    if(!Array.isArray(path)) path = path.split('.');
    var current = path.shift();
    while(obj.hasOwnProperty(current)) {
        obj = obj[current];
        current = path.shift();
    }

    if(path.length) return null;
    return obj;
}

function write(obj, path, value) {
    if(!Array.isArray(path)) path = path.split('.');
    var current = path.shift();
    while(path.length) {
        obj[current] = obj[current] || {};
        obj = obj[current];
        current = path.shift();
    }

    obj[current] = value;
}