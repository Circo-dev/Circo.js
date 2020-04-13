import { registerMsg } from "../core/msg.js"

export class PeerListRequest {
    constructor(respondto) {
        this.respondto = respondto
    }
}
registerMsg("CircoCore.PeerListRequest", PeerListRequest)

export class PeerListResponse {
    constructor(peers) {
        this.peers = peers
    }
}
registerMsg("CircoCore.PeerListResponse", PeerListResponse)
