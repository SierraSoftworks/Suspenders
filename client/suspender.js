var suspender = window.suspender = (function() {
    function Suspender(socket) {
        this.socket = socket;

        this.handlers = {
            data: [],
            error: [],
            close: []
        };

        this.handle = {};
        this.handleOnce = {};

        function onError(err) {
            for(var i = 0; i < this.handlers.error.length; i++)
                try { this.handlers.error[i].call(this, err); } catch(_) { }
        }

        this.socket.onmessage = (function(message) {
            var data = message.data;
            for(var i = 0; i < this.handlers.data.length; i++)
                try { this.handlers.data[i].call(this, data); } catch(_) {  }
        }).bind(this);

        this.socket.onerror = (function() {
            for(var i = 0; i < this.handlers.error.length; i++)
                try { this.handlers.error[i].call(this, new Error('Socket encountered an error')); } catch(err) { }
        }).bind(this);

        this.socket.onclose = (function(reason) {
            for(var i = 0; i < this.handlers.error.length; i++)
                try { this.handlers.close[i].call(this, reason); } catch(_) { }
        }).bind(this);

        this.handlers.data.push((function(data) {
             try {
                var message = JSON.parse(data);
                var handler = null;

                handler = this.handleOnce[message.c];
                if(handler) delete this.handleOnce[message.c];
                else handler = read(this.handle, message.c);

                if(!handler) onError(new Error('No handler for ' + message.c));

                if(message.r) message.a.push((function() {
                    var args = Array.prototype.slice.call(arguments, 0);
                    args.unshift(message.r);
                    this.call.apply(this, args);
                }).bind(this));
        
                if(handler.length < message.a.length && typeof message.a[message.a.length - 1] == 'function') {
                    var done = message.a.pop();
                    try {
                        done(handler.apply(this, message.a));
                    } catch(err) {
                        onError(err);
                    }
                }
                else try {
                    handler.apply(this, message.a);
                } catch(err) {
                    onError(err);
                }
            } catch(err) {
                onError(err);
            }
        }).bind(this));
    }

    Suspender.prototype.call = Suspender.prototype.emit = function(name, args) {
        args = Array.prototype.slice.call(arguments, 0);
        name = args.shift();

        if(typeof args[args.length - 1] == 'function') {
            var handler = args.pop();
            var returnTo = randomString(16);
            this.once(returnTo, handler);
            this.socket.send(JSON.stringify({ c: name, a: args, r: returnTo }));
        } 
        else this.socket.send(JSON.stringify({ c: name, a: args }));
    }

    Suspender.prototype.on = function(path, handler) {
        if(path == 'data' || path == 'error' || path == 'close') this.handlers[path].push(handler);
        else write(this.handle, path, handler);
    }

    Suspender.prototype.once = function(key, handler) {
        this.handleOnce[key] = handler;
    }
    
    var template = 'abcdef0123456789';
    function randomString(length) {
        var d = [];
        for(var i = 0; i < length; i++)
            d[i] = template[Math.floor(Math.random() * template.length)];

        return d.join('');
    }
    
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
    
    return Suspender;
})();