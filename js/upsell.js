class UpsellEngine {
    constructor(menu) {
        this.menu = menu;
    }

    getSuggestion(cartItems) {
        // 1. Check if we have a "main" item but are missing "drink" or "side"
        const hasMain = cartItems.some(item => item.category === 'main');
        const hasDrink = cartItems.some(item => item.category === 'drink');
        const hasSide = cartItems.some(item => item.category === 'side');

        if (hasMain && (!hasDrink || !hasSide)) {
            // Recommendation: Make it a meal
            // Specific items: Coke (id 6) and Truffle Fries (id 2)
            // ideally we'd pick based on best pairings, but hardcoded for now as per plan

            const missing = [];
            const recommendedIds = [];

            if (!hasDrink) {
                missing.push('drink');
                recommendedIds.push(6); // Coke
            }
            if (!hasSide) {
                missing.push('side');
                recommendedIds.push(2); // Truffle Fries
            }

            // Only suggest if we have missing items
            if (missing.length > 0) {
                return {
                    type: 'meal_upgrade',
                    text: "Make it a meal? (Add Coke & Fries)",
                    missingCategories: missing,
                    recommendedIds: recommendedIds
                };
            }
        }

        return null;
    }
}
