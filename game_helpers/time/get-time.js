const scene = game.scenes.current;
const isLandingPage = scene.getFlag('hm3', 'landingPage');

if (isLandingPage) {
    const time = scene.getFlag('hm3', 'currentTime');
    const interval = SimpleCalendar.api.secondsToInterval(time);
    SimpleCalendar.api.setDate(interval);
    ui.notifications.info(`New time get from ${scene.name}: ${JSON.stringify(interval)}`);
    console.log(`New time get from ${scene.name}:`, JSON.stringify(interval), scene);
} else {
    ui.notifications.error(`Scene ${scene.name} is no Landing Page!`);
}
