const tests = new Map([
    ['(i01) - condition', './infrastructure/condition.js'],
    ['(i02) - morale', './infrastructure/morale.js'],
    ['(c01) - defeated', './combat/defeated.js'],
    ['(c02) - shock', './combat/shock.js'],
    ['(c03) - zones', './combat/zones.js'],
    // ['(c04) - Melee Block', './combat/melee-block.js'],
    // ['(c05) - Melee Counterstrike', './combat/melee-counterstrike.js'],
    ['(c06) - Melee Dodge', './combat/melee-dodge.js']
    // ['(c07) - Melee Ignore', './combat/melee-ignore.js']
]);

let isRunning = false;

export async function runner() {
    if (isRunning) {
        ui.notifications.warn('Test runner is already running. Please wait for it to finish.');
        return;
    }
    isRunning = true;
    console.clear();
    console.info('%cRunning tests...', 'color: #b6b4a5');
    for (const test of tests.keys()) {
        console.info('%c\n----------------------------------------', 'color: #b6b4a5');
        console.info(`%cRunning test: ${test}`, 'color: #b6b4a5');
        const Module = await import(tests.get(test));
        if (!Module || !Module.TestCase) {
            console.error(`Test module for "${test}" not found or does not export TestCase.`);
            continue;
        }
        var t = new Module.TestCase();
        const success = await t.start();
        if (success) {
            console.info(`%cTest "${test}" completed successfully.`, 'color: #00990d');
        } else {
            console.error(`%cTest "${test}" failed.`, 'color: #b30000');
        }
    }
    isRunning = false;
}
