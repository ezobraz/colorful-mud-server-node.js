/**
* @namespace Locations
*/

const { Debug, Broadcaster } = __require('core/tools');
const Model = __require('core/model');
const Store = __require('core/store');
const Dictionary = __require('core/dictionary');
const Base = require('../base');

/**
* Base Location
*
* @memberof Locations
*/
class Location extends Base {
    constructor(params = {}) {
        super(params);

        this._id = params._id || null;
        this.img = params.img || [];
        this.name = params.name || 'Unknown';
        this.desc = params.desc || null;
        this.single = params.single || false;
        this.locked = params.locked || false;
        this.ownerId = params.ownerId || null;
        this.items = params.items || [];
        this.exits = params.exits || [];

        this.initItems();
    }

    get players() {
        return Store.findAll('players', 'locationId', this._id);
    }

    get color() {
        return 'cW';
    }

    get displayName() {
        return `[${this.color}]${this.name}[/]`;
    }

    async create() {
        if (this._id) {
            return;
        }

        const params = this.props;
        delete params._id;

        let res = await Model.mutations('locations/create', {
            ...params,
            code: this.name.toLowerCase(),
        });

        if (res) {
            for (let i in res) {
                this[i] = res[i];
            }
        }

        return res;
    }

    async exists() {
        if (!this.name) {
            return;
        }

        return await Model.getters('locations/findOne', {
            code: this.name.toLowerCase(),
        });
    }

    async save() {
        if (!this._id) {
            return;
        }

        await Model.mutations('locations/save', {
            ...this.props,
        });
    }

    async remove() {
        if (this.players.length) {
            return;
        }

        // call db

        Store.remove('locations', this);
    }

    initItems() {
        this.items = this.items.map(data => {
            const obj = Dictionary.get('items', data.class.toLowerCase());
            return new obj(data);
        });
    }

    addItem(item) {
        this.items.push(item);
    }

    removeItem(item) {
        this.items = this.items.filter(i => i !== item);
    }

    addExit(id) {
        if (this.exits.find(exit => exit === id)) {
            return;
        }

        this.exits.push(id);
    }

    removeExit(id) {
        this.exits = this.exits.filter(exit => exit !== id);
    }

    notifyAll({ text, exclude = null}) {
        this.players.forEach(ply => {
            if (ply !== exclude) {
                Broadcaster.sendTo({
                    to: ply,
                    text,
                });
            }
        });
    }
};

module.exports = Location;