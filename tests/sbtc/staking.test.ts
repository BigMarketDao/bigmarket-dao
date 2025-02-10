import { describe, expect, it } from "vitest";
import { boolCV, Cl, listCV, noneCV, principalCV, stringAsciiCV, uintCV } from "@stacks/transactions";
import { constructDao, metadataHash, setupSimnet, sbtcToken } from "../helpers";
import { bufferFromHex } from "@stacks/transactions/dist/cl";
import { createBinaryMarket, predictCategory } from "../categorical/categorical.test";

const simnet = await setupSimnet();
const accounts = simnet.getAccounts();
const alice = accounts.get("wallet_1")!;
const bob = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

/*
  The test below is an example. Learn more in the clarinet-sdk readme:
  https://github.com/hirosystems/clarinet/blob/develop/components/clarinet-sdk/README.md
*/

describe("prediction errors", () => {
  it("user can't commit more than their balance", async () => {
    constructDao(simnet);
    let response = await createBinaryMarket(0, deployer, sbtcToken);
    response = await predictCategory(alice, 0, 'yay', 9007199254740990, 10011, sbtcToken);
  });

  it("err-already-concluded", async () => {
    constructDao(simnet);
    let response = await createBinaryMarket(0, deployer, sbtcToken);
    expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
    response = await predictCategory(alice, 0, 'yay', 1000000, 1, sbtcToken);
    // conclude
    response = await simnet.callPublicFn(
      "bde023-market-predicting",
      "resolve-market",
      [Cl.uint(0), Cl.stringAscii('yay')],
      bob
    );
    expect(response.result).toEqual(Cl.ok(Cl.uint(1)));

    response = await predictCategory(alice, 0, 'yay', 1000000, 10018, sbtcToken);
  });
});

describe("prediction fees and stakes", () => {
  it("user transfers exact stake", async () => {
    constructDao(simnet);
    let balances = simnet.getAssetsMap().get("STX");
    // console.log("prediction fees and stakes:", balances);

    let response = await createBinaryMarket(0, deployer, sbtcToken);
    expect(response.result).toEqual(Cl.ok(Cl.uint(0)));
    response = await predictCategory(alice, 0, 'yay', 2000000, 1, sbtcToken);
    balances = simnet.getAssetsMap().get("STX");

    response = await predictCategory(bob, 0, 'nay', 10000000, 0, sbtcToken);
    const data = await simnet.callReadOnlyFn(
      "bde023-market-predicting",
      "get-market-data",
      [Cl.uint(0)],
      alice
    );
    expect(data.result).toEqual(
      Cl.some(
        Cl.tuple({
          creator: principalCV(deployer),
          "market-data-hash": bufferFromHex(metadataHash()),
          "stakes": listCV([uintCV(9900000n), uintCV(1980000n), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
          "categories": listCV([stringAsciiCV('nay'), stringAsciiCV('yay')]),
          "outcome": noneCV(),
          "resolution-burn-height": uintCV(0),
          "resolution-state": uintCV(0),
          "market-fee-bips": uintCV(0),
          concluded: boolCV(false),
          token: Cl.contractPrincipal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM","sbtc"),
          treasury: Cl.contractPrincipal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM","bde022-market-gating")
        })
      )
    );
  });

  it("fees are collected up front from prediction stakes", async () => {
    constructDao(simnet);
    let response = await createBinaryMarket(0, deployer, sbtcToken);
    response = await predictCategory(alice, 0, 'yay', 2000000, 1, sbtcToken);
    response = await predictCategory(bob, 0, 'nay', 10000000, 0, sbtcToken);
    const data = await simnet.callReadOnlyFn(
      "bde023-market-predicting",
      "get-market-data",
      [Cl.uint(0)],
      alice
    ); 
    expect(data.result).toEqual(
      Cl.some(
        Cl.tuple({
          creator: principalCV(deployer),
          "stakes": listCV([uintCV(9900000n), uintCV(1980000n), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0), uintCV(0)]),
          "categories": listCV([stringAsciiCV('nay'), stringAsciiCV('yay')]),
          "outcome": noneCV(),
          "market-data-hash": bufferFromHex(metadataHash()),
          "resolution-burn-height": uintCV(0),
          "resolution-state": uintCV(0),
          "market-fee-bips": uintCV(0),
          concluded: boolCV(false),
          token: Cl.contractPrincipal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM","sbtc"),
          treasury: Cl.contractPrincipal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM","bde022-market-gating")
        })
      )
    );
  });

  it("alice hedges yes and no", async () => {
    constructDao(simnet);
    let response = await createBinaryMarket(0, deployer, sbtcToken);
    response = await predictCategory(alice, 0, 'yay', 2000000, 1, sbtcToken);

    // check stake
    let aliceStake = simnet.getMapEntry(
      "bde023-market-predicting",
      "stake-balances",
      Cl.tuple({
        "market-id": uintCV(0),
        user: principalCV(alice),
      })
    );
    expect(aliceStake).toEqual(
      Cl.some(
        Cl.list([Cl.uint(0), Cl.uint(1980000n), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0)])
      ) 
    ); 

  response = await predictCategory(alice, 0, 'nay', 4000000, 0, sbtcToken);

    aliceStake = simnet.getMapEntry( 
      "bde023-market-predicting",
      "stake-balances",
      Cl.tuple({
        "market-id": uintCV(0),
        user: principalCV(alice),
      })
    );
    expect(aliceStake).toEqual(
      Cl.some(
        Cl.list([Cl.uint(3960000n), Cl.uint(1980000n), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0)])
      )
    );
  });
});
