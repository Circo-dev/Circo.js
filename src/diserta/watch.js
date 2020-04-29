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
      div { position: absolute; top: 10px}
    `;
  }

  constructor() {
    super()
  }

  renderObject(obj) {
    return Object.entries(obj).map( ([name, value]) => value ? html`<span><i>${name}:</i> ${value} </span>` : null)
  }

  render() {
    if (!this.actor) return null
    return html`
    <div>
      <table>
        ${Object.entries(this.actor).map( ([attr, value]) => html`
          <tr>
            <td>${attr}</td>
            <td>${typeof(value) === "object" ? this.renderObject(value) : value}</td>
          </tr>
        `)}
      </table>
    </div>
`
  }
}

customElements.define("actor-watch", Watch)
