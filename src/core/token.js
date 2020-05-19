// SPDX-License-Identifier: LGPL-3.0-only

import { generateid } from "./util.js"
import { Msg } from "./msg.js"
import { nulladdr } from "./postoffice.js"

export class Token {
    constructor() {
        this.id = generateid()
    }
}

export class Tokenized {
    constructor(token=null) {
        this.token = token || new Token()
    }
}

export class ActorRequest extends Tokenized {
    constructor() {
        super()
    }
}

export class ActorResponse extends Tokenized {
    constructor(request) {
        super(request.token)
    }
}

export class Timeout {
    constructor(token, watcher) {
        this.token = token
        this.watcher = watcher
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve
            this.reject = reject
        })
    }
}

export class TokenService {
    constructor(deliverfn) {
        this.timeouts = new Map()
        this.deliverfn = deliverfn
    }

    timeoutkey(token, watcheraddr) {
        return `${token.id}_${watcheraddr.box}`
    }

    settimeout(token, watcheraddr, deadlinems=2000) {
        const key = this.timeoutkey(token, watcheraddr)
        const timeout = new Timeout(token, watcheraddr)
        timeout.jstimeoutid = setTimeout(() => {
            this.timeouts.delete(key)
            timeout.reject && timeout.reject(timeout)
            this.deliverfn(new Msg(nulladdr, watcheraddr, timeout))
        }, deadlinems)
        this.timeouts.set(key, timeout)
        return timeout.promise
    }

    resolvetimeout(response, watcheraddr) {
        const key = this.timeoutkey(response.token, watcheraddr)
        const timeout = this.timeouts.get(key)
        if (timeout) {
            clearTimeout(timeout.jstimeoutid)
            this.timeouts.delete(key)
            timeout.resolve(response)    
        }
    }
}