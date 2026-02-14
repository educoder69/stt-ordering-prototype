function matchIntent(text) {
    if (!text) return null;
    const lowerText = text.toLowerCase();

    // Simple verification: specific trigger words like "i want", "add", "order"
    // could be used to filter, but for this prototype, we'll scan for menu items constantly.

    const matches = [];

    menu.forEach(item => {
        // Check if any keyword of the item is present in the text
        const isMatch = item.keywords.some(keyword => lowerText.includes(keyword));
        if (isMatch) {
            matches.push(item);
        }
    });

    // New Logic: Check for "make it a meal" intent
    if (lowerText.includes("make it a meal") || lowerText.includes("add meal") || lowerText.includes("meal combo")) {
        // We return a special 'item' that represents the action
        matches.push({
            id: 'MEAL_UPGRADE',
            name: "Meal Upgrade",
            processed: false // flag to help app.js handle it differently
        });
    }

    return matches.length > 0 ? matches : null;
}
