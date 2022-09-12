// ==UserScript==
// @name         Cell Identification Helper
// @namespace    KrzysztofKruk-FlyWire
// @version      0.1.2
// @description  Helps typing in neurons' names
// @author       Krzysztof Kruk
// @match        https://ngl.flywire.ai/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/ChrisRaven/FlyWire-Cell-Identification-Helper/main/Cell-identification-helper.user.js
// @downloadURL  https://raw.githubusercontent.com/ChrisRaven/FlyWire-cell-Identification-Helper/main/Cell-identification-helper.user.js
// @homepageURL  https://github.com/ChrisRaven/FlyWire-Cell-Identification-Helper
// ==/UserScript==

if (!document.getElementById('dock-script')) {
  let script = document.createElement('script')
  script.id = 'dock-script'
  script.src = typeof DEV !== 'undefined' ? 'http://127.0.0.1:5501/FlyWire-Dock/Dock.js' : 'https://chrisraven.github.io/FlyWire-Dock/Dock.js'
  document.head.appendChild(script)
}

let wait = setInterval(() => {
  if (globalThis.dockIsReady) {
    clearInterval(wait)
    main()
  }
}, 100)


function main() {
  let checkClose

  document.addEventListener('fetch', result => {
    if (!result.detail.url.includes('/root?')) return

    let counter = 50
    let wait = setInterval(() => {
      if (!--counter) {
        clearInterval(wait)
      }

      form = document.querySelector('input[title="segmentID"]')
      if (!form) return

      form = form.parentNode.parentNode

      if (form.firstChild.textContent === 'Error') return console.log('Error detected')

      checkClose = setInterval(checkForClear, 500)

      if (!document.getElementById('kk-cih-wrapper')) {
        addCode()
      }
      
      if (wasClosed) {
        wasClosed = false
        clearFields()
      }

      clearInterval(wait)
    }, 100)
    
  })

  function checkForClear() {
    if (!document.getElementsByClassName('overlay-content').length) {
      clearInterval(checkClose)
      wasClosed = true
    }
  }
}


let form = null
let textarea = null

let longName = ''
let shortName = ''
let number = ''
let isPutative = false

let wasClosed = true


function addCode() {
  form.firstChild.style.margin = 0
  form.firstChild.nextSibling.style.fontSize = '12px'
  form.firstChild.nextSibling.style.paddingBottom = 0

  form.forEach(node => {
    if (node.tagName === 'TEXTAREA') {
      textarea = node
      textarea.style.width = '100%'
      textarea.style.height = '80px'
    }
  })

  let html = `
    <div id="kk-cih-wrapper">
      <div id="kk-cih-wrapper-list">${generateHtmlList()}</div>
      <div id="kk-cih-wrapper-grid">${generateHtmlNumbersGrid()}</div>
    </div>
  `

  if (!textarea) return

  textarea.insertAdjacentHTML('beforebegin', html)

  addEvents()
  addCss()
}


function generateHtmlList() {
  const list = [
    ['Centrifugal', 'C'],
    ['Distal medulla', 'Dm'],
    ['Lamina intrinsic', 'Lai'],
    ['Lamina monopolar', 'L'],
    ['Lamina wide field', 'Lawf'],
    ['Lobula columnar', 'Lc'],
    ['Lobula-complex columnar', 'Lccn'],
    ['Lobula intrinsic', 'Li'],
    ['Lobula plate intrinsic', 'Lpi'],
    ['Lobula tangential', 'Lt'],
    ['Medulla intrinsic', 'Mi'],
    ['Medulla tangential', 'Mt'],
    ['Optic lobe tangential', 'Olt'],
    ['Proximal medulla', 'Pm'],
    ['Retinula axon', 'R'],
    ['T', ''],
    ['Translobula', 'Tl'],
    ['Translobula-plate', 'Tlp'],
    ['Transmedullary', 'Tm'],
    ['Transmedullary Y', 'TmY'],
    ['Y', '']
  ]

  let html = '<select id="kk-cih-selection" multiple size="20">'
  list.forEach(entry => {
    const n1 = entry[1] ? entry[1] : entry[0]
    const n2 = entry[1] ? `&emsp;(${entry[0]})` : ''
    html += `<option value="${entry[0]}" data-short="${entry[1]}">${n1}${n2}</option>`
  })
  
  return html += '</select>'
}


function generateHtmlNumbersGrid() {
  return /*html*/ `
    <div id="kk-cih-digit-grid">
      <label><input type="checkbox" id="kk-cih-putative">Putative</label>
      <div class="kk-cih-digit-row">
        <span class="kk-cih-digit">a</span>
        <span class="kk-cih-digit">b</span>
        <span class="kk-cih-digit">c</span>
      </div>
      <div class="kk-cih-digit-row">
        <span class="kk-cih-digit">d</span>
        <span class="kk-cih-digit">e</span>
        <span class="kk-cih-digit">Y</span>
      </div>
      <div class="kk-cih-digit-row">
        <span class="kk-cih-digit">1</span>
        <span class="kk-cih-digit">2</span>
        <span class="kk-cih-digit">3</span>
      </div>
      <div class="kk-cih-digit-row">
        <span class="kk-cih-digit">4</span>
        <span class="kk-cih-digit">5</span>
        <span class="kk-cih-digit">6</span>
      </div>
      <div class="kk-cih-digit-row">
        <span class="kk-cih-digit">7</span>
        <span class="kk-cih-digit">8</span>
        <span class="kk-cih-digit">9</span>
      </div>
      <div class="kk-cih-digit-row">
        <span class="kk-cih-digit-grid-empty"></span>
        <span class="kk-cih-digit">0</span>
        <span class="kk-cih-digit-grid-empty"></span>
      </div>
      <div id="kk-cih-digit-grid-clear">clear</div>
      <div id="kk-cih-digit-grid-suffix">Suffix</div>
      <input id="kk-cih-digit-grid-result" /><br /><br />
    </div>
  `
}


function addEvents() {
  document.getElementById('kk-cih-digit-grid').addEventListener('click', e => {
    if (!e.target.classList.contains('kk-cih-digit')) return

    const digit = e.target.textContent
    document.getElementById('kk-cih-digit-grid-result').value += digit
    number = document.getElementById('kk-cih-digit-grid-result').value
    changeName()
  })

  document.getElementById('kk-cih-digit-grid-clear').addEventListener('click', e => {
    document.getElementById('kk-cih-digit-grid-result').value = ''
    number = ''
    changeName()
  })

  document.getElementById('kk-cih-selection').addEventListener('change', e => {
    longName = e.target.value
    let selectedOption = e.target.options[e.target.selectedIndex]
    shortName = Object.keys(selectedOption.dataset).length ? selectedOption.dataset.short : ''
    changeName()
  })

  document.getElementById('kk-cih-putative').addEventListener('change', e => {
    isPutative = e.target.checked
    changeName()
  })

  document.getElementById('kk-cih-digit-grid-result').addEventListener('input', e => {
    number = e.target.value
    changeName()
  })
}


function changeName() {
  let fullName = ''

  if (isPutative) {
    fullName += 'Putative '
  }

  if (shortName) {
    if (number) {
      fullName += `${longName} ${number}; ${shortName}${number}`
    }
    else {
      fullName += `${longName}; ${shortName}`
    }
  }
  else {
    fullName += `${longName}${number}` // no space here, hence the whole condition
  }

  textarea.value = fullName
}


function clearFields() {
  const selection = document.getElementById('kk-cih-selection')
  if (!selection) return

  selection.selectedIndex = -1
  document.getElementById('kk-cih-digit-grid-result').value = ''
  document.getElementById('kk-cih-putative').checked = false
  longName = ''
  shortName = ''
  number = ''
  isPutative = false
}


function addCss() {
  const style = document.createElement('style')
  style.type = 'text/css'
  style.textContent = /*css*/`
  #kk-cih-digit-grid span {
    display: inline-block;
    padding: 0 5px;
    border: 1px solid #13d7ec;
    cursor: pointer;
    width: 10px;
    height: 20px;
    text-align: center;
    vertical-align: middle;
  }

  .kk-cih-digit-grid-empty {
    border: none !important;
  }

  #kk-cih-digit-grid-clear {
    width: 72px;
    height: 20px;
    border: 1px solid #13d7ec;
    text-align: center;
    vertical-align: middle;
    cursor: pointer;
  }

  #kk-cih-digit-grid-suffix {
    font-size: 14px;
    margin-top: 20px;
    margin-left: -14px;
  }

  #kk-cih-digit-grid-result {
    width: 100px;
    height: 30px;
    margin-left: -14px;
    border: 1px solid #13d7ec;
    background-color: #3b686c;
    text-align: right;
    font-size: 18px;
  }

  #kk-cih-selection {
    display: inline-block;
    overflow-y: auto;
    font-size: 12px;
  }

  #kk-cih-digit-grid {
    display: inline-block;
  }

  #kk-cih-wrapper {
    display: flex;
    justify-content: space-around;
  }

  #kk-cih-putative {
    font-size: 14px;
    vertical-align: text-top;
  }

  #kk-cih-digit-grid label {
    margin-bottom: 20px;
    display: inline-block;
  }
  `

  document.head.appendChild(style)
}
