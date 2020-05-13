import {Component} from "./helpers/component.js"
import {html, css} from "../../../../web_modules/lit-element.js"
import { isRegisteredMsg } from "../core/msg.js"

class Watch extends Component {

  static get properties() {
    return {
      actor: { type: Object }
    }
  }

  static get styles() {
    return css`
      .container {font-family: "Gill Sans", sans-serif; text-shadow: 1px 1px 2px white; position: absolute; top: 80px;background-color: rgba(240,240,240,0.44)}
      .attr {text-align: right;padding-right: 10px;font-weight: 700}
      .extraattr {text-align: right; font-style: italic; padding-right: 7px}
    `;
  }

  constructor() {
    super()
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

  render() {
    if (!this.actor) return null
    return html`
    <div class="container">
      <table>
        ${Object.entries(this.actor).map( ([attr, value]) => html`
          <tr>
            <td class="attr">${attr}</td>
            <td>${typeof(value) === "object" ? this.renderObject(value) : value}</td>
          </tr>
        `)}
      </table>
      ${this.messagetypes && html`
        <div>
          ${this.messagetypes.filter(msgtype => isRegisteredMsg(msgtype.typename)).map(messagetype => html`
          <span><a href="#" @click=${() => messagetype.send()}>${this.stripPackage(messagetype.typename)}</a> </span>
          `)}
        </div>
      `}
    </div>
`
  }
}

customElements.define("actor-watch", Watch)
