export const content = `
    <form id="contract-step2-form">
        <h2 class="text-2xl font-bold mb-6 text-gray-800 dark:text-dark-text-primary">Paso 2: Seleccione la Ubicación en el Mapa</h2>

        <div class="space-y-4">
            <div class="relative">
                <label for="address-search" class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Buscar dirección (opcional)</label>
                <input id="address-search" name="address-search" type="text" placeholder="Escriba una dirección o punto de interés" class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-border-primary rounded-md bg-white dark:bg-dark-bg-tertiary dark:text-dark-text-primary focus:ring-principal-500 dark:focus:ring-dark-principal-600">
                <div class="flex items-center gap-2 mt-2">
                    <button type="button" id="geolocate-btn" class="inline-flex items-center px-3 py-2 bg-principal-100 dark:bg-dark-principal-900/30 text-principal-700 dark:text-dark-principal-600 rounded-md text-sm hover:bg-principal-200 dark:hover:bg-dark-principal-900/50 transition">Usar mi ubicación</button>
                    <small class="text-xs text-gray-500 dark:text-dark-text-muted">(puede pedir permiso en el móvil)</small>
                </div>
                <div id="search-results" class="absolute left-0 right-0 z-50 bg-white dark:bg-dark-bg-card border border-gray-300 dark:border-dark-border-primary mt-1 rounded-md max-h-40 overflow-y-auto hidden shadow-lg"></div>
            </div>
            <div>
                <div id="map" class="rounded-lg border border-gray-300 dark:border-dark-border-primary"></div>
            </div>
        </div>

        <div class="mt-8 flex justify-between">
            <button type="button" id="prev-btn" class="bg-gray-300 dark:bg-dark-bg-tertiary text-gray-800 dark:text-dark-text-primary px-6 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-dark-bg-hover transition">Anterior</button>
            <button type="submit" class="bg-principal-500 dark:bg-dark-principal-600 text-white px-6 py-2 rounded-lg hover:bg-principal-600 dark:hover:bg-dark-principal-700 transition">Siguiente</button>
        </div>
    </form>
`;

export async function init(navigate, formData, populateForm) {
    const form = document.getElementById('contract-step2-form');
    const prevBtn = document.getElementById('prev-btn');
    const searchInput = document.getElementById('address-search');
    const searchResults = document.getElementById('search-results');

    populateForm(form, formData);

    // Move the results container to body so it can float above the map (Leaflet creates its own stacking context)
    (function floatResultsToBody() {
        if (!searchResults) return;
        // Ensure it's removed from current parent and appended to body
        try {
            if (searchResults.parentElement !== document.body) document.body.appendChild(searchResults);
        } catch (e) {
            // ignore
        }
        // Style it as an absolute floating panel
        searchResults.style.position = 'absolute';
        searchResults.style.zIndex = '2147483647';
        searchResults.classList.add('shadow');

        const positionResults = () => {
            if (!searchResults || searchResults.classList.contains('hidden')) return;
            const rect = searchInput.getBoundingClientRect();
            const scrollY = window.scrollY || window.pageYOffset;
            const scrollX = window.scrollX || window.pageXOffset;
            searchResults.style.left = (rect.left + scrollX) + 'px';
            // place below input
            searchResults.style.top = (rect.bottom + scrollY + 4) + 'px';
            searchResults.style.width = rect.width + 'px';
            // keep max-height unchanged (via class)
        };

        // Reposition on scroll/resize and when map moves
        window.addEventListener('scroll', positionResults, true);
        window.addEventListener('resize', positionResults);
        // Leaflet map fires move events; try to reposition on map move
        try { map.on && map.on('move', positionResults); } catch (e) { /* ignore */ }

        // Helper to show/hide will call position
        const observer = new MutationObserver(() => positionResults());
        observer.observe(searchResults, { attributes: true, attributeFilter: ['class', 'style'] });
    })();

    // Load Leaflet dynamically if not present
    const loadLeaflet = () => new Promise((resolve, reject) => {
        if (window.L) return resolve();
        const cssId = 'leaflet-css';
        if (!document.getElementById(cssId)) {
            const link = document.createElement('link');
            link.id = cssId;
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }
        const scriptId = 'leaflet-js';
        if (document.getElementById(scriptId)) {
            const existing = document.getElementById(scriptId);
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', () => reject(new Error('No se pudo cargar Leaflet')));
            return;
        }
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('No se pudo cargar Leaflet'));
        document.head.appendChild(script);
    });

    try {
        await loadLeaflet();
    } catch (err) {
        document.getElementById('map').innerHTML = '<p class="text-red-500">No se pudo cargar el mapa. Intente más tarde.</p>';
        console.error('Error cargando Leaflet:', err);
        if (window.ErrorHandler) {
            try { await window.ErrorHandler.handleHTTPError(err, 'contract', false); } catch (e) { /* swallow */ }
        } else if (window.ErrorModal) {
            try { window.ErrorModal.show(err && err.message ? err.message : String(err), 'Error cargando mapa'); } catch (e) { /* swallow */ }
        }
        return;
    }

    // Initialize Leaflet map
    const map = L.map('map').setView([-34.61, -58.44], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let marker = null;

    const setMarker = (lat, lon, display_name) => {
        if (marker) marker.remove();
        marker = L.marker([parseFloat(lat), parseFloat(lon)]).addTo(map);
        if (display_name) marker.bindPopup(String(display_name)).openPopup();
        formData.coordinates = { lat: parseFloat(lat), lon: parseFloat(lon), display_name };
    };

    // Helper: preset map to a place name using Nominatim (returns true if set)
    async function presetMapTo(place, zoomWhenFound = 13) {
        try {
            const q = encodeURIComponent(place);
            const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`;
            const resp = await fetch(url, { headers: { 'Accept-Language': 'es' } });
            if (!resp.ok) throw new Error(`Nominatim responded ${resp.status}`);
            const arr = await resp.json();
            if (arr && arr.length > 0) {
                const r = arr[0];
                const lat = parseFloat(r.lat);
                const lon = parseFloat(r.lon);
                map.setView([lat, lon], zoomWhenFound);
                setMarker(lat, lon, r.display_name || place);
                console.log(`📍 Mapa presetado a '${place}' -> ${lat},${lon}`);
                return true;
            }
            return false;
        } catch (err) {
            console.warn('⚠️ No se pudo presetear mapa a', place, err);
            return false;
        }
    }

    // If previously chosen coordinates exist, show them; otherwise preset to Rivadavia, Mendoza
    if (formData.coordinates) {
        const c = formData.coordinates;
        setMarker(c.lat, c.lon, c.display_name || 'Ubicación seleccionada');
        map.setView([c.lat, c.lon], 16);
    } else {
        presetMapTo('Rivadavia, Mendoza', 13).then(found => {
            if (!found) console.log('Usando vista por defecto porque no se encontró Rivadavia, Mendoza en Nominatim');
        });
    }

    // Click on map to set marker and optionally reverse-geocode using Nominatim
    map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
            const resp = await fetch(url, { headers: { 'Accept-Language': 'es' } });
            if (resp.ok) {
                const data = await resp.json();
                const display = data && (data.display_name || data.name) ? (data.display_name || data.name) : 'Ubicación seleccionada';
                setMarker(lat, lng, display);
            } else {
                setMarker(lat, lng, 'Ubicación seleccionada');
            }
        } catch (err) {
            // Reverse geocode es opcional; no mostrar modal crítico, solo advertir silenciosamente
            console.warn('Reverse geocode falló:', err);
            setMarker(lat, lng, 'Ubicación seleccionada');
        }
    });

    // Geolocate using device GPS
    const geolocateBtn = document.getElementById('geolocate-btn');
    if (geolocateBtn) {
        geolocateBtn.addEventListener('click', async () => {
            if (!('geolocation' in navigator)) {
                alert('La geolocalización no está disponible en este dispositivo.');
                return;
            }
            geolocateBtn.disabled = true;
            const originalText = geolocateBtn.textContent;
            geolocateBtn.textContent = 'Localizando…';
            try {
                const pos = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
                });
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                // reverse geocode to get a display name
                try {
                    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
                    const resp = await fetch(url, { headers: { 'Accept-Language': 'es' } });
                    if (resp.ok) {
                        const data = await resp.json();
                        const display = data && (data.display_name || data.name) ? (data.display_name || data.name) : 'Ubicación actual';
                        setMarker(lat, lon, display);
                    } else {
                        setMarker(lat, lon, 'Ubicación actual');
                    }
                } catch (err) {
                    console.warn('Reverse geocode falló tras geolocalizar:', err);
                    setMarker(lat, lon, 'Ubicación actual');
                }
                map.setView([lat, lon], 16);
            } catch (err) {
                console.warn('Geolocalización falló:', err);
                if (err && err.code === 1) {
                    alert('Permiso denegado para acceder a la ubicación.');
                } else if (err && err.code === 3) {
                    alert('Tiempo de espera agotado al intentar obtener la ubicación.');
                } else {
                    alert('No se pudo obtener la ubicación. Intente nuevamente.');
                }
            } finally {
                geolocateBtn.disabled = false;
                geolocateBtn.textContent = originalText;
            }
        });
    }

    // Search address using Nominatim (simple autocomplete-like results)
    let searchTimeout = null;

    async function doSearch(query) {
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(query)}`;
            const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
            const results = await res.json();
            searchResults.innerHTML = '';
            if (!results || results.length === 0) {
                searchResults.classList.add('hidden');
                return results || [];
            }
            results.forEach(r => {
                const el = document.createElement('div');
                el.className = 'px-3 py-2 hover:bg-gray-100 cursor-pointer';
                el.textContent = r.display_name;
                el.addEventListener('click', () => {
                    const lat = parseFloat(r.lat);
                    const lon = parseFloat(r.lon);
                    setMarker(lat, lon, r.display_name);
                    map.setView([lat, lon], 16);
                    searchResults.classList.add('hidden');
                    searchResults.innerHTML = '';
                });
                searchResults.appendChild(el);
            });
            searchResults.classList.remove('hidden');
            return results;
        } catch (err) {
            console.warn('Error en búsqueda Nominatim:', err);
            return [];
        }
    }

    searchInput.addEventListener('input', () => {
        const q = searchInput.value.trim();
        if (q.length < 3) {
            searchResults.classList.add('hidden');
            searchResults.innerHTML = '';
            return;
        }
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => doSearch(q), 300);
    });

    // Prevent Enter from submitting the form on mobile; select first result instead
    searchInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            const q = searchInput.value.trim();
            if (q.length < 1) return;
            e.preventDefault();
            clearTimeout(searchTimeout);
            // Ensure results are populated
            const results = await doSearch(q);
            if (results && results.length > 0) {
                // choose the first result
                const first = searchResults.children[0];
                if (first) first.click();
            }
        }
    });

    // Hide results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchResults.contains(e.target) && e.target !== searchInput) {
            searchResults.classList.add('hidden');
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        // Ensure coordinates exist
        if (!formData.coordinates) {
            alert('Por favor seleccione una ubicación en el mapa (click en el mapa o elija un resultado).');
            return;
        }
        
        // LOGGING: Estado de formData después del Paso 2
        console.log('═══════════════════════════════════════════════════════');
        console.log('📋 PASO 2 COMPLETADO - Ubicación en Mapa');
        console.log('═══════════════════════════════════════════════════════');
        console.log('🗺️ Coordenadas:', formData.coordinates);
        console.log('📦 FormData completo:', JSON.stringify(formData, null, 2));
        console.log('═══════════════════════════════════════════════════════');
        
        navigate(1);
    });

    prevBtn.addEventListener('click', () => navigate(-1));
}
