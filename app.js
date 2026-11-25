const desktop = document.getElementById('desktop');
const windows = document.getElementById('windows');
const dock = document.getElementById('dock');
const spotlight = document.getElementById('spotlight');
const spotlightInput = document.getElementById('spotlightInput');
const spotlightResults = document.getElementById('spotlightResults');
const contextMenu = document.getElementById('contextMenu');
const controlCenter = document.getElementById('controlCenter');
const appleMenu = document.getElementById('appleMenu');
const appName = document.getElementById('appName');
let zTop = 100;
let wallpaperIndex = 0;
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
  appleMenu.classList.remove('open');
  controlCenter.classList.remove('open');
  contextMenu.classList.remove('open');
}

document.getElementById('appleMenuButton').addEventListener('click', event => {
  event.stopPropagation();
  controlCenter.classList.remove('open');
  appleMenu.classList.toggle('open');
});
document.getElementById('controlButton').addEventListener('click', event => {
  event.stopPropagation();
  appleMenu.classList.remove('open');
  controlCenter.classList.toggle('open');
});
desktop.addEventListener('click', event => {
  if (!event.target.closest('.menu-dropdown, .control-center, .context-menu, .spotlight')) closeMenus();
  if (!event.target.closest('.spotlight') && spotlight.classList.contains('open')) closeSpotlight();
});

document.getElementById('themeButton').addEventListener('click', toggleTheme);
document.getElementById('appearanceToggle').addEventListener('click', toggleTheme);
document.getElementById('wallpaperToggle').addEventListener('click', () => { cycleWallpaper(); controlCenter.classList.remove('open'); });

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
    focusWindow(existing);
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
  windowEl.style.zIndex = ++zTop;
  const offset = (document.querySelectorAll('.window').length % 7) * 24;
  windowEl.style.left = `calc(50% - ${appId === 'calculator' ? 145 : 320}px + ${offset}px)`;
  windowEl.style.top = `${55 + offset}px`;
  if (appId === 'calculator') windowEl.style.width = '290px', windowEl.style.height = '430px';
  if (appId === 'about') windowEl.style.width = '520px', windowEl.style.height = '390px';
  windowEl.innerHTML = `
    <header class="titlebar">
      <div class="traffic-lights">
        <button class="close-light" aria-label="Close"></button>
        <button class="minimize-light" aria-label="Minimize"></button>
        <button class="zoom-light" aria-label="Zoom"></button>
      </div>
      <span class="window-title">${info.title}</span>
    </header>
    <div class="window-content"></div>`;
  windows.appendChild(windowEl);
  windowEl.querySelector('.close-light').addEventListener('click', () => closeWindow(windowEl));
  windowEl.querySelector('.minimize-light').addEventListener('click', () => windowEl.classList.add('minimized'));
  windowEl.querySelector('.zoom-light').addEventListener('click', () => windowEl.classList.toggle('zoomed'));
  windowEl.addEventListener('mousedown', () => focusWindow(windowEl));
  makeDraggable(windowEl);
  renderApp(windowEl.querySelector('.window-content'), appId);
  document.querySelector(`.dock-item[data-app="${appId}"]`)?.classList.add('open');
  appName.textContent = info.title;
}

function closeWindow(windowEl) {
  const appId = windowEl.dataset.app;
  windowEl.remove();
  if (!document.querySelector(`.window[data-app="${appId}"]`)) {
    document.querySelector(`.dock-item[data-app="${appId}"]`)?.classList.remove('open');
  }
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
  let startX = 0, startY = 0, originX = 0, originY = 0;
  titlebar.addEventListener('mousedown', event => {
    if (event.target.closest('button') || windowEl.classList.contains('zoomed')) return;
    startX = event.clientX; startY = event.clientY;
    const rect = windowEl.getBoundingClientRect(); originX = rect.left; originY = rect.top;
    function move(event) {
      windowEl.style.left = `${Math.max(0, Math.min(innerWidth - 100, originX + event.clientX - startX))}px`;
      windowEl.style.top = `${Math.max(29, originY + event.clientY - startY)}px`;
    }
    function stop() { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', stop); }
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', stop);
  });
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
  spotlightResults.innerHTML = matches.length ? matches.map((item,i)=>`<button class="spotlight-result ${i===0?'selected':''}" data-app="${item.app||''}" data-action="${item.action||''}"><span class="result-icon">${item.icon}</span><span><strong>${item.name}</strong><small>${item.detail}</small></span></button>`).join('') : `<div class="spotlight-result"><span>No Results</span></div>`;
}

function openSpotlight() {
  closeMenus();
  spotlight.classList.add('open'); spotlight.setAttribute('aria-hidden','false');
  spotlightInput.value=''; renderSpotlight(); setTimeout(()=>spotlightInput.focus(),50);
}
function closeSpotlight() { spotlight.classList.remove('open'); spotlight.setAttribute('aria-hidden','true'); }
document.getElementById('spotlightButton').addEventListener('click', openSpotlight);
spotlightInput.addEventListener('input', () => renderSpotlight(spotlightInput.value));
spotlightResults.addEventListener('click', event => {
  const result = event.target.closest('.spotlight-result'); if (!result) return;
  if (result.dataset.app) openApp(result.dataset.app);
  if (result.dataset.action === 'wallpaper') cycleWallpaper();
  if (result.dataset.action === 'theme') toggleTheme();
  closeSpotlight();
});

document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    openSpotlight();
  }
  if (spotlight.classList.contains('open') && event.key === 'Enter') {
    spotlightResults.querySelector('.spotlight-result[data-app], .spotlight-result[data-action]')?.click();
  }
  if (event.key === 'Escape') { closeSpotlight(); closeMenus(); }
});

document.querySelectorAll('[data-app]').forEach(element => {
  element.addEventListener('click', event => {
    if (element.classList.contains('dock-item')) openApp(element.dataset.app);
  });
  if (element.classList.contains('desktop-icon')) element.addEventListener('dblclick', () => openApp(element.dataset.app));
});

desktop.addEventListener('contextmenu', event => {
  event.preventDefault();
  if (event.target.closest('.window, .dock, .menu-bar, .spotlight')) return;
  closeMenus();
  contextMenu.style.left = `${Math.max(0, Math.min(event.clientX, innerWidth - 220))}px`;
  contextMenu.style.top = `${Math.max(29, Math.min(event.clientY, innerHeight - 220))}px`;
  contextMenu.classList.add('open');
});

contextMenu.addEventListener('click', event => {
  const action = event.target.dataset.context; if (!action) return;
  if (action === 'spotlight') openSpotlight();
  if (action === 'wallpaper') cycleWallpaper();
  if (action === 'darkMode') toggleTheme();
  if (action === 'desktopInfo') showToast('Macintosh HD · 128 GB available');
  if (action === 'newFolder') showToast('New Folder');
  contextMenu.classList.remove('open');
});

appleMenu.addEventListener('click', event => {
  const action = event.target.dataset.action; if (!action) return;
  if (action === 'about') openApp('about');
  if (action === 'lock') showToast('Screen locked');
  if (action === 'systemSettings') showToast('System Settings');
  if (action === 'appStore') showToast('App Store');
  appleMenu.classList.remove('open');
});

window.addEventListener('resize', () => {
  document.querySelectorAll('.window.zoomed').forEach(windowEl => {
    windowEl.style.width = 'calc(100% - 16px)'; windowEl.style.height = 'calc(100% - 16px)';
  });
});

function init() { document.getElementById('appearanceLabel').textContent = document.body.classList.contains('dark') ? 'Dark' : 'Light'; }
init();
init();
