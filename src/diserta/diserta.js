// SPDX-License-Identifier: LGPL-3.0-only

import * as THREE from '../../web_modules/three/build/three.module.js'
import { Scheduler } from "../core/scheduler.js"
import { MonitorClient } from "./monitor.js"
import { PerspectiveView, registerActor } from "./viewer.js"
import "./watch.js"
import { filterfn } from "./filter.js"
import "./filtercomponent.js"

registerActor("Main.SearchTreeTest.TreeNode{UInt32}",  {
    geometry: new THREE.TetrahedronBufferGeometry(20, 2),
    scale: function(actor) {
        if (actor.extra.localsize) {
            return { x: 0.2 + (actor.extra.localsize - 2000) / 6000 , y: 0.2 + (actor.extra.localsize - 2000) / 6000, z: 0.5 + (actor.extra.localsize - 2000) / 2000  }
        } else {
            return { x: 0.2 , y: 0.2, z: 0.2 }
        }
    },
    color: function(actor) {
        return actor.extra.localsize > 3800 ? 0xff0000 : (actor.extra.localsize > 0 ? 0x00b000 : 0x606060)
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

async function start() {
    const monitor = new MonitorClient()
    monitor.setView(view)
    initfilter()
    const scheduler = new Scheduler()
    try {
        await scheduler.init([monitor])
    } catch (e) {
        document.getElementById("fatal").textContent = "Unable to connect to backend actor system. Please reload to try again."
        console.error("Websocket error:", e)
    }
    scheduler.run()    
}

start()
