// ==UserScript==
// @name         Cell Identification Helper
// @namespace    KrzysztofKruk-FlyWire
// @version      0.1
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
  
}

