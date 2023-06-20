// ==UserScript==
// @name         Cell Identification Helper
// @namespace    KrzysztofKruk-FlyWire
// @version      0.3.1
// @description  Helps typing in neurons' names
// @author       Krzysztof Kruk
// @match        https://ngl.flywire.ai/*
// @match        https://edit.flywire.ai/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      services.itanna.io
// @connect      prod.flywire-daf.com
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
  if (unsafeWindow.dockIsReady) {
    unsafeWindow.GM_xmlhttpRequest = GM_xmlhttpRequest
    clearInterval(wait)
    main()
  }
}, 100)

let userId

let storage
let entries = {}
let currentLabel = ''


function save(label, values) {
  storage.set(label, { value: values })
}

function get(label, callback) {
  storage.get(label).then(res => {
    const content = res[label]

    callback(content)
  })
}


function main() {
  storage = unsafeWindow.Sifrr.Storage.getStorage('indexeddb')

  let checkClose

  // getting the userId
  fetch('https://global.daf-apis.com/auth/api/v1/user/me?middle_auth_token=' + localStorage.getItem('auth_token'))
    .then(res => res.json())
    .then(data => userId = data.id)

  get('kk-identifier', ents => {
    if (!ents || typeof ents !== 'object' || (Object.hasOwn(ents, 'value') && ents.value === undefined)) {
      entries = {}
    }
    else {
      entries = ents
    }
  })
  get('kk-identifier-label', label => currentLabel = label)

  let dock = new Dock()

  const addedIdentificator = document.createElement('div')
  addedIdentificator.id = 'kk-identifier-added-identificator'
  addedIdentificator.classList.add('kk-added-identificator-hidden')
  document.body.appendChild(addedIdentificator)

  dock.addAddon({
    name: 'Identifier',
    id: 'kk-cell-identification-helper',
    html: generateHtml(),
    events: {
      '#kk-identifier-get-cells': {
        click: getCells
      }
    }
  })

  function generateHtml() {
    return /*html*/`
      <button id="kk-identifier-get-cells">Get cells</button>
    `
  }

  function getCells() {
    Dock.dialog({
      id: 'kk-identifier-get-cells-dialog',
      okLabel: 'Close',
      width: 1150,
      okCallback: () => {},
      html: getCellsDialogContent(),
      afterCreateCallback: () => {
        fillIdentifierDialog()
        addIdentifierDialogEvents()
        updateNumberOfEnrtries()
      },
      destroyAfterClosing: true
    }).show()
  }

  function getCellsDialogContent() {
    return /*html*/`
      <div>Current label: <input type="text" id="kk-identifier-current-label"><button id="kk-identifier-label-save">Save</button></div>
      <div>
        <button id="kk-identifier-submit-all">Submit all</button>
        <button id="kk-identifier-clear-all">Clear all</button>
        <button id="kk-identifier-copy-ids">Copy IDs</button>
        <button id="kk-identifier-copy-by-label">Copy by label</button>
        <span>Number of entries: <span id="kk-identifier-entries-counter">0</span></span>
      </div>
      <div id="kk-identifier-cells-table-wrapper">
        <table id="kk-identifier-cells-table"></table>
      </div>
    `
  }

  function fillIdentifierDialog() {
    document.getElementById('kk-identifier-current-label').value = currentLabel || ''
    
    if (!entries || !Object.keys(entries).length) return

    let html = /*html*/`<tr><th>ROOT ID</th><th>COORDS</th><th>LABEL</th><th>ACTIONS</th><th>STATUS</th></tr>`

    Object.entries(entries).forEach(entry => {
      entry = entry[1]

      let coords = entry.coords.map(en => {
        return Math.floor(en)
      })

      html += /*html*/`<tr id="kk-identifier-entry-${entry.id}" data-id="${entry.id}" class="kk-identifier-cells-table-row">
          <td class="id">${entry.id}</td>
          <td class="coords">(${coords.join(', ')})</td>
          <td class="label">${entry.label}</td>
          <td class="actions">
            <button class="kk-identifier-submit">Submit</button>
            <button class="kk-identifier-edit">Edit</button>
            <button class="kk-identifier-remove">Remove</button>
            <button class="kk-identifier-jump">Jump to</button>
          </td>
          <td class="status">
        </tr>`
    })

    document.getElementById('kk-identifier-cells-table').innerHTML = html
  }

  function updateNumberOfEnrtries() {
    const numberOfEntries = document.querySelectorAll('#kk-identifier-cells-table .id').length
    document.getElementById('kk-identifier-entries-counter').textContent = numberOfEntries
  }

  function addIdentifierDialogEvents() {
    document.getElementById('kk-identifier-label-save').addEventListener('click', e => {
      const labelField = document.getElementById('kk-identifier-current-label')
      const newLabel = labelField.value
      if (newLabel) {
        currentLabel = newLabel
        save('kk-identifier-label', currentLabel)
      }
      else {
        labelField.value = currentLabel || ''
      }
    })

    document.getElementById('kk-identifier-submit-all').addEventListener('click', () => {
      identifierSubmitAll()
    })

    document.getElementById('kk-identifier-clear-all').addEventListener('click', () => {
      identifierClearAll()
      updateNumberOfEnrtries()
    })

    document.getElementById('kk-identifier-copy-ids')?.addEventListener('click', () => {
      const ids = []
      document.querySelectorAll('#kk-identifier-cells-table .id').forEach(id => {
        ids.push(id.textContent)
      })

      navigator.clipboard.writeText(ids.join(',')).then(() => {
        Dock.dialog({
          id: 'kk-identifier-ids-copied-to-clipboard-dialog',
          html: 'IDs have been copied to the clipboard',
          okLabel: 'OK',
          okCallback: () => {},
          destroyAfterClosing: true
        }).show()
      })
    })

    document.getElementById('kk-identifier-copy-by-label')?.addEventListener('click', () => {
      Dock.dialog({
        id: 'kk-identifier-copy-by-label-dialog',
        width: 800,
        html: getHtml(),
        afterCreateCallback: afterCreateCallback,
        okLabel: 'Close',
        okCallback: () => {},
        destroyAfterClosing: true
      }).show()

      // source: ChatGPT
      function convertMap(map) {
        const result = {};
      
        for (const [id, label] of map) {
          if (result[label]) {
            result[label].push(id);
          } else {
            result[label] = [id];
          }
        }
      
        return result;
      }

      function getHtml() {
        const entries = document.getElementsByClassName('kk-identifier-cells-table-row')
        const idTypeMap = new Map()
        entries.forEach(entry => idTypeMap.set(entry.dataset.id, entry.getElementsByClassName('label')[0].textContent))
        const typeIdMap = convertMap(idTypeMap)
        
        let html = /*html*/`
          <table id="kk-identifier-groupped-labels-table">
            <tr><th>Label</th><th>IDs</th><th>Action</th></tr>
        `

        Object.entries(typeIdMap).forEach(entry => {
          html += `<tr><td class="label">${entry[0]}</td><td class="ids">${entry[1].join(', ')}</td><td><button class="copy">Copy</button></td></tr>`
        })

        html += '</table>'

        return html
      }

      function afterCreateCallback() {
        document.getElementById('kk-identifier-groupped-labels-table').addEventListener('click', e => {
          if (!e.target.classList.contains('copy')) return

          const row = e.target.parentNode.parentNode
          const ids = row.getElementsByClassName('ids')[0].textContent.replace(/\s/g, '')
          const label = row.getElementsByClassName('label')[0].textContent

          navigator.clipboard.writeText(ids).then(() => {
            Dock.dialog({
              id: 'kk-identifier-groupped-labels-copied-dialog',
              width: 400,
              html: `IDs for label<span>${label}</span>have been copied to the clipboard`,
              okLabel: 'Close',
              okCallback: () => {}
            }).show()
          })
        })
      }
    })

    document.getElementById('kk-identifier-cells-table').addEventListener('click', e => {
      switch (e.target.className) {
        case 'kk-identifier-submit': identifierSubmitCell(e.target); break
        case 'kk-identifier-edit': identifierEditCell(e.target); break
        case 'kk-identifier-remove': identifierRemoveCell(e.target); break
        case 'kk-identifier-jump': identifierJumpToCell(e.target); break
      }
    })

    function identifierSubmitCell(row) {
      const parent = row.parentElement.parentElement
      const id = parent.dataset.id
      const coords = entries[id].coords
      const label = entries[id].label
      const authToken = localStorage.getItem('auth_token')
      const statusTableCell = parent.getElementsByClassName('status')[0]

      const url = `https://prod.flywire-daf.com/neurons/api/v1/submit_cell_identification?valid_id=${id}&submit=1&location=${
        coords.join(',')}&tag=${encodeURIComponent(label)}`

      let status = 'Submitting...'
      statusTableCell.style.color = '#FFF'
      let options = {}
      options.method = 'POST'
      options.url = url
      options.cookie = 'middle_auth_token=' + authToken
      options.onload = function(response) {
        if (response.responseText.includes('Submitted successfully')) {
          status = 'Success'
          statusTableCell.style.color = '#0F0'
          delete entries[id]
          save('kk-identifier', entries)

          setTimeout(() => {
            parent.remove()
            updateNumberOfEnrtries()
          }, 1000)
        }
        else {
          status = 'Error'
          statusTableCell.style.color = '#F00'
        }

        statusTableCell.textContent = status
      }

      statusTableCell.textContent = status

      GM_xmlhttpRequest(options)
      
    }

    function identifierEditCell(row) {
      const parent = row.parentElement.parentElement
      const id = parent.dataset.id
      const oldName = entries[id].label

      Dock.dialog({
        id: 'kk-identifier-edit-cell',
        html: `<input id="kk-identifier-edit-cell-name" value="${oldName}">`,
        okCallback: saveLabel,
        okLabel: 'Save',
        cancelCallback: () => {},
        destroyAfterClosing: true
      }).show()

      function saveLabel() {
        const newLabel = document.getElementById('kk-identifier-edit-cell-name').value

        if (!newLabel) {
          Dock.dialog({
            id: 'kk-identifier-edit-cell-error',
            html: 'Label cannot be empty',
            cancelLabel: 'Close',
            cancelCallback: () => {},
            destroyAfterClosing: true
          }).show()
        }
        else {
          parent.getElementsByClassName('label')[0].textContent = newLabel
          entries[id].label = newLabel
          save('kk-identifier', entries)
        }
      }
    }

    function identifierRemoveCell(row) {
      const tableRow = row.parentElement.parentElement
      const id = tableRow.dataset.id

      Dock.dialog({
        id: 'kk-identifier-remove-cell',
        html: `<center>Are you sure, you want to remove entry for cell ${id}</center>`,
        okCallback: removeCell,
        okLabel: 'Yes',
        cancelCallback: () => {},
        cancelLabel: 'No',
        width: 300
      }).show()

      function removeCell() {
        tableRow.remove()
        delete entries[id]
        save('kk-identifier', entries)
        updateNumberOfEnrtries()
      }
    }

    function identifierJumpToCell(row) {
      const id = row.parentElement.parentElement.dataset.id
      const coords = entries[id].coords

      Dock.jumpToCoords(coords)
    }

    function identifierSubmitAll() {
      document.getElementsByClassName('kk-identifier-submit').forEach(el => el.click())
    }

    function identifierClearAll() {
      Dock.dialog({
        id: 'kk-identifier-clear-all-warning',
        html: 'Are you sure, you want to remove all the entries?',
        okLabel: 'Yes',
        cancelLabel: 'No',
        okCallback: confirmed,
        cancelCallback: () => {}
      }).show()

      function confirmed() {
        entries = {}
        save('kk-identifier', entries)
        document.getElementById('kk-identifier-cells-table').remove()
        updateNumberOfEnrtries()
      }
    }
  }

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

  document.addEventListener('keyup', e => {
    if (e.key !== '/' && e.key !== '-' && e.key !== '`') return
    if (e.target.tagName === 'TEXTAREA') return
    if ((e.target.tagName === 'INPUT') && ['text', 'password', 'email', 'number'].contains(e.target.type)) return

    
    const coords = Dock.getCurrentCoords()
    // coords[1] += 10
    const mouseRootId = viewer.mouseState.pickedValue.toJSON()
    Dock.getRootIdByCoords(...coords, (rootId) => {
      const identificator = document.getElementById('kk-identifier-added-identificator')
      identificator.classList.remove('kk-added-identificator-hidden')
      setTimeout(() => identificator.classList.add('kk-added-identificator-hidden'), 1000)

      if (!rootId || mouseRootId !== rootId) {
        identificator.style.backgroundColor = 'red'
        return
      }
      identificator.style.backgroundColor = 'lime'

      entries[rootId] = {
        id: rootId,
        coords: coords,
        label: currentLabel
      }

      save('kk-identifier', entries)
    })
    
  })

  function checkForClear() {
    if (!document.getElementsByClassName('overlay-content').length) {
      clearInterval(checkClose)
      wasClosed = true
    }
  }

  addCss()
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
}


function generateHtmlList() {
  const list = [
    ['Centrifugal', 'C'],
    ['Distal medulla', 'Dm'],
    ['Lamina intrinsic', 'Lai'],
    ['Lamina monopolar', 'L'],
    ['Lamina wide field', 'Lawf'],
    ['Lobula columnar', 'Lc'],
    ['Lobula-lobula plate columnar', 'LLPC'],
    ['Lobula plate-lobula columnar', 'LPLC'],
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

  #kk-identifier-get-cells-dialog {
    height: 80vh;
  }

  #kk-identifier-cells-table-wrapper {
    height: 60vh;
    overflow-y: auto;
  }

  #kk-identifier-cells-table {
    font-size: 12px;
  }

  #kk-identifier-cells-table tr:nth-child(1) {
    top: 0;
    position: sticky;
    background-color: #222;
    box-shadow: 0 2px 2px -1px rgb(0 0 0 / 40%);
  }

  .kk-identifier-cells-table-row td {
    padding: 0 10px;
  }

  .kk-identifier-cells-table-row .coords {
    width: 160px;
  }

  .kk-identifier-cells-table-row .label {
    width: 300px;
  }

  .kk-identifier-cells-table-row .actions {
    width: 325px;
    text-align: center;
  }

  .kk-identifier-cells-table-row .status {
    width: 120px;
  }

  .kk-identifier-cells-table-row:nth-child(even) {
    background-color: #333;
  }

  .content > div > input#kk-identifier-current-label {
    width: 600px;
    margin: 20px;
  }

  .content > div > button#kk-identifier-submit-all,
  .content > div > button#kk-identifier-clear-all {
    width: 80px;
    margin-bottom: 10px;
  }

  #kk-identifier-added-identificator {
    position: absolute;
    top: 0;
    left: 0;
    margin: 0;
    width: 20px;
    height: 20px;
    background-color: lime;
    z-index: 30;
  }

  .kk-added-identificator-hidden {
    display: none;
  }

  .kk-added-identificator-error {
    background-color: #F00;
  }

  #kk-identifier-get-cells-dialog button#kk-identifier-copy-by-label {
    width: 100px;
  }

  #kk-identifier-groupped-labels-table {
    font-size: 12px;
  }

  #kk-identifier-groupped-labels-table td {
    padding-right: 10px;
  }

  #kk-identifier-groupped-labels-table td:nth-child(1) {
    width: 400px;
    max-width: 400px;
  }

  #kk-identifier-groupped-labels-table td:nth-child(2) {
    width: 300px;
    max-width: 300px;
    overflow-wrap: anywhere;
  }

  #kk-identifier-groupped-labels-copied-dialog {
    font-size: 12px;
  }

  #kk-identifier-groupped-labels-copied-dialog span {
    display: block;
    color: orange;
    margin: 15px 0;
  }

  `

  document.head.appendChild(style)
}
