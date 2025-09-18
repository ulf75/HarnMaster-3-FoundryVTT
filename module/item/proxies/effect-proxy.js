// @ts-check
import {GearProxy} from './gear-proxy';

export class EffectProxy extends GearProxy {
    /**
     * @type {string}
     * @override
     */
    get cls() {
        return super.cls + '-effect';
    }
    /**
     * @type {boolean}
     * @override
     */
    get visible() {
        // @ts-expect-error
        return game.user.isGM;
    }

    /**
     * @param {JQuery} html
     * @override
     */
    activateListeners(html) {
        super.activateListeners(html);

        html.off('keyup', '.effects-name-filter');
        html.on('keyup', '.effects-name-filter', (ev) => {
            this.effectsNameFilter = $(ev.currentTarget).val();
            const lcEffectsNameFilter = this.effectsNameFilter.toLowerCase();
            let effectItems = html.find('.effect');
            for (let effect of effectItems) {
                const effectName = effect.getAttribute('data-effect-name');
                if (lcEffectsNameFilter) {
                    if (effectName && effectName.toLowerCase().includes(lcEffectsNameFilter)) {
                        $(effect).show();
                    } else {
                        $(effect).hide();
                    }
                } else {
                    $(effect).show();
                }
            }
        });
    }
}
