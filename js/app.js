// Imports removed for file:// compatibility
// Dependencies are now loaded globally via <script> tags in index.html


// DOM Elements
const greetingOverlay = document.getElementById('greeting-overlay');
const startBtn = document.getElementById('start-btn');
const mainInterface = document.getElementById('main-interface');
const micTrigger = document.getElementById('mic-trigger');
const liveTranscript = document.getElementById('live-transcript');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const paymentOverlay = document.getElementById('payment-overlay');
const paymentTotalEl = document.getElementById('payment-total');
const cancelPaymentBtn = document.getElementById('cancel-payment-btn');
const listeningIndicator = document.getElementById('listening-indicator');

// Icons
lucide.createIcons();

// State
let isListening = false;
let lastProcessedLength = 0; // To avoid reprocessing the same text part
// Payment Timer
let paymentTimer = null;

// Initialize Cart
const cart = new Cart((items) => {
    renderCart(items);
    checkUpsell(items);
});

// Initialize Upsell Engine
const upsellEngine = new UpsellEngine(menu);
const upsellContainer = document.getElementById('upsell-container');

// Speech Handler
const speech = new SpeechHandler(
    (final, interim) => {
        handleSpeechResult(final, interim);
    },
    () => {
        // On End
        if (isListening) speech.start(); // Restart if supposed to be listening
    },
    (err) => {
        console.error("Speech Error:", err);
    }
);

// Event Listeners
startBtn.addEventListener('click', () => {
    cart.clear(); // Ensure cart is empty at the beginning
    greetingOverlay.classList.remove('active');
    setTimeout(() => {
        greetingOverlay.classList.add('hidden');
        mainInterface.classList.remove('hidden');
        startListening();
    }, 500);
});

micTrigger.addEventListener('click', () => {
    toggleListening();
});

checkoutBtn.addEventListener('click', () => {
    // Reset UI state first (restore original content structure or just update values)
    // Since we are replacing the innerHTML to show success later, we need to ensure it's reset when clicking checkout again.
    const paymentCard = paymentOverlay.querySelector('.payment-card');
    paymentCard.innerHTML = `
        <h2>Scan to Pay</h2>
        <div class="qr-placeholder">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=VoiceEatsPayment"
                alt="Payment QR Code">
        </div>
        <p>Total: <span id="payment-total">$${cart.getTotal()}</span></p>
        <button id="cancel-payment-btn" class="secondary-btn">Cancel</button>
    `;

    // Re-attach cancel listener since we overwrote the HTML
    document.getElementById('cancel-payment-btn').addEventListener('click', () => {
        // closePaymentOverlay();
        // closePaymentOverlay();
        // location.reload();
        resetApp();
    });

    paymentOverlay.classList.remove('hidden');
    setTimeout(() => paymentOverlay.classList.add('active'), 10);

    // Start Payment Success Flow
    if (paymentTimer) clearTimeout(paymentTimer);

    // 1. Wait 10 seconds
    paymentTimer = setTimeout(() => {
        // 2. Show Payment Received
        showPaymentSuccess();

        // 3. Wait another 5 seconds then close/refresh
        // 3. Wait another 5 seconds then close/refresh
        paymentTimer = setTimeout(() => {
            // cart.clear(); // Reset cart
            // closePaymentOverlay();
            // location.reload();
            resetApp();
        }, 5000);

    }, 10000);
});

cancelPaymentBtn.addEventListener('click', () => {
    // closePaymentOverlay();
    // Refresh page as per requirement
    // closePaymentOverlay();
    // Refresh page as per requirement
    // location.reload();
    resetApp();
});

function showPaymentSuccess() {
    // Generate random ticket number (100-999)
    const ticketNum = Math.floor(Math.random() * 900) + 100;

    const paymentCard = paymentOverlay.querySelector('.payment-card');
    paymentCard.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <i data-lucide="check-circle" style="width: 64px; height: 64px; color: #10b981; margin-bottom: 1rem;"></i>
            <h2>Payment Received!</h2>
            <p>Thank you for your order.</p>
            <div style="margin-top: 2rem; padding: 1rem; background: rgba(255,255,255,0.1); border-radius: 12px;">
                <p style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 0.5rem">Collection Number</p>
                <h1 style="font-size: 3rem; color: #10b981; margin: 0">#${ticketNum}</h1>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function closePaymentOverlay() {
    if (paymentTimer) {
        clearTimeout(paymentTimer);
        paymentTimer = null;
    }
    paymentOverlay.classList.remove('active');
    setTimeout(() => paymentOverlay.classList.add('hidden'), 500);
}

// Functions

function startListening() {
    isListening = true;
    micTrigger.classList.add('items-listening');
    listeningIndicator.classList.remove('hidden');
    speech.start();
    liveTranscript.textContent = "Listening...";
}

function stopListening() {
    isListening = false;
    micTrigger.classList.remove('items-listening');
    listeningIndicator.classList.add('hidden');
    speech.stop();
    liveTranscript.textContent = "Tap mic to start";
}

function toggleListening() {
    if (isListening) stopListening();
    else startListening();
}

function handleSpeechResult(final, interim) {
    // Check pause/ignore state first
    if (Date.now() < ignoreSpeechUntil) {
        liveTranscript.textContent = "";
        return;
    }

    const fullText = final + interim;
    liveTranscript.textContent = fullText || "Listening...";

    // Only process if we have text
    if (fullText.length > 0) {
        // 1. Check if we are waiting for an answer to an upsell

        // 1. Check if we are waiting for an answer to an upsell
        if (pendingUpsell) {
            // Add a guard to prevent rapid re-processing if we just answered
            const now = Date.now();
            if (now - lastUpsellAnswerTime < 2000) return;

            const answer = checkYesNo(fullText);
            if (answer === 'yes') {
                lastUpsellAnswerTime = now;
                // Add meal items CHECK IF ALREADY ADDED to be safe
                const fries = menu.find(m => m.id === 2);
                const coke = menu.find(m => m.id === 6);

                // Double check we didn't just add them
                if (!isRecentlyAdded(2) && fries) cart.addItem(fries);
                if (!isRecentlyAdded(6) && coke) cart.addItem(coke);

                speak("Great! I have updated your order.");

                // Explicitly hide upsell immediately
                hideUpsell();

                pendingUpsell = false;
                upsellSuppressed = true;

                // Stop listening briefly to clear buffer/echo
                speech.stop();
                ignoreSpeechUntil = Date.now() + 2000;

                // Clear transcript to indicate new "session"
                liveTranscript.textContent = "";

            } else if (answer === 'no') {
                lastUpsellAnswerTime = now;
                speak("Okay, just the spicy burger then.");

                // Explicitly hide upsell
                hideUpsell();

                pendingUpsell = false;
                upsellSuppressed = true;

                // Stop listening briefly to clear buffer/echo/residual "No"
                speech.stop();
                ignoreSpeechUntil = Date.now() + 2000;

                // Clear transcript
                liveTranscript.textContent = "";

                // DO NOT call checkUpsell here, as it would just show the prompt again
            }
            // If neither, we might be hearing the rest of the sentence or noise. 
            // We'll block other intents while waiting, OR we could allow them and cancel upsell.
            // For this specific requirement, we'll confirm strictly.
            return;
        }

        // 2. Normal Intent Matching
        const matches = matchIntent(fullText);
        if (matches) {
            matches.forEach(item => {
                if (item.id === 'MEAL_UPGRADE') {
                    handleMealUpgrade();
                } else {
                    // Check for Spicy Burger specifically to trigger interaction
                    if (item.id === 1) { // Spicy Burger ID
                        // Check if we just added it to avoid loops
                        if (!isRecentlyAdded(item.id)) {
                            cart.addItem(item);
                            // Trigger Interactive Upsell
                            startInteractiveUpsell();
                        }
                    } else {
                        cart.addItem(item);
                    }
                }
            });
        }
    }
}

let pendingUpsell = false;
let upsellSuppressed = false;
let lastUpsellTime = 0;
let lastUpsellAnswerTime = 0;
let ignoreSpeechUntil = 0;

function startInteractiveUpsell() {
    // Debounce the prompt itself
    const now = Date.now();
    if (now - lastUpsellTime < 10000) return; // Don't ask too often
    lastUpsellTime = now;

    pendingUpsell = true;
    speak("Would you like to make it a meal with Coke and Fries?");

    // Visual cue
    const upsellContainer = document.getElementById('upsell-container');
    if (upsellContainer) {
        upsellContainer.innerHTML = `
            <div class="upsell-box glass-panel active-prompt">
                <div class="upsell-text">Make it a meal? (Say Yes/No)</div>
            </div>
        `;
        upsellContainer.classList.remove('hidden');
    }
}

function checkYesNo(text) {
    const lower = text.toLowerCase();
    // We typically want to check the *end* of the string if it's accumulating,
    // or just presence if it's short.
    // Let's check for specific keywords associated with yes/no.
    if (lower.includes('yes') || lower.includes('yeah') || lower.includes('sure') || lower.includes('please')) return 'yes';
    if (lower.includes('no') || lower.includes('nope') || lower.includes('nah')) return 'no';
    return null;
}

// Helper to check if item was recently added to avoid re-triggering on same phrase
// Helper to check if item was recently added to avoid re-triggering on same phrase
function isRecentlyAdded(id) {
    // Check last 5 items to be safe against interleaved adds
    const now = Date.now();
    const recentItems = cart.items.slice(-5);

    return recentItems.some(item => {
        return item.id === id && (now - item.timestamp < 3000);
    });
}

function renderCart(items) {
    cartItemsContainer.innerHTML = '';

    if (items.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Cart is empty</div>';
        checkoutBtn.disabled = true;
    } else {
        items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'cart-item';
            el.innerHTML = `
                <div class="cart-item-info">
                    <strong>${item.name}</strong>
                    <span>$${item.price.toFixed(2)}</span>
                </div>
                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
            `;
            cartItemsContainer.appendChild(el);
        });
        checkoutBtn.disabled = false;
    }

    cartTotalEl.textContent = `$${cart.getTotal()}`;
}

function checkUpsell(items) {
    if (upsellSuppressed) {
        hideUpsell();
        return;
    }
    const suggestion = upsellEngine.getSuggestion(items);
    if (suggestion) {
        showUpsell(suggestion);
    } else {
        hideUpsell();
    }
}

function showUpsell(suggestion) {
    if (!upsellContainer) return; // Guard clause
    upsellContainer.innerHTML = `
        <div class="upsell-box glass-panel">
            <div class="upsell-text">${suggestion.text}</div>
            <button id="upsell-btn" class="glass-btn-sm">Yes, please</button>
        </div>
    `;
    upsellContainer.classList.remove('hidden');

    // Add listener to button
    document.getElementById('upsell-btn').addEventListener('click', () => {
        handleMealUpgrade();
    });
}

function hideUpsell() {
    if (upsellContainer) {
        upsellContainer.classList.add('hidden');
        upsellContainer.innerHTML = '';
    }
}

function handleMealUpgrade() {
    const currentItems = cart.items;
    const suggestion = upsellEngine.getSuggestion(currentItems);

    if (suggestion && suggestion.recommendedIds) {
        suggestion.recommendedIds.forEach(id => {
            const itemToAdd = menu.find(m => m.id === id);
            if (itemToAdd) {
                cart.addItem(itemToAdd);
            }
        });
        // Provide audio feedback
        speak("Great!");
    }
}

// Simple TTS mock for feedback
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
}
function resetApp() {
    // 1. Reset State
    isListening = false;
    pendingUpsell = false;
    upsellSuppressed = false;
    lastUpsellTime = 0;
    lastUpsellAnswerTime = 0;
    ignoreSpeechUntil = 0;
    if (paymentTimer) {
        clearTimeout(paymentTimer);
        paymentTimer = null;
    }

    // 2. Reset Cart
    cart.clear();

    // 3. Stop Speech
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    speech.stop();
    micTrigger.classList.remove('items-listening');
    listeningIndicator.classList.add('hidden');
    liveTranscript.textContent = "Tap mic to start";

    // 4. Reset UI
    // Hide Payment
    paymentOverlay.classList.remove('active');
    setTimeout(() => paymentOverlay.classList.add('hidden'), 500);

    // Hide Upsell
    hideUpsell();

    // Show Greeting
    mainInterface.classList.add('hidden');
    greetingOverlay.classList.remove('hidden');
    // Force reflow
    void greetingOverlay.offsetWidth;
    greetingOverlay.classList.add('active');
}
