export class HarnMasterActiveEffect extends ActiveEffect {
    _prepareDuration() {
        const ret = super._prepareDuration();

        if (ret.duration === game.hm3.CONST.TIME.INDEFINITE) {
            ret.label = 'Indefinite';
        }

        return ret;
    }

    get hidden() {
        let hidden = !!this.getFlag('hm3', 'hidden');
        if (this.parent instanceof Item) hidden ||= !!this.parent.system.hidden;
        return hidden;
    }
}
