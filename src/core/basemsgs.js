// SPDX-License-Identifier: LGPL-3.0-only

import { registerMsg } from "./msg.js"
import { ActorRequest, ActorResponse } from "./token.js"

export class RegistrationRequest {
    constructor(actoraddr) {
        this.actoraddr = actoraddr
    }
}
registerMsg("CircoCore.RegistrationRequest", RegistrationRequest)

export class Registered {
    constructor(actoraddr, accepted) {
        this.actoraddr = actoraddr
        this.accepted = accepted
    }
}
registerMsg("CircoCore.Registered", Registered)

export class NameQuery extends ActorRequest {
    constructor(name) {
        super()
        this.name = name
    }
}
registerMsg("CircoCore.NameQuery", NameQuery)

export class NameResponse extends ActorResponse {
    constructor(query, handler) {
        this.query = query
        this.handler = handler
    }
}
registerMsg("CircoCore.NameResponse", NameResponse)
    