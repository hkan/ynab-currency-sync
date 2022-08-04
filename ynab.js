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
        if (global.VERBOSE_LEVEL > 0) {
            console.log(`No existing transaction, creating new one with balance ${(balance - currentBalance) / 1000}`);
        }

        await createTransaction(token, budgetId, accountId, Math.floor(balance - currentBalance));
        return;
    }

    if (global.VERBOSE_LEVEL > 0) {
        console.log(`Updating existing transaction. Current balance: ${currentBalance / 1000}, new balance: ${(balance - currentBalance) / 1000}`);
    }

    await updateTransaction(
        token,
        budgetId,
        accountId,
        transaction.id,
        balance - (currentBalance - transaction.amount),
    );
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


    if (response.status >= 300) {
        const error = new Error('Fetching account transactions failed.');
        error.response = response;
        throw error;
    }

    const { data } = await response.json();

    return data.transactions;
}

export async function updateTransaction(token, budgetId, accountId, transactionId, amount) {
    const response = await fetch(
        `https://api.youneedabudget.com/v1/budgets/${budgetId}/transactions/${transactionId}`,
        {
            method: 'PUT',
            body: JSON.stringify({
                transaction: {
                    account_id: accountId,
                    amount,
                },
            }),
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        },
    );

    if (response.status >= 300) {
        const error = new Error('Transaction update failed.');
        error.response = response;
        throw error;
    }

    return response;
}

export async function createTransaction(token, budgetId, accountId, amount) {
    const inflowCategory = await getInflowCategory(token, budgetId);

    const response = await fetch(
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

    if (response.status >= 300) {
        const error = new Error('Transaction creation failed.');
        error.response = response;
        throw error;
    }

    return response;
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
