# Circo.js

An actor model in the browser, aka the frontend of Circo.

Circo.js allows executing Circo-compatible actors in the browser. It connects to the Circo cluster through websockets and integrates with it semi-transparently, meaning that Circo.js actors are scheduled in the JavaScript engine but they can register themselves in the cluster to become full-featured Circo actors.

This repo also contains the source of "Camera Diserta", which is a monitoring tool for Circo and also the reference application of Circo.js
