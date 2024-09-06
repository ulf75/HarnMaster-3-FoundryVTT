import * as macros from './macros.js';

/**
 * Extend the base Token.
 * @extends {Token}
 */
export class HarnMasterToken extends Token {
    /**
     *
     * @param {Condition} condition
     * @returns
     */
    async addCondition(condition) {
        return macros.createCondition(this.actor, condition);
    }

    /**
     *
     * @param {Condition} condition
     * @returns
     */
    hasCondition(condition) {
        return macros.hasActiveEffect(this.actor, condition, true);
    }
}
