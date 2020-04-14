// SPDX-License-Identifier: LGPL-3.0-only

import { unmarshal, Registered } from "./msg.js"

export const LOCALPOSTCODE="L"
export const MASTERPOSTCODE="Master"

function toHexString(byteArray) {
    return Array.from(byteArray, function(byte) {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('')
  }

export class Addr {
    static generateId() {
        if (window.crypto && window.crypto.getRandomValues) {
            const buf = new Uint32Array(8);
            window.crypto.getRandomValues(buf)
            return toHexString(buf)
        }
        console.log("No crypto.getRandomValues(), falling back to Math.random()")
        return Math.round(Math.random() * Math.pow(2, 52))
    }

    constructor(postcode=LOCALPOSTCODE, box) {
        this.postcode = postcode
        this.box = String(typeof box !== "undefined" ? box : Addr.generateId())
    }
}

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
        })
    }

    _updateactoraddr(registeredmsg) {
        if (registeredmsg.body.accepted) {
            const newaddr = registeredmsg.body.actoraddr
            const actor = this.scheduler.actorcache.get(newaddr.box)    
            if (actor) {
                actor.address.postcode = newaddr.postcode
                console.log("Actor registered: " + newaddr)
            }
        }
    }

    _onmessage = (event) => {
        if (!this.scheduler) return
        unmarshal(event.data).then((msg) => {
            console.log(msg)
            if (msg.body instanceof Registered) this._updateactoraddr(msg)
            this.scheduler.run(msg)
        })
    }

    send(msg) {
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