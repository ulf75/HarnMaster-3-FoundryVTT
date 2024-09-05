import * as macros from './macros.js';

/**
 * Extend the base Token.
 * @extends {Token}
 */
export class HarnMasterToken extends Token {
    addCondition(condition) {
        macros.createCondition(condition, this.actor);
    }
}
