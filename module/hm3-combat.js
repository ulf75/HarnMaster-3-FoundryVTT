export class HarnMasterCombat extends Combat {
    /**
     *
     * @override
     */
    async startCombat() {
        // Initially remove the Tactical Advantage flag
        await game.hm3.socket.executeAsGM('unsetTAFlag');
        return super.startCombat();
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
        const combatantIds = this.combatants.filter((c) => !c.token.hasCondition(game.hm3.Condition.BERSERK)).map((c) => c.id);
        await this.rollInitiative(combatantIds);
        return super.nextRound();
    }

    /** @override */
    async rollInitiative(combatantIds) {
        if (game.settings.get('hm3', 'autoMarkUsedSkills')) {
            combatantIds.forEach((id) => {
                const combatant = this.combatants.get(id);
                combatant.actor.items.forEach((item) => {
                    if (item.name === 'Initiative' && !item.system.improveFlag) {
                        item.update({'system.improveFlag': true});
                    }
                });
            });
        }

        return super.rollInitiative(combatantIds);
    }

    /** @override */
    async nextTurn(postpone = 0) {
        if (postpone > 0) {
            setTimeout(async () => {
                // Remove the Tactical Advantage flag
                await game.hm3.socket.executeAsGM('unsetTAFlag');
                await super.nextTurn();
            }, postpone);
        } else {
            // Remove the Tactical Advantage flag
            await game.hm3.socket.executeAsGM('unsetTAFlag');
            return super.nextTurn();
        }
    }
}
