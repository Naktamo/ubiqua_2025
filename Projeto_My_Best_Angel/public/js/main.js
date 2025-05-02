/**
 * MyBestAngel - JavaScript Principal
 * Autor: Caique Rabelo Neves
 * COP30 Belém - 2025
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar variáveis
    const body = document.body;
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mainContent = document.querySelector('.main-content');
    
    // Toggle do Sidebar para Desktop
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            body.classList.toggle('sidebar-collapsed');
        });
    }
    
    // Toggle do Sidebar para Mobile
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            body.classList.toggle('sidebar-open');
            
            // Criar overlay para fechar o sidebar ao clicar fora
            let overlay = document.querySelector('.sidebar-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'sidebar-overlay';
                body.appendChild(overlay);
            }
            
            overlay.addEventListener('click', function() {
                body.classList.remove('sidebar-open');
            });
        });
    }
    
    // Destacar item atual no menu
    const currentLocation = window.location.pathname;
    const menuItems = document.querySelectorAll('.sidebar-menu a');
    
    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && currentLocation.includes(href) && href !== '/') {
            item.classList.add('active');
        } else if (href === '/' && currentLocation === '/') {
            item.classList.add('active');
        }
    });
    
    // Inicializar Tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });
    
    // Inicializar Popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    const popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl)
    });
    
    // Fechar alertas automaticamente
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000); // Fechar após 5 segundos
    });
    
    // Funções para carregar tours e guias em destaque na homepage
    const loadFeaturedTours = async () => {
        try {
            const container = document.getElementById('featured-tours-container');
            if (!container) return;
            
            // Aqui seria feita uma requisição AJAX para buscar os tours em destaque
            // Por enquanto, vamos usar dados de exemplo
            const tours = [
                {
                    id: 1,
                    title: 'Mercado Ver-o-Peso',
                    location: 'Centro, Belém',
                    date: '2025-11-12 09:00:00',
                    description: 'Visite o famoso mercado a céu aberto, um dos símbolos da cidade de Belém.',
                    price: 80,
                    image: '/images/tour-placeholder.jpg',
                    guide: {
                        name: 'João Silva',
                        avatar: '/images/guide-avatar.jpg'
                    }
                },
                {
                    id: 2,
                    title: 'Tour Gastronômico',
                    location: 'Estação das Docas, Belém',
                    date: '2025-11-14 18:00:00',
                    description: 'Deguste os mais deliciosos pratos da culinária paraense em um tour pelos melhores restaurantes.',
                    price: 120,
                    image: '/images/tour-placeholder.jpg',
                    guide: {
                        name: 'Maria Oliveira',
                        avatar: '/images/guide-avatar.jpg'
                    }
                },
                {
                    id: 3,
                    title: 'Basílica de Nazaré',
                    location: 'Nazaré, Belém',
                    date: '2025-11-15 14:00:00',
                    description: 'Conheça a história e arquitetura da famosa Basílica de Nazaré, um marco religioso e cultural.',
                    price: 50,
                    image: '/images/tour-placeholder.jpg',
                    guide: {
                        name: 'Pedro Santos',
                        avatar: '/images/guide-avatar.jpg'
                    }
                }
            ];
            
            // Limpar container
            container.innerHTML = '';
            
            // Formatador de data
            const formatDate = (dateString) => {
                const date = new Date(dateString);
                return date.toLocaleDateString('pt-BR');
            };
            
            // Criar cards para cada tour
            tours.forEach(tour => {
                const card = document.createElement('div');
                card.className = 'col-md-4 mb-4';
                card.innerHTML = `
                    <div class="tour-card">
                        <div class="tour-image">
                            <img src="${tour.image}" alt="${tour.title}">
                            <div class="tour-price">R$ ${tour.price}</div>
                        </div>
                        <div class="tour-body">
                            <h3 class="tour-title">${tour.title}</h3>
                            <div class="tour-info">
                                <span><i class="fas fa-map-marker-alt"></i> ${tour.location}</span>
                                <span><i class="fas fa-calendar"></i> ${formatDate(tour.date)}</span>
                            </div>
                            <p class="tour-description">${tour.description}</p>
                            <div class="tour-footer">
                                <div class="tour-guide">
                                    <img src="${tour.guide.avatar}" alt="${tour.guide.name}">
                                    <span>Guia ${tour.guide.name}</span>
                                </div>
                                <a href="/tour/details/${tour.id}" class="btn btn-sm btn-primary">Ver Detalhes</a>
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        } catch (error) {
            console.error('Erro ao carregar tours em destaque:', error);
        }
    };
    
    const loadFeaturedGuides = async () => {
        try {
            const container = document.getElementById('featured-guides-container');
            if (!container) return;
            
            // Aqui seria feita uma requisição AJAX para buscar os guias em destaque
            // Por enquanto, vamos usar dados de exemplo
            const guides = [
                {
                    id: 1,
                    name: 'Maria Silva',
                    specialty: 'Gastronomia e Cultura',
                    languages: 'Português, Inglês, Espanhol',
                    rating: 4.5,
                    visitors_count: 2,
                    tours_count: 8,
                    avatar: '/images/guide-placeholder.jpg'
                },
                {
                    id: 2,
                    name: 'João Santos',
                    specialty: 'História e Arquitetura',
                    languages: 'Português, Inglês, Francês',
                    rating: 5.0,
                    visitors_count: 3,
                    tours_count: 12,
                    avatar: '/images/guide-placeholder.jpg'
                },
                {
                    id: 3,
                    name: 'Ana Pereira',
                    specialty: 'Ecoturismo e Aventura',
                    languages: 'Português, Inglês',
                    rating: 4.8,
                    visitors_count: 1,
                    tours_count: 6,
                    avatar: '/images/guide-placeholder.jpg'
                },
                {
                    id: 4,
                    name: 'Carlos Mendes',
                    specialty: 'Fotografia e Arte',
                    languages: 'Português, Espanhol',
                    rating: 4.7,
                    visitors_count: 3,
                    tours_count: 10,
                    avatar: '/images/guide-placeholder.jpg'
                }
            ];
            
            // Limpar container
            container.innerHTML = '';
            
            // Criar cards para cada guia
            guides.forEach(guide => {
                const card = document.createElement('div');
                card.className = 'col-lg-3 col-md-6 mb-4';
                
                // Criar estrelas baseadas na classificação
                let starsHtml = '';
                const fullStars = Math.floor(guide.rating);
                const hasHalfStar = guide.rating % 1 !== 0;
                
                for (let i = 1; i <= 5; i++) {
                    if (i <= fullStars) {
                        starsHtml += '<i class="fas fa-star"></i>';
                    } else if (i === fullStars + 1 && hasHalfStar) {
                        starsHtml += '<i class="fas fa-star-half-alt"></i>';
                    } else {
                        starsHtml += '<i class="far fa-star"></i>';
                    }
                }
                
                card.innerHTML = `
                    <div class="guide-card">
                        <div class="guide-image">
                            <img src="${guide.avatar}" alt="${guide.name}">
                        </div>
                        <div class="guide-body">
                            <h3 class="guide-name">${guide.name}</h3>
                            <div class="guide-rating">
                                ${starsHtml}
                                <span>${guide.rating.toFixed(1)}</span>
                            </div>
                            <p class="guide-specialty">Especialidade: ${guide.specialty}</p>
                            <p class="guide-languages">Idiomas: ${guide.languages}</p>
                            <div class="guide-stats">
                                <span><i class="fas fa-users"></i> ${guide.visitors_count} visitantes</span>
                                <span><i class="fas fa-map-marked-alt"></i> ${guide.tours_count} tours</span>
                            </div>
                            <a href="/angel/profile/${guide.id}" class="btn btn-sm btn-primary w-100 mt-2">Ver Perfil</a>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        } catch (error) {
            console.error('Erro ao carregar guias em destaque:', error);
        }
    };
    
    // Inicializar carregamento de conteúdos da homepage
    loadFeaturedTours();
    loadFeaturedGuides();
    
    // Funções para manipulação de formulários
    document.addEventListener('submit', function(event) {
        const form = event.target;
        
        // Validação de formulário de login
        if (form.id === 'loginForm') {
            const email = form.querySelector('input[name="email"]');
            const password = form.querySelector('input[name="password"]');
            
            let isValid = true;
            
            if (!email.value.trim()) {
                showError(email, 'E-mail é obrigatório');
                isValid = false;
            } else if (!isValidEmail(email.value)) {
                showError(email, 'E-mail inválido');
                isValid = false;
            } else {
                clearError(email);
            }
            
            if (!password.value.trim()) {
                showError(password, 'Senha é obrigatória');
                isValid = false;
            } else {
                clearError(password);
            }
            
            if (!isValid) {
                event.preventDefault();
            }
        }
        
        // Validação de formulário de cadastro
        if (form.id === 'registerForm') {
            const name = form.querySelector('input[name="name"]');
            const email = form.querySelector('input[name="email"]');
            const password = form.querySelector('input[name="password"]');
            const confirmPassword = form.querySelector('input[name="confirmPassword"]');
            
            let isValid = true;
            
            if (!name.value.trim()) {
                showError(name, 'Nome é obrigatório');
                isValid = false;
            } else {
                clearError(name);
            }
            
            if (!email.value.trim()) {
                showError(email, 'E-mail é obrigatório');
                isValid = false;
            } else if (!isValidEmail(email.value)) {
                showError(email, 'E-mail inválido');
                isValid = false;
            } else {
                clearError(email);
            }
            
            if (!password.value.trim()) {
                showError(password, 'Senha é obrigatória');
                isValid = false;
            } else if (password.value.length < 6) {
                showError(password, 'Senha deve ter pelo menos 6 caracteres');
                isValid = false;
            } else {
                clearError(password);
            }
            
            if (!confirmPassword.value.trim()) {
                showError(confirmPassword, 'Confirmação de senha é obrigatória');
                isValid = false;
            } else if (confirmPassword.value !== password.value) {
                showError(confirmPassword, 'As senhas não coincidem');
                isValid = false;
            } else {
                clearError(confirmPassword);
            }
            
            if (!isValid) {
                event.preventDefault();
            }
        }
    });
    
    // Função auxiliar para validar e-mail
    function isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
    
    // Funções para mostrar e limpar erros de validação
    function showError(input, message) {
        const formGroup = input.closest('.form-group') || input.closest('.mb-3');
        const errorElement = formGroup.querySelector('.invalid-feedback') || document.createElement('div');
        
        input.classList.add('is-invalid');
        
        if (!formGroup.querySelector('.invalid-feedback')) {
            errorElement.className = 'invalid-feedback';
            formGroup.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
    }
    
    function clearError(input) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
    }
    
    // Inicializar Mapa para a página de mapa (se existir)
    const initMap = () => {
        const mapContainer = document.getElementById('map');
        if (!mapContainer) return;
        
        // Carregar Google Maps via API
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initGoogleMap`;
        script.defer = true;
        document.head.appendChild(script);
        
        // Esta função será chamada quando o script do Google Maps for carregado
        window.initGoogleMap = function() {
            // Coordenadas de Belém
            const belemCoordinates = { lat: -1.4557, lng: -48.4902 };
            
            const map = new google.maps.Map(mapContainer, {
                center: belemCoordinates,
                zoom: 13,
                styles: [
                    {
                        featureType: "poi",
                        elementType: "labels",
                        stylers: [{ visibility: "off" }]
                    }
                ]
            });
            
            // Marcador para Belém
            const belemMarker = new google.maps.Marker({
                position: belemCoordinates,
                map: map,
                title: 'Belém do Pará',
                icon: {
                    url: '/images/icons/map-marker.png',
                    scaledSize: new google.maps.Size(40, 40)
                }
            });
            
            // Pontos de interesse
            const places = [
                {
                    name: 'Mercado Ver-o-Peso',
                    position: { lat: -1.4518, lng: -48.5039 },
                    type: 'attraction',
                    description: 'Famoso mercado a céu aberto, patrimônio histórico de Belém.'
                },
                {
                    name: 'Estação das Docas',
                    position: { lat: -1.4496, lng: -48.5014 },
                    type: 'restaurant',
                    description: 'Complexo turístico e gastronômico com bares e restaurantes.'
                },
                {
                    name: 'Basílica de Nazaré',
                    position: { lat: -1.4521, lng: -48.4789 },
                    type: 'attraction',
                    description: 'Santuário que abriga a imagem de Nossa Senhora de Nazaré.'
                },
                {
                    name: 'Mangal das Garças',
                    position: { lat: -1.4678, lng: -48.5039 },
                    type: 'attraction',
                    description: 'Parque naturalístico com fauna e flora amazônicas.'
                },
                {
                    name: 'Museu Emílio Goeldi',
                    position: { lat: -1.4523, lng: -48.4736 },
                    type: 'attraction',
                    description: 'Museu de história natural e centro de pesquisa científica.'
                }
            ];
            
            // Adicionar marcadores para os pontos de interesse
            const markers = [];
            const infoWindows = [];
            
            places.forEach((place, index) => {
                const marker = new google.maps.Marker({
                    position: place.position,
                    map: map,
                    title: place.name,
                    icon: {
                        url: `/images/icons/marker-${place.type}.png`,
                        scaledSize: new google.maps.Size(30, 30)
                    }
                });
                
                markers.push(marker);
                
                const infoWindow = new google.maps.InfoWindow({
                    content: `
                        <div class="map-info-window">
                            <h3>${place.name}</h3>
                            <p>${place.description}</p>
                            <a href="/tour/search?location=${encodeURIComponent(place.name)}" class="btn btn-sm btn-primary">Ver Tours</a>
                        </div>
                    `
                });
                
                infoWindows.push(infoWindow);
                
                marker.addListener('click', () => {
                    // Fechar todas as janelas de informação abertas
                    infoWindows.forEach(iw => iw.close());
                    
                    // Abrir a janela de informação do marcador clicado
                    infoWindow.open(map, marker);
                    
                    // Destacar o local na lista de locais
                    highlightPlace(index);
                });
            });
            
            // Função para destacar um local na lista de locais
            function highlightPlace(index) {
                const placeItems = document.querySelectorAll('.map-place-item');
                placeItems.forEach(item => item.classList.remove('active'));
                
                if (placeItems[index]) {
                    placeItems[index].classList.add('active');
                    placeItems[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
            
            // Adicionar interatividade para a lista de locais
            const placesContainer = document.getElementById('places-list');
            if (placesContainer) {
                places.forEach((place, index) => {
                    const placeItem = document.createElement('li');
                    placeItem.className = 'map-place-item';
                    placeItem.innerHTML = `
                        <h3>${place.name}</h3>
                        <p>${place.description}</p>
                        <span class="map-place-type ${place.type}">${getPlaceTypeLabel(place.type)}</span>
                    `;
                    
                    placeItem.addEventListener('click', () => {
                        // Centralizar o mapa na posição do local
                        map.setCenter(place.position);
                        map.setZoom(15);
                        
                        // Fechar todas as janelas de informação abertas
                        infoWindows.forEach(iw => iw.close());
                        
                        // Abrir a janela de informação do marcador
                        infoWindows[index].open(map, markers[index]);
                        
                        // Destacar o local na lista
                        highlightPlace(index);
                    });
                    
                    placesContainer.appendChild(placeItem);
                });
            }
            
            // Função para obter o rótulo do tipo de local
            function getPlaceTypeLabel(type) {
                const types = {
                    'attraction': 'Atração Turística',
                    'restaurant': 'Gastronomia',
                    'accommodation': 'Hospedagem',
                    'shopping': 'Compras'
                };
                
                return types[type] || 'Ponto de Interesse';
            }
        };
    };
    
    // Chamar a inicialização do mapa
    initMap();
});