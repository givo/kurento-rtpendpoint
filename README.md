# RtpEndpoint Example

**I have created a library for simplifing the use of `kurento-client` I recommend you to take a look [here](https://github.com/givo/lib-kurento)**

## Introduction

This is a `Node.js` example which creates a [RtpEndpoint][1] to [WebRtcEndpoint][2] pipeline in [Kurento][4] media server. 

In this example we used [Haivision Makito][3] to capture a monitor and stream to a simple web page.

We successfuly connected [Kurento][4] to [Maktio][3] using `Direct RTP` and `QuickTime` protocols which are essentially `RTP` protocols.

[Kurento][4] is deployed on Ubuntu 14.04 virtual machine

## Project Structure

asdasd

* [/Client](https://github.com/givo/kurento-rtpendpoint/tree/master/client) - Simple web client application: 
  + [client.js](https://github.com/givo/kurento-rtpendpoint/blob/master/client/client.js) - uses [RTCPeerConnection][11] and [WebSocket][10] APIs in order to create a `WebRTC` stream with [Kurento][4].
  
* [/Kurento](https://github.com/givo/kurento-rtpendpoint/tree/master/Kurento) - Everything that is related to [Kurento][4]):
  + [KurentoClient](https://github.com/givo/kurento-rtpendpoint/blob/master/Kurento/KurentoClient.js) - handles pipeline creation. (OOP improvements are issued)

* [server.js](https://github.com/givo/kurento-rtpendpoint/blob/master/server.js) - server's entry point, handles signaling and session with clients using `websocket` and `express`.

## Improtant Notes

* Most use cases for using a `RtpEndpoint`'s are for connecting to a `h.264` streams, therefore it's recommended to prevent `VP8` transcoding when sinking to WebRtc.

* If your rtp device doesn't support sdp negogiation, you need to manually configure the stream to use the udp port described in the returned sdp answer ( returned in [rtpEndpoint.processOffer( (sdpAnswer) => { ... } )][9] ).

* Learn [SDP][7]! (or at least learn the basics)

## Prevent Transcoding

By default [Kurento][4] uses `VP8` codec, that's why [Kurento][4] will transcode any `h.264` stream before sinking to a [WebRtcEndpoint](2). By preventing transcoding you will improve quality and performance. Here's are the steps to prevent transcoding: 

* Install [openh264][5] from Cisco to your `Ubuntu` machine which runs [Kurento][4].

* Request a `h.264` rtp profile in client side by editing the sdp offer: (generate by calling [RtcPeerConnection.createOffer][8])

  + Remove all `rtpmap` lines which are different then `96` and leave only `a=rtpmap:96 H264/90000` line.

## 'openh264' installation instructions:

 * Download `openh264-gst-plugins-bad-1.5` using:
 
```
sudo apt-get install openh264-gst-plugins-bad-1.5
```

## Haivision Makito

* To reconfigure [Makito][3] in runtime (just after receiving the sdp answer), Set [Makito][3]'s destination udp port as described in [Kurento][4]'s sdp answer.

![directrtp](https://user-images.githubusercontent.com/11993599/32729751-7cb526d6-c88d-11e7-8eb5-29e1b17cc117.png)

[1]: https://doc-kurento.readthedocs.io/en/latest/_static/langdoc/jsdoc/kurento-client-js/module-elements.RtpEndpoint.html
[2]: https://doc-kurento.readthedocs.io/en/latest/_static/langdoc/jsdoc/kurento-client-js/module-elements.WebRtcEndpoint.html
[3]: https://www.haivision.com/products/makito-series/makito-x-h264/
[4]: https://www.kurento.org/whats-kurento
[5]: https://github.com/cisco/openh264
[6]: https://webrtc.org/
[7]: https://tools.ietf.org/html/rfc4566
[8]: https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createOffer
[9]: https://doc-kurento.readthedocs.io/en/6.7.1/_static/client-jsdoc/module-core_abstracts.SdpEndpoint.html
[10]: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
[11]: https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection

