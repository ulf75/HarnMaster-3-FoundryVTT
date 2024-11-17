export class HarnMasterNote extends Note {
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
}
