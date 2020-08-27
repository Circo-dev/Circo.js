import { registerMsg } from "../core/msg.js"

export class PeerListRequest {
    constructor(respondto) {
        this.respondto = respondto
    }
}
registerMsg("Circo.PeerListRequest", PeerListRequest)

export class PeerListResponse {
    constructor(peers) {
        this.peers = peers
    }
}
registerMsg("Circo.PeerListResponse", PeerListResponse)
