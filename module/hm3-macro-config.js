import * as utility from './utility.js';

/**
 * A form designed for creating and editing an Macro on an Actor or Item.
 * @implements {FormApplication}
 *
 * @param {Macro} object     The target macro being configured
 * @param {object} [options]        Additional options which modify this application instance
 */
export class HM3MacroConfig extends MacroConfig {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            height: 575,
            jQuery: false
        });
    }

    /** @override */
    get template() {
        if (this.object.limited) {
            return 'systems/hm3/templates/dialog/macro-config-limited.html';
        } else {
            return 'systems/hm3/templates/dialog/macro-config.html';
        }
    }

    /** @override */
    async getData(options = {}) {
        const data = super.getData();

        data.macroTypes = game.documentTypes.Macro.map((t) => ({
            value: t,
            label: game.i18n.localize(CONFIG.Macro.typeLabels[t]),
            disabled: t === 'script' && !game.user.can('MACRO_SCRIPT')
        }));
        data.macroScopes = CONST.MACRO_SCOPES.map((s) => ({value: s, label: s}));
        data.triggerTypes = [
            {value: 'manual', label: 'Manual'},
            {value: 'hm3.onDamageRoll', label: 'HM3 On Damage Roll'},
            {value: 'hm3.onFumbleRoll', label: 'HM3 On Fumble Roll'},
            {value: 'hm3.onHealingRoll', label: 'HM3 On Healing Roll'},
            {value: 'hm3.onInjuryRoll', label: 'HM3 On Injury Roll'},
            {value: 'hm3.onInvocationRoll', label: 'HM3 On Invocation Roll'},
            {value: 'hm3.onPsionicsRoll', label: 'HM3 On Psionics Roll'},
            {value: 'hm3.onShockRoll', label: 'HM3 On Shock Roll'},
            {value: 'hm3.onSpellRoll', label: 'HM3 On Spell Roll'},
            {value: 'hm3.onStumbleRoll', label: 'HM3 On Stumble Roll'},
            {value: 'hm3.preInjuryRoll', label: 'HM3 Pre Injury Roll'},
            {value: 'applyTokenStatusEffect', label: 'Apply Token Status Effect'},
            {value: 'combatRound', label: 'Combat Round'},
            {value: 'combatStart', label: 'Combat Start'},
            {value: 'combatTurn', label: 'Combat Turn'},
            {value: 'combatTurnChange', label: 'Combat Turn Change'},
            {value: 'createToken', label: 'Create Token'},
            {value: 'pauseGame', label: 'Pause Game'},
            {value: 'preUpdateToken', label: 'Pre Update Token'},
            {value: 'targetToken', label: 'Target Token'},
            {value: 'updateCombatant', label: 'Update Combatant'},
            {value: 'updateToken', label: 'Update Token'},
            {value: 'updateWorldTime', label: 'Update World Time'}
        ];

        data.trigger = this.object.getFlag('hm3', 'trigger') || 'manual';

        if (data.trigger === 'legacy') {
            data.triggerTypes.push({value: 'legacy', label: 'Legacy'});
            data.isLegacy = true;
        }
        if (this.object.limited) {
            data.triggerTypes.push({value: 'confidential', label: 'Confidential'});
        }

        return data;
    }

    /** @override */
    async _updateObject(event, formData) {
        event.preventDefault();
        if (event instanceof SubmitEvent) {
            const ret = await super._updateObject(event, formData);
            await this.object.setFlag('hm3', 'trigger', formData.trigger);
            utility.getActorFromMacro(this.object)?.sheet.render();
            return ret;
        } else {
            return await super._updateObject(event, formData);
        }
    }

    /** @override */
    async _activateCoreListeners(...args) {
        const ret = await super._activateCoreListeners(...args);

        if (this.object.limited) {
            this.form[5].disabled = true;
            this.form[6].disabled = true;
        } else if (!['legacy', 'manual'].includes(this.object.getFlag('hm3', 'trigger'))) {
            this.form[6].disabled = true;
        }

        return ret;
    }
}
