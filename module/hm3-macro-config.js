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
            template: 'systems/hm3/templates/dialog/macro-config.html'
        });
    }

    /* ----------------------------------------- */

    /** @override */
    async getData(options = {}) {
        const context = await super.getData(options);
        // context.keyChoices = HM3.activeEffectKey;
        return context;
    }
}
