// SPDX-License-Identifier: LGPL-3.0-only

import "./viewer.js"
import { Scheduler } from "../core/scheduler.js"
import { MonitorClient } from "./monitor.js"
import { PerspectiveView } from "./viewer.js"

let scheduler = null
async function start() {
    const monitor = new MonitorClient()
    const view = new PerspectiveView()
    monitor.setView(view)
    scheduler = new Scheduler()
    await scheduler.init([monitor])
    scheduler.run()    
}

start()
