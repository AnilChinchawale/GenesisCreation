
const fs = require('fs');
const genesis = require('./genesisTemplate.json');
const keythereum = require('keythereum');
const Web3 = require('web3');
const web3 = new Web3();

const createAccount = (password, dataPath, callback) => {
  const params = { keyBytes: 32, ivBytes: 16 };

  keythereum.create(params, (dk) => {
    const options = {
      kdf: 'pbkdf2',
      cipher: 'aes-128-ctr',
      kdfparams: {
        c: 262144,
        dklen: 32,
        prf: 'hmac-sha256',
      },
    };
    keythereum.dump(password, dk.privateKey, dk.salt, dk.iv, options, (keyObject) => {
      const dir = `${dataPath}`;
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      keythereum.exportToFile(keyObject, dir, (path) => {
        callback(keyObject.address);
      });
    });
  });
};

const noOfVoters = parseInt(process.argv[2], 10);
const noOfBlockMakers = parseInt(process.argv[3], 10);
const voteThreshold = parseInt(process.argv[4], 10);
const password = '';

const storage = {};
const voterAddresses = [];
const blockMakerAddresses = [];

// set voteThreshold
storage['0x0000000000000000000000000000000000000000000000000000000000000001'] = web3.toHex(voteThreshold);
// set number of voters
storage['0x0000000000000000000000000000000000000000000000000000000000000002'] = web3.toHex(noOfVoters);
// set number of block makers
storage['0x0000000000000000000000000000000000000000000000000000000000000004'] = web3.toHex(noOfBlockMakers);

const createParty = (nodeType, callback) => {
    createAccount(password, `./${nodeType}`, (address) => {
        const paddedAddress = "000000000000000000000000"+address;
        let variableIndex;
        if(nodeType == 'voter') {
            variableIndex = "0000000000000000000000000000000000000000000000000000000000000003";
            voterAddresses.push(address);
        } else if(nodeType == 'blockMaker') {
            variableIndex = "0000000000000000000000000000000000000000000000000000000000000005";
            blockMakerAddresses.push(address);
        }
        const appendedKey = paddedAddress + variableIndex;
        const storageKey = web3.sha3(appendedKey, {"encoding": "hex"});
        callback(storageKey);
    })
};

const targetItems = noOfVoters + 2*noOfBlockMakers + 3;

for(let i = 0; i < noOfVoters + noOfBlockMakers; i++) {
    createParty('voter', (voterStorageKey) => {
        storage[voterStorageKey] = web3.toHex(1);
        if(Object.keys(storage).length == targetItems) {
            genesis.alloc['0x0000000000000000000000000000000000000020'].storage = storage;
            console.log('---------------------------------------------');
            console.log('Create genesis.json file is below');
            console.log('---------------------------------------------');
            console.log(JSON.stringify(genesis, null, 2));
            console.log('\n');
            console.log('---------------------------------------------');
            console.log('voter addresses are below');
            console.log('---------------------------------------------');
            console.log(voterAddresses);
            console.log('\n');
            console.log('---------------------------------------------');
            console.log('blockMaker addresses are below');
            console.log('---------------------------------------------');
            console.log(blockMakerAddresses);
            fs.writeFile('./genesis.json', JSON.stringify(genesis, null, 2));
        }
    });
}

for(let i = 0; i < noOfBlockMakers; i++) {
    createParty('blockMaker', (blockMakerStorageKey) => {
        storage[blockMakerStorageKey] = web3.toHex(1);
        if(Object.keys(storage).length == targetItems) {
            genesis.alloc['0x0000000000000000000000000000000000000020'].storage = storage;
            console.log('---------------------------------------------');
            console.log('Create genesis.json file is below');
            console.log('---------------------------------------------');
            console.log(JSON.stringify(genesis, null, 2));
            console.log('\n');
            console.log('---------------------------------------------');
            console.log('voter addresses are below');
            console.log('---------------------------------------------');
            console.log(voterAddresses);
            console.log('\n');
            console.log('---------------------------------------------');
            console.log('blockMaker addresses are below');
            console.log('---------------------------------------------');
            console.log(blockMakerAddresses);
            fs.writeFile('./genesis.json', JSON.stringify(genesis, null, 2));
        }
    });
}


