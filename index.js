import chalk from 'chalk';
import yargs from 'yargs/yargs';
import { getAccountBalance, setAccountBalance } from './ynab.js';
import fetchExchangeRate from './fetch-exchange-rate.js';

const argv = yargs(process.argv.slice(2))
    .usage('Usage: $0 --token [ynab-token] --source "[budget-uuid]/[account-uuid]" --target "[budget-uuid]/[account-uuid]"')
    .check(argv => {
        const valid = argv.source?.indexOf('/') > -1
            && argv.target?.indexOf('/') > -1;

        if (valid) {
            return true;
        }

        throw new Error('Parameters must be in [budget-uuid]/[account-uuid] format.');
    })
    .count('verbose')
    .alias('v', 'verbose')
    .demandOption(['token', 'source', 'target'])
    .parse();

global.VERBOSE_LEVEL = argv.verbose;
const token = argv.token;
const [ sourceBudgetId, sourceAccountId ] = argv.source.split('/');
const [ targetBudgetId, targetAccountId ] = argv.target.split('/');

const exchangeRate = await fetchExchangeRate();
const sourceBalance = await getAccountBalance(token, sourceBudgetId, sourceAccountId);

if (VERBOSE_LEVEL > 0) {
    console.log(`Source balance is ${sourceBalance / 1000} EUR.`);
}

const targetBalance = sourceBalance * exchangeRate;

if (VERBOSE_LEVEL > 0) {
    console.log(`Target balance will be ${targetBalance / 1000} TRY.`);
}

try {
    await setAccountBalance(token, targetBudgetId, targetAccountId, targetBalance);
} catch (e) {
    console.log(`Error: ${e?.message}`);

    if (e?.response && VERBOSE_LEVEL > 0) {
        console.log(await e.response.json())
    } else if (VERBOSE_LEVEL > 0) {
        console.log(e);
    }
}
