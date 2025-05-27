const tests = new Map([
    ['i01', './infrastructure/condition.js'],
    ['c01', './combat/defeated.js'],
    ['c02', './combat/shock.js']
]);

export async function runner() {
    for (const test of tests.keys()) {
        console.info(`Running test: ${test}`);
        const Module = await import(tests.get(test));
        if (!Module || !Module.TestCase) {
            console.error(`Test module for ${test} not found or does not export TestCase.`);
            continue;
        }
        var t = new Module.TestCase();
        const success = await t.start();
        if (success) {
            console.info(`Test ${test} completed successfully.`);
        } else {
            console.error(`Test ${test} failed.`);
        }
    }
}
