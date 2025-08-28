{
    // 1st effect
    const now = effect.duration.startTime;
    const end = actor.system.endurance;
    const dur = Math.round((end / 4) * 60 * 60);
    const bonus = await game.hm3.macros.rollResultAsync('1d4', {name: 'Hrus Might', type: 'bonus'});
    const postpone = 30;
    effect.changes[0].value = bonus.toString();
    effect.changes[1].value = bonus.toString();
    effect.changes[2].value = Math.ceil((2 * bonus) / 3).toString();

    effect.update({
        'changes': effect.changes,
        'duration.seconds': dur,
        'duration.startTime': now + postpone
    });

    effect.parent.update({
        'name': `${effect.parent.name} (${bonus})`
    });
}

{
    // 2nd effect
    const now = effect.duration.startTime;
    const end = actor.system.endurance;
    const dur1 = Math.round((end / 4) * 60 * 60);
    const dur2 = Math.round((end / 2) * 60 * 60);
    const bonus = -2;
    const postpone = 30;
    effect.changes[0].value = bonus.toString();
    effect.changes[1].value = bonus.toString();
    effect.changes[2].value = Math.floor((2 * bonus) / 3).toString();

    effect.update({
        'changes': effect.changes,
        'duration.seconds': dur2,
        'duration.startTime': now + dur1 + postpone
    });
}
