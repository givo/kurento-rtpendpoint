var async = require('async');
var kurento = require('kurento-client');

KurentoClient.prototype.KClient = null;

// TODO: implement a base class children will implement a rtsp2webRtc and webRtc2WebRtc and so on
module.exports = class KurentoClient{
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
            if (!iceCandidateFIFO[sessionId]) {
                iceCandidateFIFO[sessionId] = [];
            }
            iceCandidateFIFO[sessionId].push(parsedCandidate);
        }
    }

    createPipeline(sdpOffer, cb){
        let self = this;

        async.waterfall([
            // create kurento client API instance
            (callback) => {
                if(KurentoClient.kClient != null){
                    kurento(kurentoWsUrl, function(error, _kurentoClient) {
                        if (error) {                            
                            callback("Could not find media server at address" + argv.ws_uri + ". Exiting with error " + error);
                        }
                
                        KurentoClient.kClient = _kurentoClient;
                        callback(null);
                    });
                }
                else{
                    callback();
                }
            },
            // create a media pipeline
            (callback) => {
                KurentoClient.kClient.create('MediaPipeline', function(err, pipeline){
                    if(err){
                        callback(err);
                    }

                    callback(null. pipeline);
                });
            },
            // create a PlayerEndpoint in order to connect the media server to an rtsp input
            (pipeline, callback) => {
                pipeline.create('PlayerEndpoint', { url: 'rtsp://10.5.1.2' }, function(err, playerEndpoint){
                    if(err){
                        pipeline.release();
                        callback(err);
                    }

                    callback(null, pipeline, playerEndpoint);
                });
            },
            // create a WebRtcEndpoint in order to connect the media server to the client
            (pipeline, playerEndpoint, callback) => {
                pipeline.create('WebRtcEndpoint', function(err, webRtcEndpoint){
                    if(err){
                        pipeline.release();
                        callback(err);
                    }

                    callback(pipeline, playerEndpoint, webRtcEndpoint);
                });
            },
            // connect the PlayerEndpoint and WebRtcEndpoint and start media session pipeline
            (pipeline, playerEndpoint, webRtcEndpoint, callback) => {
                playerEndpoint.connect(webRtcEndpoint, function(err){
                    if(err){
                        pipeline.release();
                        callback(err);
                    }

                    // (parallel) when kurento gets his iceCandidate, send it to the client 
                    webRtcEndpoint.on('onIceCandidate', function(event){
                        let candidate = kurento.getComplexType('IceCandidate')(event.candidate);
                        ws.send(JSON.stringify({
                            id: 'iceCandidate',
                            candidate: candidate
                        }));
                    });

                    // (parallel) order ice candidiates gather
                    webRtcEndpoint.gatherCandidates(function(err) {
                        if (err) {
                            pipeline.release();
                            callback(err);
                        }
                    });

                    // (parallel)
                    playerEndpoint.play(function (err){
                        if(err){
                            callback(err);
                        }
                    });

                    callback(pipeline, playerEndpoint, webRtcEndpoint);
                });
            }, 
            // handle sdp offer
            (pipeline, playerEndpoint, webRtcEndpoint, callback) => {
                webRtcEndpoint.processOffer(sdpOffer, function(err, sdpAnswer){
                    if(err){
                        pipeline.release();
                        callback(err);
                    }

                    self.sessions[sessionId] = {
                        pipeline: pipeline,
                        webRtcEndpoint: webRtcEndpoint
                    }

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

            delete sessions[sessionsId];
            delete iceCandidateFIFO[sessionId];
        }
    }
}