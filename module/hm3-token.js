// @ts-check

import {rangeToTarget} from './combat.js';
import {Condition, ItemType} from './hm3-types.js';
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
        return this.actor?.hasCondition(condition);
    }

    /**
     *
     * @param {Condition} condition
     * @returns
     */
    getCondition(condition) {
        return this.actor?.getCondition(condition);
    }

    getConditions() {
        return Object.values(Condition).filter((c) => this.hasCondition(c));
    }

    getConditionsWithMacro(macro) {
        return Object.values(Condition).filter((c) => {
            const ae = this.getCondition(c);
            return ae?.flags?.effectMacro && ae.flags.effectmacro[macro]?.script;
        });
    }

    /**
     *
     * @param {Condition} condition
     * @param {number} [postpone=0]
     * @returns
     */
    async disableCondition(condition, postpone = 0) {
        return new Promise((resolve) =>
            setTimeout(async () => {
                await this.getCondition(condition)?.update({disabled: true});
                resolve();
            }, postpone)
        );
    }

    /**
     * Deletes a condition from a token.
     * @param {Condition} condition
     * @param {number} [postpone=0]
     * @returns
     */
    async deleteCondition(condition, postpone = 0) {
        return new Promise((resolve) =>
            setTimeout(async () => {
                await hm3.macros.deleteCondition(this, this.getCondition(condition));
                resolve();
            }, postpone)
        );
    }

    /**
     * Deletes all morale conditions from a token.
     * @returns
     */
    async deleteAllMoraleConditions(except = null) {
        if (except !== hm3.Condition.BERSERK) await this.deleteCondition(hm3.Condition.BERSERK);
        if (except !== hm3.Condition.BROKEN) await this.deleteCondition(hm3.Condition.BROKEN);
        if (except !== hm3.Condition.CAUTIOUS) await this.deleteCondition(hm3.Condition.CAUTIOUS);
        if (except !== hm3.Condition.DESPERATE) await this.deleteCondition(hm3.Condition.DESPERATE);
        if (except !== hm3.Condition.EMPOWERED) await this.deleteCondition(hm3.Condition.EMPOWERED);
        if (except !== hm3.Condition.WEAKENED) await this.deleteCondition(hm3.Condition.WEAKENED);
    }

    /**
     * @type {User}
     */
    get player() {
        return game.users?.find((user) => !user.isGM && this.actor?.testUserPermission(user, 'OWNER')) || null;
    }

    getInjuries() {
        return this.actor?.items.filter((item) => item.type === ItemType.INJURY);
    }

    isInjured() {
        return this.getInjuries().length > 0;
    }

    hasInjury(id) {
        return !!this.actor?.items.find((i) => i.id === id);
    }

    hasSeriousInjuries() {
        return this.getInjuries().filter((item) => item.system.injuryLevel >= 2).length > 0;
    }

    hasGreviousInjuries() {
        return this.getInjuries().filter((item) => item.system.injuryLevel >= 4).length > 0;
    }

    hasSeriousLegInjuries() {
        return (
            this.getInjuries().filter(
                (item) =>
                    /\b|leg|hip|thigh|knee|calf|foot|\b/i.test(item.name.toLowerCase()) && item.system.injuryLevel >= 2
            ).length > 0
        );
    }

    hasGreviousLegInjuries() {
        return (
            this.getInjuries().filter(
                (item) =>
                    /\b|leg|hip|thigh|knee|calf|foot|\b/i.test(item.name.toLowerCase()) && item.system.injuryLevel >= 4
            ).length > 0
        );
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

        return (
            !cautious && !distracted && !this.dying && !grappled && !incapacitated && !prone && !shocked && !unconscious
        );
    }

    getEngagedTokens(exclusively = false) {
        if (!game.combat?.started) return [];

        const all = canvas?.scene?.tokens.contents;
        let opponents = [];
        if (this.document.disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY)
            opponents = all.filter(
                (token) =>
                    [
                        CONST.TOKEN_DISPOSITIONS.HOSTILE,
                        CONST.TOKEN_DISPOSITIONS.NEUTRAL,
                        CONST.TOKEN_DISPOSITIONS.SECRET
                    ].includes(token.disposition) && token.id !== this.id
            );
        else if (this.document.disposition === CONST.TOKEN_DISPOSITIONS.HOSTILE)
            opponents = all.filter(
                (token) =>
                    [
                        CONST.TOKEN_DISPOSITIONS.FRIENDLY,
                        CONST.TOKEN_DISPOSITIONS.NEUTRAL,
                        CONST.TOKEN_DISPOSITIONS.SECRET
                    ].includes(token.disposition) && token.id !== this.id
            );
        else
            opponents = all.filter(
                (token) =>
                    [
                        CONST.TOKEN_DISPOSITIONS.FRIENDLY,
                        CONST.TOKEN_DISPOSITIONS.HOSTILE,
                        CONST.TOKEN_DISPOSITIONS.NEUTRAL,
                        CONST.TOKEN_DISPOSITIONS.SECRET
                    ].includes(token.disposition) && token.id !== this.id
            );

        let engaged = [
            ...opponents
                .filter((tokenDoc) => rangeToTarget(this, tokenDoc.object) < 5.1 && tokenDoc.object.hasEngagementZone())
                .map((token) => token.object)
        ];

        if (exclusively) engaged = [...engaged.filter((token) => token.getEngagedTokens().length <= 1)];

        // console.info(`HM3 | Token ${this.name} ${exclusively ? 'exclusively ' : ''}engaged with ${engaged.length} tokens:`, engaged);

        return engaged;
    }

    /**
     *
     * @returns true, if this token is engaged in combat (COMBAT 6)
     */
    isEngaged(exclusively = false) {
        return (
            game.combat?.started &&
            (exclusively
                ? this.getEngagedTokens(exclusively).length === 1
                : this.getEngagedTokens(exclusively).length > 0)
        );
    }

    /**
     *
     * @returns true, if this token has a reaction zone (COMBAT 6)
     */
    hasReactionZone() {
        return !this.isEngaged() && this.hasEngagementZone();
    }

    async turnEnds(postpone = 0) {
        if (!game.combat?.started) return;

        console.info(`HM3 | Token ${this.name} plans to finish the turn.`);

        // delay so that other hooks are executed first
        await new Promise((resolve) =>
            setTimeout(async () => {
                if (!game.combat?.started) return;
                console.info(`HM3 | Token ${this.name} started the end of the turn.`);
                await game.combat?.nextTurn(this.id);
                console.info(`HM3 | Token ${this.name} has finished the turn.`);
                resolve();
            }, postpone)
        );
    }

    get dying() {
        return (
            this.hasCondition(Condition.DYING) ||
            (this.document.hasStatusEffect('dead') && this.document.disposition === CONST.TOKEN_DISPOSITIONS.HOSTILE)
        );
    }

    pronoun(capital = false) {
        const p = () => {
            if (!this.actor?.system.gender) return 'It';
            return this.actor?.system.gender === 'Male' ? 'His' : 'Her';
        };
        return capital ? p() : p().toLowerCase();
    }

    /** @override */
    async toggleVisibility(options = {}) {
        let isHidden = options?.active !== undefined ? options.active : this.document.hidden;
        const tokens = this.controlled ? canvas?.tokens?.controlled : [this];
        const updates = tokens?.map((t) => {
            return {_id: t.id, hidden: !isHidden};
        });
        return canvas?.scene?.updateEmbeddedDocuments('Token', updates);
    }
}

export class TokenDocumentHM3 extends TokenDocument {
    /**
     * @type {TokenHM3 | null} */
    get token() {
        // @ts-expect-error
        return this.object;
    }

    /** @override */
    _onCreate(data, options, userId) {
        super._onCreate(data, options, userId);
        if (this.testUserPermission(game.user, 'OWNER'))
            this.setFlag('wall-height', 'tokenHeight', this.actor?.system.height | 6);
    }
    /**
     *
     * @param {Condition} condition
     * @returns
     */
    async addCondition(condition, options = {}) {
        return this.token?.addCondition(condition, options);
    }

    /**
     *
     * @param {Condition} condition
     * @returns
     */
    hasCondition(condition) {
        return this.token?.hasCondition(condition) || false;
    }

    /**
     *
     * @param {Condition} condition
     * @returns
     */
    getCondition(condition) {
        return this.token?.getCondition(condition);
    }

    /**
     *
     * @param {Condition} condition
     * @param {number} [postpone=0]
     * @returns
     */
    async disableCondition(condition, postpone = 0) {
        return this.token?.disableCondition(condition, postpone);
    }

    /**
     * Deletes a condition from a token.
     * @param {Condition} condition
     * @param {number} [postpone=0]
     * @returns
     */
    async deleteCondition(condition, postpone = 0) {
        return this.token?.deleteCondition(condition, postpone);
    }

    /**
     * Deletes all morale conditions from a token.
     * @returns
     */
    async deleteAllMoraleConditions(except = null) {
        return this.token?.deleteAllMoraleConditions(except);
    }

    get player() {
        return this.token?.player || false;
    }

    isInjured() {
        return this.token?.isInjured();
    }

    hasInjury(id) {
        return this.token?.hasInjury(id);
    }

    hasEngagementZone() {
        return this.token?.hasEngagementZone();
    }

    getEngagedTokens(exclusively = false) {
        return this.token?.getEngagedTokens(exclusively);
    }

    isEngaged(exclusively = false) {
        return this.token?.isEngaged(exclusively);
    }

    hasReactionZone() {
        return this.token?.hasReactionZone();
    }

    async turnEnds(postpone = 0) {
        return this.token?.turnEnds(postpone);
    }

    get dying() {
        return this.token?.dying;
    }

    pronoun(capital = false) {
        return this.token?.pronoun(capital);
    }

    async toggleVisibility(options = {}) {
        return this.token?.toggleVisibility(options);
    }
}
