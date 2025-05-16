export class RollMock extends Roll {
    async evaluate({minimize = false, maximize = false, allowStrings = false, allowInteractive = true, ...options} = {}) {
        return super.evaluate({minimize, maximize, allowStrings, allowInteractive, options});
    }

    get total() {
        return super.total;
    }
}
