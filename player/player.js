// Doxmaxima Altyazı Yöneticisi
// YouTube'un orijinal player'ına dokunmaz, sadece altyazıları (subtitles) özelleştirir.

class DoxSubtitleManager {
    constructor() {
        this.settings = null;
        this.init();
    }

    init() {
        console.log("Doxmaxima Altyazı Yöneticisi Başlatıldı");

        // Eklenti yüklendiğinde ayarları hafızadan çek
        chrome.storage.sync.get({
            playerEnabled: true,
            subSize: 24,
            subDynamicSize: true,
            subFont: 'Inter, sans-serif',
            subWeight: 400,
            subSpacing: 0,
            subColor: '#ffffff',
            subBgColor: '#000000',
            subBgOpacity: 50,
            subStroke: '2px',
            subStrokeColor: '#000000',
            subAlign: 'center',
            subLockX: true,
            subDistance: 5
        }, (items) => {
            this.settings = items;
            this.applyStyles();
        });

        // YouTube SPA (F5 atmadan sayfa değişimi) için dinleyici
        window.addEventListener('yt-navigate-finish', () => {
            console.log("Doxmaxima: Yeni video yüklendi, stiller uygulanıyor...");
            this.applyStyles();
            
            // Eğer player değiştiyse observer'ı tekrar bağla
            const playerEl = document.getElementById('movie_player');
            if (playerEl && this.resizeObserver) {
                this.resizeObserver.observe(playerEl);
            }
        });

        // Kullanıcı arayüzden (ui.html) ayar değiştirdiğinde anlık dinle
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.type === "UPDATE_DOX_SETTINGS") {
                this.settings = request.payload;
                this.applyStyles();
            }
        });

        // Video oynatıcı boyutunu dinlemek için ResizeObserver
        if (!this.resizeObserver) {
            this.resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    document.documentElement.style.setProperty('--dox-video-width', entry.contentRect.width + 'px');
                }
            });

            // Oynatıcı zaten varsa dinlemeye başla
            const playerEl = document.getElementById('movie_player');
            if (playerEl) {
                this.resizeObserver.observe(playerEl);
            } else {
                // Yoksa oluşana kadar DOM'u bekle
                const observer = new MutationObserver((mutations, obs) => {
                    const el = document.getElementById('movie_player');
                    if (el) {
                        this.resizeObserver.observe(el);
                        obs.disconnect();
                    }
                });
                observer.observe(document.body, { childList: true, subtree: true });
            }
        }

        // Özel Sürükleme (Drag) Mantığı - YouTube'un bozuk sistemini eziyoruz
        if (!window.doxDragInitialized) {
            window.doxDragInitialized = true;
            let isDragging = false;
            let startY = 0;
            let startBottom = 80; // Varsayılan başlangıç 80px

            document.addEventListener('mousedown', (e) => {
                if (!this.settings || !this.settings.playerEnabled) return; // Player kapalıysa orijinal YouTube çalışsın
                
                const cw = e.target.closest('.caption-window');
                // caption-window pointer-events: none olduğu için, sadece ::after (buton) tıklandığında tetiklenir!
                if (cw) {
                    isDragging = true;
                    e.stopPropagation();
                    e.preventDefault();
                    startY = e.clientY;
                    const currentBottom = document.documentElement.style.getPropertyValue('--dox-sub-bottom');
                    startBottom = currentBottom ? parseFloat(currentBottom) : 80;
                }
            }, true);

            document.addEventListener('mousemove', (e) => {
                if (!this.settings || !this.settings.playerEnabled) return; // Player kapalıysa orijinal YouTube çalışsın
                
                if (isDragging) {
                    e.stopPropagation();
                    e.preventDefault();
                    let deltaY = e.clientY - startY;
                    let newBottom = startBottom - deltaY;
                    
                    // Sınırlar (Ekrana dışına çıkmasın)
                    const videoEl = document.querySelector('.html5-video-player');
                    const videoHeight = videoEl ? videoEl.clientHeight : window.innerHeight;
                    if (newBottom < 0) newBottom = 0;
                    if (newBottom > videoHeight - 40) newBottom = videoHeight - 40;

                    document.documentElement.style.setProperty('--dox-sub-bottom', newBottom + 'px');
                    
                    // Altyazı %60'ın üstüne çıkarsa butonu aşağı al (Taşmayı önlemek için)
                    if (newBottom > videoHeight * 0.60) {
                        document.documentElement.style.setProperty('--dox-handle-top', 'auto');
                        document.documentElement.style.setProperty('--dox-handle-bottom', '-32px');
                    } else {
                        document.documentElement.style.setProperty('--dox-handle-top', '-32px');
                        document.documentElement.style.setProperty('--dox-handle-bottom', 'auto');
                    }
                    
                    return; // Sürüklenirken hover kontrolüne gerek yok
                }
                
                // Matematiksel Hover Tespiti (pointer-events:none olduğu için JS ile yapıyoruz)
                const cw = document.querySelector('.caption-window');
                if (cw) {
                    const rect = cw.getBoundingClientRect();
                    // Butonun nerede olduğuna bakarak hover (tetiklenme) alanını genişletiyoruz
                    const isHandleAtBottom = document.documentElement.style.getPropertyValue('--dox-handle-bottom') === '-32px';
                    const topOffset = isHandleAtBottom ? 0 : -40;
                    const bottomOffset = isHandleAtBottom ? 40 : 0;

                    if (rect.width > 0 && rect.height > 0 &&
                        e.clientX >= rect.left && e.clientX <= rect.right &&
                        e.clientY >= rect.top + topOffset && e.clientY <= rect.bottom + bottomOffset) {
                        if (cw.dataset.doxHover !== '1') {
                            cw.dataset.doxHover = '1';
                            cw.style.setProperty('--dox-handle-opacity', '1');
                        }
                    } else {
                        if (cw.dataset.doxHover !== '0') {
                            cw.dataset.doxHover = '0';
                            cw.style.setProperty('--dox-handle-opacity', '0');
                        }
                    }
                }
            }, true);

            document.addEventListener('mouseup', (e) => {
                if (isDragging) {
                    isDragging = false;
                    if (this.settings && this.settings.playerEnabled) {
                        e.stopPropagation();
                        e.preventDefault();
                    }
                }
            }, true);

            // Butona tıklandığında videonun durmasını / etkileşime girmesini engeller
            document.addEventListener('click', (e) => {
                if (!this.settings || !this.settings.playerEnabled) return;
                const cw = e.target.closest('.caption-window');
                if (cw) {
                    e.stopPropagation();
                    e.preventDefault();
                }
            }, true);
            
            document.addEventListener('pointerdown', (e) => {
                if (!this.settings || !this.settings.playerEnabled) return;
                const cw = e.target.closest('.caption-window');
                if (cw) {
                    e.stopPropagation();
                }
            }, true);
        }
    }

    applyStyles() {
        // Eğer kullanıcı eklentiyi kapattıysa, bizim stilleri sil
        if (!this.settings || !this.settings.playerEnabled) {
            this.removeStyles();
            return;
        }

        let styleEl = document.getElementById('dox-subtitle-styles');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'dox-subtitle-styles';
            document.head.appendChild(styleEl);
        }

        // Renk dönüştürücü (HEX -> RGB)
        const hexToRgb = (hex) => {
            let r = 0, g = 0, b = 0;
            if (hex && hex.length === 7) {
                r = parseInt(hex.slice(1, 3), 16);
                g = parseInt(hex.slice(3, 5), 16);
                b = parseInt(hex.slice(5, 7), 16);
            }
            return `${r}, ${g}, ${b}`;
        };

        const bgRgb = hexToRgb(this.settings.subBgColor);
        const bgAlpha = this.settings.subBgOpacity / 100;

        // Font size dinamik hesaplama
        let fontSizeCss = `${this.settings.subSize}px !important`;
        if (this.settings.subDynamicSize) {
            // Referans genişlik olarak YouTube standart küçük ekranı olan 853px'i alıyoruz.
            // CSS'te iki 'px' değeri çarpılamaz (örn: 1px * 24px geçersizdir), bu yüzden subSize yanındaki px'i kaldırdık.
            fontSizeCss = `calc((var(--dox-video-width, 853px) / 853) * ${this.settings.subSize}) !important`;
        }

        // Yazı kenarlığı ayarı
        let shadowCss = 'none';
        if (this.settings.subStroke !== 'none') {
            const size = parseFloat(this.settings.subStroke);
            const clr = this.settings.subStrokeColor;

            // İçeriye taşmayan, dışa doğru açılan yumuşak (smooth) kenarlık
            shadowCss = `
                0 0 ${size * 1.5}px ${clr},
                0 0 ${size * 1.5}px ${clr},
                0 0 ${size * 2}px ${clr},
                ${size}px ${size}px 0 ${clr},
                -${size}px -${size}px 0 ${clr},
                ${size}px -${size}px 0 ${clr},
                -${size}px ${size}px 0 ${clr},
                ${size}px 0px 0 ${clr},
                0px ${size}px 0 ${clr},
                -${size}px 0px 0 ${clr},
                0px -${size}px 0 ${clr}
            `;
        }

        // X Eksenini Kilitleme CSS'i
        let lockXCss = '';
        if (this.settings.subLockX) {
            lockXCss = `
                left: 10px !important;
                width: calc(100% - 20px) !important;
                margin-left: 0px !important;
                transform: none !important;
            `;
        }

        const distancePx = this.settings.subDistance !== undefined ? this.settings.subDistance : 5;

        // YouTube'un kendi altyazı CSS sınıflarını eziyoruz
        styleEl.innerHTML = `
            /* Metin Blokları */
            .ytp-caption-segment {
                font-size: ${fontSizeCss};
                font-family: ${this.settings.subFont} !important;
                font-weight: ${this.settings.subWeight} !important;
                letter-spacing: ${this.settings.subSpacing}px !important;
                color: ${this.settings.subColor} !important;
                background: rgba(${bgRgb}, ${bgAlpha}) !important;
                text-shadow: ${shadowCss} !important;
                border-radius: 6px !important;
                padding: 4px 8px !important;
                text-align: ${this.settings.subAlign} !important;
            }
            
            /* Konteyner'ı flex yapıp altyazıları dizeceğiz */
            #ytp-caption-window-container {
                display: flex !important;
                flex-direction: column !important;
                justify-content: flex-end !important;
                align-items: center !important;
                position: absolute !important;
                bottom: var(--dox-sub-bottom, 80px) !important;
                top: auto !important;
                left: 0 !important;
                right: 0 !important;
                width: 100% !important;
                height: auto !important;
                margin: 0 !important;
                gap: ${distancePx}px !important;
                pointer-events: none !important;
            }

            /* Kapsayıcılara da metin hizalama verelim ki tam çalışsın */
            .caption-window {
                overflow: visible !important;
                background: transparent !important;
                text-align: ${this.settings.subAlign} !important;
                margin-bottom: 0px !important;
                padding-bottom: 0px !important;
                
                /* YOUTUBE FİZİĞİNİ DEVRE DIŞI BIRAKMA: Konteyner bottom kullanıyor */
                position: relative !important;
                top: auto !important;
                bottom: auto !important;
                
                ${lockXCss}
            }
            
            /* Özel Sürükleme Butonu (Drag Handle) */
            .caption-window::after {
                content: "✥ Sürükle";
                position: absolute;
                top: var(--dox-handle-top, -32px); /* JS ile dinamik yönetilir */
                bottom: var(--dox-handle-bottom, auto);
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 5px 14px;
                border-radius: 20px;
                font-size: 13px;
                font-family: sans-serif;
                font-weight: bold;
                /* Sadece buton tıklanabilir olacak */
                pointer-events: auto !important;
                cursor: grab !important;
                transition: opacity 0.2s ease;
                user-select: none;
                -webkit-user-select: none;
                z-index: 9999;
                /* Başlangıçta görünmez. Sadece JS ile üstüne gelindiği tespit edildiğinde 1 olur */
                opacity: var(--dox-handle-opacity, 0);
            }
            
            .caption-window::after:active {
                cursor: grabbing !important;
                background: var(--accent, #0ea5e9);
            }

            .ytp-caption-window-rollup {
                 background: transparent !important;
                 /* Rollup (kayan) altyazılarda da zıplamayı durdurur */
                 margin-bottom: 0px !important;
                 padding-bottom: 0px !important;
            }
            
            /* YouTube bazen satır içi (inline) style ile background atayabiliyor, onu da eziyoruz */
            .ytp-caption-segment[style*="background"] {
                background: rgba(${bgRgb}, ${bgAlpha}) !important;
            }
        `;
    }

    removeStyles() {
        const styleEl = document.getElementById('dox-subtitle-styles');
        if (styleEl) {
            styleEl.remove();
        }
    }
}

// Sistemi başlat
new DoxSubtitleManager();
