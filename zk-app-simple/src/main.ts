import { Square } from './Square.js';
import {
    Field,
    Mina,
    PrivateKey,
    AccountUpdate,
} from 'snarkyjs';

// main.ts contains all of the exports that we want to make available for usage outside of the smart contract, such as in the UI.
export { Square };
1
console.log('SnarkyJS loaded');

const useProof = false;

const Local = Mina.LocalBlockchain({ proofsEnabled: useProof });
Mina.setActiveInstance(Local);

const {privateKey: deployerKey, publicKey: deployerAccount } = Local.testAccounts[0];
const { privateKey: senderKey, publicKey: senderAccount } = Local.testAccounts[1];

// Create a public/private keypair. Public key is the address where the Square smart contract will be deployed to
const zkAppPrivateKey = PrivateKey.random();
const zkAppAddress = zkAppPrivateKey.toPublicKey();

// Create an instance of the Square smart contractn and deploy it to the zkAppAddress (public key)
const zkAppInstance = new Square(zkAppAddress);
const deployTxn = await Mina.transaction(deployerAccount, () => {
    AccountUpdate.fundNewAccount(deployerAccount);
    zkAppInstance.deploy();
});
await deployTxn.sign([deployerKey, zkAppPrivateKey]).send();

// Get the initial state of the Square smart contract after deployemnt
const num0 = zkAppInstance.num.get();
console.log('State after Square init: ', num0.toString());

const txn1 = await Mina.transaction(senderAccount, () => {
    zkAppInstance.update(Field(9));
});
await txn1.prove();
await txn1.sign([senderKey]).send();

const num1 = zkAppInstance.num.get();
console.log('State afer txn1: ', num1.toString());

// Transaction Below Will Fail
try {
    const txn2 = await Mina.transaction(senderAccount, () => {
        zkAppInstance.update(Field(75));
    });
    // NOTE: Field.assertEquals(): 75 != 81 will be triggered on txn2.prove()
    await txn2.prove();
    await txn2.sign([senderKey]).send();
} catch(ex: any) {
    console.log(ex.message);
}

const num2 = zkAppInstance.num.get();
console.log('state after txn2: ', num2.toString());

const txn3 = await Mina.transaction(senderAccount, () => {
    zkAppInstance.update(Field(81));
});

await txn3.prove();
await txn3.sign([senderKey]).send();

const num3 = zkAppInstance.num.get();
console.log('stae after txn3: ', num3.toString());

console.log('Shutting down...');
