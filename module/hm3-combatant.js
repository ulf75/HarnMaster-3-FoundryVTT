export class HarnMasterCombatant extends Combatant {
    /**
     *
     * @override
     */
    getInitiativeRoll(formula) {
        const mark = game.settings.get('hm3', 'autoMarkUsedSkills');
        if (this.actor.system.mounted) {
            // For mounted combat, initiative is equal to Riding EML (COMBAT 20)
            const iniSkill = this.actor.items.find((item) => item.type === game.hm3.ItemType.SKILL && item.name.includes('Riding'));
            this.actor.system.initiative = iniSkill.system.effectiveMasteryLevel;
            this.actor.system.initiative += iniSkill.system.skillBase.value / 10;
            if (mark) iniSkill.update({'system.improveFlag': iniSkill.system.improveFlag + 1});
        } else {
            const iniSkill = this.actor.items.find((item) => item.type === game.hm3.ItemType.SKILL && item.name === 'Initiative');
            this.actor.system.initiative = !this.token?.hasCondition(game.hm3.Condition.SHOCKED) ? iniSkill.system.effectiveMasteryLevel : 0;
            this.actor.system.initiative += iniSkill.system.skillBase.value / 10;
            if (mark) iniSkill.update({'system.improveFlag': iniSkill.system.improveFlag + 1});
        }

        return super.getInitiativeRoll(formula);
    }
}
