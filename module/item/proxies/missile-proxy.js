// @ts-check
import {HM100Check} from '../../utility';
import {GearProxy} from './gear-proxy';

export class MissileProxy extends GearProxy {
    /**
     * @type {string}
     */
    get cls() {
        return super.cls + '-missile';
    }
    /**
     * @type {number}
     */
    get AML() {
        return HM100Check(this.SML + this.AMLEffect + this.AMLItemEffect);
    }
    /**
     * @type {string}
     */
    get assocSkill() {
        return this.item.system.assocSkill;
    }
    /**
     * @type {boolean}
     */
    get isFeet() {
        // @ts-expect-error
        return game.settings.get('hm3', 'distanceUnits') !== 'grid';
    }
    /**
     * @type {{range: number, impact: number}}
     */
    get short() {
        return {
            range: this.isFeet
                ? this.item.system.range.short
                : this.item.system.range.short / canvas.dimensions.distance,
            impact: this.item.system.impact.short
        };
    }
    /**
     * @type {{range: number, impact: number}}
     */
    get medium() {
        return {
            range: this.isFeet
                ? this.item.system.range.medium
                : this.item.system.range.medium / canvas.dimensions.distance,
            impact: this.item.system.impact.medium
        };
    }
    /**
     * @type {{range: number, impact: number}}
     */
    get long() {
        return {
            range: this.isFeet ? this.item.system.range.long : this.item.system.range.long / canvas.dimensions.distance,
            impact: this.item.system.impact.long
        };
    }
    /**
     * @type {{range: number, impact: number}}
     */
    get extreme() {
        return {
            range: this.isFeet
                ? this.item.system.range.extreme
                : this.item.system.range.extreme / canvas.dimensions.distance,
            impact: this.item.system.impact.extreme
        };
    }
    /**
     * @type {boolean}
     */
    get isHighVelocity() {
        return /\bbow\b|shortbow|longbow|crossbow|\bsling\b|\barrow\b|\bbolt\b|\bbullet\b/i.test(this.name);
    }
    /**
     * Skill Mastery Level
     * @type {number}
     */
    get SML() {
        return this.Skill(this.assocSkill)?.EML ?? 0;
    }
    /**
     * @type {number}
     */
    get AMLEffect() {
        return this.actor.system.v2.missileAMLMod ?? 0;
    }
    /**
     * @type {number}
     */
    get AMLItemEffect() {
        return this.item.system.v2.attackMasteryLevel ?? 0;
    }

    activateListeners(html) {
        super.activateListeners(html);
    }
}
