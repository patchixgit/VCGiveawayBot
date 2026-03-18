**VCGiveawayBot**

---

For ultimate transparency, Patware LLC is open sourcing our Giveaway bot. [https://patchix.vip](https://patchix.vip).

This is licensed under the Apache 2.0 License. Please review the LICENSE file and abide by the terms.

---
## Setting up the bot

* Add your .env variables. An example .env file is shown below.

```
DISCORD_TOKEN="YourTokenHere"
```

* Install modules. 
  * This is only tested with `bun`, however, you may use `npm` or `pnpm` if you'd like. (we do not guarantee this will work)

* Run the bot.
  * Please use `bun` when running the bot; `npm` and others are not supported, please do not use them.

```bash

bun install
bun run index.ts

```

## Creating issues / PRs

When creating issues, please describe:

* The issue in 1–2 sentences.
* Steps to reproduce the said bug.
* The expected behaviour.
* Your execution enviornment (we only support bun)

When creating PRs, please outline:

* Is this an enhancement, or does this fix a bug?
* Which bug does this fix? What does this enhance?
* Any extra information.

We will not be accepting any PRs that affect cosmetic files (e.g., README.md).