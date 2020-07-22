// SPDX-License-Identifier: LGPL-3.0-only

import * as THREE from '../../web_modules/three/build/three.module.js'
import { Scheduler } from "../core/scheduler.js"
import { MonitorClient } from "./monitor.js"
import { PerspectiveView, registerActor } from "./viewer.js"
import "./watch.js"
import { filterfn } from "./filter.js"
import "./filtercomponent.js"
import "./statuscomponent.js"

let view = new PerspectiveView()

function updatefilter(newvalue) {
    view.setfilter(filterfn(newvalue))
}

function initfilter() {
    document.getElementById("filter").addEventListener("filterinput", e => {
        updatefilter(e.detail.value)
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
    const schedulers = []
    try {
        let port = 2497
        while (true) {
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
