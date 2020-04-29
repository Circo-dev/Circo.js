import {Component} from "./helpers/component.js"
import {html, css} from "../../../../web_modules/lit-element.js"

class Watch extends Component {

  static get properties() {
    return {
      actor: { type: Object }
    }
  }

  static get styles() {
    return css`
      .container {font-family: "Gill Sans", sans-serif; text-shadow: 1px 1px 2px white; position: absolute; top: 10px}
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
    </div>
`
  }
}

customElements.define("actor-watch", Watch)
