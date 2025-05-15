export class HarnMasterCombatant extends Combatant {
    /**
     *
     * @override
     */
    getInitiativeRoll(formula) {
        const iniSkill = this.actor.items.find((i) => i.name === 'Initiative').system;
        this.actor.system.initiative = !this.token?.hasCondition(game.hm3.Condition.SHOCKED) ? iniSkill.effectiveMasteryLevel : 0;
        this.actor.system.initiative += iniSkill.skillBase.value / 10;
        return super.getInitiativeRoll(formula);
    }
}
