import fetch from 'node-fetch';
import { endOfMonth, format, startOfMonth, startOfToday, subMonths } from 'date-fns';

export async function getAccountBalance(token, budgetId, accountId) {
    const response = await fetch(
        `https://api.youneedabudget.com/v1/budgets/${budgetId}/accounts/${accountId}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    );

    const { data } = await response.json();

    return data.account.balance;
}

export async function setAccountBalance(token, budgetId, accountId, balance) {
    const currentBalance = await getAccountBalance(token, budgetId, accountId);
    const transaction = (await getAccountTransactions(token, budgetId, accountId))?.[0];

    if (!transaction) {
        const response = await createTransaction(token, budgetId, accountId, balance - currentBalance);
        console.log(response, await response.json());
        return;
    }

    const response = await updateTransaction(
        token,
        budgetId,
        accountId,
        transaction.id,
        Math.floor(balance - (currentBalance - transaction.amount)),
    );

    console.log(response, await response.json());
}

export async function getAccountTransactions(token, budgetId, accountId) {
    const date = format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd');

    const response = await fetch(
        `https://api.youneedabudget.com/v1/budgets/${budgetId}/accounts/${accountId}/transactions?since_date=${date}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    );

    const { data } = await response.json();

    return data.transactions;
}

export async function updateTransaction(token, budgetId, accountId, transactionId, amount) {
    return await fetch(
        `https://api.youneedabudget.com/v1/budgets/${budgetId}/transactions/${transactionId}`,
        {
            method: 'PUT',
            body: JSON.stringify({
                transaction: {
                    account_id: accountId,
                    amount,
                }
            }),
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        },
    );
}

export async function createTransaction(token, budgetId, accountId, amount) {
    const inflowCategory = await getInflowCategory(token, budgetId);

    return await fetch(
        `https://api.youneedabudget.com/v1/budgets/${budgetId}/transactions`,
        {
            method: 'POST',
            body: JSON.stringify({
                transaction: {
                    date: format(startOfMonth(startOfToday()), 'yyyy-MM-dd'),
                    cleared: 'cleared',
                    approved: true,
                    account_id: accountId,
                    category_id: inflowCategory.id,
                    amount,
                },
            }),
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        },
    );
}

export async function getInflowCategory(token, budgetId) {
    const response = await fetch(
        `https://api.youneedabudget.com/v1/budgets/${budgetId}/categories`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    );

    const { data } = await response.json();

    return data.category_groups
        .find(
            group => group.categories.some(
                category => category.name === 'Inflow: Ready to Assign',
            ),
        )
        .categories
        .find(category => category.name === 'Inflow: Ready to Assign');
}
