// @ts-check
import {truncatedOML} from '../../utility';
import {SkillProxy} from './skill-proxy';

export class ConditionSkillProxy extends SkillProxy {
    /**
     * @type {number}
     * @override
     */
    get OML() {
        const part1 = this.SBx * this.SB.value;
        const part2 = Math.round(this.OP / 2) * this.SB.value;
        const d = part1 - 70;
        return d > 0 ? truncatedOML(part1 - d + part2) + d : truncatedOML(part1 + part2);
    }
}
