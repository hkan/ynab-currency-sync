import fetch from 'node-fetch';

export default async () => {
    const response = await fetch('https://www.qnbfinansbank.enpara.com/hesaplar/doviz-ve-altin-kurlari');
    const data = await response.text();

    return parseFloat(
        data
            .match(/<span>EUR \(€\)<\/span>\s*(\\n)?\s*<span>([0-9,]+) TL<\/span>/m)[2]
            .replace(',', '.')
    );
}
