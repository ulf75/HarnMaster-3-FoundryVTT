const WATCHES_PER_DAY = 6;
const WATCHES_PER_MONTH = 30 * WATCHES_PER_DAY;

// Hârnic Weather
export class Weather {
    static climate = 'cooltemperate';
    static dateTimeApi;
    static season = 'Spring';
    static start = 0;
    static lastWatch = 0;
    static weather = [];

    static async Render() {
        if (!game.settings.get('hm3', 'showWeather')) return;
        if (!game.user.isGM) return;
        if (!this.dateTimeApi) return;
        if (this.lastWatch === this.Watch()) return;

        this.season = this.dateTimeApi.getCurrentSeason().name;
        this.lastWatch = this.Watch();

        await this.InitializeNextMonth();

        const data = game.settings.get('hm3', 'weather');
        const frc = data.weather[this.lastWatch].force;
        const weather = this.Data(data.weather[this.lastWatch].idx);
        const preArray = data.weather[this.lastWatch].precipitation || weather.precipitation;
        const DT = this.dateTimeApi.currentDateTimeDisplay();
        const datetime = DT.date + DT.yearPostfix + ' ' + DT.time.substring(0, DT.time.length - 3);
        const chatTemplate = 'systems/hm3/templates/chat/weather-card.html';
        const chatData = {
            climate: 'Climate: Cool Temperate',
            cover: cover(weather.cover),
            coverIcon: unicode[weather.cover],
            datetime,
            dir: weather.dir,
            force: force(frc),
            hasPrecipitation: preArray.length > 0,
            precipitation: precipitation(preArray),
            precipitationIcon: precipitationIcon(preArray),
            season: this.season,
            temp: this.Temp(weather),
            title: 'Current Weather',
            watch: (this.lastWatch % 6) + 1 // watch of the day
        };

        const html = await renderTemplate(chatTemplate, chatData);
        const messageData = {
            content: html.trim(),
            user: game.user.id
        };

        return ChatMessage.create(messageData, {});
    }

    static async Initialize() {
        this.dateTimeApi = SimpleCalendar?.api;

        if (!game.settings.get('hm3', 'showWeather')) return false;
        if (!this.dateTimeApi) return false;

        const data = game.settings.get('hm3', 'weather');
        if (data.weather.length === 1) {
            // 1st initialization
            this.start = this.dateTimeApi.dateToTimestamp({year: 720, month: 0, day: 0, hour: 0, minute: 0, seconds: 0});
            let idx = 0;
            const weather = [];
            for (let i = 0; i < WATCHES_PER_MONTH; i++) {
                const force = d3() - 1 + this.Data(idx).force;
                const pre = this.Data(idx).precipitation;
                if (modifyPrecipitation(pre, force)) weather.push({idx, force, precipitation: pre});
                else weather.push({idx, force});
                idx = next(idx);
            }
            await game.settings.set('hm3', 'weather', {start: this.start, weather});
        } else {
            // load data
            this.start = data.start;
            this.weather = data.weather;

            await this.InitializeNextMonth();

            // await game.settings.set('hm3', 'weather', undefined);
        }
        return true;
    }

    static async InitializeNextMonth() {
        const data = game.settings.get('hm3', 'weather');
        let weather = data.weather;
        // if (data.weather.length - this.Watch() > WATCHES_PER_MONTH) return;

        while (weather.length - this.Watch() <= WATCHES_PER_MONTH) {
            let idx = weather[weather.length - 1].idx;
            const newWeather = [];
            for (let i = 0; i < WATCHES_PER_MONTH; i++) {
                idx = next(idx);
                const force = d3() - 1 + this.Data(idx).force;
                const pre = this.Data(idx).precipitation;
                if (modifyPrecipitation(pre, force)) newWeather.push({idx, force, precipitation: pre});
                else newWeather.push({idx, force});
            }
            weather = [...weather, ...newWeather];
            await game.settings.set('hm3', 'weather', {start: this.start, weather});
        }
    }

    static Data(idx) {
        return weatherData[this.climate][this.season][idx];
    }

    static Watch() {
        const current = this.dateTimeApi.dateToTimestamp({});
        return Math.floor((current - this.start) / game.hm3.CONST.TIME.WATCH);
    }

    static Temp(weather) {
        const watch = (this.Watch() % 6) + 1;
        const isWinter = this.dateTimeApi.getCurrentSeason().name === 'Winter';
        if (watch <= 2 || watch >= 6) return weather.night; // night
        else if (isWinter && watch === 5) return weather.night; // night
        else return weather.temp; // day
    }
}

function next(idx) {
    const roll = d10();
    let change = 0;
    if (roll === 1) change = -1;
    else if (roll === 8 || roll === 9) change = 1;
    else if (roll === 10) change = 2;
    return (idx + 20 + change) % 20;
}

function d3() {
    return Math.floor(3 * foundry.dice.MersenneTwister.random()) + 1;
}

function d10() {
    return Math.floor(10 * foundry.dice.MersenneTwister.random()) + 1;
}

function force(force) {
    return windForce[force];
}

function cover(cover) {
    return cloudCover[cover];
}

function modifyPrecipitation(pre, force) {
    let mod = false;
    if (force > 0) {
        // Remove Fog if too windy
        const index = pre.indexOf('Fog');
        if (index !== -1) {
            pre.splice(index, 1);
            mod = true;
        }
    }

    const index = pre.indexOf('Thunder');
    const index2 = pre.indexOf('Hail');
    if (index !== -1 && index2 !== -1 && d10() === 1) {
        pre.push('Hail');
        mod = true;
    }

    return mod;
}

function precipitation(pre) {
    if (pre.length === 0) return '';
    else if (pre.length === 1) return _precipitation[pre[0]];
    else if (pre.length === 2) return _precipitation[pre[0]] + ' & ' + _precipitation[pre[1]];
}

function precipitationIcon(pre) {
    if (pre.length === 0) return '';
    else if (pre.length === 1) return unicode[pre[0]];
    else if (pre.length === 2) return unicode[pre[0]] + ' ' + unicode[pre[1]];
}

const _precipitation = {
    Fog: 'Fog or Mist',
    Hail: 'Hail',
    Rain: 'Rain Showers or Light Rain',
    Snow: 'Snow/Sleet Flurries',
    SteadyRain: 'Steady or Heavy Rain',
    SteadySnow: 'Steady Snow/Sleet',
    Thunder: 'Thunderstorms'
};

const unicode = {
    Fog: '#10860;',
    Full: '#9679;',
    Half: '#9680;',
    No: '#9675;',
    Rain: '',
    Snow: '#8258;',
    SteadyRain: '',
    SteadySnow: '#10033;',
    Thunder: '#9928;'
};

const windForce = ['Calm', 'Breeze', 'Windy', 'Gale', 'Storm'];

const cloudCover = {No: 'Clear', Half: 'Cloudy', Full: 'Overcast'};

const weatherData = {
    cooltemperate: {
        Spring: [
            /* 01 */ {idx: 1, temp: 'Cold', night: 'Cold', force: 1, dir: 'N', cover: 'Full', precipitation: ['Snow']},
            /* 02 */ {idx: 2, temp: 'Cool', night: 'Cool', force: 1, dir: 'NE', cover: 'Half', precipitation: []},
            /* 03 */ {idx: 3, temp: 'Warm', night: 'Cool', force: 0, dir: 'SE', cover: 'No', precipitation: ['Fog']},
            /* 04 */ {idx: 4, temp: 'Warm', night: 'Warm', force: 1, dir: 'SW', cover: 'Half', precipitation: ['Rain']},
            /* 05 */ {idx: 5, temp: 'Cool', night: 'Cool', force: 2, dir: 'NW', cover: 'Full', precipitation: ['Rain']},
            /* 06 */ {idx: 6, temp: 'Cold', night: 'Cold', force: 2, dir: 'NW', cover: 'Full', precipitation: []},
            /* 07 */ {idx: 7, temp: 'Cold', night: 'Frzg', force: 1, dir: 'SW', cover: 'Half', precipitation: []},
            /* 08 */ {idx: 8, temp: 'Cool', night: 'Cool', force: 1, dir: 'SW', cover: 'Half', precipitation: []},
            /* 09 */ {idx: 9, temp: 'Cold', night: 'Cold', force: 1, dir: 'NW', cover: 'Half', precipitation: []},
            /* 10 */ {idx: 10, temp: 'Frzg', night: 'Frzg', force: 0, dir: 'N', cover: 'Half', precipitation: ['Fog']},
            /* 11 */ {idx: 11, temp: 'Cold', night: 'Frzg', force: 1, dir: 'N', cover: 'No', precipitation: []},
            /* 12 */ {idx: 12, temp: 'Cool', night: 'Frzg', force: 1, dir: 'NE', cover: 'Half', precipitation: []},
            /* 13 */ {idx: 13, temp: 'Warm', night: 'Cool', force: 0, dir: 'SE', cover: 'No', precipitation: ['Fog']},
            /* 14 */ {idx: 14, temp: 'Hot', night: 'Warm', force: 0, dir: 'S', cover: 'No', precipitation: ['Fog']},
            /* 15 */ {idx: 15, temp: 'Warm', night: 'Warm', force: 0, dir: 'SW', cover: 'Half', precipitation: ['Thunder']},
            /* 16 */ {idx: 16, temp: 'Cool', night: 'Cold', force: 1, dir: 'NW', cover: 'No', precipitation: []},
            /* 17 */ {idx: 17, temp: 'Cool', night: 'Cool', force: 2, dir: 'SW', cover: 'Half', precipitation: ['Rain']},
            /* 18 */ {idx: 18, temp: 'Cool', night: 'Cool', force: 2, dir: 'SW', cover: 'Full', precipitation: ['SteadyRain']},
            /* 19 */ {idx: 19, temp: 'Cold', night: 'Cold', force: 2, dir: 'NW', cover: 'Half', precipitation: ['Snow']},
            /* 20 */ {idx: 20, temp: 'Cold', night: 'Cold', force: 1, dir: 'NW', cover: 'Full', precipitation: []}
        ],
        Summer: [
            /* 01 */ {idx: 1, temp: 'Cool', night: 'Cool', force: 0, dir: 'N', cover: 'Half', precipitation: []},
            /* 02 */ {idx: 2, temp: 'Warm', night: 'Warm', force: 0, dir: 'NE', cover: 'Half', precipitation: ['Rain']},
            /* 03 */ {idx: 3, temp: 'Hot', night: 'Cool', force: 0, dir: 'SE', cover: 'No', precipitation: []},
            /* 04 */ {idx: 4, temp: 'Hot', night: 'Warm', force: 0, dir: 'S', cover: 'No', precipitation: []},
            /* 05 */ {idx: 5, temp: 'Warm', night: 'Warm', force: 0, dir: 'SW', cover: 'Half', precipitation: ['Thunder']},
            /* 06 */ {idx: 6, temp: 'Warm', night: 'Cool', force: 0, dir: 'S', cover: 'Half', precipitation: []},
            /* 07 */ {idx: 7, temp: 'Cool', night: 'Cool', force: 1, dir: 'SW', cover: 'Full', precipitation: ['SteadyRain']},
            /* 08 */ {idx: 8, temp: 'Cool', night: 'Cool', force: 2, dir: 'NW', cover: 'Full', precipitation: ['Rain']},
            /* 09 */ {idx: 9, temp: 'Warm', night: 'Cool', force: 1, dir: 'SW', cover: 'Half', precipitation: []},
            /* 10 */ {idx: 10, temp: 'Warm', night: 'Cool', force: 1, dir: 'NW', cover: 'No', precipitation: []},
            /* 11 */ {idx: 11, temp: 'Warm', night: 'Cool', force: 1, dir: 'N', cover: 'No', precipitation: []},
            /* 12 */ {idx: 12, temp: 'Hot', night: 'Cool', force: 0, dir: 'NE', cover: 'No', precipitation: ['Fog']},
            /* 13 */ {idx: 13, temp: 'Hot', night: 'Warm', force: 0, dir: 'SE', cover: 'Half', precipitation: ['Thunder']},
            /* 14 */ {idx: 14, temp: 'Warm', night: 'Cool', force: 0, dir: 'S', cover: 'Half', precipitation: []},
            /* 15 */ {idx: 15, temp: 'Warm', night: 'Warm', force: 0, dir: 'SW', cover: 'Half', precipitation: []},
            /* 16 */ {idx: 16, temp: 'Warm', night: 'Cool', force: 1, dir: 'SW', cover: 'Half', precipitation: []},
            /* 17 */ {idx: 17, temp: 'Cool', night: 'Cool', force: 2, dir: 'SW', cover: 'Full', precipitation: []},
            /* 18 */ {idx: 18, temp: 'Cool', night: 'Cool', force: 1, dir: 'SW', cover: 'Full', precipitation: ['Rain']},
            /* 19 */ {idx: 19, temp: 'Cool', night: 'Cool', force: 1, dir: 'SW', cover: 'Full', precipitation: ['SteadyRain']},
            /* 20 */ {idx: 20, temp: 'Cold', night: 'Cold', force: 0, dir: 'NW', cover: 'Full', precipitation: ['SteadyRain']}
        ],
        Autumn: [
            /* 01 */ {idx: 1, temp: 'Cool', night: 'Cold', force: 0, dir: 'N', cover: 'No', precipitation: ['Fog']},
            /* 02 */ {idx: 2, temp: 'Warm', night: 'Cool', force: 0, dir: 'N', cover: 'Half', precipitation: []},
            /* 03 */ {idx: 3, temp: 'Warm', night: 'Cool', force: 0, dir: 'NE', cover: 'No', precipitation: ['Fog']},
            /* 04 */ {idx: 4, temp: 'Hot', night: 'Warm', force: 0, dir: 'SE', cover: 'No', precipitation: ['Fog']},
            /* 05 */ {idx: 5, temp: 'Hot', night: 'Warm', force: 0, dir: 'S', cover: 'Half', precipitation: ['Thunder']},
            /* 06 */ {idx: 6, temp: 'Warm', night: 'Warm', force: 0, dir: 'SW', cover: 'Full', precipitation: ['Rain']},
            /* 07 */ {idx: 7, temp: 'Cool', night: 'Cool', force: 1, dir: 'NW', cover: 'Full', precipitation: ['SteadyRain']},
            /* 08 */ {idx: 8, temp: 'Cold', night: 'Cold', force: 1, dir: 'SW', cover: 'Full', precipitation: ['SteadyRain']},
            /* 09 */ {idx: 9, temp: 'Cold', night: 'Cold', force: 2, dir: 'NW', cover: 'Full', precipitation: ['SteadyRain']},
            /* 10 */ {idx: 10, temp: 'Cold', night: 'Cold', force: 1, dir: 'N', cover: 'Full', precipitation: []},
            /* 11 */ {idx: 11, temp: 'Cold', night: 'Cold', force: 2, dir: 'N', cover: 'Full', precipitation: []},
            /* 12 */ {idx: 12, temp: 'Cool', night: 'Cool', force: 1, dir: 'NE', cover: 'Full', precipitation: ['Rain']},
            /* 13 */ {idx: 13, temp: 'Warm', night: 'Cool', force: 0, dir: 'SE', cover: 'Half', precipitation: ['Fog']},
            /* 14 */ {idx: 14, temp: 'Cool', night: 'Cool', force: 1, dir: 'S', cover: 'Full', precipitation: ['SteadyRain']},
            /* 15 */ {idx: 15, temp: 'Cool', night: 'Cool', force: 2, dir: 'SW', cover: 'Full', precipitation: []},
            /* 16 */ {idx: 16, temp: 'Warm', night: 'Cool', force: 1, dir: 'S', cover: 'Half', precipitation: ['Rain']},
            /* 17 */ {idx: 17, temp: 'Warm', night: 'Cool', force: 1, dir: 'SW', cover: 'No', precipitation: []},
            /* 18 */ {idx: 18, temp: 'Cool', night: 'Cold', force: 2, dir: 'NW', cover: 'Half', precipitation: []},
            /* 19 */ {idx: 19, temp: 'Cold', night: 'Frzg', force: 2, dir: 'SW', cover: 'Full', precipitation: ['Snow']},
            /* 20 */ {idx: 20, temp: 'Frzg', night: 'Frzg', force: 1, dir: 'NW', cover: 'Half', precipitation: []}
        ],
        Winter: [
            /* 01 */ {idx: 1, temp: 'Cold', night: 'Frzg', force: 0, dir: 'N', cover: 'Full', precipitation: ['SteadySnow']},
            /* 02 */ {idx: 2, temp: 'Frzg', night: 'Frzg', force: 1, dir: 'NW', cover: 'Full', precipitation: ['Snow']},
            /* 03 */ {idx: 3, temp: 'Cold', night: 'Cold', force: 2, dir: 'N', cover: 'Full', precipitation: []},
            /* 04 */ {idx: 4, temp: 'Cool', night: 'Cold', force: 1, dir: 'NE', cover: 'Half', precipitation: []},
            /* 05 */ {idx: 5, temp: 'Warm', night: 'Cold', force: 0, dir: 'SE', cover: 'No', precipitation: ['Fog']},
            /* 06 */ {idx: 6, temp: 'Cool', night: 'Frzg', force: 0, dir: 'S', cover: 'Half', precipitation: ['Rain']},
            /* 07 */ {idx: 7, temp: 'Cold', night: 'Cold', force: 1, dir: 'SW', cover: 'Full', precipitation: ['SteadyRain']},
            /* 08 */ {idx: 8, temp: 'Cold', night: 'Cold', force: 0, dir: 'NW', cover: 'Full', precipitation: ['Snow']},
            /* 09 */ {idx: 9, temp: 'Cool', night: 'Cool', force: 1, dir: 'SW', cover: 'Full', precipitation: ['Rain']},
            /* 10 */ {idx: 10, temp: 'Cold', night: 'Cold', force: 1, dir: 'NW', cover: 'Full', precipitation: ['Snow']},
            /* 11 */ {idx: 11, temp: 'Cold', night: 'Cold', force: 2, dir: 'N', cover: 'Full', precipitation: ['SteadySnow']},
            /* 12 */ {idx: 12, temp: 'Frzg', night: 'Frzg', force: 1, dir: 'N', cover: 'Full', precipitation: []},
            /* 13 */ {idx: 13, temp: 'Cool', night: 'Frzg', force: 2, dir: 'NE', cover: 'No', precipitation: []},
            /* 14 */ {idx: 14, temp: 'Cool', night: 'Cold', force: 1, dir: 'SE', cover: 'Half', precipitation: []},
            /* 15 */ {idx: 15, temp: 'Cool', night: 'Frzg', force: 1, dir: 'S', cover: 'No', precipitation: []},
            /* 16 */ {idx: 16, temp: 'Cool', night: 'Cold', force: 2, dir: 'SW', cover: 'Half', precipitation: ['Rain']},
            /* 17 */ {idx: 17, temp: 'Cold', night: 'Frzg', force: 1, dir: 'NW', cover: 'Full', precipitation: ['SteadySnow']},
            /* 18 */ {idx: 18, temp: 'Cold', night: 'Cold', force: 2, dir: 'SW', cover: 'Full', precipitation: ['Snow']},
            /* 19 */ {idx: 19, temp: 'Cold', night: 'Cold', force: 1, dir: 'SW', cover: 'Half', precipitation: []},
            /* 20 */ {idx: 20, temp: 'Cold', night: 'Cold', force: 1, dir: 'NW', cover: 'Full', precipitation: []}
        ]
    },

    subartic: {spring: [], summer: [], autumn: [], winter: []}
};
