// Este script se ejecuta cuando el contenido de facturas.html se carga dinámicamente.
(async function() {
    /**
     * Carga scripts necesarios para UI y validación
     */
    async function cargarScriptsNecesarios() {
        const scripts = [
            { src: '/js/utils/sanitizer.js', global: 'Sanitizer' },
            { src: '/js/utils/validators.js', global: 'Validators' },
            { src: '/js/utils/errorHandler.js', global: 'ErrorHandler' },
            { src: '/js/ui/error-modal.js', global: 'ErrorModal' },
            { src: '/js/ui/success-modal.js', global: 'SuccessModal' },
            { src: '/js/ui/spinner-carga.js', global: 'LoadingSpinner' }
        ];

        const promises = scripts.map(({ src, global }) => {
            if (window[global]) return Promise.resolve();
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = () => reject(new Error(`Failed to load ${src}`));
                document.head.appendChild(script);
            });
        });

        try {
            await Promise.all(promises);
        } catch (error) {
            console.warn('⚠️ Error cargando scripts UI:', error);
        }
    }

    // Cargar scripts primero
    await cargarScriptsNecesarios();

    const connectionFilter = document.getElementById('connection-filter');
    const invoicesTableBody = document.getElementById('invoices-table-body');
    const invoicesMobileCards = document.getElementById('invoices-mobile-cards');

    if (!connectionFilter || !invoicesTableBody || !invoicesMobileCards) {
        console.error("No se encontraron los elementos necesarios para la página de facturas.");
        return;
    }

    let allInvoices = []; // Almacena todas las facturas obtenidas de la API

    // --- DATOS MOCK (reemplazar con llamadas a la API en producción) ---
    const mockConnections = [
        { id: "CON-001", name: "CON-001 (Calle Falsa 123)" },
        { id: "CON-002", name: "CON-002 (Av. Siempre Viva 742)" }
    ];

    const mockInvoices = [
        {
            invoiceNumber: "FC-001-00012345",
            period: "Noviembre 2023",
            dueDate: "10/12/2023",
            amount: "$17.500,00",
            status: "Pagado",
            actionLink: "#",
            connectionId: "CON-001"
        },
        {
            invoiceNumber: "FC-001-00012346",
            period: "Diciembre 2023",
            dueDate: "10/01/2024",
            amount: "$18.000,00",
            status: "Pendiente",
            actionLink: "#",
            connectionId: "CON-001"
        },
        {
            invoiceNumber: "FC-001-00012347",
            period: "Enero 2024",
            dueDate: "10/02/2024",
            amount: "$18.000,00",
            status: "Vencido",
            actionLink: "#",
            connectionId: "CON-002"
        }
    ];

    // --- LÓGICA DE RENDERIZADO ---

    function renderInvoices(invoicesToRender) {
        invoicesTableBody.innerHTML = '';
        invoicesMobileCards.innerHTML = '';

        if (invoicesToRender.length === 0) {
            const noDataMessage = `<div class="p-4 text-center text-gray-500 dark:text-dark-text-secondary col-span-full">No se encontraron facturas para la selección actual.</div>`;
            invoicesTableBody.innerHTML = `<tr><td colspan="6" class="py-4 text-center text-gray-500 dark:text-dark-text-secondary">No se encontraron facturas.</td></tr>`;
            invoicesMobileCards.innerHTML = noDataMessage;
            return;
        }

        invoicesToRender.forEach(invoice => {
            // Sanitizar valores antes de renderizar
            const invoiceNumber = window.Sanitizer ? window.Sanitizer.sanitizeString(invoice.invoiceNumber) : invoice.invoiceNumber;
            const period = window.Sanitizer ? window.Sanitizer.sanitizeString(invoice.period) : invoice.period;
            const dueDate = window.Sanitizer ? window.Sanitizer.sanitizeString(invoice.dueDate) : invoice.dueDate;
            const amount = window.Sanitizer ? window.Sanitizer.sanitizeString(invoice.amount) : invoice.amount;
            const status = window.Sanitizer ? window.Sanitizer.sanitizeString(invoice.status) : invoice.status;
            const actionLink = window.Sanitizer ? window.Sanitizer.sanitizeURL(invoice.actionLink) : invoice.actionLink;
            const statusClasses = getStatusClasses(status);
            
            // Lógica para generar los botones de acción según el estado
            let actionButtonsHTML = '';
            const downloadIconSVG = `<svg class="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
            const payButton = `<a href="#" class="boton boton-verde text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2">Pagar</a>`;

            if (invoice.status === 'Pagado') {
                const downloadButton = `<a href="${invoice.actionLink}" class="boton boton-azul p-1.5 sm:p-2" title="Ver / Descargar">${downloadIconSVG}</a>`;
                actionButtonsHTML = `<div class="flex items-center justify-center">${downloadButton}</div>`;
            } else {
                const downloadButton = `<a href="${invoice.actionLink}" class="boton boton-azul p-1.5 sm:p-2" title="Ver Factura">${downloadIconSVG}</a>`;
                actionButtonsHTML = `
                    <div class="flex items-center justify-center gap-1 sm:gap-2">
                        ${downloadButton}
                        ${payButton}
                    </div>
                `;
            }

            // Renderizar fila de tabla
            const tableRow = document.createElement('tr');
            tableRow.className = 'hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors';
            tableRow.innerHTML = `
                <td class="py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm text-gray-700 dark:text-dark-text-primary">${invoiceNumber}</td>
                <td class="py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm text-gray-700 dark:text-dark-text-primary">${period}</td>
                <td class="py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm text-gray-700 dark:text-dark-text-primary">${dueDate}</td>
                <td class="py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm text-gray-700 dark:text-dark-text-primary font-medium">${amount}</td>
                <td class="py-2 sm:py-3 px-3 sm:px-4"><span class="px-2 py-1 text-xs font-semibold ${statusClasses} rounded-full whitespace-nowrap">${status}</span></td>
                <td class="py-2 sm:py-3 px-3 sm:px-4">${actionButtonsHTML}</td>
            `;
            invoicesTableBody.appendChild(tableRow);

            // Renderizar tarjeta móvil
            const mobileCard = document.createElement('div');
            mobileCard.className = 'bg-white dark:bg-dark-bg-card p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-dark-border-primary space-y-2 sm:space-y-3 hover:shadow-md transition-all';
            // Usamos el mismo HTML de botones para la tarjeta móvil
            mobileCard.innerHTML = `
                <div class="flex justify-between items-start gap-2">
                    <span class="font-semibold text-gray-800 dark:text-dark-text-primary text-sm sm:text-base truncate">${invoiceNumber}</span>
                    <span class="px-2 py-1 text-xs font-semibold ${statusClasses} rounded-full whitespace-nowrap flex-shrink-0">${status}</span>
                </div>
                <div class="text-xs sm:text-sm text-gray-600 dark:text-dark-text-secondary"><strong>Período:</strong> ${invoice.period}</div>
                <div class="text-xs sm:text-sm text-gray-600 dark:text-dark-text-secondary"><strong>Vencimiento:</strong> ${invoice.dueDate}</div>
                <div class="text-base sm:text-lg font-bold text-gray-900 dark:text-dark-text-primary">${invoice.amount}</div>
                <div class="mt-3 sm:mt-4">${actionButtonsHTML}</div>
            `;
            invoicesMobileCards.appendChild(mobileCard);
        });
    }

    function getStatusClasses(status) {
        switch (status) {
            case 'Pagado': return 'text-green-800 dark:text-green-300 bg-green-100 dark:bg-green-900/30';
            case 'Pendiente': return 'text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30';
            case 'Vencido': return 'text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-900/30';
            default: return 'text-gray-800 dark:text-gray-300 bg-gray-100 dark:bg-gray-800/30';
        }
    }

    function populateConnectionFilter(connections) {
        connectionFilter.innerHTML = '<option value="all">Todas las conexiones</option>';
        connections.forEach(conn => {
            const option = document.createElement('option');
            option.value = conn.id;
            option.textContent = conn.name;
            // Sanitize option values
            option.value = window.Sanitizer ? window.Sanitizer.sanitizeString(conn.id) : conn.id;
            option.textContent = window.Sanitizer ? window.Sanitizer.sanitizeString(conn.name) : conn.name;
            connectionFilter.appendChild(option);
        });
    }

    // --- LÓGICA DE DATOS Y FILTRADO ---

    async function fetchConnections() {
        // Se simula una llamada a la API con datos de ejemplo.
        return new Promise(resolve => setTimeout(() => resolve(mockConnections), 500));
    }

    async function fetchInvoices() {
        // 🎭 En modo desarrollo, usar datos mock
        if (window.ENV && window.ENV.isDevelopment && window.DevMock) {
            console.log('🎭 Usando facturas del mock');
            // Convertir formato de mock a formato esperado
            const mockFacturas = window.DevMock.facturas.map(f => ({
                invoiceNumber: f.numero,
                period: f.periodo,
                dueDate: f.vencimiento,
                amount: `$${f.monto.toLocaleString('es-AR')}`,
                status: f.estado === 'pagada' ? 'Pagado' : 
                        f.estado === 'vencida' ? 'Vencido' : 'Pendiente',
                actionLink: '#',
                connectionId: 'CON-001' // Por defecto
            }));
            return new Promise(resolve => setTimeout(() => resolve(mockFacturas), 300));
        }
        
        // Se simula una llamada a la API con datos de ejemplo.
        return new Promise(resolve => setTimeout(() => resolve(mockInvoices), 800));
    }

    async function initializePage() {
        console.log('📋 Inicializando página de facturas...');
        
        // Se obtienen los datos de ejemplo y se renderiza la página.
        const [connections, invoices] = await Promise.all([
            fetchConnections(),
            fetchInvoices()
        ]);

        allInvoices = invoices;
        populateConnectionFilter(connections);
        renderInvoices(allInvoices);

        connectionFilter.addEventListener('change', (e) => {
            const selectedId = e.target.value;
            const filteredInvoices = selectedId === 'all' ? allInvoices : allInvoices.filter(inv => inv.connectionId === selectedId);
            renderInvoices(filteredInvoices);
        });
    }

    initializePage();
})();