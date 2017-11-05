# Rtp Endpoint Example

## Introduction

This is a `Node.js` example which creates a `RtpEndpoint` to `WebRtcEndpoint` pipeline in `Kurento` media server. 

In this example a we used `Haivision Makito` to capture a monitor and watching the live stream on a simple web page.

We successfuly connected `Kurento` to Maktio using `Direct RTP` and `QuickTime`.

`Kureto` is deployed on Ubuntu 14.04 virtual machine

## Improtant Note

In order for this example to work you need to reconfigure in runtime (just after receiving the sdp answer) to use the udp port which `kurento` accepts in the sdp answer.

## Haivision Makito

![directRtp](/uploads/d5dca4a1d08e2fcc6ddac1150f18f34c/directRtp.png)

## Required Node.js Packages:

* async
* express
* express-session
* ws
* kurento-client