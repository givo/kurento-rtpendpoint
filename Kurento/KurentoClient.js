var async = require('async');
var kurento = require('kurento-client');
var fs = require('fs');

var encoderSdpRequest = null;

// 
// Read encoder sdp from file system
//
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
    addClientIceCandidate(sessionId, candidate) {
        let parsedCandidate = kurento.getComplexType('IceCandidate')(candidate);

        // if a WebRtcEndpoint has been created for this session
        if (this.sessions[sessionId]) {
            this.sessions[sessionId].webRtcEndpoint.addIceCandidate(parsedCandidate, (err) => {
                if (err) {
                    console.error(`addClientIceCandidate() ${err}`);
                    return;
                }

                console.log('addClientIceCandidate() added ice');
            });
        }
        // else, queue the candidate
        else{
            console.log('queue');
            if (!this.iceCandidateFIFO[sessionId]) {
                this.iceCandidateFIFO[sessionId] = [];
            }
            this.iceCandidateFIFO[sessionId].push(parsedCandidate);
        }
    }

    createPipeline(sessionId, sdpOffer, cb){
        let self = this;
        
        async.waterfall([
            //
            // create kurento client API instance
            //
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
            //
            // create MediaPipeline
            //
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
            //
            // create WebRtcEndpoint 
            //
            (pipeline, callback) => {
                pipeline.create('WebRtcEndpoint', function (err, webRtcEndpoint) {
                    if (err) {
                        console.error('error at create WebRtcEndpoing');
                        pipeline.release();
                        callback(err);
                    }
                    
                    //
                    // listenning to media flow states
                    //
                    webRtcEndpoint.on('MediaFlowInStateChange', function(event){
                        console.log(`WebRtc flow IN: ${event.state}\n`);                        
                    });
                    webRtcEndpoint.on('MediaFlowOutStateChange', function(event){
                        console.log(`WebRtc flow OUT: ${event.state}\n`);                        
                    });

                    console.log('successfully created WebRtcEndpoint');

                    // create session
                    self.sessions[sessionId] = {
                        pipeline: pipeline,
                        webRtcEndpoint: webRtcEndpoint
                    }

                    callback(null, pipeline, webRtcEndpoint);
                });
            },
            //
            // create a rtpEndpoint 
            //
            (pipeline, webRtcEndpoint, callback) => {
                pipeline.create('RtpEndpoint', (err, rtpEndpoint) => {
                    if(err){
                        console.error('error at create rtpEndpoint');
                        pipeline.release();
                        callback(err);
                    }

                    //
                    // listenning to media flow states
                    //
                    rtpEndpoint.on('MediaFlowInStateChange', function(event){
                        console.log(`Rtp flow IN: ${event.state}\n`);                        
                    });
                    rtpEndpoint.on('MediaFlowOutStateChange', function(event){
                        console.log(`Rtp flow OUT: ${event.state}\n`);                        
                    });

                    console.log('successfully create rtpEndpoint');

                    callback(null, pipeline, rtpEndpoint, webRtcEndpoint);
                });
            },
            //
            // process encoder sdp
            //
            (pipeline, rtpEndpoint, webRtcEndpoint, callback) => {                
                // increase max video receive bandwidth to 1000 kb/s                
                rtpEndpoint.setMaxVideoRecvBandwidth(1000);

                rtpEndpoint.processOffer(encoderSdpRequest, (err, sdpAnswer) => {
                    if (err) {
                        console.error(err);
                        pipeline.release();
                        callback(err);
                    }

                    console.log(`successfully process sdp from encoder \n\n${sdpAnswer}`);

                    // check connection state with device
                    rtpEndpoint.getConnectionState(function encoderStateChanged(err, state) {
                        if (err) {
                            console.error(err);
                        }

                        console.log(`encoder connection state: ${state}`);
                    });

                    callback(null, pipeline, rtpEndpoint, webRtcEndpoint);
                });
            },                
            //
            // process client sdp offer 
            //
            (pipeline, rtpEndpoint, webRtcEndpoint, callback) => {
                webRtcEndpoint.processOffer(sdpOffer, function(err, sdpAnswer){
                    if(err){
                        console.error('error at processOffer');
                        pipeline.release();
                        callback(err);
                    }

                    console.log('successfullty processed sdp offer from client');                    
                    
                    // TODO: implement event-emitter interface instead
                    cb(null, sdpAnswer);

                    callback(null, pipeline, rtpEndpoint, webRtcEndpoint);
                });
            },
            //
            // get waiting candidates from FIFO
            //
            (pipeline, rtpEndpoint, webRtcEndpoint, callback) => {   
                
                console.log(`fifo ${self.iceCandidateFIFO[sessionId].length}`);

                async.retry((iceCallback) => {
                    if (self.iceCandidateFIFO[sessionId].length) {
                        // pull candidate from queue
                        var candidate = self.iceCandidateFIFO[sessionId].shift();

                        // add ice to webrtc endpoint
                        webRtcEndpoint.addIceCandidate(candidate, (candidateErr) => {
                            if (candidateErr) {
                                // break loop
                                console.error(`ERROR while getting waiting candidiates! ${candidateErr}`);
                                iceCallback(candidateErr);
                            }

                            console.log('added waiting ice');

                            // continute
                            iceCallback({}, null);
                        });
                    }
                    else {
                        // finish iteration
                        console.log('finish iteration');

                        iceCallback(null, {});
                    }
                }, (candidateErr, res) => {
                    if (candidateErr) {
                        callback(candidateErr);
                    }

                    console.log(`finish loop ${res}`);

                    callback(null, pipeline, rtpEndpoint, webRtcEndpoint);
                });
            },  
            //
            // gather ice candidates
            //
            (pipeline, rtpEndpoint, webRtcEndpoint, callback) => {
                // when kurento gets his iceCandidate, send it to the client 
                webRtcEndpoint.on('OnIceCandidate', function(event){
                    console.log('kurento generated ice candidate');

                    let candidate = kurento.getComplexType('IceCandidate')(event.candidate);
                    
                    // TODO: implement event-emitter interface instead of this OOP violation
                    self.ws.send(JSON.stringify({
                        id: 'iceCandidate',
                        candidate: candidate
                    }));
                });

                // order ice candidiates gather
                webRtcEndpoint.gatherCandidates(function(err) {
                    if (err) {
                        console.error('error at create gatherCandidates');
                        pipeline.release();
                        callback(err);
                    }

                    console.log('started gathering ice candidates');

                    callback(null, pipeline, rtpEndpoint, webRtcEndpoint);
                });
            }, 
            //
            // connect the rtpEndpoint and WebRtcEndpoint and start media session pipeline
            //
            (pipeline, rtpEndpoint, webRtcEndpoint, callback) => {
                rtpEndpoint.connect(webRtcEndpoint, function (err) {
                    if (err) {
                        console.error('error at create connect');
                        pipeline.release();
                        callback(err);
                    }

                    console.log('successfully connected endpoints');

                    callback(null, pipeline, rtpEndpoint, webRtcEndpoint);
                });
            }
        ], (err, result) => {
            if(err){
                cb(err);
            }
            console.log('finish');
            //cb(null, null);
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
