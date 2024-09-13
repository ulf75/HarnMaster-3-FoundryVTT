export class HarnMasterCombat extends Combat {
    /**
     *
     * @override
     */
    async startCombat() {
        // Initially remove the Tactical Advantage flag
        await this.unsetFlag('hm3', 'TA');
        return super.startCombat();
    }

    /**
     * HarnMaster requires that we re-determine initiative each round, since penalties affecting
     * initiative may change during the course of combat.
     *
     * @override
     */
    async nextRound() {
        const combatantIds = this.combatants.map((c) => c.id);
        await this.rollInitiative(combatantIds);
        return super.nextRound();
    }

    /** @override */
    async nextTurn(postpone = 0) {
        if (postpone > 0) {
            setTimeout(async () => {
                // Remove the Tactical Advantage flag
                await this.unsetFlag('hm3', 'TA');
                return super.nextTurn();
            }, postpone);
        } else {
            // Remove the Tactical Advantage flag
            await this.unsetFlag('hm3', 'TA');
            return super.nextTurn();
        }
    }
}
