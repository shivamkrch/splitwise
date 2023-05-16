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

const splitWise = new Splitwise(["Shivam", "Anshuman", "Vipul", "Shivendu"]);
displayBalances();

splitWise.addExpense("u1", 1000, SplitType.EQUAL, [
  new SplitInfo("u1"),
  new SplitInfo("u2"),
  new SplitInfo("u3"),
  new SplitInfo("u4")
]);
displayBalances();

splitWise.addExpense("u1", 1250, SplitType.EXACT, [
  new SplitInfo("u2", 370),
  new SplitInfo("u3", 880)
]);
displayBalances();

splitWise.addExpense("u4", 1200, SplitType.PERCENT, [
  new SplitInfo("u1", 40),
  new SplitInfo("u2", 20),
  new SplitInfo("u3", 20),
  new SplitInfo("u4", 20)
]);
displayBalances();
