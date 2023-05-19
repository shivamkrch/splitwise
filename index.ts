import Splitwise, { SplitInfo, SplitType } from "./Splitwise";

function displayBalances() {
  const userBalances = splitWise.getBalances(true);
  if (userBalances.length === 0) console.log("\nNo balances");

  for (const { user, balances } of userBalances) {
    console.log(`\n${user.id} ${user.name}`);
    for (const { user: payer, amount } of balances) {
      console.log(`   ${payer.id} ${payer.name} -> ${amount}`);
    }
  }

  console.log("-----------------------------------");
}

function displayPassbook(userId: string) {
  console.log(`-------------- ${userId}'s PASSBOOK ----------------`);

  const passbook = splitWise.getUserPassbook(userId);
  for (const { name, payerId, amount, splitInfos, dateTime } of passbook) {
    console.log(
      `${name}: ${payerId} paid ${amount} for ${splitInfos
        .map((inf) => inf.userId)
        .join(
          ", "
        )} on ${dateTime.toLocaleDateString()} at ${dateTime.toLocaleTimeString()}`
    );
  }

  console.log(`----------------------------------------------------`);
}

const splitWise = new Splitwise(["Shivam", "Anshuman", "Vipul", "Shivendu"]);
displayBalances();

splitWise.addExpense("Electricity Bill", "u1", 1000, SplitType.EQUAL, [
  new SplitInfo("u1"),
  new SplitInfo("u2"),
  new SplitInfo("u3"),
  new SplitInfo("u4")
]);
displayBalances();

splitWise.addExpense("Online order", "u1", 1250, SplitType.EXACT, [
  new SplitInfo("u2", 370),
  new SplitInfo("u3", 880)
]);
displayBalances();

splitWise.addExpense("Restaurant", "u4", 1200, SplitType.PERCENT, [
  new SplitInfo("u1", 40),
  new SplitInfo("u2", 20),
  new SplitInfo("u3", 20),
  new SplitInfo("u4", 20)
]);
displayBalances();

displayPassbook("u1");
displayPassbook("u2");
displayPassbook("u3");
displayPassbook("u4");