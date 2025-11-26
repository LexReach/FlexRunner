/**
 * FlexRunner - Amazon Flex Package Organizer
 * Main Application Logic
 */

/* ============ State Management ============ */

/**
 * Application state with error handling and validation
 */
const AppState = {
    packages: {},
    delivered: [],
    selectedNumbers: [],
    view: 'assign',
    showSummary: false,
    showHelp: false,
    showConfirm: false,
    confirmCallback: null,
    confirmMessage: '',
    darkMode: true,
    packageRange: 50,
    history: [],
    quickEntryValue: '',
    quickEntryAdded: [],

    /**
     * Load state from localStorage with error handling
     */
    load() {
        try {
            const packagesData = localStorage.getItem('packages_v10');
            const deliveredData = localStorage.getItem('delivered_v10');
            const darkModeData = localStorage.getItem('darkMode_v10');
            const packageRangeData = localStorage.getItem('packageRange_v10');

            if (packagesData) {
                this.packages = JSON.parse(packagesData);
                // Validate packages object
                if (typeof this.packages !== 'object' || Array.isArray(this.packages)) {
                    console.warn('Invalid packages data, resetting');
                    this.packages = {};
                }
            }

            if (deliveredData) {
                this.delivered = JSON.parse(deliveredData);
                // Validate delivered array
                if (!Array.isArray(this.delivered)) {
                    console.warn('Invalid delivered data, resetting');
                    this.delivered = [];
                }
            }

            if (darkModeData !== null) {
                this.darkMode = darkModeData !== 'false';
            }

            if (packageRangeData) {
                this.packageRange = parseInt(packageRangeData, 10);
                if (isNaN(this.packageRange) || this.packageRange < 1 || this.packageRange > 100) {
                    console.warn('Invalid package range, using default');
                    this.packageRange = 50;
                }
            }

            // Show help on first visit
            const hasVisited = localStorage.getItem('hasVisited_v10');
            if (!hasVisited) {
                this.showHelp = true;
                localStorage.setItem('hasVisited_v10', 'true');
            }
        } catch (error) {
            console.error('Error loading state:', error);
            showToast('Error loading saved data. Starting fresh.');
            this.packages = {};
            this.delivered = [];
        }
    },

    /**
     * Save state to localStorage with error handling
     */
    save() {
        try {
            localStorage.setItem('packages_v10', JSON.stringify(this.packages));
            localStorage.setItem('delivered_v10', JSON.stringify(this.delivered));
            localStorage.setItem('darkMode_v10', this.darkMode);
            localStorage.setItem('packageRange_v10', this.packageRange);
        } catch (error) {
            console.error('Error saving state:', error);
            if (error.name === 'QuotaExceededError') {
                showToast('Storage quota exceeded. Some data may not be saved.');
            } else {
                showToast('Error saving data');
            }
        }
    },

    /**
     * Export data as JSON for backup
     */
    exportData() {
        const data = {
            packages: this.packages,
            delivered: this.delivered,
            packageRange: this.packageRange,
            exportDate: new Date().toISOString(),
            version: 'v10'
        };
        return JSON.stringify(data, null, 2);
    },

    /**
     * Import data from JSON backup
     */
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            // Validate imported data
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid data format');
            }

            if (data.packages && typeof data.packages === 'object') {
                this.packages = data.packages;
            }

            if (data.delivered && Array.isArray(data.delivered)) {
                this.delivered = data.delivered;
            }

            if (data.packageRange && typeof data.packageRange === 'number') {
                this.packageRange = data.packageRange;
            }

            this.save();
            render();
            showToast('Data imported successfully!');
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            showToast('Error importing data. Invalid file format.');
            return false;
        }
    },

    /**
     * Reset all data
     */
    reset() {
        this.packages = {};
        this.delivered = [];
        this.selectedNumbers = [];
        this.history = [];
        this.save();
    }
};

/* ============ Zone Configuration ============ */
const zones = {
    passenger: { name: 'Passenger Seat', class: 'passenger' },
    backleft: { name: 'Back Left', class: 'backleft' },
    backmid: { name: 'Back Middle', class: 'backmid' },
    backright: { name: 'Back Right', class: 'backright' },
    trunk: { name: 'Trunk', class: 'trunk' }
};

const ranges = [20, 35, 50];

/* ============ Utility Functions ============ */

/**
 * Apply dark/light mode theme
 */
function applyDarkMode() {
    document.body.classList.toggle('dark', AppState.darkMode);
    document.body.classList.toggle('light', !AppState.darkMode);
}

/**
 * Haptic feedback for mobile devices
 * @param {string} style - Vibration pattern style
 */
function haptic(style = 'light') {
    if ('vibrate' in navigator) {
        const patterns = {
            light: [10],
            medium: [20],
            success: [10, 50, 10],
            error: [50, 30, 50]
        };
        navigator.vibrate(patterns[style] || [10]);
    }
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {boolean} showUndo - Show undo button
 */
function showToast(message, showUndo = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.innerHTML = showUndo
        ? `${message} <button onclick="undoLast()" aria-label="Undo last action">Undo</button>`
        : message;
    toast.classList.add('show');
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');

    setTimeout(() => toast.classList.remove('show'), 3000);
}

/**
 * Show custom confirm dialog
 * @param {string} message - Confirmation message
 * @param {Function} callback - Callback function if confirmed
 */
function showConfirm(message, callback) {
    AppState.showConfirm = true;
    AppState.confirmMessage = message;
    AppState.confirmCallback = callback;
    render();
}

/**
 * Undo last action
 */
function undoLast() {
    if (AppState.history.length === 0) return;

    const last = AppState.history.pop();

    if (last.type === 'assign') {
        last.numbers.forEach((num, i) => {
            if (last.prevZones[i]) {
                AppState.packages[num] = last.prevZones[i];
            } else {
                delete AppState.packages[num];
            }
        });
    } else if (last.type === 'remove') {
        AppState.packages[last.number] = last.zone;
    } else if (last.type === 'deliver') {
        AppState.delivered = AppState.delivered.filter(n => n !== last.number);
    } else if (last.type === 'undeliver') {
        AppState.delivered.push(last.number);
    }

    haptic('medium');
    render();
    document.getElementById('toast').classList.remove('show');
}

/**
 * Get package count for a specific zone
 * @param {string} zoneKey - Zone identifier
 * @returns {number} Number of packages in zone
 */
function getZoneCount(zoneKey) {
    return Object.entries(AppState.packages)
        .filter(([num, zone]) => zone === zoneKey && !AppState.delivered.includes(num))
        .length;
}

/**
 * Get total assigned packages
 * @returns {number} Total assigned packages
 */
function getTotalAssigned() {
    return Object.keys(AppState.packages)
        .filter(num => !AppState.delivered.includes(num))
        .length;
}

/**
 * Get list of unassigned package numbers
 * @returns {string[]} Array of unassigned package numbers
 */
function getUnassignedNumbers() {
    return Array.from({ length: AppState.packageRange }, (_, i) => String(i + 1))
        .filter(num => !AppState.packages[num]);
}

/* ============ Quick Entry Functions ============ */

/**
 * Open quick entry numpad overlay
 */
function openQuickEntry() {
    AppState.quickEntryValue = '';
    AppState.quickEntryAdded = [];
    updateQuickEntryDisplay();
    document.getElementById('quickEntryOverlay').classList.add('active');

    // Focus on first numpad button for accessibility
    setTimeout(() => {
        const firstBtn = document.querySelector('.numpad-btn.digit');
        if (firstBtn) firstBtn.focus();
    }, 100);
}

/**
 * Close quick entry overlay and add numbers to selection
 */
function closeQuickEntry() {
    AppState.quickEntryAdded.forEach(num => {
        if (!AppState.selectedNumbers.includes(num)) {
            AppState.selectedNumbers.push(num);
        }
    });

    document.getElementById('quickEntryOverlay').classList.remove('active');
    render();
}

/**
 * Update quick entry display
 */
function updateQuickEntryDisplay() {
    const display = document.getElementById('quickEntryNumber');
    const addedContainer = document.getElementById('quickEntryAdded');
    const addBtn = document.getElementById('numpadAdd');

    if (!display || !addedContainer || !addBtn) return;

    if (AppState.quickEntryValue === '') {
        display.textContent = '--';
        display.classList.add('empty');
        display.setAttribute('aria-label', 'No number entered');
    } else {
        display.textContent = AppState.quickEntryValue;
        display.classList.remove('empty');
        display.setAttribute('aria-label', `Package number ${AppState.quickEntryValue}`);
    }

    // Update added chips
    addedContainer.innerHTML = AppState.quickEntryAdded
        .map(num => `<span class="added-chip" aria-label="Added package ${num}">#${num}</span>`)
        .join('');

    // Check if current value is valid
    const num = parseInt(AppState.quickEntryValue, 10);
    const isValid =
        !isNaN(num) &&
        num >= 1 &&
        num <= AppState.packageRange &&
        !AppState.packages[AppState.quickEntryValue] &&
        !AppState.quickEntryAdded.includes(AppState.quickEntryValue);

    addBtn.classList.toggle('disabled', !isValid);
    addBtn.disabled = !isValid;
    addBtn.setAttribute('aria-disabled', !isValid);
}

/**
 * Handle numpad digit press
 * @param {string} digit - Digit pressed
 */
function handleNumpadDigit(digit) {
    haptic('light');

    // Max 2 digits
    if (AppState.quickEntryValue.length >= 2) {
        AppState.quickEntryValue = digit;
    } else {
        AppState.quickEntryValue += digit;
    }

    // Remove leading zero
    if (AppState.quickEntryValue.length > 1 && AppState.quickEntryValue[0] === '0') {
        AppState.quickEntryValue = AppState.quickEntryValue.substring(1);
    }

    updateQuickEntryDisplay();
}

/**
 * Handle numpad clear
 */
function handleNumpadClear() {
    haptic('light');
    AppState.quickEntryValue = '';
    updateQuickEntryDisplay();
}

/**
 * Handle numpad add button
 */
function handleNumpadAdd() {
    const num = parseInt(AppState.quickEntryValue, 10);

    if (isNaN(num) || num < 1 || num > AppState.packageRange) {
        haptic('error');
        showToast(`Must be 1-${AppState.packageRange}`);
        return;
    }

    if (AppState.packages[AppState.quickEntryValue]) {
        haptic('error');
        showToast(`#${AppState.quickEntryValue} already loaded`);
        return;
    }

    if (AppState.quickEntryAdded.includes(AppState.quickEntryValue)) {
        haptic('error');
        showToast(`#${AppState.quickEntryValue} already added`);
        return;
    }

    haptic('success');
    AppState.quickEntryAdded.push(AppState.quickEntryValue);
    AppState.quickEntryValue = '';
    updateQuickEntryDisplay();

    // Play success sound
    playSuccessSound();
}

/**
 * Play success sound using Web Audio API
 */
function playSuccessSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (error) {
        // Silent fail for audio - not critical
        console.debug('Audio not available:', error);
    }
}

/* ============ Data Export/Import Functions ============ */

/**
 * Download data as JSON file
 */
function downloadBackup() {
    try {
        const data = AppState.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flexrunner-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Backup downloaded successfully!');
    } catch (error) {
        console.error('Error downloading backup:', error);
        showToast('Error creating backup file');
    }
}

/**
 * Handle file import
 */
function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            AppState.importData(event.target.result);
        };
        reader.onerror = () => {
            showToast('Error reading file');
        };
        reader.readAsText(file);
    };
    input.click();
}

/* ============ Keyboard Navigation ============ */

/**
 * Initialize keyboard shortcuts
 */
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Escape key closes modals
        if (e.key === 'Escape') {
            if (AppState.showSummary) {
                AppState.showSummary = false;
                render();
            } else if (AppState.showHelp) {
                AppState.showHelp = false;
                render();
            } else if (AppState.showConfirm) {
                AppState.showConfirm = false;
                render();
            } else if (document.getElementById('quickEntryOverlay').classList.contains('active')) {
                closeQuickEntry();
            }
        }

        // Help shortcut (Shift + ?)
        if (e.key === '?' && e.shiftKey && !AppState.showHelp) {
            AppState.showHelp = true;
            render();
        }

        // Dark mode toggle (Ctrl/Cmd + D)
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            AppState.darkMode = !AppState.darkMode;
            applyDarkMode();
            render();
        }
    });
}

/* ============ Rendering Functions ============ */

/**
 * Render car SVG visual
 * @returns {string} SVG markup
 */
function renderCarSVG() {
    const bc = AppState.darkMode ? '#374151' : '#64748b';
    const bs = AppState.darkMode ? '#4b5563' : '#475569';
    const gc = AppState.darkMode ? '#1e3a5f' : '#0ea5e9';
    const ic = AppState.darkMode ? '#1f2937' : '#374151';
    const dc = AppState.darkMode ? '#4b5563' : '#57534e';
    const wc = AppState.darkMode ? '#1f2937' : '#1e293b';
    const rc = AppState.darkMode ? '#4b5563' : '#64748b';

    return `<svg class="car-svg" viewBox="0 0 180 320" fill="none" role="img" aria-label="Car layout diagram">
        <ellipse cx="90" cy="312" rx="65" ry="6" fill="rgba(0,0,0,0.3)"/>
        <path d="M28 55 Q28 22 58 18 L122 18 Q152 22 152 55 L152 285 Q152 308 122 312 L58 312 Q28 308 28 285 Z" fill="${bc}" stroke="${bs}" stroke-width="2"/>
        <path d="M48 18 Q90 8 132 18" stroke="${bs}" stroke-width="1.5" fill="none"/>
        <path d="M40 52 L40 25 Q40 20 55 18 L125 18 Q140 20 140 25 L140 52 Q140 60 130 63 L50 63 Q40 60 40 52 Z" fill="${gc}" opacity="0.6"/>
        <rect x="38" y="66" width="104" height="105" rx="8" fill="${ic}"/>
        <rect x="52" y="75" width="76" height="42" rx="6" fill="${AppState.darkMode ? '#111827' : '#1e293b'}" opacity="0.8"/>
        <path d="M43 178 L43 205 Q43 215 55 218 L125 218 Q137 215 137 205 L137 178 Q137 172 125 170 L55 170 Q43 172 43 178 Z" fill="${gc}" opacity="0.5"/>
        <rect x="36" y="222" width="108" height="82" rx="14" fill="${dc}"/>
        <rect x="36" y="288" width="30" height="10" rx="3" fill="#ef4444"/>
        <rect x="114" y="288" width="30" height="10" rx="3" fill="#ef4444"/>
        <ellipse cx="90" cy="305" rx="12" ry="8" fill="${bs}"/>
        <ellipse cx="22" cy="65" rx="9" ry="6" fill="${bc}"/>
        <ellipse cx="158" cy="65" rx="9" ry="6" fill="${bc}"/>
        <ellipse cx="45" cy="48" rx="14" ry="7" fill="${wc}"/>
        <ellipse cx="135" cy="48" rx="14" ry="7" fill="${wc}"/>
        <ellipse cx="45" cy="275" rx="14" ry="7" fill="${wc}"/>
        <ellipse cx="135" cy="275" rx="14" ry="7" fill="${wc}"/>
        <ellipse cx="45" cy="48" rx="7" ry="3.5" fill="${rc}"/>
        <ellipse cx="135" cy="48" rx="7" ry="3.5" fill="${rc}"/>
        <ellipse cx="45" cy="275" rx="7" ry="3.5" fill="${rc}"/>
        <ellipse cx="135" cy="275" rx="7" ry="3.5" fill="${rc}"/>
    </svg>`;
}

/**
 * Render assign view (package loading mode)
 * @returns {string} HTML markup
 */
function renderAssignView() {
    const totalAssigned = getTotalAssigned();
    const hasSelection = AppState.selectedNumbers.length > 0;
    const unassigned = getUnassignedNumbers();

    let gridContent = '';
    if (unassigned.length === 0 && totalAssigned > 0) {
        gridContent = `<div class="all-assigned">
            <div class="all-assigned-icon" aria-hidden="true">✅</div>
            <div class="all-assigned-text">All packages loaded!</div>
        </div>`;
    } else if (unassigned.length === 0) {
        gridContent = `<div class="all-assigned">
            <div class="all-assigned-icon" aria-hidden="true">📦</div>
            <div class="all-assigned-text">Select a range above</div>
        </div>`;
    } else {
        gridContent = `<div class="number-grid" role="group" aria-label="Unassigned packages">
            ${unassigned.map(num => {
                const isSelected = AppState.selectedNumbers.includes(num);
                return `<button
                    class="sticker ${isSelected ? 'selected' : ''}"
                    data-num="${num}"
                    aria-label="Package ${num}, ${isSelected ? 'selected' : 'not selected'}"
                    aria-pressed="${isSelected}"
                >${num}</button>`;
            }).join('')}
        </div>`;
    }

    return `<div class="app">
        <header class="header">
            <div class="header-row">
                <div class="logo">
                    <span class="logo-icon" aria-hidden="true">📦</span>
                    <h1 class="logo-text">Flex<span>Runner</span></h1>
                </div>
                <div class="header-actions">
                    <div class="header-stat" aria-live="polite" aria-atomic="true">${totalAssigned} loaded</div>
                    <button class="icon-btn" id="darkModeBtn" aria-label="Toggle ${AppState.darkMode ? 'light' : 'dark'} mode">${AppState.darkMode ? '☀️' : '🌙'}</button>
                    <button class="icon-btn" id="helpBtn" aria-label="Show help">?</button>
                </div>
            </div>
        </header>
        <main class="content">
            <div class="range-selector" role="radiogroup" aria-label="Package range selection">
                ${ranges.map(r => `<button
                    class="range-btn ${AppState.packageRange === r ? 'active' : ''}"
                    data-range="${r}"
                    role="radio"
                    aria-checked="${AppState.packageRange === r}"
                    aria-label="Range 1 to ${r} packages"
                >1–${r}</button>`).join('')}
            </div>
            ${gridContent}
            <div class="car-container">
                <div class="car-label" aria-live="polite">
                    ${hasSelection
                        ? `Load <strong>${AppState.selectedNumbers.length > 1
                            ? AppState.selectedNumbers.length + ' packages'
                            : '#' + AppState.selectedNumbers[0]}</strong> into:`
                        : 'Tap numbers or use Quick Add ⚡'}
                </div>
                <div class="car-visual">
                    ${renderCarSVG()}
                    ${Object.entries(zones).map(([key, zone]) => `
                        <button
                            class="zone-btn zone-${key} ${hasSelection ? 'pulse' : 'disabled'}"
                            data-zone="${key}"
                            aria-label="${zone.name}, ${getZoneCount(key)} packages"
                            ${!hasSelection ? 'disabled' : ''}
                        >
                            <span class="count" aria-hidden="true">${getZoneCount(key)}</span>
                            <span class="label">${zone.name.replace('Back ', '')}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        </main>
        <footer class="bottom-bar">
            ${hasSelection ? `<div class="selection-info" role="status" aria-live="polite"><strong>${AppState.selectedNumbers.length}</strong> package${AppState.selectedNumbers.length > 1 ? 's' : ''} selected</div>` : ''}
            <div class="btn-row">
                ${hasSelection ? `<button class="btn btn-ghost btn-small" id="clearSelectionBtn" aria-label="Clear selection">Clear</button>` : ''}
                <button class="btn btn-scan btn-small" id="quickAddBtn" aria-label="Quick add packages">⚡ Quick</button>
                <button class="btn btn-secondary btn-small" id="summaryBtn" aria-label="Show load summary">📋</button>
                <button class="btn btn-secondary btn-small" id="exportBtn" aria-label="Export data">💾</button>
                <button class="btn btn-primary" id="deliveryBtn" ${totalAssigned === 0 ? 'disabled' : ''} aria-label="Start delivery mode">🚚 Start</button>
            </div>
        </footer>
    </div>${renderSummaryModal()}${renderHelpModal()}${renderConfirmModal()}`;
}

/**
 * Render summary modal
 * @returns {string} HTML markup
 */
function renderSummaryModal() {
    return `<div
        class="modal-overlay ${AppState.showSummary ? 'active' : ''}"
        id="summaryModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="summaryModalTitle"
        ${AppState.showSummary ? '' : 'aria-hidden="true"'}
    >
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title" id="summaryModalTitle">📋 Load Summary</h2>
                <button class="modal-close" id="closeSummary" aria-label="Close summary">✕</button>
            </div>
            <div class="modal-body">
                ${Object.entries(zones).map(([key, zone]) => {
                    const zonePackages = Object.entries(AppState.packages)
                        .filter(([num, z]) => z === key && !AppState.delivered.includes(num))
                        .map(([num]) => num)
                        .sort((a, b) => Number(a) - Number(b));

                    return `<section class="zone-section">
                        <div class="zone-header ${zone.class}">
                            <span>${zone.name}</span>
                            <span class="zone-count">${zonePackages.length}</span>
                        </div>
                        <div class="package-list">
                            ${zonePackages.length > 0
                                ? zonePackages.map(num => `
                                    <div class="package-chip">
                                        ${num}
                                        <button data-remove="${num}" aria-label="Remove package ${num}">✕</button>
                                    </div>
                                `).join('')
                                : '<span class="empty-zone">Empty</span>'}
                        </div>
                    </section>`;
                }).join('')}
                <button class="btn btn-danger" id="clearAllBtn" style="width:100%; margin-top:1.25rem;" aria-label="Clear all packages">🗑️ Clear All</button>
            </div>
        </div>
    </div>`;
}

/**
 * Render help modal
 * @returns {string} HTML markup
 */
function renderHelpModal() {
    return `<div
        class="modal-overlay ${AppState.showHelp ? 'active' : ''}"
        id="helpModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="helpModalTitle"
        ${AppState.showHelp ? '' : 'aria-hidden="true"'}
    >
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title" id="helpModalTitle">📖 Help Guide</h2>
                <button class="modal-close" id="closeHelp" aria-label="Close help">✕</button>
            </div>
            <div class="modal-body help-content">
                <section class="help-section">
                    <h3>Getting Started</h3>
                    <p>FlexRunner helps Amazon Flex drivers organize packages into car zones before starting delivery routes.</p>
                </section>

                <section class="help-section">
                    <h3>Step 1: Select Range</h3>
                    <p>Choose your package count (20, 35, or 50) at the top of the screen.</p>
                </section>

                <section class="help-section">
                    <h3>Step 2: Load Packages</h3>
                    <p>Two ways to add packages:</p>
                    <ul>
                        <li><strong>Tap numbers</strong> on the grid to select them</li>
                        <li><strong>Quick Add (⚡)</strong> for rapid entry with numpad</li>
                    </ul>
                </section>

                <section class="help-section">
                    <h3>Step 3: Assign Zones</h3>
                    <p>Tap a zone on the car (Passenger, Back Left/Middle/Right, or Trunk) to assign selected packages.</p>
                </section>

                <section class="help-section">
                    <h3>Step 4: Start Delivery</h3>
                    <p>Tap <strong>🚚 Start</strong> to switch to delivery mode. Mark packages as delivered by tapping them.</p>
                </section>

                <section class="help-section">
                    <h3>Keyboard Shortcuts</h3>
                    <ul>
                        <li><strong>Shift + ?</strong> - Show this help</li>
                        <li><strong>Ctrl/Cmd + D</strong> - Toggle dark mode</li>
                        <li><strong>Esc</strong> - Close modals</li>
                    </ul>
                </section>

                <section class="help-section">
                    <h3>Backup & Restore</h3>
                    <p>Use the <strong>💾</strong> button to export your data as a backup file. Import it later to restore your setup.</p>
                </section>
            </div>
        </div>
    </div>`;
}

/**
 * Render custom confirm modal
 * @returns {string} HTML markup
 */
function renderConfirmModal() {
    return `<div
        class="modal-overlay ${AppState.showConfirm ? 'active' : ''}"
        id="confirmModal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmModalTitle"
        ${AppState.showConfirm ? '' : 'aria-hidden="true"'}
    >
        <div class="confirm-modal">
            <h2 class="confirm-modal-title" id="confirmModalTitle">Confirm Action</h2>
            <p class="confirm-modal-message">${AppState.confirmMessage || 'Are you sure?'}</p>
            <div class="confirm-modal-buttons">
                <button class="btn btn-secondary" id="confirmCancel">Cancel</button>
                <button class="btn btn-danger" id="confirmOk">Confirm</button>
            </div>
        </div>
    </div>`;
}

/**
 * Render delivery view
 * @returns {string} HTML markup
 */
function renderDeliveryView() {
    const totalDelivered = AppState.delivered.length;
    const totalRemaining = getTotalAssigned();
    const allDone = totalRemaining === 0 && Object.keys(AppState.packages).length > 0;

    return `<div class="app delivery-mode">
        <header class="header">
            <div class="header-row">
                <div class="logo">
                    <span class="logo-icon" aria-hidden="true">🚚</span>
                    <h1 class="logo-text">Deliver<span>ing</span></h1>
                </div>
                <div class="header-actions">
                    <button class="icon-btn" id="darkModeBtn" aria-label="Toggle ${AppState.darkMode ? 'light' : 'dark'} mode">${AppState.darkMode ? '☀️' : '🌙'}</button>
                    <button class="btn btn-secondary btn-small" id="backBtn">← Back</button>
                </div>
            </div>
        </header>
        <main class="content">
            <div class="delivery-stats" role="region" aria-label="Delivery progress">
                <div class="delivery-stat done">
                    <div class="delivery-stat-value" aria-label="${totalDelivered} packages delivered">${totalDelivered}</div>
                    <div class="delivery-stat-label">Delivered</div>
                </div>
                <div class="delivery-stat remaining">
                    <div class="delivery-stat-value" aria-label="${totalRemaining} packages remaining">${totalRemaining}</div>
                    <div class="delivery-stat-label">Remaining</div>
                </div>
            </div>
            ${allDone ? `
                <div class="celebration" role="alert" aria-live="polite">
                    <div class="celebration-emoji" aria-hidden="true">🎉</div>
                    <div class="celebration-text">Route Complete!</div>
                    <div class="celebration-sub">All packages delivered</div>
                </div>
            ` : `
                <p class="swipe-hint">Tap to mark delivered • Tap again to undo</p>
                ${Object.entries(zones).map(([key, zone]) => {
                    const zonePackages = Object.entries(AppState.packages)
                        .filter(([num, z]) => z === key)
                        .map(([num]) => num)
                        .sort((a, b) => Number(a) - Number(b));

                    if (zonePackages.length === 0) return '';

                    const remaining = zonePackages.filter(n => !AppState.delivered.includes(n)).length;

                    return `<section class="delivery-zone">
                        <div class="delivery-zone-header ${zone.class}">
                            <h2 class="delivery-zone-title">${zone.name}</h2>
                            <span class="delivery-zone-count" aria-live="polite">${remaining} left</span>
                        </div>
                        <div class="delivery-packages" role="group" aria-label="${zone.name} packages">
                            ${zonePackages.map(num => `
                                <button
                                    class="delivery-chip ${AppState.delivered.includes(num) ? 'delivered' : ''}"
                                    data-deliver="${num}"
                                    aria-label="Package ${num}, ${AppState.delivered.includes(num) ? 'delivered' : 'not delivered'}"
                                    aria-pressed="${AppState.delivered.includes(num)}"
                                >${num}</button>
                            `).join('')}
                        </div>
                    </section>`;
                }).join('')}
            `}
        </main>
        <footer class="bottom-bar">
            <div class="btn-row">
                <button class="btn btn-danger" id="resetDeliveryBtn" aria-label="Reset delivery progress">↺ Reset Progress</button>
            </div>
        </footer>
    </div>${renderHelpModal()}${renderConfirmModal()}`;
}

/**
 * Main render function
 */
function render() {
    const appElement = document.getElementById('app');
    if (!appElement) {
        console.error('App element not found');
        return;
    }

    appElement.innerHTML = AppState.view === 'assign'
        ? renderAssignView()
        : renderDeliveryView();

    attachListeners();
    AppState.save();
}

/**
 * Attach event listeners to DOM elements
 */
function attachListeners() {
    // Dark mode toggle
    const darkModeBtn = document.getElementById('darkModeBtn');
    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', () => {
            haptic('light');
            AppState.darkMode = !AppState.darkMode;
            applyDarkMode();
            render();
        });
    }

    // Help button
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            haptic('light');
            AppState.showHelp = true;
            render();
        });
    }

    // Close help
    const closeHelp = document.getElementById('closeHelp');
    if (closeHelp) {
        closeHelp.addEventListener('click', () => {
            haptic('light');
            AppState.showHelp = false;
            render();
        });
    }

    // Help modal backdrop click
    const helpModal = document.getElementById('helpModal');
    if (helpModal) {
        helpModal.addEventListener('click', (e) => {
            if (e.target.id === 'helpModal') {
                AppState.showHelp = false;
                render();
            }
        });
    }

    // Range selector buttons
    document.querySelectorAll('.range-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            haptic('light');
            AppState.packageRange = parseInt(btn.dataset.range, 10);
            AppState.selectedNumbers = AppState.selectedNumbers.filter(n => parseInt(n, 10) <= AppState.packageRange);
            render();
        });
    });

    // Package stickers
    document.querySelectorAll('.sticker').forEach(box => {
        box.addEventListener('click', () => {
            haptic('light');
            const num = box.dataset.num;
            AppState.selectedNumbers = AppState.selectedNumbers.includes(num)
                ? AppState.selectedNumbers.filter(n => n !== num)
                : [...AppState.selectedNumbers, num];
            render();
        });
    });

    // Zone buttons
    document.querySelectorAll('.zone-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (AppState.selectedNumbers.length === 0 || btn.classList.contains('disabled')) return;

            const zone = btn.dataset.zone;
            haptic('success');

            AppState.history.push({
                type: 'assign',
                numbers: [...AppState.selectedNumbers],
                prevZones: AppState.selectedNumbers.map(n => AppState.packages[n])
            });

            AppState.selectedNumbers.forEach(num => {
                AppState.packages[num] = zone;
                AppState.delivered = AppState.delivered.filter(d => d !== num);
            });

            showToast(`${AppState.selectedNumbers.length} → ${zones[zone].name}`, true);
            AppState.selectedNumbers = [];
            render();
        });
    });

    // Quick Add button
    const quickAddBtn = document.getElementById('quickAddBtn');
    if (quickAddBtn) {
        quickAddBtn.addEventListener('click', () => {
            haptic('light');
            openQuickEntry();
        });
    }

    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const exportMenu = document.createElement('div');
            exportMenu.className = 'modal-overlay active';
            exportMenu.innerHTML = `
                <div class="confirm-modal">
                    <h2 class="confirm-modal-title">Backup & Restore</h2>
                    <p class="confirm-modal-message">Choose an action:</p>
                    <div class="confirm-modal-buttons">
                        <button class="btn btn-secondary" id="importDataBtn">📥 Import</button>
                        <button class="btn btn-primary" id="downloadBackupBtn">💾 Export</button>
                    </div>
                    <button class="btn btn-ghost" id="closeExportMenu" style="margin-top: 0.5rem;">Cancel</button>
                </div>
            `;
            document.body.appendChild(exportMenu);

            document.getElementById('downloadBackupBtn').addEventListener('click', () => {
                downloadBackup();
                document.body.removeChild(exportMenu);
            });

            document.getElementById('importDataBtn').addEventListener('click', () => {
                handleImport();
                document.body.removeChild(exportMenu);
            });

            document.getElementById('closeExportMenu').addEventListener('click', () => {
                document.body.removeChild(exportMenu);
            });
        });
    }

    // Clear selection
    const clearSelectionBtn = document.getElementById('clearSelectionBtn');
    if (clearSelectionBtn) {
        clearSelectionBtn.addEventListener('click', () => {
            haptic('light');
            AppState.selectedNumbers = [];
            render();
        });
    }

    // Summary button
    const summaryBtn = document.getElementById('summaryBtn');
    if (summaryBtn) {
        summaryBtn.addEventListener('click', () => {
            haptic('light');
            AppState.showSummary = true;
            render();
        });
    }

    // Close summary
    const closeSummary = document.getElementById('closeSummary');
    if (closeSummary) {
        closeSummary.addEventListener('click', () => {
            haptic('light');
            AppState.showSummary = false;
            render();
        });
    }

    // Summary modal backdrop click
    const summaryModal = document.getElementById('summaryModal');
    if (summaryModal) {
        summaryModal.addEventListener('click', (e) => {
            if (e.target.id === 'summaryModal') {
                AppState.showSummary = false;
                render();
            }
        });
    }

    // Remove package buttons
    document.querySelectorAll('[data-remove]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            haptic('medium');
            const num = btn.dataset.remove;
            AppState.history.push({
                type: 'remove',
                number: num,
                zone: AppState.packages[num]
            });
            delete AppState.packages[num];
            showToast(`Removed #${num}`, true);
            render();
        });
    });

    // Clear all button
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            showConfirm('Clear all packages? This cannot be undone.', () => {
                haptic('medium');
                AppState.reset();
                AppState.showSummary = false;
                render();
            });
        });
    }

    // Confirm modal buttons
    const confirmOk = document.getElementById('confirmOk');
    const confirmCancel = document.getElementById('confirmCancel');

    if (confirmOk) {
        confirmOk.addEventListener('click', () => {
            if (AppState.confirmCallback) {
                AppState.confirmCallback();
            }
            AppState.showConfirm = false;
            AppState.confirmCallback = null;
            render();
        });
    }

    if (confirmCancel) {
        confirmCancel.addEventListener('click', () => {
            AppState.showConfirm = false;
            AppState.confirmCallback = null;
            render();
        });
    }

    // Delivery button
    const deliveryBtn = document.getElementById('deliveryBtn');
    if (deliveryBtn) {
        deliveryBtn.addEventListener('click', () => {
            if (getTotalAssigned() === 0) return;
            haptic('success');
            AppState.selectedNumbers = [];
            AppState.view = 'delivery';
            render();
        });
    }

    // Back button
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            haptic('light');
            AppState.view = 'assign';
            render();
        });
    }

    // Delivery chips
    document.querySelectorAll('[data-deliver]').forEach(chip => {
        chip.addEventListener('click', () => {
            const num = chip.dataset.deliver;
            haptic('success');

            if (AppState.delivered.includes(num)) {
                AppState.history.push({ type: 'undeliver', number: num });
                AppState.delivered = AppState.delivered.filter(n => n !== num);
            } else {
                AppState.history.push({ type: 'deliver', number: num });
                AppState.delivered.push(num);
            }

            render();
        });
    });

    // Reset delivery button
    const resetDeliveryBtn = document.getElementById('resetDeliveryBtn');
    if (resetDeliveryBtn) {
        resetDeliveryBtn.addEventListener('click', () => {
            showConfirm('Reset delivery progress? All packages will be marked as undelivered.', () => {
                haptic('medium');
                AppState.delivered = [];
                render();
            });
        });
    }
}

/**
 * Initialize quick entry listeners (these are persistent)
 */
function initQuickEntryListeners() {
    const quickEntryClose = document.getElementById('quickEntryClose');
    const quickEntryDone = document.getElementById('quickEntryDone');
    const numpadClear = document.getElementById('numpadClear');
    const numpadAdd = document.getElementById('numpadAdd');

    if (quickEntryClose) {
        quickEntryClose.addEventListener('click', closeQuickEntry);
    }

    if (quickEntryDone) {
        quickEntryDone.addEventListener('click', closeQuickEntry);
    }

    if (numpadClear) {
        numpadClear.addEventListener('click', handleNumpadClear);
    }

    if (numpadAdd) {
        numpadAdd.addEventListener('click', handleNumpadAdd);
    }

    document.querySelectorAll('.numpad-btn.digit').forEach(btn => {
        btn.addEventListener('click', () => handleNumpadDigit(btn.dataset.digit));
    });
}

/**
 * Initialize the application
 */
function init() {
    AppState.load();
    applyDarkMode();
    render();
    initQuickEntryListeners();
    initKeyboardShortcuts();

    // Make undoLast available globally
    window.undoLast = undoLast;

    console.log('FlexRunner initialized successfully');
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
