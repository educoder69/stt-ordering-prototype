class SpeechHandler {
    constructor(onResult, onEnd, onError) {
        // Check browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.error("Speech Recognition API not supported in this browser.");
            alert("Sorry, your browser doesn't support voice recognition. Try Chrome or Edge.");
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true; // Keep listening
        this.recognition.interimResults = true; // Show results while speaking
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            onResult(finalTranscript, interimTranscript);
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            if (onError) onError(event.error);
        };

        this.recognition.onend = () => {
            if (onEnd) onEnd();
        };

        this.isListening = false;
    }

    start() {
        if (this.isListening) return;
        try {
            this.recognition.start();
            this.isListening = true;
        } catch (e) {
            console.error(e);
        }
    }

    stop() {
        if (!this.isListening) return;
        this.recognition.stop();
        this.isListening = false;
    }
}
