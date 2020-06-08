import {Component} from "./helpers/component.js"
import {html, css} from "../../../../web_modules/lit-element.js"

const filters = [
  { label: "coordinators", filter:"/Coordinator/.test(me.typename)"},
  { label: "schedulers", filter:"/MonitorActor/.test(me.typename) || selected && selected.box === me._monitorbox"},
  { label: "walk-out", filter: '!selected || selected.box == me.box || me.typename === "CircoCore.MonitorActor{MonitorService}" || onpath( selected, me, [/root|left|right/], 10)' },
  { label: "walk-in", filter: '!selected || selected.box == me.box || me.typename === "CircoCore.MonitorActor{MonitorService}" || onpath( me, selected, [/root|left|right/], 10)' },
  { label: "default(flower)", filter: "!selected || selected.box == me.box || !selected.typename.match(/TreeNode/) || onpath(me, selected, [/left|right/])  ||selected.extra.sibling == me.box || onpath( selected, me, [/left|right/])"},
]

class Filter extends Component {
  static get properties() {
    return {
      actorfilter: { type: String },
      showedges: { type: Boolean }
    }
  }

  static get styles() {
    return css`
      .container { position: absolute; top: 8px; left: 4px }
      .filterinput { font-size: 110%; width: 600px; opacity: 0.8 }
      .filler { margin-right: 5px }
      .options { margin-top: 5px }
    `;
  }

  constructor() {
    super()
    this.showedges = false
    this.editedtext = null
  }

  firstUpdated() {
    this.setactorfilter(filters[filters.length - 1].filter)
  }

  setactorfilter = value => {
    this.actorfilter = value
    if (!filters.find(filter => filter.filter === value)) {
      this.editedtext = value
    }
    this.dispatchEvent(new CustomEvent('filterinput', { detail: { value: this.actorfilter }, bubbles: true, composed: true }));
  }

  handleinput = e => {
    this.setactorfilter(e.target.value)
  }

  dispatchShowedges = value => {
    this.dispatchEvent(new CustomEvent('showedgeschanged', { detail: { value: this.showedges }, bubbles: true, composed: true }));
  }

  handleShowedges = e => {
    this.showedges = e.target.checked
    this.dispatchShowedges()
  }

  inputfiller(text) {
    return (e) => {
      e.preventDefault()
      this.setactorfilter(text)
    }
  }

  render() {
    return html`
    <div class="container">
      <div>
        <input class="filterinput" type="text" placeholder="Filter" @input=${this.handleinput} .value="${this.actorfilter}"></input>
        <div>
          ${filters.map(({label, filter}) => html`<a class="filler" href="" @click=${this.inputfiller(filter)}>${label}</a>`)}
          ${this.editedtext && html`<a href="" @click=${this.inputfiller(this.editedtext)}>edited</a>`}
        </div>
      </div>
      <div class="options">
        <input id="showedges" type="checkbox" ?checked=${this.showedges} @click=${this.handleShowedges}></input><label for="showedges">Edges</label>
      </div>
    </div>
`
  }
}

customElements.define("actor-filter", Filter)
