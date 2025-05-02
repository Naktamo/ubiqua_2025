/**
 * MyBestAngel - Carrossel da Homepage
 * Autor: Caique Rabelo Neves
 * COP30 Belém - 2025
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar o carrossel principal
    const heroCarousel = document.getElementById('heroCarousel');
    if (heroCarousel) {
        const carousel = new bootstrap.Carousel(heroCarousel, {
            interval: 5000, // Intervalo de 5 segundos entre slides
            wrap: true, // Circular (voltar ao primeiro slide após o último)
            keyboard: true, // Permitir navegação via teclado
            pause: 'hover', // Pausar ao passar o mouse
            ride: 'carousel' // Iniciar automaticamente
        });
        
        // Adicionar indicadores dinamicamente
        const carouselItems = heroCarousel.querySelectorAll('.carousel-item');
        const indicatorsContainer = heroCarousel.querySelector('.carousel-indicators');
        
        if (indicatorsContainer) {
            indicatorsContainer.innerHTML = '';
            
            carouselItems.forEach((item, index) => {
                const indicator = document.createElement('button');
                indicator.type = 'button';
                indicator.setAttribute('data-bs-target', '#heroCarousel');
                indicator.setAttribute('data-bs-slide-to', index.toString());
                
                if (index === 0) {
                    indicator.classList.add('active');
                    indicator.setAttribute('aria-current', 'true');
                }
                
                indicator.setAttribute('aria-label', `Slide ${index + 1}`);
                indicatorsContainer.appendChild(indicator);
            });
        }
        
        // Adicionar evento para pausar o carrossel quando o usuário interage com o slide
        heroCarousel.addEventListener('mousedown', function() {
            carousel.pause();
        });
        
        // Retomar a reprodução automática quando o usuário solta o clique
        heroCarousel.addEventListener('mouseup', function() {
            carousel.cycle();
        });
        
        // Adicionar transição suave nos slides
        carouselItems.forEach(item => {
            item.style.transition = 'transform 1.2s ease-in-out';
        });
        
        // Pré-carregar próxima imagem para melhor desempenho
        heroCarousel.addEventListener('slide.bs.carousel', function(event) {
            const nextSlide = event.relatedTarget;
            const img = nextSlide.querySelector('img');
            
            if (img && img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }
        });
        
        // Animação de texto nos slides
        heroCarousel.addEventListener('slid.bs.carousel', function(event) {
            const activeSlide = event.relatedTarget;
            const caption = activeSlide.querySelector('.carousel-caption');
            
            if (caption) {
                // Resetar opacidade para criar efeito de fade in
                caption.style.opacity = '0';
                caption.style.transform = 'translateY(20px)';
                
                // Aplicar animação após um pequeno delay
                setTimeout(() => {
                    caption.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
                    caption.style.opacity = '1';
                    caption.style.transform = 'translateY(0)';
                }, 100);
            }
        });
        
        // Iniciar a animação para o primeiro slide
        const firstSlideCaption = heroCarousel.querySelector('.carousel-item.active .carousel-caption');
        if (firstSlideCaption) {
            setTimeout(() => {
                firstSlideCaption.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
                firstSlideCaption.style.opacity = '1';
                firstSlideCaption.style.transform = 'translateY(0)';
            }, 500);
        }
    }
    
    // Função para inicializar carrosséis de tours (se existirem na página)
    const initTourCarousels = () => {
        const tourCarousels = document.querySelectorAll('.tour-carousel');
        
        tourCarousels.forEach((carousel, index) => {
            const id = carousel.id || `tourCarousel${index}`;
            carousel.id = id;
            
            const carouselInner = carousel.querySelector('.carousel-inner');
            const tourItems = carousel.querySelectorAll('.tour-card');
            
            // Reorganizar os itens por slide (3 tours por slide em desktop, 1 em mobile)
            if (carouselInner && tourItems.length > 0) {
                carouselInner.innerHTML = '';
                
                // Determinar número de itens por slide com base no tamanho da tela
                const getItemsPerSlide = () => {
                    if (window.innerWidth < 768) {
                        return 1; // Mobile: 1 tour por slide
                    } else if (window.innerWidth < 992) {
                        return 2; // Tablet: 2 tours por slide
                    } else {
                        return 3; // Desktop: 3 tours por slide
                    }
                };
                
                let itemsPerSlide = getItemsPerSlide();
                
                // Recalcular quando o tamanho da janela muda
                window.addEventListener('resize', () => {
                    const newItemsPerSlide = getItemsPerSlide();
                    
                    if (newItemsPerSlide !== itemsPerSlide) {
                        itemsPerSlide = newItemsPerSlide;
                        createSlides();
                    }
                });
                
                // Função para criar slides
                function createSlides() {
                    carouselInner.innerHTML = '';
                    
                    for (let i = 0; i < tourItems.length; i += itemsPerSlide) {
                        const slide = document.createElement('div');
                        slide.className = 'carousel-item';
                        
                        if (i === 0) {
                            slide.classList.add('active');
                        }
                        
                        const row = document.createElement('div');
                        row.className = 'row';
                        
                        for (let j = i; j < i + itemsPerSlide && j < tourItems.length; j++) {
                            const col = document.createElement('div');
                            col.className = `col-md-${12 / itemsPerSlide}`;
                            
                            col.appendChild(tourItems[j].cloneNode(true));
                            row.appendChild(col);
                        }
                        
                        slide.appendChild(row);
                        carouselInner.appendChild(slide);
                    }
                }
                
                // Criar slides iniciais
                createSlides();
                
                // Adicionar controles de navegação
                const prevButton = document.createElement('button');
                prevButton.className = 'carousel-control-prev';
                prevButton.type = 'button';
                prevButton.setAttribute('data-bs-target', `#${id}`);
                prevButton.setAttribute('data-bs-slide', 'prev');
                prevButton.innerHTML = `
                    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span class="visually-hidden">Anterior</span>
                `;
                
                const nextButton = document.createElement('button');
                nextButton.className = 'carousel-control-next';
                nextButton.type = 'button';
                nextButton.setAttribute('data-bs-target', `#${id}`);
                nextButton.setAttribute('data-bs-slide', 'next');
                nextButton.innerHTML = `
                    <span class="carousel-control-next-icon" aria-hidden="true"></span>
                    <span class="visually-hidden">Próximo</span>
                `;
                
                carousel.appendChild(prevButton);
                carousel.appendChild(nextButton);
                
                // Inicializar o carrossel do Bootstrap
                new bootstrap.Carousel(carousel, {
                    interval: 7000, // 7 segundos entre slides
                    wrap: true
                });
            }
        });
    };
    
    // Inicializar carrosséis de tours
    initTourCarousels();
});