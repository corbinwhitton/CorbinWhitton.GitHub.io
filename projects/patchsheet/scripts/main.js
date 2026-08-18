let routes = []; // { id, name, parentId }
let sources = []; // { channel, person, source, materials, routeId }

// DOM Elements
const showNameInput = document.getElementById('showNameInput');
const dateInput = document.getElementById('dateInput');
const callTimeInput = document.getElementById('callTimeInput');
const showTimeInput = document.getElementById('showTimeInput');

const openModalBtn = document.getElementById('openModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const sourceModal = document.getElementById('sourceModal');
const sourceForm = document.getElementById('sourceForm');
const modalChInput = document.getElementById('modalChInput');
const personInput = document.getElementById('personInput');
const sourceInput = document.getElementById('sourceInput');
const materialsInput = document.getElementById('materialsInput');
const sourceRouteSelect = document.getElementById('sourceRouteSelect');
const tableContainer = document.getElementById('tableContainer');

const openRouteModalBtn = document.getElementById('openRouteModalBtn');
const cancelRouteModalBtn = document.getElementById('cancelRouteModalBtn');
const routeModal = document.getElementById('routeModal');
const routeForm = document.getElementById('routeForm');
const routeNameInput = document.getElementById('routeNameInput');
const parentRouteSelect = document.getElementById('parentRouteSelect');
const routeMgmtList = document.getElementById('routeMgmtList');

// Load State from URLSearchParams on startup
function loadStateFromURL() {
    const params = new URLSearchParams(window.location.search);
    
    if (params.has('show')) showNameInput.value = params.get('show');
    if (params.has('date')) {
        dateInput.value = params.get('date');
    } else {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    if (params.has('call')) callTimeInput.value = params.get('call');
    if (params.has('start')) showTimeInput.value = params.get('start');

    if (params.has('routes')) {
        try {
            routes = JSON.parse(params.get('routes')) || [];
        } catch (e) {
            routes = [];
        }
    }

    if (params.has('sources')) {
        try {
            sources = JSON.parse(params.get('sources')) || [];
        } catch (e) {
            sources = [];
        }
    }
}

// Save State to URLSearchParams dynamically as user types/changes
function saveStateToURL() {
    const params = new URLSearchParams();

    if (showNameInput.value.trim()) params.set('show', showNameInput.value.trim());
    if (dateInput.value) params.set('date', dateInput.value);
    if (callTimeInput.value) params.set('call', callTimeInput.value);
    if (showTimeInput.value) params.set('start', showTimeInput.value);

    if (routes.length > 0) params.set('routes', JSON.stringify(routes));
    if (sources.length > 0) params.set('sources', JSON.stringify(sources));

    const newQuery = params.toString();
    const newURL = newQuery ? `${window.location.pathname}?${newQuery}` : window.location.pathname;
    history.replaceState(null, '', newURL);
}

// Initialize state right away
loadStateFromURL();

// Hook input listeners for live URL updates
[showNameInput, dateInput, callTimeInput, showTimeInput].forEach(el => {
    el.addEventListener('input', saveStateToURL);
});

// Modal Controls for Source
openModalBtn.addEventListener('click', () => {
    openSourceModal();
});

function openSourceModal() {
    const nextCh = sources.length > 0 ? Math.max(...sources.map(s => s.channel)) + 1 : 1;
    modalChInput.value = nextCh;
    populateRouteDropdowns();
    sourceModal.classList.add('active');
    personInput.focus();
}

const closeSourceModal = () => {
    sourceModal.classList.remove('active');
    sourceForm.reset();
};

cancelModalBtn.addEventListener('click', closeSourceModal);
sourceModal.addEventListener('click', (e) => {
    if (e.target === sourceModal) closeSourceModal();
});

// Modal Controls for Route
openRouteModalBtn.addEventListener('click', () => {
    openRouteModal();
});

function openRouteModal() {
    populateRouteDropdowns();
    renderRouteManagementList();
    routeModal.classList.add('active');
    routeNameInput.focus();
}

const closeRouteModal = () => {
    routeModal.classList.remove('active');
    routeForm.reset();
};

cancelRouteModalBtn.addEventListener('click', closeRouteModal);
routeModal.addEventListener('click', (e) => {
    if (e.target === routeModal) closeRouteModal();
});

// Global Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    const activeTag = document.activeElement.tagName;
    const isInputActive = ['INPUT', 'SELECT', 'TEXTAREA'].indexOf(activeTag) !== -1;

    if (e.key === 'Escape') {
        closeSourceModal();
        closeRouteModal();
        if (isInputActive) {
            document.activeElement.blur();
        }
    } else if (isInputActive) {
        if (e.key === 'Enter') {
            if (document.activeElement === showNameInput || 
                document.activeElement === dateInput || 
                document.activeElement === callTimeInput || 
                document.activeElement === showTimeInput) {
                e.preventDefault();
                document.activeElement.blur();
            }
        }
    } else {
        const key = e.key.toLowerCase();
        if (key === 'r') {
            e.preventDefault();
            openRouteModal();
        } else if (key === 's') {
            e.preventDefault();
            openSourceModal();
        } else if (key === 'n') {
            e.preventDefault();
            showNameInput.focus();
        } else if (key === 'd') {
            e.preventDefault();
            dateInput.focus();
        } else if (key === 'c') {
            e.preventDefault();
            callTimeInput.focus();
        } else if (key === 'e') {
            e.preventDefault();
            showTimeInput.focus();
        }
    }
});

sourceRouteSelect.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        sourceForm.requestSubmit();
    }
});

parentRouteSelect.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        routeForm.requestSubmit();
    }
});

function populateRouteDropdowns() {
    const currentSelectedRoute = sourceRouteSelect.value;
    const currentSelectedParent = parentRouteSelect.value;

    sourceRouteSelect.innerHTML = '<option value="">-- None --</option>';
    parentRouteSelect.innerHTML = '<option value="">-- None --</option>';
    routes.forEach(r => {
        const opt1 = document.createElement('option');
        opt1.value = r.id;
        opt1.textContent = getRouteFullPath(r.id);
        sourceRouteSelect.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = r.id;
        opt2.textContent = getRouteFullPath(r.id);
        parentRouteSelect.appendChild(opt2);
    });

    sourceRouteSelect.value = currentSelectedRoute;
    parentRouteSelect.value = currentSelectedParent;
}

function getRouteFullPath(routeId) {
    const r = routes.find(item => item.id === routeId);
    if (!r) return '';
    if (!r.parentId) return r.name;
    return getRouteFullPath(r.parentId) + ' > ' + r.name;
}

function renderRouteManagementList() {
    if (routes.length === 0) {
        routeMgmtList.innerHTML = '<li style="color:#777; font-style:italic;">No routes created yet.</li>';
        return;
    }
    let html = '';
    routes.forEach(r => {
        html += `
            <li class="route-badge">
                ${escapeHtml(getRouteFullPath(r.id))}
                <button onclick="deleteRoute(${r.id})" title="Delete">&times;</button>
            </li>
        `;
    });
    routeMgmtList.innerHTML = html;
}

routeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = routeNameInput.value.trim();
    const parentId = parentRouteSelect.value ? parseInt(parentRouteSelect.value, 10) : null;

    if (name) {
        routes.push({ id: Date.now(), name, parentId });
        sortAndRender();
        saveStateToURL();
        routeNameInput.value = '';
        parentRouteSelect.value = '';
        populateRouteDropdowns();
        renderRouteManagementList();
        routeNameInput.focus();
    }
});

sourceForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const channel = parseInt(modalChInput.value, 10);
    const person = personInput.value.trim();
    const source = sourceInput.value.trim();
    const materials = materialsInput.value.trim();
    const routeId = sourceRouteSelect.value ? parseInt(sourceRouteSelect.value, 10) : null;

    if (!isNaN(channel) && person && source) {
        sources.push({ channel, person, source, materials, routeId });
        sortAndRender();
        saveStateToURL();
        
        const nextCh = sources.length > 0 ? Math.max(...sources.map(s => s.channel)) + 1 : 1;
        modalChInput.value = nextCh;
        personInput.value = '';
        sourceInput.value = '';
        materialsInput.value = '';
        personInput.focus();
    }
});

window.updateChannel = function(index, newChannelVal) {
    const parsed = parseInt(newChannelVal, 10);
    if (!isNaN(parsed)) {
        sources[index].channel = parsed;
        sortAndRender();
        saveStateToURL();
    }
};

window.deleteSource = function(index) {
    sources.splice(index, 1);
    sortAndRender();
    saveStateToURL();
};

window.deleteRoute = function(routeId) {
    const routeIdsToDelete = [routeId];
    let findChildren = (pid) => {
        routes.filter(r => r.parentId === pid).forEach(child => {
            routeIdsToDelete.push(child.id);
            findChildren(child.id);
        });
    };
    findChildren(routeId);

    sources.forEach(s => {
        if (routeIdsToDelete.includes(s.routeId)) {
            s.routeId = null;
        }
    });

    routes = routes.filter(r => !routeIdsToDelete.includes(r.id));
    sortAndRender();
    saveStateToURL();
    populateRouteDropdowns();
    renderRouteManagementList();
};

function sortAndRender() {
    sources.sort((a, b) => a.channel - b.channel);
    renderTable();
}

function getRouteAncestry(routeId) {
    let chain = [];
    let currId = routeId;
    while (currId) {
        const r = routes.find(item => item.id === currId);
        if (!r) break;
        chain.unshift(r);
        currId = r.parentId;
    }
    return chain;
}

function renderTable() {
    if (sources.length === 0) {
        tableContainer.innerHTML = `
            <div class="placeholder-content" id="emptyState">
                No inputs added yet. Click "+ Route" or "+ Source" to begin building your input list.
            </div>
        `;
        return;
    }

    let maxDepth = 0;
    sources.forEach(s => {
        if (s.routeId) {
            const depth = getRouteAncestry(s.routeId).length;
            if (depth > maxDepth) maxDepth = depth;
        }
    });

    let html = `
        <table class="input-table">
            <thead>
                <tr>
    `;
    for (let i = 0; i < maxDepth; i++) {
        html += `<th class="route-th-empty"></th>`;
    }
    html += `
                            <th class="ch-col">Ch</th>
                            <th>Person</th>
                            <th>Source</th>
                            <th>Materials</th>
                            <th class="action-col no-print">Action</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    let rowSpansMap = Array(sources.length).fill(null).map(() => Array(maxDepth).fill(1));
    let skipMap = Array(sources.length).fill(null).map(() => Array(maxDepth).fill(false));

    for (let level = 0; level < maxDepth; level++) {
        let i = 0;
        while (i < sources.length) {
            const ancestryI = getRouteAncestry(sources[i].routeId);
            const routeAtLevelI = ancestryI[level] ? ancestryI[level].id : null;

            if (!routeAtLevelI) {
                skipMap[i][level] = false;
                rowSpansMap[i][level] = 1;
                i++;
                continue;
            }

            let j = i;
            while (j < sources.length) {
                const ancestryJ = getRouteAncestry(sources[j].routeId);
                const routeAtLevelJ = ancestryJ[level] ? ancestryJ[level].id : null;
                if (routeAtLevelJ === routeAtLevelI) {
                    j++;
                } else {
                    break;
                }
            }

            const spanCount = j - i;
            rowSpansMap[i][level] = spanCount;
            for (let k = i + 1; k < j; k++) {
                skipMap[k][level] = true;
            }
            i = j;
        }
    }

    sources.forEach((item, rowIndex) => {
        const ancestry = getRouteAncestry(item.routeId);
        html += `<tr>`;

        for (let level = 0; level < maxDepth; level++) {
            if (skipMap[rowIndex][level]) {
                continue; 
            }

            const routeObj = ancestry[level];
            if (routeObj) {
                const span = rowSpansMap[rowIndex][level];
                html += `<td class="route-col" ${span > 1 ? `rowspan="${span}"` : ''}><span>${escapeHtml(routeObj.name)}</span></td>`;
            } else {
                html += `<td class="route-td-empty"></td>`;
            }
        }

        html += `
                <td class="ch-col">
                    <input type="number" class="ch-input" value="${item.channel}" min="1" onchange="updateChannel(${rowIndex}, this.value)">
                </td>
                <td>${escapeHtml(item.person)}</td>
                <td>${escapeHtml(item.source)}</td>
                <td>${escapeHtml(item.materials || '')}</td>
                <td class="action-col no-print">
                    <button class="delete-btn" onclick="deleteSource(${rowIndex})" title="Remove">&times;</button>
                </td>
            </tr>
        `;
    });

    html += `
                    </tbody>
                </table>
            `;

    tableContainer.innerHTML = html;
}

function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}
sortAndRender();
