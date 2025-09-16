import {ItemType} from '../../hm3-types';
import {ActorProxy} from './actor-proxy';

export class ContainerProxy extends ActorProxy {
    /**
     * @type {{max: number,pct: number, value: number}}
     */
    get capacity() {
        const max = this._actor.system.capacity.max;
        const value = this.totalGearWeight;
        let pct = Math.round(((max - value) / (max || 1)) * 100);
        pct = Math.max(Math.min(pct, 100), 0); // ensure value is between 0 and 100 inclusive)

        return {max, pct, value};
    }

    get containers() {
        // Setup the fake container entry for "Content" container
        const containers = {
            'on-person': {
                'name': 'Content',
                'type': ItemType.CONTAINERGEAR,
                'container': 'on-person',
                'collapsed': this.actor.getFlag('hm3', 'onPersonContainerCollapsed') || false,
                'capacity': {
                    'max': this.capacity.max,
                    'value': this.capacity.value
                }
            }
        };

        this.proxies.forEach((item) => {
            if (item.type === ItemType.CONTAINERGEAR) {
                containers[item.id] = item;
            }
        });

        return containers;
    }
}
