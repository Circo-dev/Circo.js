// SPDX-License-Identifier: LGPL-3.0-only
import { RegisteredActor } from "../core/actor.js"

export class MonitorClient extends RegisteredActor {
    constructor() {
        this.monitoraddr = null
        this.queryInterval = null
        super()
    }

    onRegistered = _ => this.service.querymastername("monitor")

    onNameResponse = response => {
        this.monitoraddr = response.handler
        this.startQuerying()
    }

    startQuerying(intervalms=1000) {
        if (this.queryInterval) clearInterval(this.queryInterval)
        this.queryInterval = setInterval(
            () => {
                this.service.send(this.monitoraddr, new PeerListRequest(this.address))
            }, intervalms
        )
    }
}