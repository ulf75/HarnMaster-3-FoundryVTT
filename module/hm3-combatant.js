export class HarnMasterCombatant extends Combatant {
    /**
     *
     * @override
     */
    getInitiativeRoll(formula) {
        if (this.actor.system.mounted) {
            // For mounted combat, initiative is equal to Riding EML (COMBAT 20)
            const iniSkill = this.actor.items.find((item) => item.type === game.hm3.ItemType.SKILL && item.name.includes('Riding')).system;
            this.actor.system.initiative = iniSkill.effectiveMasteryLevel;
            this.actor.system.initiative += iniSkill.skillBase.value / 10;
        } else {
            const iniSkill = this.actor.items.find((item) => item.type === game.hm3.ItemType.SKILL && item.name === 'Initiative').system;
            this.actor.system.initiative = !this.token?.hasCondition(game.hm3.Condition.SHOCKED) ? iniSkill.effectiveMasteryLevel : 0;
            this.actor.system.initiative += iniSkill.skillBase.value / 10;
        }
        return super.getInitiativeRoll(formula);
    }
}
