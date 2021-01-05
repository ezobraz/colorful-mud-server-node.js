const Color = require('../common/color');

module.exports = class Entity {
    constructor(params = {}) {
        this.props = params;
    }

    get dictionary() {
        return {
            createdOn: {
                type: Date,
                default: null,
            },
        }
    }

    get props() {
        const res = {};

        for (let i in this.dictionary) {
            res[i] = this[i];
        }

        return res;
    }

    set props(params) {
        for (let i in this.dictionary) {
            const dic = this.dictionary[i];
            let val = params[i];

            if (val) {
                if (dic.type === Number) {
                    val = parseFloat(val);
                }

                if (dic.type === String) {
                    val = val.toString();
                }

                if (dic.type === Date) {
                    val = new Date(val);
                }

                if (dic.options && !dic.options.includes(val)) {
                    val = dic.default;
                }

            } else {
                val = dic.default;

                if (!val && dic.type === Date) {
                    val = Date.now();
                }
            }

            this[i] = val;
        }
    }
};
