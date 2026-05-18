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
    const subDistance = document.getElementById('sub-distance');
    const subDistanceVal = document.getElementById('sub-distance-val');
    const uiLang = document.getElementById('ui-lang');
    // Çeviri Ayarları Elementleri
    const toggleCeviri = document.getElementById('toggle-ceviri');
    const apiGeminiInput = document.getElementById('api-gemini');
    const apiGroqInput = document.getElementById('api-groq');
    const apiDeeplInput = document.getElementById('api-deepl');
    const chunkGeminiInput = document.getElementById('chunk-gemini');
    const chunkGroqInput = document.getElementById('chunk-groq');
    const chunkDeeplInput = document.getElementById('chunk-deepl');
    const promptGeminiInput = document.getElementById('prompt-gemini');
    const promptGroqInput = document.getElementById('prompt-groq');

    const aiModelSelect = document.getElementById('ai-model');
    const aiModeSelect = document.getElementById('ai-mode');

    const translationModes = [
        { code: "tr", name: "Türkçe Çevirisi" },
        { code: "en", name: "İngilizce Çevirisi" },
        { code: "de", name: "Almanca Çevirisi" },
        { code: "ru", name: "Rusça Çevirisi" },
        { code: "zh", name: "Çince Çevirisi" },
        { code: "ja", name: "Japonca Çevirisi" },
        { code: "fr", name: "Fransızca Çevirisi" },
        { code: "it", name: "İtalyanca Çevirisi" },
        { code: "az", name: "Azerbaycanca Çevirisi" },
        { code: "es", name: "İspanyolca Çevirisi" },
        { code: "uk", name: "Ukraynaca Çevirisi" },
        { code: "pt", name: "Portekizce Çevirisi" },
        { code: "none", name: "Sadece Özel Promptlar" }
    ];

    let deeplTargetLangs = [];
    let isFetchingDeepl = false;
    let deeplFetchError = false;
    let savedAiMode = null;

    const fetchDeeplLanguages = async (apiKey) => {
        if (!apiKey || apiKey.length < 5) {
            deeplTargetLangs = [];
            deeplFetchError = false;
            if (aiModelSelect && aiModelSelect.value.startsWith('DeepL')) updateAiModeOptions();
            return;
        }

        const cleanKey = apiKey.replace(/[^\x20-\x7E]/g, '').trim();
        const baseUrl = cleanKey.endsWith(':fx') ? 'https://api-free.deepl.com/v2' : 'https://api.deepl.com/v2';
        
        isFetchingDeepl = true;
        deeplFetchError = false;
        
        if (aiModelSelect && aiModelSelect.value.startsWith('DeepL')) {
            updateAiModeOptions();
        }

        try {
            const res = await fetch(`${baseUrl}/languages?type=target`, {
                headers: { 'Authorization': `DeepL-Auth-Key ${cleanKey}` }
            });
            if (res.ok) {
                const data = await res.json();
                deeplTargetLangs = data.map(l => ({ code: l.language, name: l.name }));
            } else {
                deeplTargetLangs = [];
                deeplFetchError = true;
            }
        } catch (e) {
            console.error("[Doxmaxima] DeepL dilleri çekilemedi", e);
            deeplTargetLangs = [];
            deeplFetchError = true;
        } finally {
            isFetchingDeepl = false;
            if (aiModelSelect && aiModelSelect.value.startsWith('DeepL')) {
                updateAiModeOptions();
            }
        }
    };

    const updateAiModeOptions = () => {
        if (!aiModelSelect || !aiModeSelect) return;
        
        const isDeepl = aiModelSelect.value.startsWith('DeepL');
        const currentValue = aiModeSelect.value;
        
        aiModeSelect.innerHTML = '';
        
        if (isDeepl) {
            if (isFetchingDeepl) {
                aiModeSelect.disabled = true;
                const optionEl = document.createElement('option');
                optionEl.value = "";
                optionEl.textContent = currentLang === 'tr' ? "Diller Yükleniyor..." : "Loading Languages...";
                aiModeSelect.appendChild(optionEl);
                return;
            }
            
            if (deeplFetchError || deeplTargetLangs.length === 0) {
                aiModeSelect.disabled = true;
                const optionEl = document.createElement('option');
                optionEl.value = "";
                optionEl.textContent = currentLang === 'tr' ? "API Anahtarı Eksik/Hatalı" : "API Key Error/Missing";
                aiModeSelect.appendChild(optionEl);
                return;
            }
        }
        
        // Eğer DeepL değilse veya DeepL yüklemesi başarılıysa aktif et
        aiModeSelect.disabled = false;
        const options = isDeepl ? deeplTargetLangs : translationModes;
        
        options.forEach(opt => {
            const optionEl = document.createElement('option');
            optionEl.value = opt.code;
            optionEl.textContent = opt.name;
            aiModeSelect.appendChild(optionEl);
        });
        
        // Önce kullanıcının kaydettiği dili (savedAiMode) veya o anki değeri kontrol et
        const targetValue = savedAiMode || currentValue;
        
        const hasOption = Array.from(aiModeSelect.options).some(o => o.value.toLowerCase() === targetValue.toLowerCase());
        if (hasOption) {
            aiModeSelect.value = isDeepl ? targetValue.toUpperCase() : targetValue.toLowerCase();
        }
    };

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
        subLockX: true,
        subDistance: 5,
        
        // Çeviri Ayarları
        ceviriEnabled: false,
        apiGemini: '',
        apiGroq: '',
        apiDeepl: '',
        chunkGemini: 400,
        chunkGroq: 100,
        chunkDeepl: 150,
        promptGemini: '',
        promptGroq: '',
        aiModel: 'gemini-3-flash-preview',
        aiMode: 'tr'
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
        
        if (subDistance) {
            subDistance.value = items.subDistance;
            subDistanceVal.textContent = items.subDistance + 'px';
        }

        // --- 3. Çeviri Ayarlarını Yükle ---
        if (toggleCeviri) toggleCeviri.checked = items.ceviriEnabled;
        if (apiGeminiInput) apiGeminiInput.value = items.apiGemini;
        if (apiGroqInput) apiGroqInput.value = items.apiGroq;
        if (apiDeeplInput) {
            apiDeeplInput.value = items.apiDeepl;
            fetchDeeplLanguages(items.apiDeepl); // DeepL dillerini API'den çek
        }
        if (chunkGeminiInput) chunkGeminiInput.value = items.chunkGemini;
        if (chunkGroqInput) chunkGroqInput.value = items.chunkGroq;
        if (chunkDeeplInput) chunkDeeplInput.value = items.chunkDeepl;
        if (promptGeminiInput) promptGeminiInput.value = items.promptGemini;
        if (promptGroqInput) promptGroqInput.value = items.promptGroq;

        if (aiModelSelect) {
            aiModelSelect.value = items.aiModel;
            updateAiModeOptions();
        }
        if (aiModeSelect) {
            const isDeepl = items.aiModel && items.aiModel.startsWith('DeepL');
            const targetVal = isDeepl ? items.aiMode.toUpperCase() : items.aiMode.toLowerCase();
            savedAiMode = targetVal;
            
            // Eğer seçenekler anında varsa hemen ayarla (örneğin Gemini için)
            if (Array.from(aiModeSelect.options).some(o => o.value === targetVal)) {
                aiModeSelect.value = targetVal;
            }
        }
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
            subLockX: subLockX.checked,
            subDistance: subDistance ? parseInt(subDistance.value) : 5,
            
            ceviriEnabled: toggleCeviri ? toggleCeviri.checked : false,
            apiGemini: apiGeminiInput ? apiGeminiInput.value : '',
            apiGroq: apiGroqInput ? apiGroqInput.value : '',
            apiDeepl: apiDeeplInput ? apiDeeplInput.value : '',
            chunkGemini: chunkGeminiInput ? parseInt(chunkGeminiInput.value) : 400,
            chunkGroq: chunkGroqInput ? parseInt(chunkGroqInput.value) : 100,
            chunkDeepl: chunkDeeplInput ? parseInt(chunkDeeplInput.value) : 150,
            promptGemini: promptGeminiInput ? promptGeminiInput.value : '',
            promptGroq: promptGroqInput ? promptGroqInput.value : '',
            aiModel: aiModelSelect ? aiModelSelect.value : 'gemini-3-flash-preview',
            aiMode: aiModeSelect ? aiModeSelect.value : 'tr'
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
    
    if (subDistance) {
        subDistance.addEventListener('input', (e) => {
            subDistanceVal.textContent = e.target.value + 'px';
            saveSettings();
        });
    }

    if (aiModelSelect) {
        aiModelSelect.addEventListener('change', () => {
            updateAiModeOptions();
            saveSettings();
        });
    }

    if (aiModeSelect) {
        aiModeSelect.addEventListener('change', () => {
            savedAiMode = aiModeSelect.value;
            saveSettings();
        });
    }
    
    // Çeviri Ayarları Kayıt Dinleyicileri
    if (toggleCeviri) toggleCeviri.addEventListener('change', saveSettings);
    if (apiGeminiInput) apiGeminiInput.addEventListener('input', saveSettings);
    if (apiGroqInput) apiGroqInput.addEventListener('input', saveSettings);
    
    let deeplDebounce;
    if (apiDeeplInput) {
        apiDeeplInput.addEventListener('input', (e) => {
            saveSettings();
            clearTimeout(deeplDebounce);
            deeplDebounce = setTimeout(() => {
                fetchDeeplLanguages(e.target.value);
            }, 1500);
        });
    }
    
    if (chunkGeminiInput) chunkGeminiInput.addEventListener('input', saveSettings);
    if (chunkGroqInput) chunkGroqInput.addEventListener('input', saveSettings);
    if (chunkDeeplInput) chunkDeeplInput.addEventListener('input', saveSettings);
    if (promptGeminiInput) promptGeminiInput.addEventListener('input', saveSettings);
    if (promptGroqInput) promptGroqInput.addEventListener('input', saveSettings);

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

    const downloadFilteredSubBtn = document.getElementById('download-filtered-sub-btn');
    if (downloadFilteredSubBtn) {
        downloadFilteredSubBtn.addEventListener('click', () => {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs[0] && tabs[0].url.includes("youtube.com")) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        type: "DOWNLOAD_SUBTITLE_FILTERED"
                    }).catch(() => {
                        alert(currentLang === 'tr' ? "Lütfen YouTube sayfasını yenileyin ve tekrar deneyin." : "Please refresh the YouTube page and try again.");
                    });
                } else {
                    alert(currentLang === 'tr' ? "Lütfen bir YouTube video sayfasına gidin." : "Please navigate to a YouTube video page.");
                }
            });
        });
    }

    const downloadTranslatedSubBtn = document.getElementById('download-translated-sub-btn');
    if (downloadTranslatedSubBtn) {
        downloadTranslatedSubBtn.addEventListener('click', () => {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs[0] && tabs[0].url.includes("youtube.com")) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        type: "DOWNLOAD_SUBTITLE_TRANSLATED"
                    }).catch(() => {
                        alert(currentLang === 'tr' ? "Lütfen YouTube sayfasını yenileyin ve tekrar deneyin." : "Please refresh the YouTube page and try again.");
                    });
                } else {
                    alert(currentLang === 'tr' ? "Lütfen bir YouTube video sayfasına gidin." : "Please navigate to a YouTube video page.");
                }
            });
        });
    }

    // Oynatıcıdaki (YouTube) butondan ayar değiştiğinde popup'ı anlık güncelle (Senkronizasyon)
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync' && changes.ceviriEnabled) {
            if (toggleCeviri) {
                toggleCeviri.checked = changes.ceviriEnabled.newValue;
            }
        }
    });
});
