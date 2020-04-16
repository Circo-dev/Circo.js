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

    settimeout(token, watcheraddr, deadlinems=1000) {
        const key = this.timeoutkey(token, watcheraddr)
        const timeout = setTimeout(() => {
            this.timeouts.delete(key)
            this.deliverfn(new Msg(nulladdr, watcheraddr, new Timeout(token, watcheraddr)))
        }, deadlinems)
        this.timeouts[key] = timeout
    }

    cleartimeout(token, watcheraddr) {
        const key = this.timeoutkey(token, watcheraddr)
        clearTimeout(this.timeouts[key])
        this.timeouts.delete(key)
    }
}