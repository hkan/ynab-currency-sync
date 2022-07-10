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
    .demandOption(['token', 'source', 'target'])
    .parse();

const token = argv.token;
const [ sourceBudgetId, sourceAccountId ] = argv.source.split('/');
const [ targetBudgetId, targetAccountId ] = argv.target.split('/');

const exchangeRate = await fetchExchangeRate();
const sourceBalance = await getAccountBalance(token, sourceBudgetId, sourceAccountId);

console.log(`Source balance is ${sourceBalance / 1000} EUR.`);

const targetBalance = sourceBalance * exchangeRate;

console.log(`Target balance will be ${targetBalance / 1000} TRY.`);

await setAccountBalance(token, targetBudgetId, targetAccountId, targetBalance);
