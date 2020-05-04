import {Component} from "./helpers/component.js"
import {html, css} from "../../../../web_modules/lit-element.js"

class Filter extends Component {

  static get properties() {
    return {
      value: { type: String }
    }
  }

  static get styles() {
    return css`
      .container { position: absolute; top: 10px; left: 10px;}
      .filterinput { font-size: 150%; width: 600px; opacity: 0.8}
    `;
  }

  constructor() {
    super()
    this.value = "!selected || selected.box == me.box || inhops(me, selected, 8)"
  }

  dispatchvalue = value => {
    this.dispatchEvent(new CustomEvent('filterinput', { detail: { value: this.value }, bubbles: true, composed: true }));
  }

  firstUpdated() {
    this.dispatchvalue()
  }

  handleinput = e => {
    this.value = e.target.value
    this.dispatchvalue()
  }

  render() {
    return html`
    <div class="container">
        <input class="filterinput" type="text" placeholder="Filter" @input=${this.handleinput} value="${this.value}"></input>
    </div>
`
  }
}

customElements.define("actor-filter", Filter)
