const desktop = document.getElementById('desktop');
const windows = document.getElementById('windows');
const spotlight = document.getElementById('spotlight');
const spotlightInput = document.getElementById('spotlightInput');
const spotlightResults = document.getElementById('spotlightResults');
const contextMenu = document.getElementById('contextMenu');
const controlCenter = document.getElementById('controlCenter');
const appleMenu = document.getElementById('appleMenu');
const appName = document.getElementById('appName');
const appleMenuButton = document.getElementById('appleMenuButton');
const controlButton = document.getElementById('controlButton');
const spotlightButton = document.getElementById('spotlightButton');
let zTop = 100;
let wallpaperIndex = 0;
let spotlightSelectedIndex = 0;
let spotlightReturnFocus = null;
let contextMenuReturnFocus = null;
const wallpapers = ['sonoma', 'ventura', 'monterey'];

const appInfo = {
  finder: { title: 'Finder', icon: '▱' },
  notes: { title: 'Notes', icon: '✎' },
  terminal: { title: 'Terminal', icon: '>_' },
  calculator: { title: 'Calculator', icon: '＋' },
  about: { title: 'About This Mac', icon: '' }
};

function getStoredValue(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`Unable to read "${key}" from browser storage.`, error);
    return null;
  }
}

function setStoredValue(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Unable to save "${key}" to browser storage.`, error);
    showToast('Changes could not be saved in this browser.');
    return false;
  }
}

const savedTheme = getStoredValue('mac-theme');
if (savedTheme === 'dark') document.body.classList.add('dark');
const savedWallpaper = getStoredValue('mac-wallpaper');
const savedWallpaperIndex = wallpapers.indexOf(savedWallpaper);
if (savedWallpaperIndex >= 0) wallpaperIndex = savedWallpaperIndex;
applyWallpaper();

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}

function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toLocaleString([], {
    weekday:'short', month:'short', day:'numeric', hour:'numeric', minute:'2-digit'
  }).replace(',', '');
}
updateClock();
setInterval(updateClock, 1000);

function closeMenus() {
  const activeMenu = [appleMenu, controlCenter, contextMenu].find(menu => menu.contains(document.activeElement));
  if (activeMenu) {
    const focusTarget = activeMenu === appleMenu ? appleMenuButton
      : activeMenu === controlCenter ? controlButton : contextMenuReturnFocus;
    focusTarget?.focus();
  }
  appleMenu.classList.remove('open');
  appleMenu.setAttribute('aria-hidden', 'true');
  appleMenuButton.setAttribute('aria-expanded', 'false');
  controlCenter.classList.remove('open');
  controlCenter.setAttribute('aria-hidden', 'true');
  controlButton.setAttribute('aria-expanded', 'false');
  contextMenu.classList.remove('open');
  contextMenu.setAttribute('aria-hidden', 'true');
}

appleMenuButton.addEventListener('click', event => {
  event.stopPropagation();
  const isOpen = appleMenu.classList.toggle('open');
  controlCenter.classList.remove('open');
  controlCenter.setAttribute('aria-hidden', 'true');
  controlButton.setAttribute('aria-expanded', 'false');
  appleMenu.setAttribute('aria-hidden', String(!isOpen));
  appleMenuButton.setAttribute('aria-expanded', String(isOpen));
});
controlButton.addEventListener('click', event => {
  event.stopPropagation();
  appleMenu.classList.remove('open');
  appleMenu.setAttribute('aria-hidden', 'true');
  appleMenuButton.setAttribute('aria-expanded', 'false');
  const isOpen = controlCenter.classList.toggle('open');
  controlCenter.setAttribute('aria-hidden', String(!isOpen));
  controlButton.setAttribute('aria-expanded', String(isOpen));
});
desktop.addEventListener('click', event => {
  if (!event.target.closest('.menu-dropdown, .control-center, .context-menu, .spotlight')) closeMenus();
  if (!event.target.closest('.spotlight') && spotlight.classList.contains('open')) closeSpotlight();
});

document.getElementById('themeButton').addEventListener('click', toggleTheme);
document.getElementById('appearanceToggle').addEventListener('click', toggleTheme);
document.getElementById('wallpaperToggle').addEventListener('click', () => { cycleWallpaper(); closeMenus(); });

function toggleTheme() {
  document.body.classList.toggle('dark');
  const dark = document.body.classList.contains('dark');
  setStoredValue('mac-theme', dark ? 'dark' : 'light');
  document.getElementById('appearanceLabel').textContent = dark ? 'Dark' : 'Light';
}

function applyWallpaper() {
  desktop.classList.remove('wallpaper-sonoma', 'wallpaper-ventura', 'wallpaper-monterey');
  desktop.classList.add(`wallpaper-${wallpapers[wallpaperIndex]}`);
  setStoredValue('mac-wallpaper', wallpapers[wallpaperIndex]);
}
function cycleWallpaper() {
  wallpaperIndex = (wallpaperIndex + 1) % wallpapers.length;
  applyWallpaper();
  const name = wallpapers[wallpaperIndex];
  showToast(`Wallpaper changed to ${name[0].toUpperCase()}${name.slice(1)}`);
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 1800);
}

function openApp(appId) {
  if (!appInfo[appId]) return;
  const existing = document.querySelector(`.window[data-app="${appId}"]`);
  if (existing) {
    existing.classList.remove('hidden', 'minimized');
    existing.inert = false;
    existing.setAttribute('aria-hidden', 'false');
    focusWindow(existing);
    existing.focus();
  } else {
    createWindow(appId);
  }
  closeMenus();
  closeSpotlight();
}

function createWindow(appId) {
  const info = appInfo[appId];
  if (!info) return;
  const windowEl = document.createElement('article');
  windowEl.className = 'window';
  windowEl.dataset.app = appId;
  windowEl.setAttribute('role', 'dialog');
  windowEl.setAttribute('aria-modal', 'false');
  windowEl.setAttribute('aria-labelledby', `window-title-${appId}`);
  windowEl.tabIndex = -1;
  windowEl.style.zIndex = ++zTop;
  const offset = (document.querySelectorAll('.window').length % 7) * 24;
  windowEl.style.left = `calc(50% - ${appId === 'calculator' ? 145 : 320}px + ${offset}px)`;
  windowEl.style.top = `${55 + offset}px`;
  if (appId === 'calculator') windowEl.style.width = '290px', windowEl.style.height = '430px';
  if (appId === 'about') windowEl.style.width = '520px', windowEl.style.height = '390px';
  windowEl.innerHTML = `
    <header class="titlebar">
      <div class="traffic-lights">
        <button class="close-light" aria-label="Close ${info.title} window"></button>
        <button class="minimize-light" aria-label="Minimize ${info.title} window"></button>
        <button class="zoom-light" aria-label="Zoom ${info.title} window" aria-pressed="false"></button>
      </div>
      <span class="window-title" id="window-title-${appId}">${info.title}</span>
    </header>
    <div class="window-content"></div>`;
  windows.appendChild(windowEl);
  windowEl.focus();
  windowEl.querySelector('.close-light').addEventListener('click', () => closeWindow(windowEl));
  windowEl.querySelector('.minimize-light').addEventListener('click', () => minimizeWindow(windowEl));
  windowEl.querySelector('.zoom-light').addEventListener('click', event => {
    const zoomed = windowEl.classList.toggle('zoomed');
    event.currentTarget.setAttribute('aria-pressed', String(zoomed));
  });
  windowEl.addEventListener('pointerdown', () => focusWindow(windowEl));
  makeDraggable(windowEl);
  renderApp(windowEl.querySelector('.window-content'), appId);
  document.querySelector(`.dock-item[data-app="${appId}"]`)?.classList.add('open');
  appName.textContent = info.title;
}

function closeWindow(windowEl) {
  const appId = windowEl.dataset.app;
  windowEl.remove();
  if (!document.querySelector(`.window[data-app="${appId}"]`)) {
    const dockItem = document.querySelector(`.dock-item[data-app="${appId}"]`);
    dockItem?.classList.remove('open');
    (dockItem || document.getElementById('desktopIcons')).focus();
  }
  updateAppName();
}

function minimizeWindow(windowEl) {
  document.querySelector(`.dock-item[data-app="${windowEl.dataset.app}"]`)?.focus();
  windowEl.classList.add('minimized');
  windowEl.inert = true;
  windowEl.setAttribute('aria-hidden', 'true');
  updateAppName();
}

function focusWindow(windowEl) {
  windowEl.style.zIndex = ++zTop;
  appName.textContent = appInfo[windowEl.dataset.app].title;
}

function updateAppName() {
  const activeWindow = Array.from(document.querySelectorAll('.window:not(.minimized)'))
    .sort((a, b) => Number(b.style.zIndex) - Number(a.style.zIndex))[0];
  appName.textContent = activeWindow ? appInfo[activeWindow.dataset.app].title : 'Finder';
}

function makeDraggable(windowEl) {
  const titlebar = windowEl.querySelector('.titlebar');
  let dragState = null;

  titlebar.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || event.target.closest('button') || windowEl.classList.contains('zoomed')) return;
    const bounds = windows.getBoundingClientRect();
    const rect = windowEl.getBoundingClientRect();
    dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: rect.left - bounds.left,
      originY: rect.top - bounds.top
    };
    titlebar.setPointerCapture(event.pointerId);
  });

  titlebar.addEventListener('pointermove', event => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const maxLeft = Math.max(0, windows.clientWidth - windowEl.offsetWidth);
    const maxTop = Math.max(0, windows.clientHeight - windowEl.offsetHeight);
    windowEl.style.left = `${Math.max(0, Math.min(maxLeft, dragState.originX + event.clientX - dragState.startX))}px`;
    windowEl.style.top = `${Math.max(0, Math.min(maxTop, dragState.originY + event.clientY - dragState.startY))}px`;
  });

  function stopDragging(event) {
    if (dragState && dragState.pointerId === event.pointerId) dragState = null;
  }
  titlebar.addEventListener('pointerup', stopDragging);
  titlebar.addEventListener('pointercancel', stopDragging);
  titlebar.addEventListener('lostpointercapture', stopDragging);
}

function renderApp(container, appId) {
  if (appId === 'finder') renderFinder(container);
  if (appId === 'notes') renderNotes(container);
  if (appId === 'terminal') renderTerminal(container);
  if (appId === 'calculator') renderCalculator(container);
  if (appId === 'about') renderAbout(container);
}

function renderFinder(container) {
  const folders = ['Desktop', 'Documents', 'Downloads', 'Projects'];
  container.innerHTML = `<div class="finder"><aside class="sidebar"><h4>Favorites</h4>${folders.map((name,i)=>`<button class="${i===0?'active':''}" data-folder="${name}">${name}</button>`).join('')}</aside><section class="finder-browser"><h3 id="finderHeading">Desktop</h3><div class="file-grid"></div></section></div>`;
  const browser = container.querySelector('.file-grid');
  function showFolder(name) {
    container.querySelector('#finderHeading').textContent = name;
    browser.innerHTML = (name === 'Desktop'
      ? ['Macintosh HD', 'Quick Note', 'Terminal']
      : name === 'Projects' ? ['Portfolio', 'Experiments', 'Archive'] : ['Welcome.txt', 'Read me.pdf', 'Untitled folder']).map(item => `<button class="file-item"><span class="folder-icon"></span><span>${item}</span></button>`).join('');
  }
  showFolder('Desktop');
  container.querySelector('.sidebar').addEventListener('click', event => {
    const button = event.target.closest('[data-folder]');
    if (!button) return;
    container.querySelectorAll('.sidebar button').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    showFolder(button.dataset.folder);
  });
}

function renderNotes(container) {
  let notes = [];
  const storedNotes = getStoredValue('mac-notes');
  if (storedNotes) {
    try {
      const parsedNotes = JSON.parse(storedNotes);
      if (Array.isArray(parsedNotes)) {
        notes = parsedNotes
          .filter(note => note && typeof note === 'object')
          .map(note => ({
            title: typeof note.title === 'string' ? note.title : 'Untitled',
            body: typeof note.body === 'string' ? note.body : ''
          }));
      }
    } catch (error) {
      console.warn('Saved notes were invalid and could not be loaded.', error);
    }
  }
  if (!Array.isArray(notes) || !notes.length) notes = [{title:'Welcome', body:'Welcome to Notes!\n\nYour notes are saved automatically in this browser.'}];
  let active = 0;
  container.innerHTML = `<div class="notes-app"><aside class="notes-list"></aside><section class="notes-editor"><div class="notes-toolbar"><button id="addNote" title="New note">＋</button></div><input id="noteTitle"><textarea id="noteBody"></textarea></section></div>`;
  const list = container.querySelector('.notes-list');
  const title = container.querySelector('#noteTitle');
  const body = container.querySelector('#noteBody');
  function save() { setStoredValue('mac-notes', JSON.stringify(notes)); }
  function draw() {
    list.innerHTML = notes.map((note,i)=>`<button class="${i===active?'active':''}" data-index="${i}">${escapeHtml(note.title || 'Untitled')}</button>`).join('');
    title.value = notes[active].title; body.value = notes[active].body;
  }
  draw();
  title.addEventListener('input', () => {
    notes[active].title = title.value;
    save();
    const activeItem = list.querySelector(`[data-index="${active}"]`);
    if (activeItem) activeItem.textContent = title.value || 'Untitled';
  });
  body.addEventListener('input', () => { notes[active].body = body.value; save(); });
  list.addEventListener('click', event => {
    const button = event.target.closest('[data-index]');
    const index = button ? Number(button.dataset.index) : -1;
    if (!Number.isInteger(index) || index < 0 || index >= notes.length) return;
    active = index;
    draw();
  });
  container.querySelector('#addNote').addEventListener('click', () => { notes.unshift({title:'Untitled', body:''}); active=0; save(); draw(); title.select(); });
}

function renderTerminal(container) {
  container.innerHTML = `<div class="terminal-app"><div class="terminal-output">Last login: ${new Date().toDateString()} on ttys000\nType 'help' for available commands.</div><div class="terminal-line"><span class="prompt">prashanth@mac ~ %</span><input class="terminal-input" autocomplete="off"></div></div>`;
  const output = container.querySelector('.terminal-output');
  const input = container.querySelector('.terminal-input');
  input.focus();
  container.addEventListener('click', () => input.focus());
  input.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    const command = input.value.trim();
    const [name, ...args] = command.split(/\s+/);
    let response = '';
    if (!command) response = '';
    else if (name === 'help') response = 'Available: help, ls, open, wallpaper, theme, whoami, date, uname, echo, clear';
    else if (name === 'ls') response = 'Desktop  Documents  Downloads  Projects';
    else if (name === 'open') response = args[0] ? `Opening ${args.join(' ')}…` : 'usage: open <app|file>';
    else if (name === 'wallpaper') { cycleWallpaper(); response = `Wallpaper set to ${wallpapers[wallpaperIndex]}`; }
    else if (name === 'theme') { toggleTheme(); response = `Theme set to ${document.body.classList.contains('dark') ? 'dark' : 'light'}`; }
    else if (name === 'whoami') response = 'prashanth';
    else if (name === 'date') response = new Date().toString();
    else if (name === 'uname') response = 'Darwin mac.local 24.0.0 Darwin Kernel Version 24.0.0';
    else if (name === 'echo') response = args.join(' ');
    else if (name === 'clear') { output.textContent = ''; input.value = ''; return; }
    else response = `zsh: command not found: ${name}`;
    output.textContent += `\nprashanth@mac ~ % ${command}` + (response ? `\n${response}` : '');
    input.value = '';
  });
}

function renderCalculator(container) {
  container.innerHTML = `<div class="calculator-app"><div class="calc-display">0</div><div class="calc-grid">${[
    ['AC','function'],['+/−','function'],['%','function'],['÷','operator'],['7',''],['8',''],['9',''],['×','operator'],['4',''],['5',''],['6',''],['−','operator'],['1',''],['2',''],['3',''],['＋','operator'],['0','zero'],['.',''],['=','operator']
  ].map(([label,cls])=>`<button class="${cls}" data-key="${label}">${label}</button>`).join('')}</div></div>`;
  const display = container.querySelector('.calc-display');
  let displayValue = '0';
  let storedValue = null;
  let pendingOperator = null;
  let waitingForOperand = false;

  function updateDisplay() {
    display.textContent = displayValue;
  }

  function calculate(left, right, operator) {
    if (operator === '＋') return left + right;
    if (operator === '−') return left - right;
    if (operator === '×') return left * right;
    if (operator === '÷') return right === 0 ? null : left / right;
    return right;
  }

  function formatResult(value) {
    return String(Number(value.toPrecision(10)));
  }

  container.querySelector('.calc-grid').addEventListener('click', event => {
    const button = event.target.closest('[data-key]');
    if (!button) return;
    const key = button.dataset.key;

    if (/^\d$/.test(key)) {
      displayValue = waitingForOperand || displayValue === '0' ? key : displayValue + key;
      waitingForOperand = false;
    } else if (key === '.') {
      if (waitingForOperand) {
        displayValue = '0.';
        waitingForOperand = false;
      } else if (!displayValue.includes('.')) {
        displayValue += '.';
      }
    } else if (key === 'AC') {
      displayValue = '0';
      storedValue = null;
      pendingOperator = null;
      waitingForOperand = false;
    } else if (key === '+/−') {
      displayValue = String(Number(displayValue) * -1);
    } else if (key === '%') {
      displayValue = String(Number(displayValue) / 100);
    } else if (key === '=') {
      if (pendingOperator && storedValue !== null) {
        const result = calculate(storedValue, Number(displayValue), pendingOperator);
        displayValue = result === null ? 'Error' : formatResult(result);
        storedValue = null;
        pendingOperator = null;
        waitingForOperand = true;
        if (result === null) showToast('Cannot divide by zero.');
      }
    } else if (['＋', '−', '×', '÷'].includes(key)) {
      const inputValue = Number(displayValue);
      if (pendingOperator && !waitingForOperand && storedValue !== null) {
        const result = calculate(storedValue, inputValue, pendingOperator);
        if (result === null) {
          displayValue = 'Error';
          storedValue = null;
          pendingOperator = null;
          waitingForOperand = true;
          showToast('Cannot divide by zero.');
          updateDisplay();
          return;
        }
        displayValue = formatResult(result);
      }
      storedValue = Number(displayValue);
      pendingOperator = key;
      waitingForOperand = true;
    }

    updateDisplay();
  });
}

function renderAbout(container) {
  container.innerHTML = `<div class="about-app"><div class="about-logo"></div><h2>macOS Sonoma</h2><p>MacBook Pro</p><div class="about-specs"><div><strong>Chip</strong>Apple Silicon</div><div><strong>Memory</strong>16 GB</div><div><strong>Display</strong>14-inch Retina</div><div><strong>Appearance</strong>${document.body.classList.contains('dark')?'Dark':'Light'}</div></div></div>`;
}

function renderSpotlight(query='') {
  const items = [
    {name:'Finder', detail:'Application', app:'finder', icon:'▱'},
    {name:'Notes', detail:'Application', app:'notes', icon:'✎'},
    {name:'Terminal', detail:'Application', app:'terminal', icon:'>_'},
    {name:'Calculator', detail:'Application', app:'calculator', icon:'＋'},
    {name:'About This Mac', detail:'System Preferences', app:'about', icon:''},
    {name:'Sonoma Wallpaper', detail:'System Action', action:'wallpaper', icon:'▧'},
    {name:'Toggle Dark Mode', detail:'System Action', action:'theme', icon:'◐'}
  ];
  const matches = items.filter(item => `${item.name} ${item.detail}`.toLowerCase().includes(query.toLowerCase()));
  spotlightSelectedIndex = matches.length ? 0 : -1;
  spotlightResults.innerHTML = matches.length ? matches.map((item,i)=>`<button class="spotlight-result ${i===spotlightSelectedIndex?'selected':''}" id="spotlight-result-${i}" role="option" aria-selected="${i===spotlightSelectedIndex}" data-app="${item.app||''}" data-action="${item.action||''}"><span class="result-icon">${item.icon}</span><span><strong>${item.name}</strong><small>${item.detail}</small></span></button>`).join('') : `<div class="spotlight-result"><span>No Results</span></div>`;
  updateSpotlightSelection();
}

function updateSpotlightSelection() {
  const results = spotlightResults.querySelectorAll('[role="option"]');
  results.forEach((result, index) => {
    const selected = index === spotlightSelectedIndex;
    result.classList.toggle('selected', selected);
    result.setAttribute('aria-selected', String(selected));
  });
  if (spotlightSelectedIndex >= 0 && results[spotlightSelectedIndex]) {
    spotlightInput.setAttribute('aria-activedescendant', results[spotlightSelectedIndex].id);
  } else {
    spotlightInput.removeAttribute('aria-activedescendant');
  }
}

function openSpotlight(returnFocus = document.activeElement) {
  closeMenus();
  spotlightReturnFocus = returnFocus;
  spotlight.inert = false;
  spotlight.classList.add('open'); spotlight.setAttribute('aria-hidden','false');
  spotlightButton.setAttribute('aria-expanded', 'true');
  spotlightInput.setAttribute('aria-expanded', 'true');
  spotlightInput.value=''; renderSpotlight(); setTimeout(() => {
    if (spotlight.classList.contains('open')) spotlightInput.focus();
  }, 50);
}
function closeSpotlight(restoreFocus = false) {
  if (restoreFocus || spotlight.contains(document.activeElement)) {
    const focusTarget = spotlightReturnFocus?.isConnected && !spotlight.contains(spotlightReturnFocus)
      ? spotlightReturnFocus : spotlightButton;
    focusTarget.focus();
  }
  spotlight.classList.remove('open');
  spotlight.inert = true;
  spotlight.setAttribute('aria-hidden','true');
  spotlightButton.setAttribute('aria-expanded', 'false');
  spotlightInput.setAttribute('aria-expanded', 'false');
}
spotlightButton.addEventListener('click', openSpotlight);
spotlightInput.addEventListener('input', () => renderSpotlight(spotlightInput.value));
spotlightResults.addEventListener('click', event => {
  const result = event.target.closest('.spotlight-result'); if (!result) return;
  if (result.dataset.app) {
    openApp(result.dataset.app);
    return;
  }
  if (result.dataset.action === 'wallpaper') cycleWallpaper();
  if (result.dataset.action === 'theme') toggleTheme();
  closeSpotlight(true);
});

document.addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  const modifier = event.ctrlKey || event.metaKey;

  if ((event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10'))
    && (event.target.closest?.('.desktop-icon') || event.target === document.getElementById('desktopIcons'))) {
    event.preventDefault();
    showContextMenu(innerWidth / 2, innerHeight / 2, event.target.closest?.('.desktop-icon') || document.getElementById('desktopIcons'));
  }

  if (spotlight.classList.contains('open') && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
    const resultCount = spotlightResults.querySelectorAll('[role="option"]').length;
    if (resultCount) {
      event.preventDefault();
      spotlightSelectedIndex = (spotlightSelectedIndex + (event.key === 'ArrowDown' ? 1 : -1) + resultCount) % resultCount;
      updateSpotlightSelection();
    }
  }
  if ((modifier && key === 'k')) {
    event.preventDefault();
    openSpotlight();
  }
  if (spotlight.classList.contains('open') && event.key === 'Enter') {
    event.preventDefault();
    spotlightResults.querySelector('[aria-selected="true"]')?.click();
  }
  if (modifier && (key === 'w' || key === 'm')) {
    const activeWindow = Array.from(document.querySelectorAll('.window:not(.minimized)'))
      .sort((a, b) => Number(b.style.zIndex) - Number(a.style.zIndex))[0];
    if (activeWindow) {
      event.preventDefault();
      if (key === 'w') closeWindow(activeWindow);
      else minimizeWindow(activeWindow);
    }
  }

  const openMenu = desktop.querySelector('.menu-dropdown.open, .control-center.open, .context-menu.open');
  if (openMenu && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    const items = Array.from(openMenu.querySelectorAll('button:not([disabled])'));
    if (!items.length) return;
    event.preventDefault();
    const currentIndex = items.indexOf(document.activeElement);
    const nextIndex = event.key === 'Home' ? 0
      : event.key === 'End' ? items.length - 1
      : event.key === 'ArrowDown' ? (currentIndex + 1 + items.length) % items.length
      : (currentIndex <= 0 ? items.length - 1 : currentIndex - 1);
    items[nextIndex].focus();
  }
  if (event.key === 'Escape') {
    const restoreMenuFocus = appleMenu.classList.contains('open') ? appleMenuButton
      : controlCenter.classList.contains('open') ? controlButton
      : contextMenu.classList.contains('open') ? contextMenuReturnFocus : null;
    closeSpotlight(spotlight.classList.contains('open'));
    closeMenus();
    restoreMenuFocus?.focus();
  }
});

document.querySelectorAll('[data-app]').forEach(element => {
  element.addEventListener('click', event => {
    if (element.classList.contains('dock-item')) openApp(element.dataset.app);
    if (element.classList.contains('desktop-icon') && event.detail === 0) openApp(element.dataset.app);
  });
  if (element.classList.contains('desktop-icon')) element.addEventListener('dblclick', () => openApp(element.dataset.app));
});

function showContextMenu(x, y, invoker) {
  closeMenus();
  contextMenuReturnFocus = invoker;
  contextMenu.style.left = `${Math.max(0, Math.min(x, innerWidth - 220))}px`;
  contextMenu.style.top = `${Math.max(29, Math.min(y, innerHeight - 220))}px`;
  contextMenu.classList.add('open');
  contextMenu.setAttribute('aria-hidden', 'false');
  contextMenu.querySelector('button')?.focus();
}

desktop.addEventListener('contextmenu', event => {
  event.preventDefault();
  if (event.target.closest('.window, .dock, .menu-bar, .spotlight')) return;
  showContextMenu(event.clientX, event.clientY, event.target.closest('.desktop-icon') || document.getElementById('desktopIcons'));
});

contextMenu.addEventListener('click', event => {
  const action = event.target.dataset.context; if (!action) return;
  if (action === 'spotlight') openSpotlight(contextMenuReturnFocus);
  if (action === 'wallpaper') cycleWallpaper();
  if (action === 'darkMode') toggleTheme();
  if (action === 'desktopInfo') showToast('Macintosh HD · 128 GB available');
  if (action === 'newFolder') showToast('New Folder');
  closeMenus();
  contextMenuReturnFocus?.focus();
});

appleMenu.addEventListener('click', event => {
  const action = event.target.dataset.action; if (!action) return;
  if (action === 'about') openApp('about');
  if (action === 'lock') showToast('Screen locked');
  if (action === 'systemSettings') showToast('System Settings');
  if (action === 'appStore') showToast('App Store');
  closeMenus();
  if (action !== 'about') appleMenuButton.focus();
});

window.addEventListener('resize', () => {
  document.querySelectorAll('.window.zoomed').forEach(windowEl => {
    windowEl.style.width = 'calc(100% - 16px)'; windowEl.style.height = 'calc(100% - 16px)';
  });
});

// ── Bar-menu dropdowns ───────────────────────────────────────────────
const barMenus = [
  { buttonId: 'fileMenuButton',   menuId: 'fileMenu' },
  { buttonId: 'editMenuButton',   menuId: 'editMenu' },
  { buttonId: 'viewMenuButton',   menuId: 'viewMenu' },
  { buttonId: 'goMenuButton',     menuId: 'goMenu' },
  { buttonId: 'windowMenuButton', menuId: 'windowMenu' },
  { buttonId: 'helpMenuButton',   menuId: 'helpMenu' },
];

function closeBarMenus(except) {
  barMenus.forEach(({ buttonId, menuId }) => {
    const btn = document.getElementById(buttonId);
    const menu = document.getElementById(menuId);
    if (menu === except) return;
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
    btn.setAttribute('aria-expanded', 'false');
  });
}

barMenus.forEach(({ buttonId, menuId }) => {
  const btn = document.getElementById(buttonId);
  const menu = document.getElementById(menuId);

  // Position dropdown under its button on each open
  function positionMenu() {
    const rect = btn.getBoundingClientRect();
    menu.style.left = `${rect.left}px`;
  }

  btn.addEventListener('click', event => {
    event.stopPropagation();
    const isOpen = menu.classList.contains('open');
    // Close apple menu and control center
    appleMenu.classList.remove('open');
    appleMenu.setAttribute('aria-hidden', 'true');
    appleMenuButton.setAttribute('aria-expanded', 'false');
    controlCenter.classList.remove('open');
    controlCenter.setAttribute('aria-hidden', 'true');
    controlButton.setAttribute('aria-expanded', 'false');
    closeBarMenus(isOpen ? null : menu);
    if (!isOpen) {
      positionMenu();
      menu.classList.add('open');
      menu.setAttribute('aria-hidden', 'false');
      btn.setAttribute('aria-expanded', 'true');
      menu.querySelector('button')?.focus();
    }
  });

  // Hover: switch to this menu if another bar menu is already open
  btn.addEventListener('mouseenter', () => {
    const anyOpen = barMenus.some(m => document.getElementById(m.menuId).classList.contains('open'));
    if (anyOpen && !menu.classList.contains('open')) btn.click();
  });

  menu.addEventListener('click', event => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    const app    = event.target.closest('[data-app]')?.dataset.app;
    const msg    = event.target.closest('[data-msg]')?.dataset.msg;
    if (!action) return;

    if (action === 'openApp' && app)       openApp(app);
    else if (action === 'newFolder')       showToast('New Folder');
    else if (action === 'newWindow')       openApp('finder');
    else if (action === 'closeWindow')     { const w = topWindow(); if (w) closeWindow(w); }
    else if (action === 'minimizeWindow')  { const w = topWindow(); if (w) minimizeWindow(w); }
    else if (action === 'zoomWindow')      { const w = topWindow(); if (w) { const zoomed = w.classList.toggle('zoomed'); w.querySelector('.zoom-light')?.setAttribute('aria-pressed', String(zoomed)); } }
    else if (action === 'toggleTheme')     toggleTheme();
    else if (action === 'cycleWallpaper')  cycleWallpaper();
    else if (action === 'spotlight')       openSpotlight();
    else if (action === 'toastEdit' && msg) showToast(msg);

    closeBarMenus(null);
    barMenus.find(m => m.menuId === menuId)?.buttonId && document.getElementById(buttonId)?.setAttribute('aria-expanded', 'false');
  });
});

// Helper: get the topmost non-minimized window
function topWindow() {
  return Array.from(document.querySelectorAll('.window:not(.minimized)'))
    .sort((a, b) => Number(b.style.zIndex) - Number(a.style.zIndex))[0] || null;
}

// Close bar menus when clicking outside
const _origCloseMenus = closeMenus;
function closeMenus() {
  _origCloseMenus();
  closeBarMenus(null);
}

// Close bar menus on Escape
const _barEscListener = event => {
  if (event.key === 'Escape') closeBarMenus(null);
};
document.addEventListener('keydown', _barEscListener);

function init() { document.getElementById('appearanceLabel').textContent = document.body.classList.contains('dark') ? 'Dark' : 'Light'; }
init();
