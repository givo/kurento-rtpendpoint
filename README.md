# RtpEndpoint Example

## Introduction

This is a `Node.js` example which creates a [RtpEndpoint](1) to [WebRtcEndpoint](2) pipeline in [Kurento](4) media server. 

In this example a we used [Haivision Makito](3) to capture a monitor and watching the live stream on a simple web page.

We successfuly connected [Kurento](4) to [Maktio](3) using `Direct RTP` and `QuickTime`.

[Kurento](4) is deployed on Ubuntu 14.04 virtual machine

## Project Structure

* [/Client](https://github.com/givo/kurento-rtpendpoint/tree/master/client) (Directory which holds the client-side application): 
  + [client.js](https://github.com/givo/kurento-rtpendpoint/blob/master/client/client.js) - uses [RTCPeerConnection](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection) API in order to connect the `WebRtc` stream with [Kurento](4).
  
* [/Kurento](https://github.com/givo/kurento-rtpendpoint/tree/master/Kurento) Directory which holds everything that is related to [Kurento](4)):
  + [KurentoClient](https://github.com/givo/kurento-rtpendpoint/blob/master/Kurento/KurentoClient.js) - implements a module for pipeline creation. (OOP improvements are issued)

* [server.js](https://github.com/givo/kurento-rtpendpoint/blob/master/server.js) - server's entry point, handles signaling and session with clients using `websocket` and `express`.

## Improtant Notes

* Most use cases for `RtpEndpoint`'s are `h.264` streams, therefore it's recommended to prevent transcoding when sinking to WebRtc.

* If your rtp device doesn't support sdp negogiation, you will need to manually configure it to stream to the udp port described in the returned sdp answer ( returned in [rtpEndpoint.processOffer(function(sdpAnswer){ ... })](9) ).

* Learn [SDP](7)! (or at least learn the basics)

## Preventing Transcoding

By default [Kurento](4) uses `VP8` as its' [WebRtc](6) codec, that's why [Kurento](4) will transcode any `h.264` stream before sinking to a [WebRtcEndpoint](2).

* Your `Ubuntu` machine which runs [Kurento](4) have to have [openh264](5) package from Cisco installed.

* Preventing `transcoding` will improve quality and performance.

* In order to disable transcoding to `VP8`, request a `h.264` rtp profile in client side by editing the local sdp. (generate by calling [RtcPeerConnection.createOffer](8) at client-side)

You can implement that by removing all `rtpmap` lines which are different then 96 and leave only `a=rtpmap:96 H264/90000` line.

## 'openh265' offline installation instructions:

 * Download `openh264-gst-plugins-bad-1.5` using:
 
```
sudo apt-get install openh264-gst-plugins-bad-1.5
```

## Haivision Makito

* In order for this example to work you need to reconfigure [Makito](3) in runtime (just after receiving the sdp answer) to use the udp port which [Kurento](4) accepts in the sdp answer.

![directrtp](https://user-images.githubusercontent.com/11993599/32729751-7cb526d6-c88d-11e7-8eb5-29e1b17cc117.png)

## Required Node.js Packages:

* async
* express
* express-session
* ws
* kurento-client

[1]: https://doc-kurento.readthedocs.io/en/latest/_static/langdoc/jsdoc/kurento-client-js/module-elements.RtpEndpoint.html
[2]: https://doc-kurento.readthedocs.io/en/latest/_static/langdoc/jsdoc/kurento-client-js/module-elements.WebRtcEndpoint.html
[3]: https://www.haivision.com/products/makito-series/makito-x-h264/
[4]: https://www.kurento.org/whats-kurento
[5]: https://github.com/cisco/openh264
[6]: https://webrtc.org/
[7]: https://tools.ietf.org/html/rfc4566
[8]: https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createOffer
[9]: https://doc-kurento.readthedocs.io/en/latest/_static/langdoc/jsdoc/kurento-client-js/module-core_abstracts.SdpEndpoint.html#processOffer
