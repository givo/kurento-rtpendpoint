# PlayerEndpoint Example

## Introduction

The PlayerEndpoint example 

This is a `Node.js` example which creates a `PlayerEndpoint` to `WebRtcEndpoint` pipeline in `Kurento` media server. 

In this example a `RTSP-H.264` stream generates by `VLC` is transmitted to `Kureto` (which is deployed on Ubuntu 14.04 virtual machine) which trancodes to `VP8` and transmitted
to a simple web page in WebRTC.

## VLC

stream desktop using:

      :sout=#transcode{vcodec=h264,scale=Auto,width=1920,height=1080,acodec=mpga,ab=128,channels=2,samplerate=44100}:rtp{sdp=rtsp://:8554/v.sdp} :sout-keep
      
**Watch Out!** - using ` :file-caching` lower than 1000ms causes image smearing and key-frame lose.

## Required Node.js Packages:

* async
* express
* express-session
* ws
* kurento-client