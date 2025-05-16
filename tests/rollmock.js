export class RollMock extends Roll {
    static D6SUCCESS = 1;
    static D6FAILURE = 100;
    static D100MS = 1;
    static D100CS = 5;
    static D100MF = 99;
    static D100CF = 100;

    static d6Results = [];
    static d100Results = [];

    // async evaluate({minimize = false, maximize = false, allowStrings = false, allowInteractive = true, ...options} = {}) {
    //     return super.evaluate({minimize, maximize, allowStrings, allowInteractive, options});
    // }

    /**
     * @override
     */
    get total() {
        const isD6 = this._formula.includes('d6');
        const hasValue = CONFIG.debug.hm3 && (isD6 ? RollMock.d6Results.length > 0 : RollMock.d100Results.length > 0);
        if (hasValue) {
            return isD6 ? RollMock.d6Results.shift() : RollMock.d100Results.shift();
        } else {
            return super.total;
        }
    }
}
