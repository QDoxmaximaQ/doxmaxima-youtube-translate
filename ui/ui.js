document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elementlerini al
    const togglePlayer = document.getElementById('toggle-player');
    const subSize = document.getElementById('sub-size');
    const subSizeVal = document.getElementById('sub-size-val');
    const subDynamicSize = document.getElementById('sub-dynamic-size');
    const subFont = document.getElementById('sub-font');
    const subWeight = document.getElementById('sub-weight');
    const subWeightVal = document.getElementById('sub-weight-val');
    const subSpacing = document.getElementById('sub-spacing');
    const subSpacingVal = document.getElementById('sub-spacing-val');
    const subColor = document.getElementById('sub-color');
    const subBgColor = document.getElementById('sub-bg-color');
    const subBgOpacity = document.getElementById('sub-bg-opacity');
    const subBgOpacityVal = document.getElementById('sub-bg-opacity-val');
    const subStroke = document.getElementById('sub-stroke');
    const subStrokeColor = document.getElementById('sub-stroke-color');
    const subAlign = document.getElementById('sub-align');
    const subLockX = document.getElementById('sub-lock-x');
    const uiLang = document.getElementById('ui-lang');

    // Dil dosyasını yükle (dil.json)
    let translations = {};
    try {
        const response = await fetch('dil.json');
        translations = await response.json();
    } catch (e) {
        console.error('Dil dosyası yüklenemedi. JSON yolunu kontrol edin:', e);
    }

    let currentLang = 'tr';

    // Arayüz metinlerini seçilen dile göre güncelleme fonksiyonu
    const updateTexts = () => {
        if (!translations[currentLang]) return;

        const dict = translations[currentLang];

        // Sahnede data-i18n="kelime" olan her şeyi bul ve içeriğini sözlükten çekip değiştir
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) {
                el.textContent = dict[key];
            }
        });

        // HTML etiketinin lang özelliğini değiştir
        document.documentElement.lang = currentLang;

        // Yazı kalınlığı (Weight) yazısını güncellemek için özel durum
        subWeightVal.textContent = subWeight.value;
    };

    // Kalınlık numaralarını dil json dosyasındaki anahtarlara çevirme
    function getWeightKey(weight) {
        weight = parseInt(weight);
        if (weight <= 300) return 'weight_thin';
        if (weight === 400) return 'weight_normal';
        if (weight === 500) return 'weight_medium';
        if (weight >= 600 && weight <= 700) return 'weight_bold';
        return 'weight_extrabold';
    }

    // Seçili dildeki kalınlık ismini json'dan alma
    function getWeightName(weight) {
        const key = getWeightKey(weight);
        return translations[currentLang] && translations[currentLang][key]
            ? translations[currentLang][key]
            : 'Normal';
    }

    // Kayıtlı ayarları Chrome Storage'dan yükle
    chrome.storage.sync.get({
        playerEnabled: true,
        uiLang: 'tr', // Varsayılan dil Türkçe
        subSize: 24,
        subDynamicSize: true,
        subFont: 'Inter, sans-serif',
        subWeight: 400,
        subSpacing: 0,
        subColor: '#ffffff',
        subBgColor: '#000000',
        subBgOpacity: 50,
        subStroke: '1px',
        subStrokeColor: '#000000',
        subAlign: 'center',
        subLockX: true
    }, (items) => {
        // --- 1. Önce Dili Ayarla ---
        currentLang = items.uiLang;
        uiLang.value = currentLang;
        updateTexts(); // Kelimeleri Türkçe veya İngilizce yap

        // --- 2. Diğer Arayüz Elemanlarını Ayarla ---
        togglePlayer.checked = items.playerEnabled;

        subSize.value = items.subSize;
        subSizeVal.textContent = items.subSize + 'px';
        subDynamicSize.checked = items.subDynamicSize;

        subFont.value = items.subFont;

        subWeight.value = items.subWeight;
        subWeightVal.textContent = items.subWeight;

        subSpacing.value = items.subSpacing;
        subSpacingVal.textContent = items.subSpacing + 'px';

        subColor.value = items.subColor;
        subBgColor.value = items.subBgColor;

        subBgOpacity.value = items.subBgOpacity;
        subBgOpacityVal.textContent = items.subBgOpacity + '%';

        subStroke.value = items.subStroke;
        subStrokeColor.value = items.subStrokeColor;
        subAlign.value = items.subAlign;
        subLockX.checked = items.subLockX;
    });

    // Değişiklikleri dinle ve kaydet (Her ayar değiştiğinde çalışır)
    const saveSettings = () => {
        const settings = {
            playerEnabled: togglePlayer.checked,
            uiLang: uiLang.value, // Dili de ayarlara kaydediyoruz
            subSize: parseInt(subSize.value),
            subDynamicSize: subDynamicSize.checked,
            subFont: subFont.value,
            subWeight: parseInt(subWeight.value),
            subSpacing: parseFloat(subSpacing.value),
            subColor: subColor.value,
            subBgColor: subBgColor.value,
            subBgOpacity: parseInt(subBgOpacity.value),
            subStroke: subStroke.value,
            subStrokeColor: subStrokeColor.value,
            subAlign: subAlign.value,
            subLockX: subLockX.checked
        };

        chrome.storage.sync.set(settings, () => {
            // Açık YouTube sayfası varsa ayarları ona anında gönder
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs[0] && tabs[0].url.includes("youtube.com")) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        type: "UPDATE_DOX_SETTINGS",
                        payload: settings
                    }).catch(() => { });
                }
            });
        });
    };

    // --- Olay Dinleyicileri (Event Listeners) ---

    // Kullanıcı dili değiştirdiğinde
    uiLang.addEventListener('change', (e) => {
        currentLang = e.target.value;
        updateTexts(); // Ekranda anında tr/en kelimelere geçiş yap
        saveSettings();
    });

    togglePlayer.addEventListener('change', saveSettings);

    subSize.addEventListener('input', (e) => {
        subSizeVal.textContent = e.target.value + 'px';
        saveSettings();
    });

    subDynamicSize.addEventListener('change', saveSettings);

    subFont.addEventListener('change', saveSettings);

    subWeight.addEventListener('input', (e) => {
        const val = e.target.value;
        subWeightVal.textContent = val;
        saveSettings();
    });

    subSpacing.addEventListener('input', (e) => {
        subSpacingVal.textContent = e.target.value + 'px';
        saveSettings();
    });

    subColor.addEventListener('input', saveSettings);
    subBgColor.addEventListener('input', saveSettings);

    subBgOpacity.addEventListener('input', (e) => {
        subBgOpacityVal.textContent = e.target.value + '%';
        saveSettings();
    });

    subStroke.addEventListener('change', saveSettings);
    subAlign.addEventListener('change', saveSettings);
    subLockX.addEventListener('change', saveSettings);

    const downloadSubBtn = document.getElementById('download-sub-btn');
    if (downloadSubBtn) {
        downloadSubBtn.addEventListener('click', () => {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs[0] && tabs[0].url.includes("youtube.com")) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        type: "DOWNLOAD_SUBTITLE_MANUAL"
                    }).catch(() => {
                        alert(currentLang === 'tr' ? "Lütfen YouTube sayfasını yenileyin ve tekrar deneyin." : "Please refresh the YouTube page and try again.");
                    });
                } else {
                    alert(currentLang === 'tr' ? "Lütfen bir YouTube video sayfasına gidin." : "Please navigate to a YouTube video page.");
                }
            });
        });
    }

    const downloadCleanSubBtn = document.getElementById('download-clean-sub-btn');
    if (downloadCleanSubBtn) {
        downloadCleanSubBtn.addEventListener('click', () => {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs[0] && tabs[0].url.includes("youtube.com")) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        type: "DOWNLOAD_SUBTITLE_CLEAN"
                    }).catch(() => {
                        alert(currentLang === 'tr' ? "Lütfen YouTube sayfasını yenileyin ve tekrar deneyin." : "Please refresh the YouTube page and try again.");
                    });
                } else {
                    alert(currentLang === 'tr' ? "Lütfen bir YouTube video sayfasına gidin." : "Please navigate to a YouTube video page.");
                }
            });
        });
    }
});
