class Cart {
    constructor(updateUICallback) {
        this.items = [];
        this.updateUI = updateUICallback;
    }

    addItem(item) {
        // Simple logic: Add item.
        // In a real NLP, we would handle "remove burger" vs "add burger".
        // Here, we might need to be careful not to spam add if the user repeats the sentence.
        // We will rely on unique IDs or timestamps if needed, but for now simple push.

        // Check if we just added this item (debounce)
        if (lastItem && lastItem.id === item.id && (now - lastItem.timestamp < 5000)) {
            // Skip if added same item less than 5 seconds ago (prevents echo/buffer duplicates)
            return;
        }

        this.items.push({ ...item, timestamp: Date.now() });
        this.updateUI(this.items);
    }

    getTotal() {
        return this.items.reduce((sum, item) => sum + item.price, 0).toFixed(2);
    }

    clear() {
        this.items = [];
        this.updateUI(this.items);
    }
}
