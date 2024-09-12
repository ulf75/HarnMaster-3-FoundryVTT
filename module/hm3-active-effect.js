const INDEFINITE = Number.MAX_SAFE_INTEGER;

export class HarnMasterActiveEffect extends ActiveEffect {
    _prepareDuration() {
        const ret = super._prepareDuration();

        if (ret.duration === INDEFINITE) {
            ret.label = 'Indefinite';
        }

        return ret;
    }
}
