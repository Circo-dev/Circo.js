// SPDX-License-Identifier: LGPL-3.0-only

import * as THREE from '../../web_modules/three/build/three.module.js'
import { Scheduler } from "../core/scheduler.js"
import { MonitorClient } from "./monitor.js"
import { PerspectiveView, registerActor } from "./viewer.js"
import "./watch.js"
import { filterfn } from "./filter.js"
import "./filtercomponent.js"

const ITEMS_PER_NODE = 10
const RED_AFTER = ITEMS_PER_NODE * 0.95 - 1

registerActor("Main.SearchTreeTest.TreeNode{UInt32}",  {
    geometry: new THREE.TetrahedronBufferGeometry(20, 2),
    scale: function(actor) {
        if (actor.extra.left) {
            return { x: 0.2 , y: 0.2, z: 0.2 }
        } else {
            return { x: 0.2 + (actor.extra.size - ITEMS_PER_NODE / 2) / 6000 , y: 0.2 + (actor.extra.size - ITEMS_PER_NODE / 2) / 6000, z: 0.5 + (actor.extra.size - ITEMS_PER_NODE / 2) / 2000  }
        }
    },
    color: function(actor) {
        return actor.extra.size < RED_AFTER ? 0x00b000 : (actor.extra.left ? 0x606060 : 0xff0000)
    }
})

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
    const scheduler = new Scheduler("ws://localhost:" + port)
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
