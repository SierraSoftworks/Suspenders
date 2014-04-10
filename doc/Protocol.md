# Suspenders Protocol
Suspenders uses a JSON protocol which allows the calling of functions across the wire.
All communication is handled through the use of this interface - with special function names being used in cases where it doesn't make sense to register a specific handler.

## Packet Structure
```js
var packet = {
    c: 'function_namespace.function_namespace.function_name',
    a: ['argument1', 2, 'argument 3'],
    r: 'optional_callback_id'
};
```

Packets consist of three components - a function path which defines the function to call, an arguments array to be passed to the function and an optional callback ID.
Function paths consist of optional function namespaces followed by the function's name, allowing for a logical structuring of the API into a tree based structure.
The callback ID parameter is used to allow control to return to pass data back to the remote server upon completion of local work in an asynchronous manner - and is
only present when a function is passed as the last argument to a `call`, `emit` or callback operation. The callback ID is registered as a `handleOnce` handler with the
relevant callback, which is called when the remote end calls the callback.