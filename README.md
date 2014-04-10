# Suspenders
**Realtime Asynchronous WebSocket RPC Using SockJS**

Socket.io is an exceptional idea, a drop in "all you need" WebSocket library which aims to provide all the tools necessary
for common usage scenarios. Unfortunately v0.9 is currently a bit out of date, and doesn't seem to work as well as libraries
like SockJS.

That's where Suspenders comes in - implementing some of the core functionality available in Socket.io on top of SockJS to
give you all the easy to use features you're used to with the added stability of a proven and tested backing library which
is fully compatible with the WebSocket spec.

## Features
 - **Remote Function Calls** allow you to call functions on the client and server across the wire
 - **Asynchronous Returns** allow you to easily return information from the remote side's functions
 - **Function Namespacing** allows you to layout your APIs in a logical and easy to navigate manner

## Example

### Server
```js
var http = require('http'),
    sockjs = require('sockjs'),
    suspender = require('suspender');

var echo = sockjs.createServer();
echo.on('connection', function(conn) {
    var sock = suspender(conn);

    conn.on('ping', function() {
       sock.call('pong'); 
    });
    
    conn.on('echo', function(data, done) {
        return done(null, data);
    });

    conn.on('close', function() {});
});

var server = http.createServer();
echo.installHandlers(server, {prefix:'/echo'});
server.listen(9999, '0.0.0.0');
```

### Client
```html
<html>
	<head>
		<script src='/js/sockjs.min.js'></script>
		<script src='/js/stockings.min.js'></script>
		<script type="text/javascript">
			var websocket = new SockJS('/');
			var socket = new socking(websocket);

			socket.on('auth.session', function(done) {
			    return done('session_id', function (success) {
                    if(!success) notify('Authentication Failed', 'danger');
				    notify('Authentication Complete', 'success');
			    });
			});
		</script>
	</head>
</html>
```