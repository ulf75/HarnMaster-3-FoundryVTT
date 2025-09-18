// @ts-check
import axios from '../node_modules/axios/index';

const API_KEY = 'xxxxxxxxxxxxxxxx';

export async function googleTranslate(text) {
    let res = await axios.post(`https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`, {
        q: text,
        target: 'tr'
    });
    let translation = res.data.data.translations[0].translatedText;
    return translation;
}
