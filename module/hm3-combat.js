export class CombatHM3 extends Combat {
    /**
     *
     * @override
     */
    async startCombat() {
        return (
            await Promise.allSettled([
                // Wait for the first outnumbered calculation
                new Promise((resolve) => {
                    let timer = setTimeout(() => resolve(), 3000);
                    Hooks.once('hm3.onOutnumbered', () => {
                        clearTimeout(timer);
                        resolve();
                    });
                }),
                // Remove the Tactical Advantage flag
                game.hm3.socket.executeAsGM('unsetTAFlag'),
                // Start the combat
                super.startCombat()
            ])
        )[2].value;
    }

    /**
     * HarnMaster requires that we re-determine initiative each round, since penalties affecting
     * initiative may change during the course of combat.
     *
     * @override
     */
    async nextRound() {
        // Berserk is a special state of battle frenzy. Any character who enters this mode must take the most
        // aggressive action available for Attack or Defense, adding 20 to EML to Attack or Counterstrike.
        // Further Initiative rolls are ignored until the battle ends. (COMBAT 16)
        const combatantIds = this.combatants
            .filter((c) => !c.token?.hasCondition(game.hm3.Condition.BERSERK))
            .map((c) => c.id);
        await this.rollInitiative(combatantIds);
        return super.nextRound();
    }

    /** @override */
    async nextTurn(tokenId = 'true') {
        if (!game.combat?.started) return;
        return game.hm3.combatMutex.runExclusive(async () => {
            if (game.combat?.started && (tokenId === 'true' || tokenId === game.combat.combatant?.token?.id)) {
                // Remove the Tactical Advantage flag
                await game.hm3.socket.executeAsGM('unsetTAFlag');
                return super.nextTurn();
            }
        });
    }
}
