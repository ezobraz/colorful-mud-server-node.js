const Config = __require('core/config');

const lineLength = Config.get('format.lineLength');
const currency = Config.get('currency');
const currencyKeys = Object.keys(currency);

const alias = {
    // normal
    'cs': '[30m', // black
    'cr': '[31m', // red
    'cg': '[32m', // green
    'cy': '[33m', // yellow
    'cb': '[34m', // blue
    'cm': '[35m', // magenta
    'cc': '[36m', // cyan
    'cw': '[37m', // white,

    // bright
    'cS': '[30m', // bright black
    'cR': '[31m', // bright red
    'cG': '[32m', // bright green
    'cY': '[33m', // bright yellow
    'cB': '[34m', // bright blue
    'cM': '[35m', // bright magenta
    'cC': '[36m', // bright cyan
    'cW': '[37m', // bright white,

    // background normal
    'bs': '[40m', // black
    'br': '[41m', // red
    'bg': '[42m', // green
    'by': '[43m', // yellow
    'bb': '[44m', // blue
    'bm': '[45m', // magenta
    'bc': '[46m', // cyan
    'bw': '[47m', // white,

    // background bright
    'bS': '[40m;1m', // bright black
    'bR': '[41m;1m', // bright red
    'bG': '[42m;1m', // bright green
    'bY': '[43m;1m', // bright yellow
    'bB': '[44m;1m', // bright blue
    'bM': '[45m;1m', // bright magenta
    'bC': '[46m;1m', // bright cyan
    'bW': '[47m;1m', // bright white,

    // styles
    'b': '[1m',
    'u': '[4m',
    'r': '[7m',

    // reset
    '/': '[0m',
};

const imgSymbols = {
    'S': alias['bs'], // black
    'R': alias['br'], // red
    'G': alias['bg'], // green
    'Y': alias['by'], // yellow
    'B': alias['bb'], // blue
    'M': alias['bm'], // magenta
    'C': alias['bc'], // cyan
    'W': alias['bw'], // white,
};

const clearStr = str => {
    if (!str) {
        return '';
    }

    str = str.toString();

    for (let symbol in alias) {
        str = str.replace(new RegExp(`\u001b\\${alias[symbol]}`, 'g'), '');
    }

    return str;
};

const parse = text => {
    if (!text) {
        return '';
    }

    text = text.toString();

    for (let symbol in alias) {
        text = text.replace(new RegExp(`\\[${symbol}\\]`, 'g'), '\u001b' + alias[symbol]);
    }

    return text;
};

const formatScaleNumber = i => {
    const scaleColor = [
        'W',
        'G',
        'B',
        'C',
        'Y',
        'M',
        'R',
    ];

    let number = i;
    let color = scaleColor[Math.floor(Math.ceil(number) / 10)];

    if (number / 10 >= 1) {
        number = number - number + number % 10;
    }

    return parse(`[r][c${color}]${number}[/]`);
};

const wrap = text => {
    const res = text.split(' ');
    let chunks = [];
    let lastChunk = 0;

    res.forEach((word, i) => {
        if (word) {
            if (!chunks[lastChunk]) {
                chunks[lastChunk] = [];
            }

            const line = chunks[lastChunk].join(' ');

            if (line.length + word.length > lineLength) {
                lastChunk += 1;
                chunks[lastChunk] = [];
            }

            chunks[lastChunk].push(word);
        }
    });

    chunks = chunks.map(line => line.join(' '));

    return chunks.join('\r\n');
};

const list = (arr, cols = 1, separator = ' ') => {
    let res = [
        [],
    ];

    const cellLength = Math.max(...arr.map(o => clearStr(o).length), 0);

    let lastCol = 0;

    arr.forEach(item => {
        if (res[lastCol].length >= cols) {
            lastCol++;
            res[lastCol] = [];
        }

        let add = cellLength - clearStr(item).length;
        let addStr = new Array(add + 1).join(' ');

        res[lastCol].push(`${item}${addStr}`);
    });

    res = res.map(line => line.join(separator));

    return res;
};

const dottedList = ({ data = [], length = 0, cols = 1, symbol = '.', separator = ' ' }) => {
    if (!length) {
        length = lineLength / 2 - separator.length;
    }

    data = data.map(item => {
        const cleanName = clearStr(item[0]);
        const cleanData = clearStr(item[1]);

        let add = length - cleanName.length - cleanData.length;
        let addStr = new Array(add + 1).join(symbol);

        return `${item[0]}${addStr}${item[1]}`;
    });

    return list(data, cols, separator);
};

const align = ({ symbol = ' ', length = lineLength, text = '', align = 'center' }) => {
    let start = 0;

    const cleanStr = clearStr(text);

    if (text && align == 'center') {
        start = Math.floor(length / 2 - cleanStr.length / 2);
    } else if (text && align == 'right') {
        start = length - cleanStr.length;
    }

    const res = new Array(length + text.length - cleanStr.length).join(symbol).split('');

    if (text) {
        for (var i in text) {
            res[start + parseInt(i)] = text[i];
        }
    }

    return res.join('');
};

const img = (imgArr, numeral = false) => {
    if (!imgArr) {
        return;
    }

    if (typeof imgArr === 'string') {
        imgArr = [imgArr];
    }

    if (!imgArr.length) {
        return;
    }

    let length = 8;

    for (let i = 0; i < imgArr.length; i++) {
        if (!imgArr[i]) {
            imgArr[i] = ' ';
        }
    }

    imgArr = imgArr.map(line => {
        if (line.length > length) {
            length = line.length;
        }

        for (let symbol in imgSymbols) {
            line = line.replace(new RegExp(symbol, 'g'), '\u001b' + imgSymbols[symbol] + ' ' + '\u001b' + alias['/']);
        }

        return line;
    });

    if (numeral) {
        imgArr = imgArr.map((line, i) => {
            return `${formatScaleNumber(i)}${line}`
        });

        let line = parse(`[r][cW] [/]`) +
            Array.from(Array(length).keys()).map(i => formatScaleNumber(i)).join('');

        imgArr.unshift(line);
        imgArr.push(line);
    }

    return imgArr.join('\r\n');
};

const progress = ({ bgColor = 'bb', textColor = 'cw', val = 0, max = 100 }) => {
    let percent = Math.round(val * 100 / max);
    let percentBar = Math.round(percent / 10);
    let percentStr = `${val}/${max}`;

    let str = '';

    for (let i = 1; i <= 10; i++) {
        let rBg = i <= percentBar ? bgColor : 'bw';
        let rColor = rBg == 'bw' ? 'cs' : textColor;

        if (i >= 2 && percentStr.length >= i - 1) {
            str += parse(`[${rBg}][${rColor}]${percentStr[i - 2]}[/]`);
            continue;
        }

        str += parse(`[${rBg}] [/]`);
    }

    return str;
};

const table = ({ title = null, color = 'cW', data }) => {
    // collect longest cols
    const colLengths = [];
    data = data.map(row => row.map((col, colIndx) => {
        col = col || '';

        let str = clearStr(col);

        const length = str.length + 3;

        if (!colLengths[colIndx] || colLengths[colIndx] < length) {
            colLengths[colIndx] = length;
        }

        return {
            display: col.toString(),
            clean: str,
        }
    }));

    const rowLine = colLengths.reduce((a,b) => a + b, 0);
    const res = [];

    if (title) {
        res.push(...[
            ' ' + new Array(rowLine).join('_'),
            '|' + new Array(rowLine).join(' ') + '|',
            '|' + parse(`[b][${color}]${ align({ text: title, length: rowLine }) }[/]`) + '|',
            '|' + new Array(rowLine).join('_') + '|',
        ]);
    }

    // draw row
    const rowSep = new Array(rowLine).join('_');
    data.forEach((row, rowIndx) => {
        const l2 = '|' + row.map((col, colIndx) => {
            const length = colLengths[colIndx];
            let str = new Array(length).join(' ');
            return str;
        }).join('|') + '|';

        const l3 = '|' + row.map((col, colIndx) => {
            const length = colLengths[colIndx];
            const displayStr = col.display;
            const cleanStr = col.clean;

            const arr = new Array(length + (displayStr.length - cleanStr.length)).join(' ').split('');

            for (let i in displayStr) {
                arr[1 + parseInt(i)] = displayStr[i];
            }

            return arr.join('');
        }).join('|') + '|';

        const l4 = '|' + row.map((col, colIndx) => {
            const length = colLengths[colIndx];
            return new Array(length).join('_');
        }).join('|') + '|';

        const tmp = [];

        if (!title && rowIndx === 0) {
            res.push(` ${rowSep}`);
        }

        res.push(...[
            l2,
            l3,
            l4,
        ]);
    });

    return res;
};

const price = value => {
    value = parseFloat(value);

    if (!value) {
        const key = currencyKeys[currencyKeys.length -1];
        const color = currency[key];
        return `[b][${color}]0[/]`;
    }

    const res = [];

    if (currencyKeys.length === 1) {
        res[0] = value;
    } else {
        currencyKeys.forEach((key, i) => {
            if (i === 0) {
                res[i] = parseInt(Math.floor(value / 100));
            } else if (i === 1) {
                res[i] = parseInt(Math.floor(value - res[0] * 100));
            } else {
                res[i] = parseInt((value - (res[0] * 100) - res[1] ) * 100);
            }
        });
    }

    return res.map((r, i) => {
        if (r) {
            const key = currencyKeys[i];
            const color = currency[key];
            return `[b][${color}]${r}${key.slice(0, 1)}[/]`;
        }
    }).filter(i => i).join(' ');
};

module.exports = {
    parse,
    wrap,
    list,
    dottedList,
    align,
    img,
    progress,
    table,
    price,
};
