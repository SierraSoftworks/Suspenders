var should = require('should'),
    EventEmitter = require('events').EventEmitter,
    Suspender = require('../lib/Suspender.js');

describe('server', function() {
    var serverSocket = new EventEmitter();
    var clientSocket = new EventEmitter();

    serverSocket.write = function(data) {
        clientSocket.emit('data', data);
    };
    clientSocket.write = function(data) {
        serverSocket.emit('data', data);
    };

    var suspender = new Suspender(serverSocket);

    it('should send the correct packets for a one-way call', function(done) {
        clientSocket.once('data', function(data) {
            JSON.parse(data).should.eql({ c: 'test', a: [1, 2, '3'] });
            done();
        });

        suspender.call('test', 1, 2, '3');
    });
    
    it('should send the correct packets for a two-way call', function(done) {
        clientSocket.once('data', function(data) {
            JSON.parse(data).should.eql({ c: 'test', a: [1, 2, '3'], r: Object.keys(suspender.handleOnce)[0] });
            suspender.handleOnce = {};
            done();
        });

        suspender.call('test', 1, 2, '3', function() { });
    });
    
    it('should correctly handle callback functions', function(done) {
        clientSocket.once('data', function(data) {
            var returnFunction = Object.keys(suspender.handleOnce)[0];
            JSON.parse(data).should.eql({ c: 'test', a: [1, 2, '3'], r: returnFunction });
            clientSocket.write(JSON.stringify({ c: returnFunction, a: ['1', 2] }));
        });

        suspender.call('test', 1, 2, '3', function(a1, a2) {
            Object.keys(suspender.handleOnce).length.should.equal(0);
            a1.should.equal('1');
            a2.should.equal(2);
            done();    
        });
    });
});