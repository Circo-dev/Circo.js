// SPDX-License-Identifier: LGPL-3.0-only

import { Addr, MASTERPOSTCODE } from "../core/postoffice.js"
import { registerMsg } from "../core/msg.js"
import { RegisteredActor } from "../core/actor.js"
import { ActorRequest, ActorResponse } from "../core/token.js"
import { setactors } from "./filter.js"

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

class ActorInterfaceRequest extends ActorRequest {
    constructor(respondto, box) {
        super()
        this.respondto = respondto
        this.box = box
    }
}
registerMsg("CircoCore.ActorInterfaceRequest", ActorInterfaceRequest)

class ActorInterfaceResponse extends ActorResponse {
    constructor(messagetypes) {
        this.messagetypes = messagetypes
    }
}
registerMsg("CircoCore.ActorInterfaceResponse", ActorInterfaceResponse)

export class MonitorClient extends RegisteredActor {
    constructor() {
        super()
        this.monitoraddr = null
        this.queryInterval = null
        this.view = null
    }

    onRegistered = _ => this.service.querymastername("monitor")

    setview(view) {
        this.view = view
        this.view.setmonitor(this)
    }

    onNameResponse = response => {
        this.monitoraddr = response.handler
        this.startQuerying()
    }

    startQuerying(intervalms=500) {
        const query = () => {
            this.service.send(this.monitoraddr, new ActorListRequest(this.address))
        }
        if (this.queryInterval) clearInterval(this.queryInterval)
        this.queryInterval = setInterval(query, intervalms)
        query()
    }

    onTimeout(timeout) {
        console.warn("Monitoring request timeouted")
    }

    onActorListResponse = (response) => {
        setactors(response.actors)
        for (var actor of response.actors) {
            this.view.putActor(actor)
        }
        this.view.redraw()
    }

    requestActorInterface(addr) { // TODO send should return a promise if the message is an ActorRequest
        this.service.send(this.monitoraddr, new ActorInterfaceRequest(this.address, addr))
    }

    onActorInterfaceResponse = (response) => {
        console.log(response)
    }

    actorselected(actorinfo) {
        this.requestActorInterface(actorinfo.box)
    }
}