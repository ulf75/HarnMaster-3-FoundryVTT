{
    // 1st effect
    const now = effect.duration.startTime;
    const end = actor.system.endurance;
    const dur = Math.round((end / 4) * 60 * 60);
    const bonus = (await new Roll('1d4').evaluate()).total;
    const postpone = 30;
    effect.changes[0].value = bonus.toString();
    effect.changes[1].value = bonus.toString();
    effect.changes[2].value = Math.ceil((2 * bonus) / 3).toString();

    effect.update({
        'duration.seconds': dur,
        'duration.startTime': now + postpone,
        'changes': effect.changes
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
        'duration.seconds': dur2,
        'duration.startTime': now + dur1 + postpone,
        'changes': effect.changes
    });
}
