var async = require('async');
var kurento = require('kurento-client');
var fs = require('fs');

var encoderSdpRequest = null;

fs.readFile(__dirname + '/stream.sdp', 'utf8', (err, data) => {
    if(err){
        throw err;
    }

    encoderSdpRequest = data;
});

class KurentoClient{
    constructor(kurentoWsUrl, ws){        
        this.wsUrl = kurentoWsUrl;
        this.ws = ws;        

        // dictionary for holding all current sessions (RtcPeer)
        this.sessions = {};
        // dictionary for holding all the current sessions' ice candidates
        this.iceCandidateFIFO = {};
    }

    // when received an ice candidate from client
    addClientIceCandidate(sessionId, candidate){
        let parsedCandidate = kurento.getComplexType('IceCandidate')(candidate);

        // if a complete pipeline has managed to be created
        if(this.sessions[sessionId]){
            this.sessions[sessionId].webRtcEndpoint.addIceCandidate(parsedCandidate);
        }
        // else, queue the candidate
        else{
            if (!this.iceCandidateFIFO[sessionId]) {
                this.iceCandidateFIFO[sessionId] = [];
            }
            this.iceCandidateFIFO[sessionId].push(parsedCandidate);
        }
    }

    createPipeline(sessionId, sdpOffer, cb){
        let self = this;
        
        async.waterfall([
            // create kurento client API instance
            (callback) => {                                
                if(KurentoClient.KClient == null){
                    kurento(this.wsUrl, function(err, _kurentoClient) {
                        if (err) {     
                            console.error('error at kurento()');
                            callback("Could not find media server at address" + argv.ws_uri + ". Exiting with error " + err);
                        }
                                                
                        KurentoClient.KClient = _kurentoClient;
                        console.log('successfully created kClient');
                        callback(null);
                    });
                }
                else{
                    callback(null);
                }
            },
            // create a media pipeline
            (callback) => {
                KurentoClient.KClient.create('MediaPipeline', function(err, pipeline){
                    if(err){
                        console.error('error at create pipeline');
                        callback(err);
                    }

                    console.log('successfully created pipeline');
                    callback(null, pipeline);
                });
            },
            // create a RtpEndpoint in order to connect the media server to an rtsp input
            (pipeline, callback) => {
                pipeline.create('RtpEndpoint', (err, rtpEndpoint) => {
                    if(err){
                        console.error('error at create RtpEndpoint');
                        pipeline.release();
                        callback(err);
                    }

                    rtpEndpoint.processOffer(encoderSdpRequest, function(err, sdpAnswer){
                        if(err){
                            console.error('error when processing encoder sdp offer');
                            callback(err);
                        }
                        
                        console.log('successfully created RtpEndpoint');
                    
                        callback(null, pipeline, rtpEndpoint);
                    });
                });
            },
            // create a WebRtcEndpoint in order to connect the media server to the client
            (pipeline, rtpEndpoint, callback) => {
                pipeline.create('WebRtcEndpoint', function(err, webRtcEndpoint){
                    if(err){
                        console.error('error at create WebRtcEndpoing');
                        pipeline.release();
                        callback(err);
                    }

                    console.log('successfully created WebRtcEndpoint');

                    callback(null, pipeline, rtpEndpoint, webRtcEndpoint);
                });
            },
            // connect the RtpEndpoint and WebRtcEndpoint and start media session pipeline
            (pipeline, rtpEndpoint, webRtcEndpoint, callback) => {
                rtpEndpoint.connect(webRtcEndpoint, function(err){
                    if(err){
                        console.error('error at create connect');
                        pipeline.release();
                        callback(err);
                    }

                    console.log('successfully connected endpoints');

                    callback(null, pipeline, rtpEndpoint, webRtcEndpoint);
                });
            },
            // process sdp offer from client
            (pipeline, rtpEndpoint, webRtcEndpoint, callback) => {
                webRtcEndpoint.processOffer(sdpOffer, function(err, sdpAnswer){
                    if(err){
                        console.error('error at processOffer');
                        pipeline.release();
                        callback(err);
                    }

                    self.sessions[sessionId] = {
                        pipeline: pipeline,
                        webRtcEndpoint: webRtcEndpoint
                    }

                    console.log('WebRtc successfullty processed sdp offer from client');

                    callback(null, pipeline, rtpEndpoint, webRtcEndpoint, sdpAnswer);
                });
            },
            // gather ice candidates
            (pipeline, rtpEndpoint, webRtcEndpoint, sdpAnswer, callback) => {
                // (parallel) when kurento gets his iceCandidate, send it to the client 
                webRtcEndpoint.on('OnIceCandidate', function(event){
                    console.log('kurento generated ice candidate');

                    let candidate = kurento.getComplexType('IceCandidate')(event.candidate);
                    self.ws.send(JSON.stringify({
                        id: 'iceCandidate',
                        candidate: candidate
                    }));
                });

                // (parallel) order ice candidiates gather
                webRtcEndpoint.gatherCandidates(function(err) {
                    if (err) {
                        console.error('error at create gatherCandidates');
                        pipeline.release();
                        callback(err);
                    }

                    console.log('successfullty started gathering ice candidates');

                    callback(null, sdpAnswer);
                });
            }
        ], (err, sdpAnswer) => {
            if(err){
                cb(err);
            }

            cb(null, sdpAnswer);
        });
    }

    destroyPipeline(sessionId){
        if(this.sessions[sessionId]){
            this.sessions[sessionId].pipeline.release();

            delete this.sessions[sessionId];
            delete this.iceCandidateFIFO[sessionId];
        }
    }
}

KurentoClient.KClient = null;

// TODO: implement a base class children will implement a rtsp2webRtc and webRtc2WebRtc and so on
module.exports = KurentoClient;