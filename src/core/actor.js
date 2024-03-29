// SPDX-License-Identifier: LGPL-3.0-only
import { ActorResponse } from "./token.js"


export class Actor {
    constructor() {
        this.address = null // address and service will be set by the scheduler when scheduling
        /** @type {import("./scheduler.js").ActorService} */
        this.service = null
    }

    onschedule() {}

    onmessage(messageBody) {
        const dispatchName = this._dispatchNameFor(messageBody)
        const handler = this[dispatchName]
        if (handler) {
            handler(messageBody)
        } else if (!messageBody instanceof ActorResponse){
            console.error("No method '" + dispatchName + "' defined on " + this.constructor.name)
        }
    }
    
    _dispatchNameFor(messageBody) {
        const bodyType = typeof messageBody
        if (bodyType !== "object") {
            return "on" + bodyType.charAt(0).toUpperCase() + bodyType.slice(1)
        }
        const constructorname = messageBody.constructor.name
        return "on" + (constructorname === "Object" ? messageBody.typename : constructorname)
    }
}

export class RegisteredActor extends Actor {
    constructor() {
        super()
    }

    onschedule() {
        this.service.register(this)
    }
}
