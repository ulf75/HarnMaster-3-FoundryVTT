const tests = ['./defeated.js', './shock.js'];

export async function runner() {
    for (let i = 0; i < tests.length; i++) {
        const Module = await import(tests[i]);
        var test = new Module.TestCase();
        const success = await test.start();
    }
}
