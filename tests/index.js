var boot = require('../bin/www').boot,
    shutdown = require('../bin/www').shutdown,
    port = require('../bin/www').port,
    superagent = require('superagent'),
    expect = require('expect.js');

describe('server', function() {
    before(function() {
        boot();
    });

    describe('homepage', function() {
        it('should respond to GET', function(done) {
            console.log("port: " + port.toString());
            superagent.get('http://localhost:' + port)
                .end(function (res) {
                    expect(res.status).to.equal(200);
                    done();
                });
        });
    });

    describe('roomsJSON', function() {
        it('should respond to GET s4f/data/rooms.json', function(done) {
            console.log("port: " + port.toString());
            superagent.get('http://localhost:' + port + '/s4f/data/rooms.json')
                .end(function (res) {
                    expect(res.status).to.equal(200);
                    done();
                });
        });
    });


    describe('simpleJSON', function() {
        it('should respond to GET s4f/data/simple.json', function(done) {
            console.log("port: " + port.toString());
            superagent.get('http://localhost:' + port + '/s4f/data/simple.json')
                .end(function (res) {
                    expect(res.status).to.equal(200);
                    done();
                });
        });
    });

    describe('shapesJSON', function() {
        it('should respond to GET s4f/data/shapes.json', function(done) {
            console.log("port: " + port.toString());
            superagent.get('http://localhost:' + port + '/s4f/data/shapes.json')
                .end(function (res) {
                    expect(res.status).to.equal(200);
                    done();
                });
        });
    });


    after(function () {
        shutdown();
    });
});
