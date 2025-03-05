import "colors";
import yargs from "yargs";

import { chaos, order } from "./commands/chaos";
import { checkSorting, checkSubgraphCmd, dumpTrovesCmd } from "./commands/checks";
import { warzone } from "./commands/warzone";

const wrapCmd =
  <A extends unknown[], R>(cmd: (...args: A) => Promise<R>) =>
  async (...args: A) => {
    try {
      return await cmd(...args);
    } catch (error) {
      console.error(error);
    }
  };

yargs
  .scriptName("npm run fuzzer")

  .command(
    "warzone",
    "Create lots of Troves.",
    {
      troves: {
        alias: "n",
        default: 1000,
        description: "Number of troves to create"
      }
    },
    wrapCmd(warzone)
  )

  .command(
    "chaos",
    "Try to break the protocol by randomly interacting with it.",
    {
      users: {
        alias: "u",
        default: 40,
        description: "Number of users to spawn"
      },
      rounds: {
        alias: "n",
        default: 25,
        description: "How many times each user should interact with the protocol"
      },
      subgraph: {
        alias: "g",
        default: false,
        description: "Check after every round that subgraph data matches layer 1"
      }
    },
    wrapCmd(chaos)
  )

  .command(
    "order",
    "End chaos and restore order by liquidating every Trove except the Funder's.",
    {},
    wrapCmd(order)
  )

  .command("check-sorting", "Check if Troves are sorted by ICR.", {}, wrapCmd(checkSorting))

  .command(
    "check-subgraph",
    "Check that subgraph data matches layer 1.",
    {},
    wrapCmd(checkSubgraphCmd)
  )

  .command("dump-troves", "Dump list of Troves.", {}, wrapCmd(dumpTrovesCmd))

  .strict()
  .demandCommand()
  .wrap(null)
  .parse();
