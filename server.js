var express = require('express');
var WebSocket = require('ws');
var KurentoClient = require('./KurentoClient');

const KURENTO_WS_URL = 'ws://192.168.6.20:8888/kurento';

//
// Express
//
var app = express();

app.use(express.session({ secret: 'abc' }));

app.use(function(req, res, next){
    console.log('Message received');
    next();
});

app.listen(3000, function(){
    console.log('listening on port 3000..');
});

//
// Web Socket
// 
var wss = WebSocket.Server({ port: 8080 });  

wss.on('connection', function connect(newSocket, req){
    var sessionId = wss.upgradeReq.session.id;

    var kClient = new KurentoClient(KURENTO_WS_URL, newSocket);

    newSocket.on('open', function(){
        console.log("connected to ${req.connection.remoteAddress}");
    });

    newSocket.on('close', function(){
        console.log('disconnected');
    });

    newSocket.on('error', function(err){
        console.log(err);
    });

    //
    // Message
    //
    newSocket.on('message', function onMessage(msg){
        var parsedMsg = JSON.parse(msg);        
        
        switch(parsedMsg.id){
            case 'start':
                
                break;
            case 'iceCandidate':
                
                break;
        }
    });          
});
