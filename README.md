# Rtp Endpoint Example

## Introduction

This is a `Node.js` example which creates a `RtpEndpoint` to `WebRtcEndpoint` pipeline in `Kurento` media server. 

In this example a we used `Haivision Makito` to capture a monitor and watching the live stream on a simple web page.

We successfuly connected `Kurento` to Maktio using `Direct RTP` and `QuickTime`.

`Kureto` is deployed on Ubuntu 14.04 virtual machine

## Improtant Notes

* Your `Ubuntu` machine which runs `Kurento` have to have `openh264` and package from Cisco installed.

* If your rtp source doesn't support sdp negogiation, you will need to manually configure it transmits to the udp port described in kurento sdp answer.

## Codec Transcoding

By default `Kurento` use VP8 as the `WebRtc` codec, that's why Kurento will transcode any `h.264` stream before sinking to a WebRtcEndpoint.

* In order to disable transcoding to VP8 at Kurento, request a h264 rtp profile in client side by editing the local sdp.
* You can implement that by removing all `rtpmap` lines which are different then 96 and leave only `a=rtpmap:96 H264/90000` line.

### 'openh265' offline installation instructions:

 * Copy `libopenh264-1.4.0-linux64.so.bz2` (or newer) to the root `/` directory and add permissions (`chmod 777`)
 * Then install the following packages: (`openh264_1.4.0.trusty.20170725133438.e20ebe9_amd64-fixed.deb` is the openh264 with customization for offline installation)
 
```
sudo dpkg -i openh264_1.4.0.trusty.20170725133438.e20ebe9_amd64-fixed.deb

sudo dpkg -i openh264-gst-plugins-bad-1.5_1.8.1.1~20160909144557.99.gf836e53.trusty_amd64.deb
```

## Haivision Makito

* In order for this example to work you need to reconfigure `Makito` in runtime (just after receiving the sdp answer) to use the udp port which `kurento` accepts in the sdp answer.

![directrtp](https://user-images.githubusercontent.com/11993599/32729751-7cb526d6-c88d-11e7-8eb5-29e1b17cc117.png)

## Required Node.js Packages:

* async
* express
* express-session
* ws
* kurento-client
