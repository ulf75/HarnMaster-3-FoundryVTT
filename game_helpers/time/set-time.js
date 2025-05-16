const scene = game.scenes.current;
// await scene.setFlag('hm3', 'landingPage', true);
const isLandingPage = scene.getFlag('hm3', 'landingPage');

if (isLandingPage) {
    const time = SimpleCalendar.api.timestamp();
    const interval = SimpleCalendar.api.secondsToInterval(time);
    await scene.setFlag('hm3', 'currentTime', time);
    ui.notifications.info(`New time set in ${scene.name}: ${JSON.stringify(interval)}`);
    console.info(`New time set in ${scene.name}:`, JSON.stringify(interval), scene);
} else {
    ui.notifications.error(`Scene ${scene.name} is no Landing Page!`);
}
