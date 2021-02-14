// SPDX-License-Identifier: LGPL-3.0-only

import { generateid } from "./util.js"
import { unmarshal } from "./msg.js"
import { Registered } from "./basemsgs.js"

export const LOCALPOSTCODE="L"
export const MASTERPOSTCODE="Master"

export class Addr {
    constructor(postcode=LOCALPOSTCODE, box) {
        this.postcode = postcode
        this.box = String(typeof box !== "undefined" ? box : generateid())
    }
}

export const nulladdr = new Addr(LOCALPOSTCODE, 0)

export class PostOffice {
    constructor(masterurl, scheduler) {
        this.masterurl = masterurl
        this.masteraddr = new Addr(MASTERPOSTCODE, 0)
        this.scheduler = scheduler
        this.queue = []
        this.socket = new WebSocket(masterurl)
        this.socket.onmessage = this._onmessage
    }

    opened() {
        if (this.socket.readyState === WebSocket.OPEN) {
            return true
        }
        if (this.socket.readyState === WebSocket.CLOSING || this.socket.readyState === WebSocket.CLOSED) {
            return false
        }
        return new Promise((resolve, reject) => {
            this.socket.onopen = () => resolve(true)
            this.socket.onerror = (err) => reject(err)
        })
    }

    _updateactoraddr(registeredmsg) {
        if (registeredmsg.body.accepted) {
            const newaddr = registeredmsg.body.actoraddr
            const actor = this.scheduler.actorcache.get(newaddr.box)    
            if (actor) {
                actor.address.postcode = newaddr.postcode
                console.log("Actor registered: ", newaddr)
            }
        }
    }

    _onmessage = (event) => {
        if (!this.scheduler) return
        unmarshal(event.data).then((msg) => {
            //console.log("<=", msg)
            if (msg.body instanceof Registered) this._updateactoraddr(msg)
            this.scheduler.run(msg)
        })
    }

    send(msg) {
        //console.log("=>", msg)
        msg.sendto(this.socket)
    }

    shutdown() {
        try {
            this.socket.close()
        } catch (e) {
            console.log("Exception while closing websocket", e)
        }
    }
}