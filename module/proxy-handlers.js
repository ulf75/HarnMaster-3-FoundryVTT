// @ts-check

/**
 *
 * @param {*} api
 * @param {string} name
 * @returns {Proxy}
 */
function createCachingHandler(api, name) {
    const cache = new Map();
    const cacheTTL = 200; // [ms]

    return new Proxy(api, {
        /**
         *
         * @param {Object} target
         * @param {string} property
         * @param {*} receiver
         * @returns
         */
        get(target, property, receiver) {
            if (typeof target[property] === 'function') return Reflect.get(target, property);

            const now = Date.now();

            // Check if we have a valid cached response
            if (cache.has(property)) {
                const {data, timestamp} = cache.get(property);

                // If the cache is still fresh, use it
                if (now - timestamp < cacheTTL) {
                    console.info(`HM3 | Using cached data for actor ${name} ${property} by ${target[property]}`);
                    return data;
                } else {
                    console.info(`HM3 | Cache expired for ${property}`);
                }
            }

            // Otherwise, call the actual API
            console.info(`HM3 | Fetching data for actor ${name} ${property} by ${target[property]}`);
            const data = Reflect.get(target, property);

            // Cache the response
            cache.set(property, {
                data,
                timestamp: now
            });

            return data;
        }
    });
}
