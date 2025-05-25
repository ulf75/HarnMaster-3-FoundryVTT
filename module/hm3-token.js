import {rangeToTarget} from './combat.js';
import {Condition} from './hm3-types.js';
import * as macros from './macros.js';
import {Mutex} from './mutex.js';

let tokenMutex;

/**
 * Extend the base Token.
 * @extends {Token}
 */
export class TokenHM3 extends Token {
    constructor(...args) {
        super(...args);
        if (!tokenMutex) tokenMutex = new Mutex();
    }

    /** @override */
    _onClickLeft(event) {
        if (event.shiftKey && event.ctrlKey) super._onClickLeft2(event);
        else super._onClickLeft(event);
    }

    /** @override */
    _onClickRight(event) {
        if (event.shiftKey && event.ctrlKey) super._onClickRight2(event);
        else super._onClickRight(event);
    }

    /**
     *
     * @param {Condition} condition
     * @returns
     */
    async addCondition(condition, options = {}) {
        return macros.createCondition(this, condition, options);
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
     *
     * @param {Condition} condition
     * @param {number} [postpone=10]
     * @returns
     */
    async disableCondition(condition, postpone = 10) {
        setTimeout(() => tokenMutex.runExclusive(async () => await this.getCondition(condition)?.update({disabled: true})), postpone);
    }

    /**
     * Deletes a condition from a token.
     * @param {Condition} condition
     * @param {number} [postpone=10]
     * @returns
     */
    async deleteCondition(condition, postpone = 10) {
        return setTimeout(async () => await game.hm3.macros.deleteActiveEffect(this.id, this.getCondition(condition)?.id), postpone);
    }

    /**
     * Deletes all morale conditions from a token.
     * @returns
     */
    async deleteAllMoraleConditions(except = null) {
        if (except !== game.hm3.Condition.BERSERK) await this.deleteCondition(game.hm3.Condition.BERSERK);
        if (except !== game.hm3.Condition.BROKEN) await this.deleteCondition(game.hm3.Condition.BROKEN);
        if (except !== game.hm3.Condition.CAUTIOUS) await this.deleteCondition(game.hm3.Condition.CAUTIOUS);
        if (except !== game.hm3.Condition.DESPERATE) await this.deleteCondition(game.hm3.Condition.DESPERATE);
        if (except !== game.hm3.Condition.EMPOWERED) await this.deleteCondition(game.hm3.Condition.EMPOWERED);
        if (except !== game.hm3.Condition.WEAKENED) await this.deleteCondition(game.hm3.Condition.WEAKENED);
    }

    /**
     *
     */
    get player() {
        return game.users.find((u) => !u.isGM && this.actor.testUserPermission(u, 'OWNER')) || null;
    }

    hasInjury(id) {
        return !!token.actor.items.find((i) => i.id === id);
    }

    /**
     *
     * @returns true, if this token has an engagement zone (COMBAT 6)
     */
    hasEngagementZone() {
        if (!game.combat?.started) return false;

        const cautious = this.hasCondition(Condition.CAUTIOUS);
        const distracted = this.hasCondition(Condition.DISTRACTED);
        const grappled = this.hasCondition(Condition.GRAPPLED);
        const incapacitated = this.hasCondition(Condition.INCAPACITATED);
        const prone = this.hasCondition(Condition.PRONE);
        const shocked = this.hasCondition(Condition.SHOCKED);
        const unconscious = this.hasCondition(Condition.UNCONSCIOUS);

        return !cautious && !distracted && !this.dying && !grappled && !incapacitated && !prone && !shocked && !unconscious;
    }

    getEngagedTokens(exclusively = false) {
        if (!game.combat?.started) return [];

        const all = canvas.scene.tokens.contents;
        const opponents =
            this.document.disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY
                ? all.filter((token) =>
                      [CONST.TOKEN_DISPOSITIONS.HOSTILE, CONST.TOKEN_DISPOSITIONS.NEUTRAL, CONST.TOKEN_DISPOSITIONS.SECRET].includes(
                          token.disposition
                      )
                  )
                : all.filter((token) =>
                      [CONST.TOKEN_DISPOSITIONS.FRIENDLY, CONST.TOKEN_DISPOSITIONS.NEUTRAL, CONST.TOKEN_DISPOSITIONS.SECRET].includes(
                          token.disposition
                      )
                  );

        const engaged = [
            ...opponents
                .filter((tokenDoc) => rangeToTarget(this, tokenDoc.object) < 5.1 && tokenDoc.object.hasEngagementZone())
                .map((token) => token.object)
        ];

        if (exclusively) return engaged.filter((token) => token.getEngagedTokens().length === 1);
        else return engaged;
    }

    /**
     *
     * @returns true, if this token is engaged in combat (COMBAT 6)
     */
    isEngaged(exclusively = false) {
        return game.combat?.started && this.getEngagedTokens(exclusively).length > 0;
    }

    /**
     *
     * @returns true, if this token has a reaction zone (COMBAT 6)
     */
    hasReactionZone() {
        return !this.isEngaged() && this.hasEngagementZone();
    }

    turnEnds(postpone = 666) {
        if (!game.combat?.started) return;

        console.debug(`HM3 | Token ${this.name} plans to finish the turn.`);

        // delay so that other hooks are executed first
        setTimeout(async () => {
            console.debug(`HM3 | Token ${this.name} started the end of the turn.`);
            game.combat.nextTurn(this.id);
            console.debug(`HM3 | Token ${this.name} has finished the turn.`);
        }, postpone);
    }

    get dying() {
        return (
            this.hasCondition(Condition.DYING) ||
            (this.document.hasStatusEffect('dead') && this.document.disposition === CONST.TOKEN_DISPOSITIONS.HOSTILE)
        );
    }

    pronoun(capital = false) {
        const p = () => {
            if (!this.actor.system.gender) return 'It';
            return this.actor.system.gender === 'Male' ? 'His' : 'Her';
        };
        return capital ? p() : p().toLowerCase();
    }

    async toggleVisibility(options = {}) {
        let isHidden = options?.active !== undefined ? options.active : this.document.hidden;
        const tokens = this.controlled ? canvas.tokens.controlled : [this];
        const updates = tokens.map((t) => {
            return {_id: t.id, hidden: !isHidden};
        });
        return canvas.scene.updateEmbeddedDocuments('Token', updates);
    }
}

export class TokenDocumentHM3 extends TokenDocument {
    _onCreate(data, options, userId) {
        super._onCreate(data, options, userId);
        this.setFlag('wall-height', 'tokenHeight', this.actor.system.height | 6);
    }
    /**
     *
     * @param {Condition} condition
     * @returns
     */
    async addCondition(condition, options = {}) {
        return this.object.addCondition(condition, options);
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
     *
     * @param {Condition} condition
     * @param {number} [postpone=0]
     * @returns
     */
    async disableCondition(condition, postpone = 10) {
        return this.object.disableCondition(condition, postpone);
    }

    /**
     * Deletes a condition from a token.
     * @param {Condition} condition
     * @returns
     */
    async deleteCondition(condition, postpone = 10) {
        return this.object.deleteCondition(condition, postpone);
    }

    /**
     * Deletes all morale conditions from a token.
     * @returns
     */
    async deleteAllMoraleConditions(except = null) {
        return this.object.deleteAllMoraleConditions(except);
    }

    get player() {
        return this.object.player;
    }

    hasInjury(id) {
        return this.object.hasInjury(id);
    }

    hasEngagementZone() {
        return this.object.hasEngagementZone();
    }

    getEngagedTokens(exclusively = false) {
        return this.object.getEngagedTokens(exclusively);
    }

    isEngaged(exclusively = false) {
        return this.object.isEngaged(exclusively);
    }

    hasReactionZone() {
        return this.object.hasReactionZone();
    }

    turnEnds(postpone = 666) {
        return this.object.turnEnds(postpone);
    }

    get dying() {
        return this.object.dying;
    }

    pronoun(capital = false) {
        return this.object.pronoun(capital);
    }

    async toggleVisibility(options = {}) {
        return this.object.toggleVisibility(options);
    }
}
