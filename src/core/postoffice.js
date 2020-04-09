// SPDX-License-Identifier: LGPL-3.0-only

export class Address {
    static generateId() {
        if (window.crypto && window.crypto.getRandomValues) {
            const buf = new Uint32Array(2);
            window.crypto.getRandomValues(buf)
            return buf[0] * Math.pow(2, 20) + buf[1]; // TODO use 64 bit integers instead of 52, overcome js Number limitation
        }
        console.log("No crypto.getRandomValues(), falling back to Math.random()")
        return Math.round(Math.random() * Math.pow(2, 52))
    }

    constructor(postcode, box) {
        this.postcode = postcode
        this.box = typeof box !== "undefined" ? box : Address.generateId()
    }
}

export class PostOffice {
    constructor(url) {
        this.url = url
        this.socket = new WebSocket(url)
    }

    shutdown() {
        try {
            this.socket.close()
        } catch (e) {
            console.log("Exception while closing websocket", e)
        }
    }
}