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
const voiceInputBtn = document.getElementById('voiceInputBtn');
const clearInputBtn = document.getElementById('clearInputBtn');
const clearOutputBtn = document.getElementById('clearOutputBtn');
const swapBtn = document.getElementById('swapBtn');
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
        showStatus('Please enter text', 'error');
        return;
    }

    if (sourceLanguage !== 'auto' && sourceLanguage === targetLanguage) {
        showStatus('Languages must be different', 'error');
        return;
    }

    // Perform translation
    await performTranslation(inputText, sourceLanguage, targetLanguage);
});

// Swap languages functionality
swapBtn.addEventListener('click', () => {
    const sourceVal = sourceLanguageSelect.value;
    const targetVal = targetLanguageSelect.value;
    
    if (sourceVal === 'auto') {
        showToast('Cannot swap with Auto-Detect');
        return;
    }

    sourceLanguageSelect.value = targetVal;
    targetLanguageSelect.value = sourceVal;
    
    // Also swap text if available
    const inputVal = inputTextArea.value;
    const outputVal = outputTextArea.value;
    
    if (outputVal) {
        inputTextArea.value = outputVal;
        outputTextArea.value = inputVal;
        inputCount.textContent = inputTextArea.value.length;
        outputCount.textContent = outputTextArea.value.length;
    }

    // Trigger animation
    swapBtn.style.transform = 'rotate(180deg)';
    setTimeout(() => {
        swapBtn.style.transform = '';
    }, 200);
});

// Copy button - Individual copy for output
copyBtn.addEventListener('click', async () => {
    try {
        const text = outputTextArea.value;
        if (!text) return;

        await navigator.clipboard.writeText(text);
        showToast('Text copied to clipboard');
    } catch (err) {
        fallbackCopyToClipboard(outputTextArea.value);
    }
});

// Listen button for OUTPUT - Individual listen for output translation
listenBtn.addEventListener('click', () => {
    const text = outputTextArea.value;
    if (!text) {
        showToast('No text to listen to');
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
        'te': 'te-IN',
        'mr': 'mr-IN',
        'ta': 'ta-IN',
        'gu': 'gu-IN',
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
        showToast('Playing audio...');
    };

    utterance.onend = () => {
        listenBtn.disabled = false;
    };

    utterance.onerror = (event) => {
        console.error('Speech error:', event);
        listenBtn.disabled = false;
        showToast('Text-to-Speech unavailable');
    };

    // Start speaking
    window.speechSynthesis.speak(utterance);
});

// Listen button for INPUT - Individual listen for input text
listenInputBtn.addEventListener('click', () => {
    const text = inputTextArea.value;
    if (!text) {
        showToast('No input text to listen to');
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
        'te': 'te-IN',
        'mr': 'mr-IN',
        'ta': 'ta-IN',
        'gu': 'gu-IN',
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
        showToast('Playing input audio...');
    };

    utterance.onend = () => {
        listenInputBtn.disabled = false;
    };

    utterance.onerror = (event) => {
        console.error('Speech error:', event);
        listenInputBtn.disabled = false;
        showToast('Text-to-Speech unavailable');
    };

    // Start speaking
    window.speechSynthesis.speak(utterance);
});

// Clear buttons
clearInputBtn.addEventListener('click', () => {
    inputTextArea.value = '';
    inputCount.textContent = '0';
    statusDiv.innerHTML = '';
    statusDiv.className = 'status-indicator';
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
    listenInputBtn.disabled = inputTextArea.value.length === 0;
});

// ============================================
// Translation Functions (Multiple APIs with Fallback)
// ============================================

/**
 * performTranslation - Main translation function with multiple API fallbacks
 */
async function performTranslation(text, sourceLang, targetLang) {
    try {
        showStatus('Translating...', 'loading');
        translateBtn.disabled = true;

        let translatedText = null;

        // Try API 1: MyMemory
        try {
            translatedText = await translateUsingMyMemory(text, sourceLang, targetLang);
        } catch (e) {
            console.warn('MyMemory failed, trying Google...');
            // Try API 2: Google Translate
            try {
                translatedText = await translateUsingGoogleTranslate(text, sourceLang, targetLang);
            } catch (e2) {
                console.warn('Google failed, trying Alt...');
                // Try API 3: Alternative
                try {
                    translatedText = await translateUsingAltMethod(text, sourceLang, targetLang);
                } catch (e3) {
                    throw new Error('All translation methods failed');
                }
            }
        }

        if (!translatedText) {
            throw new Error('Translation failed');
        }

        // Update the output text area
        outputTextArea.value = translatedText;
        outputCount.textContent = translatedText.length;

        // Enable action buttons
        copyBtn.disabled = false;
        listenBtn.disabled = false;
        clearOutputBtn.disabled = false;

        showStatus('Translation complete', 'success');

    } catch (error) {
        console.error('Translation Error:', error);
        showStatus(error.message, 'error');
    } finally {
        translateBtn.disabled = false;
    }
}

/**
 * API 1: MyMemory Translation API
 */
async function translateUsingMyMemory(text, source, target) {
    const sourceCode = source === 'auto' ? 'en' : source;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceCode}|${target}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('MyMemory error');

    const data = await response.json();
    if (data.responseStatus === 200) {
        return data.responseData.translatedText;
    }
    throw new Error('MyMemory failed');
}

/**
 * API 2: Google Translate
 */
async function translateUsingGoogleTranslate(text, source, target) {
    const sl = source === 'auto' ? 'auto' : source;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Google error');

    const data = await response.json();
    if (data && data[0] && data[0][0] && data[0][0][0]) {
        return data[0][0][0];
    }
    throw new Error('Google failed');
}

/**
 * API 3: Alternative Translation Method
 */
async function translateUsingAltMethod(text, source, target) {
    const sourceCode = source === 'auto' ? 'en' : source;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.substring(0, 500))}&langpair=${sourceCode}|${target}`;
    
    const response = await fetch(url);
    const data = await response.json();
    if (data.responseStatus === 200) {
        return data.responseData.translatedText;
    }
    throw new Error('Alt method failed');
}


// ============================================
// Utility Functions
// ============================================

/**
 * showStatus - Display status messages
 */
function showStatus(message, type) {
    statusDiv.className = `status-indicator ${type}`;
    
    let icon = '';
    if (type === 'success') icon = '<i class="fas fa-check-circle"></i> ';
    if (type === 'error') icon = '<i class="fas fa-exclamation-circle"></i> ';
    
    if (type === 'loading') {
        statusDiv.innerHTML = message; // CSS handles spinner
    } else {
        statusDiv.innerHTML = `${icon}${message}`;
    }

    if (type !== 'loading') {
        setTimeout(() => {
            statusDiv.className = 'status-indicator';
            statusDiv.innerHTML = '';
        }, 3000);
    }
}

/**
 * showToast - Display temporary notification
 */
function showToast(message) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(1rem)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

/**
 * fallbackCopyToClipboard
 */
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        showToast('Copied to clipboard');
    } catch (err) {
        showToast('Copy failed');
    }
    document.body.removeChild(textArea);
}

// ============================================
// Initialization
// ============================================

sourceLanguageSelect.value = 'auto';
targetLanguageSelect.value = 'es';

copyBtn.disabled = true;
listenBtn.disabled = true;
clearOutputBtn.disabled = true;
listenInputBtn.disabled = true;

console.log('✅ WorldSpeakAI Initialized!');

console.log('📡 Using MyMemory API with Google Translate Fallback');
console.log('🌐 Supported languages: 16+');
console.log('🎤 Text-to-Speech: Enabled (Input & Output)');
console.log('📋 Copy to Clipboard: Enabled');

// ============================================
// Voice Input (Speech-to-Text)
// ============================================

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    voiceInputBtn.addEventListener('click', () => {
        const sourceLang = sourceLanguageSelect.value;
        // Map common codes to full locale for recognition
        const recognitionLangMap = {
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
            'te': 'te-IN',
            'mr': 'mr-IN',
            'ta': 'ta-IN',
            'gu': 'gu-IN',
            'th': 'th-TH',
            'tr': 'tr-TR'
        };

        recognition.lang = recognitionLangMap[sourceLang] || 'en-US';
        
        try {
            recognition.start();
            voiceInputBtn.classList.add('recording');
            showToast('🎙️ Listening... Speak now');
        } catch (err) {
            recognition.stop();
        }
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        inputTextArea.value = transcript;
        inputCount.textContent = transcript.length;
        listenInputBtn.disabled = false;
        
        showToast('✅ Voice captured!');
        
        // Auto-translate after a short delay
        setTimeout(() => {
            performTranslation(transcript, sourceLanguageSelect.value, targetLanguageSelect.value);
        }, 500);
    };

    recognition.onspeechend = () => {
        recognition.stop();
        voiceInputBtn.classList.remove('recording');
    };

    recognition.onerror = (event) => {
        voiceInputBtn.classList.remove('recording');
        console.error('Speech recognition error:', event.error);
        
        let errorMsg = 'Speech error: ' + event.error;
        
        if (event.error === 'no-speech') {
            errorMsg = '🎙️ No speech detected. Please try again.';
        } else if (event.error === 'not-allowed') {
            errorMsg = '❌ Microphone permission denied.';
        } else if (event.error === 'network') {
            errorMsg = '🌐 Network error during recognition.';
        }
        
        showToast(errorMsg);
    };

} else {
    voiceInputBtn.title = "Speech recognition not supported in this browser";
    voiceInputBtn.addEventListener('click', () => {
        showToast('❌ Voice input not supported in this browser');
    });
}

