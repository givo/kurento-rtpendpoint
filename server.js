var express = require('express');
var session = require('express-session')
var ws = require('ws');
var KurentoClient = require('./Kurento/KurentoClient');
var fs = require('fs');

const KURENTO_WS_URL = 'ws://192.168.6.20:8888/kurento';

//
// Express
//
var app = express();

var sessionHandler = session({
    secret : 'none',
    rolling : true,
    resave : true,
    saveUninitialized : true
});

app.use(sessionHandler);

//
// Static
//
app.use(express.static('C:/projects/kurento-test/client'));

app.listen(3000, function(){
    console.log('listenning at 3000');
});

//
// Web Socket
// 
var wss = ws.Server({
     port: 8080,     
});  

wss.on('connection', function connect(newSocket, req){
    //let sessionId = newSocket.upgradeReq.session.id;
    let sessionId;
    let request = newSocket.upgradeReq;
    let response = {
        writeHead : {}
    };

    sessionHandler(request, response, function(err) {
        sessionId = request.session.id;
        console.log('Connection received with sessionId ' + sessionId);
    });

    // create a new KurentoClient for each client
    let kClient = new KurentoClient(KURENTO_WS_URL, newSocket);

    newSocket.on('open', function(){
        console.log(`connected to ${req.connection.remoteAddress}`);        
    });

    newSocket.on('close', function(){
        console.log('disconnected');
        kClient.destroyPipeline(sessionId);
    });

    newSocket.on('error', function(err){
        console.log(err);
        kClient.destroyPipeline(sessionId);
    });

    //
    // Message
    //
    newSocket.on('message', function onMessage(msg){
        var parsedMsg = JSON.parse(msg);        
        
        switch(parsedMsg.id){
            case 'start':
                console.log('received "start" message ');

                kClient.createPipeline(sessionId, parsedMsg.sdpOffer, function(err, sdpAnswer){
                    let response;
                    if(err){
                        console.error(err);

                        response = JSON.stringify({
                            id: 'error',
                            message: err
                        });
                    }
                    else{
                        if(parsedMsg.sdpOffer != null){
                            response = JSON.stringify({
                                id: 'sdpAnswer',
                                sdpAnswer: sdpAnswer
                            });
                        }
                        else {       
                            console.log('f');
                            response = JSON.stringify({});
                        }
                    }

                    return newSocket.send(response);
                });
                break;

            case 'stop':
                kClient.destroyPipeline(sessionId);
            break;

            case 'iceCandidate':
                console.log('received ice candidate');

                kClient.addClientIceCandidate(sessionId, parsedMsg.candidate);
                break;

            default:
                newSocket.send(JSON.stringify({
                    id: 'error',
                    message: 'Invalid message '
                }));
                break;
        }
    });          
});
