export class ActiveEffectHM3 extends ActiveEffect {
    _prepareDuration() {
        const ret = super._prepareDuration();

        if (ret.duration === game.hm3.CONST.TIME.INDEFINITE) {
            ret.label = 'Indefinite';
        }

        return ret;
    }

    get hidden() {
        let hidden = !!this.flags?.hm3?.hidden;
        if (this.parent instanceof Item) hidden ||= !!this.parent.system.hidden;
        return hidden;
    }

    get selfDestroy() {
        return !!this.flags?.hm3?.selfDestroy;
    }

    get unique() {
        return !!this.flags?.hm3?.unique;
    }

    hasCreateMacro() {
        return this.flags?.effectmacro?.onCreate?.script && this.flags?.effectmacro?.onCreate?.script?.trim() !== '';
    }

    hasDeleteMacro() {
        return this.flags?.effectmacro?.onDelete?.script && this.flags?.effectmacro?.onDelete?.script?.trim() !== '';
    }

    hasDisableMacro() {
        return this.flags?.effectmacro?.onDisable?.script && this.flags?.effectmacro?.onDisable?.script?.trim() !== '';
    }

    hasTurnStartMacro() {
        return this.flags?.effectmacro?.onTurnStart?.script && this.flags?.effectmacro?.onTurnStart?.script?.trim() !== '';
    }
}
