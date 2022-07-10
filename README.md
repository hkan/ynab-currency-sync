# YNAB currency sync

This is a simple script to synchronize a YNAB budget's balance to an account
in another budget. It has started from my personal issue of having to keep
multiple budgets with different currencies, and not getting a good Age of Money
track.

## Usage

```shell
$ node ./index.js --source "{budget-id}/{account-id}" --target "{budget-id}/{account-id}"
```

## Known issues

- It does not support multiple source accounts or the whole source budget. Plan is to introduce that.
