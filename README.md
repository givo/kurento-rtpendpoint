# Rtp Endpoint Example

## Introduction

This is a `Node.js` example which creates a `RtpEndpoint` to `WebRtcEndpoint` pipeline in `Kurento` media server. 

In this example a we used `Haivision Makito` to capture a monitor and watching the live stream on a simple web page.

We successfuly connected `Kurento` to Maktio using `Direct RTP` and `QuickTime`.

`Kureto` is deployed on Ubuntu 14.04 virtual machine

## Improtant Notes

* In order for this example to work you need to reconfigure in runtime (just after receiving the sdp answer) to use the udp port which `kurento` accepts in the sdp answer.

* Your `Ubuntu` machine which runs `Kurento` have to have `openh264` and package from Cisco installed.

### 'openh265' offline installation instructions:

 * Copy `libopenh264-1.4.0-linux64.so.bz2` (or newer) to the root `/` directory and add permissions (`chmod 777`)
 * Then install the following packages: (`openh264_1.4.0.trusty.20170725133438.e20ebe9_amd64-fixed.deb` is the openh264 with customization for offline installation)
 
```
sudo dpkg -i openh264_1.4.0.trusty.20170725133438.e20ebe9_amd64-fixed.deb

sudo dpkg -i openh264-gst-plugins-bad-1.5_1.8.1.1~20160909144557.99.gf836e53.trusty_amd64.deb
```

## Haivision Makito

![directRtp](/uploads/d5dca4a1d08e2fcc6ddac1150f18f34c/directRtp.png)

## Required Node.js Packages:

* async
* express
* express-session
* ws
* kurento-client