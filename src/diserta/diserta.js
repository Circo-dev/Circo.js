// SPDX-License-Identifier: LGPL-3.0-only

import * as THREE from '../../web_modules/three/build/three.module.js'
import { Scheduler } from "../core/scheduler.js"
import { MonitorClient } from "./monitor.js"
import { PerspectiveView, registerActor } from "./viewer.js"
import "./watch.js"
import { filterfn } from "./filter.js"
import "./filtercomponent.js"
import "./edgecontrolcomponent.js"
import "./statuscomponent.js"

let view = new PerspectiveView()

function initfilter() {
    document.getElementById("filter").addEventListener("filterinput", e => {
        view.setfilter(filterfn(e.detail.value, ["me", "selected", "pointed", "dist", "onpath", "$"]))
    })
}

function initedgecontrol() {
    document.getElementById("edgecontrol").addEventListener("edgefilterinput", e => {
        view.setedgefilter(filterfn(e.detail.value,["src", "dst", "edge", "srcvisible", "dstvisible"]))
    })
}

async function createmonitor(view, port) {
    const monitor = new MonitorClient()
    const scheduler = new Scheduler("ws://" + window.location.hostname + ":" + port)
    await scheduler.init([monitor])
    monitor.setview(view)
    return {monitor, scheduler}
}

async function start() {
    initfilter()
    initedgecontrol()
    const schedulers = []
    try {
        let port = 2497
        while (port < 3200) {
            const {monitor, scheduler} = await createmonitor(view, port)
            schedulers.push(scheduler)
            port = port + 1
            document.getElementById("status").schedulercount = schedulers.length
        }
    } catch (e) {
        if (!schedulers.length) {
            document.getElementById("fatal").textContent = "Unable to connect to backend actor system. Please reload to try again."
            console.error("Websocket error:", e)    
        }
    }
    schedulers.map(scheduler => scheduler.run())
}

start()
