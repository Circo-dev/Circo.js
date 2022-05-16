// SPDX-License-Identifier: LGPL-3.0-only
import "./watchitem.js"
import {Component} from "./helpers/component.js"
import {html, css} from "lit"

class Watch extends Component {

  static get properties() {
    return {
      selectedactor: { type: Object, attribute: false },
      pointedactor: { type: Object, attribute: false },
      actorviews: { type: Object, attribute: false} // box -> actorview beacuse viewer already had that, but box -> actor + messagetypes would be enough
    }
  }

  static get styles() {
    return css`
      .maincontainer {
        position: absolute;
        top: 98px;
        left: 10px;
        padding: 5px;
        font-family: "Gill Sans", sans-serif;
        text-shadow: 1px 1px 2px white;
        background-color: rgba(240,240,240,0.44);
        overflow-y: scroll;
        max-height: 400px;
      }
      .pinnedcontainer {
        position: absolute;
        bottom: 0px;
        left: 10px;
        padding: 5px;
        font-family: "Gill Sans", sans-serif;
        text-shadow: 1px 1px 2px white;
        background-color: rgba(240,240,240,0.44);
        overflow-y: scroll;
        max-height: calc(100vh - 520px);
      }
    `;
  }

  constructor() {
    super()
    this.selectedactor = null
    this.pointedactor = null
    this.actormap = null
    this.pinnedboxes = []
  }
  
  onpin = (e) => {
      this.onunpin(e)
      this.pinnedboxes.push(e.target.actor.box)
      this.requestUpdate()
  }

  onunpin = (e) => {
    this.pinnedboxes = this.pinnedboxes.filter(box => box !== e.target.actor.box)
    this.requestUpdate()
  }

  renderpinned = (box) => {
    const actorview = this.actorviews && this.actorviews.get(box)
    if (!actorview || !actorview.actor) return html`<div>Cannot find pinned actor: ${box}</div>`
    return html`<actor-watch-item unpinnable=true .messagetypes=${actorview.messagetypes} .actor=${actorview.actor} @unpin=${this.onunpin}>></actor-watch-item>`
  }

  render() {
    const mainactor = this.selectedactor || this.pointedactor
    const mainactorview = mainactor && this.actorviews && this.actorviews.get(mainactor.box)
    return html`
      ${mainactorview ? html`<div class="maincontainer">
      <actor-watch-item pinnable=true .messagetypes=${mainactorview.messagetypes} .actor=${mainactor} @pin=${this.onpin}></actor-watch-item>
      </div>` : ""}
      ${this.pinnedboxes.length ? html`
      <div class="pinnedcontainer">
        ${this.pinnedboxes.map(this.renderpinned)}
      </div>` : ""}`
  }
}

customElements.define("actor-watch", Watch)
