// SPDX-License-Identifier: LGPL-3.0-only
import {Component} from "./helpers/component.js"
import {html, css} from "../../../../web_modules/lit-element.js"
import { registrationOptions } from "../core/msg.js"

class WatchItem extends Component {

  static get properties() {
    return {
      actor: { type: Object, attribute: false },
      messagetypes: { type: Array, attribute: false},
      pinnable: { type: Boolean },
      unpinnable: { type: Boolean }
    }
  }

  static get styles() {
    return css`
      .container {
        position: relative;
        padding: 5px;
      }
      .pin {
        position: absolute;
        right: 0
      }
      .attr {text-align: right;padding-right: 10px;font-weight: 700}
      .extraattr {text-align: right; font-style: italic; padding-right: 7px}
      .command {font-weight: 700}
    `;
  }

  constructor() {
    super()
    this.actor = null
    this.messagetypes = null
    this.pinnable = false
    this.unpinnable = false
  }

  renderObject(obj) {
    return html`
      <table>
        ${Object.entries(obj).map( ([name, value]) => value ? html`<tr><td class="extraattr">${name}</ts><td>${value}</td></tr>` : null)}
      </table>
     `
  }

  stripPackage(typename) {
    return typename.substr(typename.lastIndexOf(".") + 1)
  }

  renderValue(attr, value) {
    return typeof(value) === "object" ? this.renderObject(value) : value
  }

  hasSpecialDisplay(attrname) {
    return ["x", "y", "z", "typename"].indexOf(attrname) >= 0
  }

  formatCoords() {
    function formatCoord(value) {
      return Math.round(value * 100) / 100
    }
    return `${formatCoord(this.actor.x)}, ${formatCoord(this.actor.y)}, ${formatCoord(this.actor.z)}`
  }
  
  render() {
    if (!this.actor) return null
    return html`
    <div class="container">
      <details class="container" open="true">
        <summary>${this.actor.typename}</summary>
        ${this.pinnable ? html`<a href="" class="pin" @click=${e => {e.preventDefault();this.dispatchEvent(new CustomEvent("pin"))}}>pin</a>` : null}
        ${this.unpinnable ? html`<a href="" class="pin" @click=${e => {e.preventDefault();this.dispatchEvent(new CustomEvent("unpin"))}}>unpin</a>` : null}
        <table>
          <tr>
          <td class="attr">Coordinates</td>
              <td>${this.formatCoords()}</td>
          </tr>
          ${Object.entries(this.actor).filter(([attr, value]) => attr[0] !== '_' && !this.hasSpecialDisplay(attr)).map(([attr, value]) => html`
            <tr>
              <td class="attr">${attr}</td>
              <td>${this.renderValue(attr, value)}</td>
            </tr>
          `)}
        </table>
      </details>
      ${this.messagetypes && this.messagetypes.length && html`
      <div class="commands">
        Commands: 
        ${this.messagetypes.filter(msgtype => registrationOptions(msgtype.typename).ui).map(messagetype => html`
        <span class="command"><a href="#" @click=${() => messagetype.send()}>${this.stripPackage(messagetype.typename)}</a> </span>
        `)}
      </div>
    </div>
  `}
`
  }
}

customElements.define("actor-watch-item", WatchItem)
