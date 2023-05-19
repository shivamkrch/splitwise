export enum SplitType {
  EQUAL = "EQUAL",
  EXACT = "EXACT",
  PERCENT = "PERCENT"
}

class User {
  private _id: string;
  private _name: string;

  constructor(id: string, name: string) {
    this._id = id;
    this._name = name;
  }

  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }
}

class PerUserBalance {
  private _user: User;
  private _amount: number;

  constructor(user: User, amt: number) {
    this._user = user;
    this._amount = amt;
  }

  get user() {
    return this._user;
  }

  get amount() {
    return this._amount;
  }
}

class UserBalance {
  private _user: User;
  private _balances: PerUserBalance[];

  constructor(user: User) {
    this._user = user;
    this._balances = [];
  }

  get user() {
    return this._user;
  }

  get balances() {
    return this._balances as Readonly<PerUserBalance[]>;
  }

  addPerUserBalance(user: User, amt: number) {
    this._balances.push(new PerUserBalance(user, amt));
  }
}

export class SplitInfo {
  private _userId: string;
  private _splitValue?: number;

  constructor(userId: string, splitValue?: number) {
    this._userId = userId;
    if (splitValue) this._splitValue = splitValue;
  }

  get userId() {
    return this._userId;
  }

  get splitValue() {
    return this._splitValue;
  }
}

class ExpenseInfo {
  private _name: string;
  private _payerId: string;
  private _amount: number;
  private _splitType: SplitType;
  private _splitInfos: SplitInfo[];
  private _dateTime: Date;

  constructor(
    name: string,
    payerId: string,
    amt: number,
    splitType: SplitType,
    splitInfos: SplitInfo[],
    dateTime?: Date
  ) {
    this._name = name;
    this._payerId = payerId;
    this._amount = amt;
    this._splitType = splitType;
    this._splitInfos = splitInfos;
    this._dateTime = dateTime ?? new Date();
  }

  get name() {
    return this._name;
  }

  get payerId() {
    return this._payerId;
  }

  get amount() {
    return this._amount;
  }

  get splitType() {
    return this._splitType;
  }

  get splitInfos() {
    return this._splitInfos;
  }

  get dateTime() {
    return this._dateTime;
  }
}

export default class Splitwise {
  private _users: Map<string, User>;
  private _balances: Map<string, Map<string, number>>;
  private _history: ExpenseInfo[];

  constructor(users: string[]) {
    this._users = new Map<string, User>();
    this._balances = new Map<string, Map<string, number>>();
    this._history = [];

    for (let i = 0; i < users.length; ++i) {
      const newUser = new User(`u${i + 1}`, users[i]);
      this._users.set(newUser.id, newUser);
      this._balances.set(newUser.id, new Map<string, number>());
    }
  }

  addExpense(
    name: string,
    payerId: string,
    amount: number,
    splitType: SplitType,
    splitInfos: SplitInfo[]
  ) {
    if (splitType === SplitType.EXACT || splitType === SplitType.PERCENT) {
      const totalSplitValue = splitInfos.reduce<number>(
        (prev, curr) => prev + (curr.splitValue ?? 0),
        0
      );
      if (splitType === SplitType.EXACT && totalSplitValue !== amount) {
        throw Error("Total split value should equal the amount");
      }
      if (splitType === SplitType.PERCENT && totalSplitValue !== 100) {
        throw Error("Total split value should be 100");
      }
    }
    for (let splitInfo of splitInfos) {
      if (splitInfo.userId === payerId) continue;

      let userBal = 0;
      switch (splitType) {
        case SplitType.EQUAL:
          userBal = parseFloat((amount / splitInfos.length).toFixed(2));
          break;
        case SplitType.EXACT:
          if (splitInfo.splitValue)
            userBal = parseFloat(splitInfo.splitValue.toFixed(2));
          else throw Error(`Split value required for ${splitType} split`);
          break;
        case SplitType.PERCENT:
          if (splitInfo.splitValue) {
            let bal = (amount * splitInfo.splitValue) / 100;
            userBal = parseFloat(bal.toFixed(2));
          } else
            throw Error(`Split percentage required for ${splitType} split`);
          break;
      }

      if (userBal > 0) {
        const payerBal = this._balances.get(payerId);
        const payerBalToUser = payerBal?.get(splitInfo.userId) ?? 0;
        if (payerBalToUser > 0) {
          userBal = payerBalToUser - userBal;
          payerBal?.set(splitInfo.userId, userBal < 0 ? 0 : userBal);
          this._balances.set(payerId, payerBal!);
        }

        const currUserBal = this._balances.get(splitInfo.userId);
        const userBalToPayer = currUserBal?.get(payerId) ?? 0;
        currUserBal?.set(payerId, userBalToPayer + Math.abs(userBal));
        this._balances.set(splitInfo.userId, currUserBal!);
      }
    }

    this._history.push(
      new ExpenseInfo(name, payerId, amount, splitType, splitInfos)
    );
  }

  getBalances(includeZeroBal: boolean = false): UserBalance[] {
    const userBalances: UserBalance[] = [];

    for (let userId of this._balances.keys()) {
      const userBalance = this.getBalance(userId, includeZeroBal);
      if (userBalance.balances.length) userBalances.push(userBalance);
    }

    return userBalances;
  }

  getBalance(userId: string, includeZeroBal: boolean = false): UserBalance {
    const userBalance = new UserBalance(this.getUser(userId));
    const userBal = this._balances.get(userId);

    for (let [payerId, amt] of userBal ?? []) {
      if (amt || includeZeroBal)
        userBalance.addPerUserBalance(this.getUser(payerId), amt);
    }

    return userBalance;
  }

  getUserPassbook(userId: string): ExpenseInfo[] {
    return this._history
      .filter(
        (expenseInfo) =>
          expenseInfo.payerId === userId ||
          expenseInfo.splitInfos.some(
            (splitInfo) => splitInfo.userId === userId
          )
      )
      .reverse();
  }

  getUser(userId: string): User {
    const user = this._users.get(userId);
    if (!user) throw new Error("User not found");
    return user;
  }
}
