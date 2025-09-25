// @ts-check

import {Condition} from './hm3-types';
import {truncate} from './utility';

export class CombatantHM3 extends Combatant {
    /**
     *
     * @override
     */
    getInitiativeRoll(formula) {
        const start = performance.now();

        const mark = game.settings?.get('hm3', 'autoMarkUsedSkills');
        if (this.actor?.system.mounted) {
            // For mounted combat, initiative is equal to Riding EML (COMBAT 20)
            const iniSkill = this.actor.proxy.Skill('Riding');
            this.actor.system.initiative = !this.token?.hasCondition(Condition.SHOCKED) ? iniSkill?.EML : 5;
            this.actor.system.initiative += iniSkill?.SB.value / 10;
            if (mark) iniSkill?.item.update({'system.improveFlag': iniSkill.improveFlag + 1});
        } else if (this.actor) {
            const iniSkill = this.actor.proxy.Skill('Initiative');
            this.actor.system.initiative = !this.token?.hasCondition(Condition.SHOCKED) ? iniSkill?.EML : 5;
            this.actor.system.initiative += iniSkill?.SB.value / 10;
            if (mark) iniSkill?.item.update({'system.improveFlag': iniSkill.improveFlag + 1});
        }

        console.info(`HM3 | CombatantHM3.getInitiativeRoll: ${truncate(performance.now() - start)} ms`);

        return super.getInitiativeRoll(formula);
    }
}
