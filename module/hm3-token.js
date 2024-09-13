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
        return macros.createCondition(this, condition);
    }

    /**
     *
     * @param {Condition} condition
     * @returns
     */
    hasCondition(condition) {
        return macros.hasActiveEffect(this, condition, true);
    }

    /**
     *
     * @param {Condition} condition
     * @returns
     */
    getCondition(condition) {
        return macros.getActiveEffect(this, condition, true);
    }

    /**
     * Deletes a condition from a token.
     * @param {Condition} condition
     * @returns
     */
    async deleteCondition(condition) {
        return this.getCondition(condition)?.delete();
    }
}

export class HarnMasterTokenDocument extends TokenDocument {
    /**
     *
     * @param {Condition} condition
     * @returns
     */
    async addCondition(condition) {
        return this.object.addCondition(condition);
    }

    /**
     *
     * @param {Condition} condition
     * @returns
     */
    hasCondition(condition) {
        return this.object.hasCondition(condition);
    }

    /**
     *
     * @param {Condition} condition
     * @returns
     */
    getCondition(condition) {
        return this.object.getCondition(condition);
    }

    /**
     * Deletes a condition from a token.
     * @param {Condition} condition
     * @returns
     */
    async deleteCondition(condition) {
        return this.object.deleteCondition(condition);
    }
}
