var remoteVideo = document.getElementById('remoteVideo');
var webRtcPeer;

window.onload = function() {	
	console.log('Page loaded ...');	
	remoteVideo = document.getElementById('remoteVideo');	
}

var ws = new WebSocket('ws://localhost:8080');

window.onbeforeunload = function() {
	ws.close();
}

ws.onopen = function(event){
    console.log('socket opened');
}

ws.onmessage = function(msg) {    
    var parsedMsg = JSON.parse(msg.data);

    switch (parsedMsg.id){
        case 'error':
            console.error(parsedMsg.message);
        break;

        // add the server's ice candidate to webRtcPeer
        case 'iceCandidate':
            console.log('received ice candidate');
            webRtcPeer.addIceCandidate(parsedMsg.candidate, function(err){
                if(err){
                    console.error('ERROR: ' + err);
                }
            }); 
        break;

        case 'sdpAnswer':
            console.log('SDP answer received, processing..');

            console.log(parsedMsg.sdpAnswer);

            webRtcPeer.setRemoteDescription(new RTCSessionDescription(parsedMsg.sdpAnswer));
        break;

        default:
            console.error('Unrecongnized message', parsedMsg);
        break;
    }
}

function onIceCandidate(candidate){
    console.log(`local candidate: ${JSON.stringify(candidate)}`);

    var message = {
        id: 'iceCandidate',
        candidate: candidate
    }

    ws.send(JSON.stringify(message));
}

// when a sdp offset is created, send the offer to the server
function onLocalOfferCreated(err, sdpOffer){
    if(err){
        console.error(err);
    }

    console.log('local sdp: \n' + sdpOffer.sdp);

    webRtcPeer.setLocalDescription(sdpOffer);

    var message = {
        id: 'start',
        sdpOffer: sdpOffer.sdp
    }

    console.log('sending local sdp offer');
    ws.send(JSON.stringify(message));
}

function btnStart(){
    console.log('Creating WebRtcPeer and generating local sdp offer ...');

    //
    // Create the webRtcPeer instance
    // 
    webRtcPeer = new RTCPeerConnection();

    webRtcPeer.onicecandidate = onIceCandidate;
    webRtcPeer.onopen = () => console.log('real time connection has established');
    webRtcPeer.onerror = (err) => console.log(`real time connection error {err}`);
    webRtcPeer.onaddstream = (event) => remoteVideo.src = window.URL.createObjectURL(event.stream);

    webRtcPeer.createOffer((offer) => {
        onLocalOfferCreated(null, offer);
    }, (err) => {
        onLocalOfferCreated(err, null);
    });
}
