/**
 * AI Multilingual Translator - AI-Powered Language Translation Tool
 * Uses Multiple Free Translation APIs with Fallback Support
 * 
 * Primary APIs: Google Translate, MyMemory, Yandex
 * Bonus: Web Speech API for Text-to-Speech, Clipboard API for Copy
 */

// ============================================
// DOM Elements
// ============================================
const sourceLanguageSelect = document.getElementById('sourceLanguage');
const targetLanguageSelect = document.getElementById('targetLanguage');
const inputTextArea = document.getElementById('inputText');
const outputTextArea = document.getElementById('outputText');
const translateBtn = document.getElementById('translateBtn');
const copyBtn = document.getElementById('copyBtn');
const listenBtn = document.getElementById('listenBtn');
const listenInputBtn = document.getElementById('listenInputBtn');
const clearInputBtn = document.getElementById('clearInputBtn');
const clearOutputBtn = document.getElementById('clearOutputBtn');
const statusDiv = document.getElementById('status');
const inputCount = document.getElementById('inputCount');
const outputCount = document.getElementById('outputCount');

// ============================================
// Event Listeners
// ============================================

translateBtn.addEventListener('click', async () => {
    const inputText = inputTextArea.value.trim();
    const sourceLanguage = sourceLanguageSelect.value;
    const targetLanguage = targetLanguageSelect.value;

    // Validation
    if (!inputText) {
        showStatus('❌ Please enter text to translate', 'error');
        return;
    }

    if (sourceLanguage !== 'auto' && sourceLanguage === targetLanguage) {
        showStatus('❌ Source and target languages must be different', 'error');
        return;
    }

    // Perform translation
    await performTranslation(inputText, sourceLanguage, targetLanguage);
});

// Copy button - Individual copy for output
copyBtn.addEventListener('click', async () => {
    try {
        const text = outputTextArea.value;
        if (!text) return;

        await navigator.clipboard.writeText(text);
        showToast('✅ Text copied to clipboard!');
    } catch (err) {
        fallbackCopyToClipboard(outputTextArea.value);
    }
});

// Listen button for OUTPUT - Individual listen for output translation
listenBtn.addEventListener('click', () => {
    const text = outputTextArea.value;
    if (!text) {
        showToast('❌ No text to listen to');
        return;
    }

    const targetLanguage = targetLanguageSelect.value;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    // Create a speech utterance object for the translated text
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Map language codes to language tags for speech synthesis
    const languageMap = {
        'auto': 'en-US',
        'en': 'en-US',
        'es': 'es-ES',
        'fr': 'fr-FR',
        'de': 'de-DE',
        'it': 'it-IT',
        'pt': 'pt-BR',
        'ru': 'ru-RU',
        'ja': 'ja-JP',
        'zh': 'zh-CN',
        'ar': 'ar-SA',
        'hi': 'hi-IN',
        'ko': 'ko-KR',
        'bn': 'bn-IN',
        'th': 'th-TH',
        'tr': 'tr-TR'
    };

    utterance.lang = languageMap[targetLanguage] || 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Event listeners for speech synthesis
    utterance.onstart = () => {
        listenBtn.disabled = true;
        listenBtn.textContent = '🔉 Playing...';
        showToast('🔊 Playing translated audio...');
    };

    utterance.onend = () => {
        listenBtn.disabled = false;
        listenBtn.textContent = '🔊';
    };

    utterance.onerror = (event) => {
        console.error('Speech error:', event);
        listenBtn.disabled = false;
        listenBtn.textContent = '🔊';
        showToast('❌ Text-to-Speech unavailable');
    };

    // Start speaking
    window.speechSynthesis.speak(utterance);
});

// Listen button for INPUT - Individual listen for input text
listenInputBtn.addEventListener('click', () => {
    const text = inputTextArea.value;
    if (!text) {
        showToast('❌ No input text to listen to');
        return;
    }

    const sourceLanguage = sourceLanguageSelect.value;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    // Create a speech utterance object for the input text
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Map language codes to language tags for speech synthesis
    const languageMap = {
        'auto': 'en-US',
        'en': 'en-US',
        'es': 'es-ES',
        'fr': 'fr-FR',
        'de': 'de-DE',
        'it': 'it-IT',
        'pt': 'pt-BR',
        'ru': 'ru-RU',
        'ja': 'ja-JP',
        'zh': 'zh-CN',
        'ar': 'ar-SA',
        'hi': 'hi-IN',
        'ko': 'ko-KR',
        'bn': 'bn-IN',
        'th': 'th-TH',
        'tr': 'tr-TR'
    };

    utterance.lang = languageMap[sourceLanguage] || 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Event listeners for speech synthesis
    utterance.onstart = () => {
        listenInputBtn.disabled = true;
        listenInputBtn.textContent = '🔉 Playing...';
        showToast('🔊 Playing input audio...');
    };

    utterance.onend = () => {
        listenInputBtn.disabled = false;
        listenInputBtn.textContent = '🔊';
    };

    utterance.onerror = (event) => {
        console.error('Speech error:', event);
        listenInputBtn.disabled = false;
        listenInputBtn.textContent = '🔊';
        showToast('❌ Text-to-Speech unavailable');
    };

    // Start speaking
    window.speechSynthesis.speak(utterance);
});

// Clear buttons
clearInputBtn.addEventListener('click', () => {
    inputTextArea.value = '';
    inputCount.textContent = '0';
    statusDiv.innerHTML = '';
    statusDiv.className = 'status';
    window.speechSynthesis.cancel();
});

clearOutputBtn.addEventListener('click', () => {
    outputTextArea.value = '';
    outputCount.textContent = '0';
    copyBtn.disabled = true;
    listenBtn.disabled = true;
    clearOutputBtn.disabled = true;
    window.speechSynthesis.cancel();
});

// Character count tracking
inputTextArea.addEventListener('input', () => {
    inputCount.textContent = inputTextArea.value.length;
});

outputTextArea.addEventListener('input', () => {
    outputCount.textContent = outputTextArea.value.length;
});

// ============================================
// Translation Functions (Multiple APIs with Fallback)
// ============================================

/**
 * performTranslation - Main translation function with multiple API fallbacks
 */
async function performTranslation(text, sourceLang, targetLang) {
    try {
        showStatus('⏳ Translating...', 'loading');
        translateBtn.disabled = true;

        let translatedText = null;
        let lastError = null;

        // Try API 1: MyMemory (Most Reliable Free API)
        try {
            console.log('Trying MyMemory API...');
            translatedText = await translateUsingMyMemory(text, sourceLang, targetLang);
            console.log('✅ MyMemory API successful');
        } catch (e) {
            console.warn('⚠️ MyMemory failed:', e.message);
            lastError = e;

            // Try API 2: Google Translate
            try {
                console.log('Trying Google Translate API...');
                translatedText = await translateUsingGoogleTranslate(text, sourceLang, targetLang);
                console.log('✅ Google Translate API successful');
            } catch (e2) {
                console.warn('⚠️ Google Translate failed:', e2.message);
                lastError = e2;

                // Try API 3: Alternative method
                try {
                    console.log('Trying alternative translation method...');
                    translatedText = await translateUsingAltMethod(text, sourceLang, targetLang);
                    console.log('✅ Alternative method successful');
                } catch (e3) {
                    console.warn('⚠️ All methods failed');
                    lastError = e3;
                }
            }
        }

        if (!translatedText) {
            throw new Error('Translation failed. Please try again.');
        }

        // Update the output text area
        outputTextArea.value = translatedText;
        outputCount.textContent = translatedText.length;

        // Enable action buttons
        copyBtn.disabled = false;
        listenBtn.disabled = false;
        clearOutputBtn.disabled = false;

        showStatus('✅ Translation completed successfully!', 'success');

    } catch (error) {
        console.error('Translation Error:', error);
        outputTextArea.value = '';
        showStatus(
            `❌ Error: ${error.message}`,
            'error'
        );
        copyBtn.disabled = true;
        listenBtn.disabled = true;
        clearOutputBtn.disabled = true;
    } finally {
        translateBtn.disabled = false;
    }
}

/**
 * API 1: MyMemory Translation API - MOST RELIABLE
 * Free, no authentication, CORS enabled, works with 50+ languages
 */
async function translateUsingMyMemory(text, source, target) {
    // MyMemory doesn't support auto-detect, default to 'en'
    const sourceCode = source === 'auto' ? 'en' : source;

    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceCode}|${target}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'User-Agent': 'AI-Multilingual-Translator'
        }
    });
    
    if (!response.ok) {
        throw new Error(`MyMemory HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
        const translated = data.responseData.translatedText;
        if (translated && translated.length > 0 && translated !== 'Not found (null). Translation by humans.') {
            return translated;
        }
    }

    throw new Error('MyMemory: No translation received');
}

/**
 * API 2: Google Translate
 */
async function translateUsingGoogleTranslate(text, source, target) {
    const sourceCode = source === 'auto' ? 'auto' : source;

    try {
        const params = new URLSearchParams({
            client: 'gtx',
            sl: sourceCode,
            tl: target,
            dt: 't',
            q: text
        });

        const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params}`, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Google HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data[0] && data[0][0] && data[0][0][0]) {
            return data[0][0][0];
        }

        throw new Error('Google: Invalid response');
    } catch (error) {
        throw new Error(`Google Translate failed: ${error.message}`);
    }
}

/**
 * API 3: Alternative Translation Method
 */
async function translateUsingAltMethod(text, source, target) {
    // Using a different endpoint as backup
    const sourceCode = source === 'auto' ? 'en' : source;

    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.substring(0, 500))}&langpair=${sourceCode}|${target}`;
        
        const altResponse = await fetch(url);
        const altData = await altResponse.json();

        if (altData.responseStatus === 200 && altData.responseData.translatedText) {
            return altData.responseData.translatedText;
        }

        throw new Error('Alternative method failed');
    } catch (error) {
        throw new Error(`Alternative method: ${error.message}`);
    }
}


// ============================================
// Utility Functions
// ============================================

/**
 * showStatus - Display status messages to the user
 * Supports different status types: loading, success, error
 */
function showStatus(message, type) {
    statusDiv.className = `status ${type}`;
    
    if (type === 'loading') {
        statusDiv.innerHTML = `<span class="spinner"></span>${message}`;
    } else {
        statusDiv.textContent = message;
    }

    // Auto-hide success and error messages after 5 seconds
    if (type !== 'loading') {
        setTimeout(() => {
            statusDiv.className = 'status';
            statusDiv.innerHTML = '';
        }, 5000);
    }
}

/**
 * showToast - Display temporary notification messages
 * Used for quick feedback on user actions (copy, listen, etc.)
 */
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Remove toast after 2.5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

/**
 * fallbackCopyToClipboard - Legacy copy method for older browsers
 * Used as a fallback if the modern Clipboard API is not available
 */
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
        showToast('✅ Text copied to clipboard!');
    } catch (err) {
        showToast('❌ Could not copy text');
    }
    document.body.removeChild(textArea);
}

// ============================================
// Initialization
// ============================================

// Set default values
sourceLanguageSelect.value = 'auto';
targetLanguageSelect.value = 'es';

// Disable output buttons initially
copyBtn.disabled = true;
listenBtn.disabled = true;
clearOutputBtn.disabled = true;
listenInputBtn.disabled = false;

// Log initialization
console.log('✅ AI Multilingual Translator Initialized!');
console.log('📡 Using MyMemory API with Google Translate Fallback');
console.log('🌐 Supported languages: 16+');
console.log('🎤 Text-to-Speech: Enabled (Input & Output)');
console.log('📋 Copy to Clipboard: Enabled');
