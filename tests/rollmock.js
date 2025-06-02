export class RollMock extends Roll {
    _totalMock = null;

    static D100_CF = 100;
    static D100_CS = 5;
    static D100_MF = 99;
    static D100_MS = 1;
    static D6_FAILURE = 100;
    static D6_SUCCESS = 1;

    static D100_RESULTS = [];
    static D6_RESULTS = [];

    async evaluate({minimize = false, maximize = false, allowStrings = false, allowInteractive = true, ...options} = {}) {
        const isD6 = this._formula.includes('d6');
        const hasValue = CONFIG.debug.hm3 && (isD6 ? RollMock.D6_RESULTS.length > 0 : RollMock.D100_RESULTS.length > 0);
        if (hasValue) {
            this._totalMock = isD6 ? RollMock.D6_RESULTS.shift() : RollMock.D100_RESULTS.shift();
            return this;
        } else {
            this._totalMock = null;
            return super.evaluate({minimize, maximize, allowStrings, allowInteractive, options});
        }
    }

    /**
     * @override
     */
    get total() {
        if (this._totalMock) {
            return this._totalMock;
        } else {
            return super.total;
        }
    }
}
