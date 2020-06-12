import {Component} from "./helpers/component.js"
import {html, css} from "../../../../web_modules/lit-element.js"

const filters = [
  { label: "all", filter:"true"},
  { label: "coordinators", filter:"/Coordinator/.test(me.typename)"},
  { label: "schedulers", filter:"/MonitorActor/.test(me.typename) || selected && selected.box === me._monitorbox"},
  { label: "tree:walk-out", filter: '!selected || selected.box == me.box || me.typename === "CircoCore.MonitorActor{MonitorService}" || onpath( selected, me, [/root|left|right/], 10)' },
  { label: "tree:walk-in", filter: '!selected || selected.box == me.box || me.typename === "CircoCore.MonitorActor{MonitorService}" || onpath( me, selected, [/root|left|right/], 10)' },
  { label: "tree:flower", filter: "!selected || selected.box == me.box || !selected.typename.match(/TreeNode/) || onpath(me, selected, [/left|right/])  ||selected.extra.sibling == me.box || onpath( selected, me, [/left|right/])"},
]

class Filter extends Component {
  static get properties() {
    return {
      actorfilter: { type: String },
      showedges: { type: Boolean },
      glow: { type: Boolean }
    }
  }

  static get styles() {
    return css`
      .container { position: absolute; top: 8px; left: 4px }
      .filterinput { font-size: 110%; width: 600px; opacity: 0.8 }
      .filler { margin-right: 5px }
      .activefiller { color: blue }
      .options { margin-top: 5px }
    `;
  }

  constructor() {
    super()
    this.showedges = false
    this.glow = false
    this.editedtext = localStorage.getItem("editedfilter")
  }

  firstUpdated() {
    this.setactorfilter(filters[0].filter)
  }

  setactorfilter = value => {
    this.actorfilter = value
    if (!filters.find(filter => filter.filter === value)) {
      this.editedtext = value
      localStorage.setItem("editedfilter", this.editedtext)
    }
    this.dispatchEvent(new CustomEvent('filterinput', { detail: { value: this.actorfilter }, bubbles: true, composed: true }));
  }

  handleinput = e => {
    this.setactorfilter(e.target.value)
  }

  handleShowedges = e => {
    this.showedges = e.target.checked
    this.dispatchEvent(new CustomEvent('showedgeschanged', { detail: { value: this.showedges }, bubbles: true, composed: true }));
  }

  handleGlow = e => {
    this.glow = e.target.checked
    this.dispatchEvent(new CustomEvent('glowchanged', { detail: { value: this.glow }, bubbles: true, composed: true }));
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
          ${filters.map(({label, filter}) => html`<a class="filler ${filter === this.actorfilter ? 'activefiller': ''}" href="" @click=${this.inputfiller(filter)}>${label}</a>`)}
          ${this.editedtext && html`<a class="filler ${this.actorfilter === this.editedtext ? 'activefiller': ''}" href="" @click=${this.inputfiller(this.editedtext)}>edited</a>`}
        </div>
      </div>
      <div class="options">
        <input id="showedges" type="checkbox" ?checked=${this.showedges} @click=${this.handleShowedges}></input><label for="showedges">Edges (slow)</label>
        <input id="glow" type="checkbox" ?checked=${this.glow} @click=${this.handleGlow}></input><label for="glow">Glow pointed scheduler (slow)</label>
      </div>
    </div>
`
  }
}

customElements.define("actor-filter", Filter)
