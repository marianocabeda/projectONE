// Este script se ejecuta cuando el contenido de soporte.html se carga dinámicamente.
(function() {
    const emailBtn = document.getElementById('send-email');
    const whatsappBtn = document.getElementById('send-whatsapp');
    const queryTextarea = document.getElementById('support-query');

    if (!emailBtn || !whatsappBtn || !queryTextarea) return;

    // --- DATOS DE CONTACTO ---
    const supportEmail = 'info@oneinternet.com.ar';
    const supportWhatsAppNumber = '5492615975657'; // Número de WhatsApp sin '+' ni espacios.
    const COOLDOWN_PERIOD_MS = 30 * 60 * 1000; // 30 minutos en milisegundos
    const LAST_SUBMISSION_KEY = 'lastSupportSubmissionTime';

    // Función para mostrar un mensaje flotante
    const showFloatingMessage = (message, type = 'error') => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-white z-[9999] transition-all duration-300 ease-in-out transform opacity-0 scale-95`;
        
        if (type === 'error') {
            messageDiv.classList.add('bg-red-600');
        } else if (type === 'success') {
            messageDiv.classList.add('bg-green-600');
        } else {
            messageDiv.classList.add('bg-gray-800');
        }

        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);

        // Animar entrada
        setTimeout(() => {
            messageDiv.classList.remove('opacity-0', 'scale-95');
            messageDiv.classList.add('opacity-100', 'scale-100');
        }, 10); // Pequeño retraso para asegurar la transición

        // Animar salida y remover
        setTimeout(() => {
            messageDiv.classList.remove('opacity-100', 'scale-100');
            messageDiv.classList.add('opacity-0', 'scale-95');
            messageDiv.addEventListener('transitionend', () => messageDiv.remove());
        }, 3000); // Mostrar por 3 segundos
    };

    const checkCooldownAndSubmit = (submitAction) => {
        const body = queryTextarea.value;

        if (!body.trim()) {
            queryTextarea.reportValidity();
            return;
        }

        const lastSubmissionTime = localStorage.getItem(LAST_SUBMISSION_KEY);
        const currentTime = new Date().getTime();

        if (lastSubmissionTime && (currentTime - parseInt(lastSubmissionTime, 10) < COOLDOWN_PERIOD_MS)) {
            showFloatingMessage('¡Estás haciendo consultas muy rápido! Intenta de nuevo en un momento.', 'error');
            // Redirigir al dashboard después de un breve retraso para que el mensaje sea visible
            setTimeout(() => {
                const homeRoute = window.AppConfig?.routes?.home || '/home';
                const dashboardRoute = window.AppConfig?.routes?.dashboard || '/dashboard';

                if (window.loadContent) {
                    window.loadContent(homeRoute);
                } else {
                    console.warn("window.loadContent no está disponible para la redirección.");
                    window.location.href = dashboardRoute; // Fallback si loadContent no está disponible
                }
            }, 3500); // Espera un poco más que el mensaje para que se vea
            return;
        }

        submitAction(body);
        localStorage.setItem(LAST_SUBMISSION_KEY, currentTime.toString());
    };

    emailBtn.addEventListener('click', () => {
        checkCooldownAndSubmit((body) => {
            const subject = "Consulta de Soporte";
            const mailtoLink = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailtoLink;
        });
    });

    whatsappBtn.addEventListener('click', () => {
        checkCooldownAndSubmit((body) => {
            const whatsappLink = `https://wa.me/${supportWhatsAppNumber}?text=${encodeURIComponent(body)}`;
            window.open(whatsappLink, '_blank');
        });
    });
})();