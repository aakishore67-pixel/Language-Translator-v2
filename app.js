
    // Voice Recognition Setup
    let recognition;
    let isListening = false;
    let speechSynthesis = window.speechSynthesis;
    let currentUtterance = null;

    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onstart = function() {
        isListening = true;
        const voiceBtn = document.getElementById('voiceBtn');
        voiceBtn.classList.add('listening');
        voiceBtn.innerText = '🔴 Listening...';
        document.getElementById('output').innerText = 'Listening... Speak now!';
      };
      
      recognition.onresult = function(event) {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        const currentText = document.getElementById('inputText').value;
        document.getElementById('inputText').value = currentText + finalTranscript;
        
        if (interimTranscript) {
          document.getElementById('output').innerText = 'Recognizing: ' + interimTranscript;
        }
      };
      
      recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        document.getElementById('output').innerText = 'Error: ' + event.error;
        stopVoiceRecognition();
      };
      
      recognition.onend = function() {
        if (isListening) {
          document.getElementById('output').innerText = 'Voice input stopped. Click "Translate" to continue.';
        }
        stopVoiceRecognition();
      };
    }

    function toggleVoiceRecognition() {
      if (!recognition) {
        document.getElementById('output').innerText = 'Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.';
        return;
      }
      
      if (isListening) {
        stopVoiceRecognition();
      } else {
        startVoiceRecognition();
      }
    }

    function startVoiceRecognition() {
      const sourceLang = document.getElementById('sourceLang').value;
      recognition.lang = getLanguageCode(sourceLang);
      recognition.start();
    }

    function stopVoiceRecognition() {
      if (recognition && isListening) {
        recognition.stop();
        isListening = false;
        const voiceBtn = document.getElementById('voiceBtn');
        voiceBtn.classList.remove('listening');
        voiceBtn.innerText = '🎤 Start Voice Input';
      }
    }

    function getLanguageCode(lang) {
      const langCodes = {
        'en': 'en-US',
        'ta': 'ta-IN',
        'te': 'te-IN',
        'ml': 'ml-IN',
        'hi': 'hi-IN',
        'pa': 'pa-IN',
        'ur': 'ur-PK',
        'ar': 'ar-SA',
        'de': 'de-DE',
        'fr': 'fr-FR',
        'es': 'es-ES'
      };
      return langCodes[lang] || 'en-US';
    }

    // Handle file upload
    async function handleFileUpload(event) {
      const file = event.target.files[0];
      const outputDiv = document.getElementById('output');
      
      if (!file) return;

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        outputDiv.innerText = 'File is too large. Maximum size is 5MB.';
        return;
      }

      const reader = new FileReader();
      
      reader.onload = function(e) {
        const content = e.target.result;
        
        // Handle .txt files
        if (file.name.endsWith('.txt')) {
          document.getElementById('inputText').value = content;
          outputDiv.innerText = 'File loaded successfully! Click "Translate" to continue.';
        } else {
          outputDiv.innerText = 'Please upload a .txt file.';
        }
      };

      reader.onerror = function() {
        outputDiv.innerText = 'Error reading file. Please try again.';
      };

      // Read file as text
      if (file.name.endsWith('.txt')) {
        reader.readAsText(file);
      }
    }

    async function translateText() {
      const text = document.getElementById('inputText').value;
      const source = document.getElementById('sourceLang').value;
      const target = document.getElementById('targetLang').value;
      const outputDiv = document.getElementById('output');

      // Validate input
      if (!text.trim()) {
        outputDiv.innerText = 'Please enter text to translate';
        return;
      }

      if (source === target) {
        outputDiv.innerText = 'Source and target languages are the same!';
        return;
      }

      // Show loading message
      outputDiv.innerText = 'Translating...';

      try {
        const response = await fetch(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`
        );
        
        if (!response.ok) {
          throw new Error('Translation failed');
        }

        const result = await response.json();
        const translated = result[0].map(item => item[0]).join('');
        outputDiv.innerText = translated;
        
        // Show the speak button after successful translation
        if (translated) {
          document.getElementById('speakBtn').style.display = 'inline-block';
        }
      } catch (error) {
        outputDiv.innerText = 'Error: Unable to translate. Please try again.';
        console.error('Translation error:', error);
        document.getElementById('speakBtn').style.display = 'none';
      }
    }

    // Text-to-Speech Function
    function speakTranslatedText() {
      const translatedText = document.getElementById('output').innerText;
      const targetLang = document.getElementById('targetLang').value;
      const speakBtn = document.getElementById('speakBtn');
      
      // Check if browser supports speech synthesis
      if (!speechSynthesis) {
        alert('Text-to-speech is not supported in your browser.');
        return;
      }
      
      // If already speaking, stop it
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
        speakBtn.classList.remove('speaking');
        speakBtn.innerText = '🔊 Read Aloud';
        return;
      }
      
      // Check if there's text to speak
      if (!translatedText || translatedText.includes('Error') || translatedText.includes('Please enter') || translatedText.includes('Translating')) {
        alert('No translated text to read!');
        return;
      }
      
      // Cancel any ongoing speech first
      speechSynthesis.cancel();
      
      // Longer delay to ensure proper initialization
      setTimeout(() => {
        // Create speech utterance
        currentUtterance = new SpeechSynthesisUtterance(translatedText);
        
        // Set language
        const langCode = getSpeechLanguageCode(targetLang);
        currentUtterance.lang = langCode;
        currentUtterance.rate = 0.9;
        currentUtterance.pitch = 1;
        currentUtterance.volume = 1;
        
        // Update button immediately
        speakBtn.classList.add('speaking');
        speakBtn.innerText = '⏸️ Stop Reading';
        
        // Load voices and select appropriate one
        let voices = speechSynthesis.getVoices();
        
        // If voices not loaded yet, wait for them
        if (voices.length === 0) {
          speechSynthesis.onvoiceschanged = () => {
            voices = speechSynthesis.getVoices();
            selectVoiceAndSpeak(voices, langCode, translatedText, speakBtn);
          };
          // Trigger getVoices again to force load
          setTimeout(() => {
            voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
              selectVoiceAndSpeak(voices, langCode, translatedText, speakBtn);
            }
          }, 100);
        } else {
          selectVoiceAndSpeak(voices, langCode, translatedText, speakBtn);
        }
      }, 200);
    }

    // Helper function to select voice and speak
    function selectVoiceAndSpeak(voices, langCode, text, speakBtn) {
      console.log('Available voices:', voices.length);
      console.log('Looking for language:', langCode);
      
      // Special handling for Indian and other languages
      let selectedVoice;
      const langPrefix = langCode.split('-')[0];
      
      // Try multiple ways to find the appropriate voice
      selectedVoice = voices.find(voice => voice.lang === langCode) ||
                     voices.find(voice => voice.lang.startsWith(langPrefix)) ||
                     voices.find(voice => voice.lang.includes(langPrefix)) ||
                     voices.find(voice => voice.name.toLowerCase().includes(langPrefix));
      
      if (!selectedVoice) {
        console.warn(`No ${langPrefix} voice found. Will use default voice.`);
        
        // Language names for better error messages
        const languageNames = {
          'ta': 'Tamil',
          'te': 'Telugu',
          'ml': 'Malayalam',
          'hi': 'Hindi',
          'pa': 'Punjabi',
          'ur': 'Urdu',
          'ar': 'Arabic',
          'de': 'German',
          'fr': 'French',
          'es': 'Spanish'
        };
        
        const langName = languageNames[langPrefix] || langPrefix;
        
        alert(`${langName} voice not available on your device. Using default voice.\n\nTo get ${langName} voice:\n• Windows: Settings > Time & Language > Language > Add ${langName}\n• Mac: System Preferences > Accessibility > Speech > System Voice > Customize\n• Android/iOS: Settings > Language & Input > Text-to-speech\n• Try using Chrome for better language support`);
      } else {
        console.log('Voice found:', selectedVoice.name, selectedVoice.lang);
      }
      
      // If still no match, use default voice
      if (!selectedVoice && voices.length > 0) {
        selectedVoice = voices[0];
        console.log('Using default voice:', selectedVoice.name);
      }
      
      // Create new utterance with selected voice
      currentUtterance = new SpeechSynthesisUtterance(text);
      currentUtterance.lang = langCode;
      
      if (selectedVoice) {
        currentUtterance.voice = selectedVoice;
        console.log('Selected voice:', selectedVoice.name, selectedVoice.lang);
      }
      
      // Adjust speech rate for different languages (Indian languages benefit from slower rate)
      const indianLangs = ['ta', 'te', 'ml', 'hi', 'pa', 'ur'];
      if (indianLangs.includes(langPrefix)) {
        currentUtterance.rate = 0.8;
      } else if (langPrefix === 'ar') {
        currentUtterance.rate = 0.85;
      } else {
        currentUtterance.rate = 0.9;
      }
      
      currentUtterance.pitch = 1;
      currentUtterance.volume = 1;
      
      // Update button while speaking
      speakBtn.classList.add('speaking');
      speakBtn.innerText = '⏸️ Stop Reading';
      
      // Event handlers
      currentUtterance.onstart = function() {
        console.log('Speech started successfully');
      };
      
      currentUtterance.onend = function() {
        console.log('Speech ended');
        speakBtn.classList.remove('speaking');
        speakBtn.innerText = '🔊 Read Aloud';
      };
      
      currentUtterance.onerror = function(event) {
        console.error('Speech synthesis error:', event.error);
        speakBtn.classList.remove('speaking');
        speakBtn.innerText = '🔊 Read Aloud';
        
        if (event.error === 'not-allowed') {
          alert('Speech was blocked. Please allow audio playback in your browser settings.');
        } else if (event.error === 'audio-busy') {
          alert('Audio is busy. Please wait and try again.');
        } else if (event.error === 'not-supported' || event.error === 'language-unavailable') {
          alert('Voice is not available on your device.\n\nTo add more voices:\n• Windows: Settings > Time & Language > Language\n• Mac: System Preferences > Accessibility > Speech\n• Try using Chrome browser for better language support');
        } else {
          alert('Error reading text: ' + event.error + '. Try refreshing the page.');
        }
      };
      
      // Speak the text
      console.log('Starting speech synthesis...');
      speechSynthesis.speak(currentUtterance);
      
      // Debug: Check if speaking started
      setTimeout(() => {
        if (!speechSynthesis.speaking) {
          console.error('Speech did not start!');
          speakBtn.classList.remove('speaking');
          speakBtn.innerText = '🔊 Read Aloud';
          
          // Show available voices for debugging
          console.log('All available voices:');
          voices.forEach(voice => {
            console.log(`- ${voice.name} (${voice.lang})`);
          });
        } else {
          console.log('Speech is active');
        }
      }, 500);
    }

    // Get speech synthesis language code
    function getSpeechLanguageCode(lang) {
      const speechLangCodes = {
        'en': 'en-US',
        'ta': 'ta-IN',
        'te': 'te-IN',
        'ml': 'ml-IN',
        'hi': 'hi-IN',
        'pa': 'pa-IN',
        'ur': 'ur-PK',
        'ar': 'ar-SA',
        'de': 'de-DE',
        'fr': 'fr-FR',
        'es': 'es-ES'
      };
      return speechLangCodes[lang] || 'en-US';
    }

    // Check available voices on page load
    window.addEventListener('load', function() {
      if (speechSynthesis) {
        // Wait a bit for voices to load
        setTimeout(() => {
          const voices = speechSynthesis.getVoices();
          console.log('Total voices available:', voices.length);
          
          // Check for Indian languages
          const indianLangs = ['ta', 'te', 'ml', 'hi', 'pa', 'ur'];
          const availableIndianLangs = [];
          
          indianLangs.forEach(lang => {
            const found = voices.find(voice => voice.lang.includes(lang));
            if (found) {
              availableIndianLangs.push(found.lang);
              console.log(`${lang.toUpperCase()} voice found: ${found.name}`);
            } else {
              console.warn(`${lang.toUpperCase()} voice not found`);
            }
          });
          
          // Check for Arabic and German
          const arabicVoice = voices.find(voice => voice.lang.includes('ar'));
          const germanVoice = voices.find(voice => voice.lang.includes('de'));
          
          if (arabicVoice) console.log('Arabic voice found:', arabicVoice.name);
          else console.warn('Arabic voice not found');
          
          if (germanVoice) console.log('German voice found:', germanVoice.name);
          else console.warn('German voice not found');
          
        }, 1000);
      }
    });
