// SPDX-License-Identifier: LGPL-3.0-only

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const parser = /Msg{(\w+)(.\w+)?}/

export async function unmarshal(messageblob) {
    const buf = await messageblob.arrayBuffer()
    const fullbytes = new Uint8Array(buf)
    const newlinepos = fullbytes.indexOf(10)
    const headerbytes = new Uint8Array(buf, 0, newlinepos)
    const header = decoder.decode(headerbytes)
    const headermatch = header.match(parser)
    if (!headermatch) {
        return null
    }
    const typename = headermatch[2] ? headermatch[2].substr(1) : headermatch[1]
    const bodyBytes = new Uint8Array(buf, newlinepos + 1)
    const retval = msgpack.deserialize(bodyBytes)
    retval.__proto__ = Msg.prototype
    retval.body.__proto__ = eval(typename).prototype
    retval.body.typename = typename
    return retval
}

export class Msg {
    constructor(sender, target, body) {
        this.sender = sender
        this.target = target
        this.body = body
    }

    marshal() {
        const header = `Msg{${this.body.constructor.typename || this.body.constructor.name}}\n`
        const headerBytes = encoder.encode(header)
        const msgBytes = msgpack.serialize(this)
        const buf = new Uint8Array(headerBytes.length + msgBytes.length + 1)
        buf.set(headerBytes)
        buf.set(msgBytes, headerBytes.length)
        return buf
    }

    sendto(socket) {
        socket.send(this.marshal())
    }
}

typeregistry = new Map()

export function registerMsg(fulltypename, messagetype) {
    if (typeregistry.has(fulltypename)) {
        console.warn(`Overriding registered type '${fulltypename}'`)
    }
    typeregistry.set(fulltypename, messagetype)
}

export class RegistrationRequest {
    constructor(actoraddr) {
        this.actoraddr = actoraddr
    }
}
registerMsg("CircoCore.RegistrationRequest", RegistrationRequest)