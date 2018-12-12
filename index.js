const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
var cluster = require('cluster');
var os = require('os');

var customHandler = {};

//add handling for 'hello' path
customHandler.hello = function(callback) {
    callback(200, {'message': 'Welcome to my assignment #1'});
}

// add handling for not found
customHandler.notFound = function(callback) {
    callback(404);
}

// adding router
var router = {
    'hello' : customHandler.hello
}

const serverHandling = function(req, res) {
    // parsing the url
    var parsedUrl = url.parse(req.url, true);
    var path = parsedUrl.pathname;

    //getting the path
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data', function(data) {
        buffer += decoder.write(data);
    });
    req.on('end', function(data) {
        buffer += decoder.end();
        var handler = typeof(router[trimmedPath]) !== 'undefined'? router[trimmedPath]: customHandler.notFound;
        handler(function(status, payload){
            status = typeof(status) === 'number'? status: 200;
            payload = typeof(payload) === 'object'? payload: {};
            res.setHeader('Content-type', 'application/json');
            res.writeHead(status);
            res.end(JSON.stringify(payload));
            console.log(`return payload: ${payload} on Cluster: ${cluster.worker.id}`);
        });
    });
}

var server = http.createServer (function(req, res) {
    serverHandling(req, res);
});

// If we're on the master thread
if(cluster.isMaster){
    // Fork the process
    for(var i = 0; i < os.cpus().length; i++){
        cluster.fork();
    }
} else {
    server.listen(3000, function(){
        console.log('starting to listen to 3000, on cluster:', cluster.worker.id);
    });
}