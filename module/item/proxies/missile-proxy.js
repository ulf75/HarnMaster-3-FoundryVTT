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
        return HM100Check(this.Skill(this.assocSkill)?.EML ?? 0);
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
        return game.settings.get('hm3', 'distanceUnits') !== 'grid';
    }
    /**
     * @type {number}
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
     * @type {number}
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
     * @type {number}
     */
    get long() {
        return {
            range: this.isFeet ? this.item.system.range.long : this.item.system.range.long / canvas.dimensions.distance,
            impact: this.item.system.impact.long
        };
    }
    /**
     * @type {number}
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

    activateListeners(html) {
        super.activateListeners(html);
    }
}
