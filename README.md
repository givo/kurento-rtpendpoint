# Rtp Endpoint Example

## Introduction

This is a `Node.js` example which creates a [RtpEndpoint](1) to [WebRtcEndpoint](2) pipeline in [Kurento](4) media server. 

In this example a we used [Haivision Makito](3) to capture a monitor and watching the live stream on a simple web page.

We successfuly connected [Kurento](4) to Maktio using `Direct RTP` and `QuickTime`.

[Kurento](4) is deployed on Ubuntu 14.04 virtual machine

## Improtant Notes

* Learn [SDP](7)! (or at least learn the basics)

* Your `Ubuntu` machine which runs [Kurento](4) have to have [openh264](5) and package from Cisco installed.

* If your rtp source doesn't support sdp negogiation, you will need to manually configure it transmits to the udp port described in kurento sdp answer.

## Codec Transcoding

By default [Kurento](4) uses `VP8` as its' [WebRtc](6) codec, that's why [Kurento](4) will transcode any `h.264` stream before sinking to a [WebRtcEndpoint](2).

In order to disable transcoding to VP8 at Kurento, request a h264 rtp profile in client side by editing the local sdp.

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
