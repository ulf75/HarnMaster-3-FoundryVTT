// @ts-check
import {ConditionTestCase} from './00-infrastructure/condition';
import {MoraleTestCase} from './00-infrastructure/morale';
import {DefeatedTestCase} from './03-combat/defeated';
import {MeleeBlockTestCase} from './03-combat/melee-block';
import {OutnumberedTestCase} from './03-combat/outnumbered';
import {ShockTestCase} from './03-combat/shock';
import {ZonesTestCase} from './03-combat/zones';

const tests = new Map([
    ['(i01) - condition', new ConditionTestCase()],
    ['(i02) - morale', new MoraleTestCase()],
    ['(c01) - defeated', new DefeatedTestCase()],
    ['(c02) - shock', new ShockTestCase()],
    ['(c03) - zones', new ZonesTestCase()],
    ['(c04) - Melee Block', new MeleeBlockTestCase()],
    // ['(c05) - Melee Counterstrike', new MeleeCSTestCase()],
    // ['(c06) - Melee Dodge', new MeleeDodgeTestCase()],
    // ['(c07) - Melee Ignore', new MeleeIgnoreTestCase()],
    ['(c08) - Outnumbered', new OutnumberedTestCase()]
]);

let isRunning = false;

export async function runner() {
    if (isRunning) {
        ui.notifications?.warn('Test runner is already running. Please wait for it to finish.');
        return;
    }
    isRunning = true;
    console.clear();
    console.info('%cRunning tests...', 'color: #b6b4a5');
    for (const test of tests.keys()) {
        console.info('%c\n----------------------------------------', 'color: #b6b4a5');
        console.info(`%cRunning test: ${test}`, 'color: #b6b4a5');

        var t = tests.get(test);
        const success = await t?.start();
        if (success) {
            console.info(`%cTest "${test}" completed successfully.`, 'color: #00990d');
        } else {
            console.error(`%cTest "${test}" failed.`, 'color: #b30000');
        }
    }
    isRunning = false;
}
