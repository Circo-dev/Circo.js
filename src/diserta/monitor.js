// SPDX-License-Identifier: LGPL-3.0-only

import { registerMsg } from "../core/msg.js"
import { RegisteredActor } from "../core/actor.js"
import { ActorRequest, ActorResponse } from "../core/token.js"

class ActorListRequest extends ActorRequest {
    constructor(respondto) {
        super()
        this.respondto = respondto
    }
}
registerMsg("CircoCore.ActorListRequest", ActorListRequest)

class ActorListResponse extends ActorResponse {
    constructor(actors) {
        this.actors = actors
    }
}
registerMsg("CircoCore.ActorListResponse", ActorListResponse)

export class MonitorClient extends RegisteredActor {
    constructor() {
        super()
        this.monitoraddr = null
        this.queryInterval = null
    }

    onRegistered = _ => this.service.querymastername("monitor")

    onNameResponse = response => {
        this.monitoraddr = response.handler
        this.startQuerying()
    }

    startQuerying(intervalms=1) {
        if (this.queryInterval) clearInterval(this.queryInterval)
        this.queryInterval = setInterval(
            () => {
                this.service.send(this.monitoraddr, new ActorListRequest(this.address))
            }, intervalms
        )
    }

    onTimeout(timeout) {
        console.warn("Monitoring request timeouted")
    }

    onActorListResponse(response) {
        //console.log("Got actor list", response.actors)
    }
}