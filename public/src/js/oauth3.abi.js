window.OAuth3.abi = {
	ft : [
		{
			"inputs": [
				{
					"components": [
						{
							"internalType": "bytes32",
							"name": "m",
							"type": "bytes32"
						},
						{
							"internalType": "bytes32",
							"name": "h",
							"type": "bytes32"
						},
						{
							"internalType": "bytes32",
							"name": "r",
							"type": "bytes32"
						},
						{
							"internalType": "bytes32",
							"name": "s",
							"type": "bytes32"
						},
						{
							"internalType": "uint8",
							"name": "v",
							"type": "uint8"
						}
					],
					"internalType": "struct AccountAbstraction.Sign",
					"name": "sign",
					"type": "tuple"
				}
			],
			"stateMutability": "payable",
			"type": "constructor"
		},
		{
			"anonymous": false,
			"inputs": [
				{
					"indexed": true,
					"internalType": "address",
					"name": "src",
					"type": "address"
				},
				{
					"indexed": true,
					"internalType": "address",
					"name": "guy",
					"type": "address"
				},
				{
					"indexed": false,
					"internalType": "uint256",
					"name": "wad",
					"type": "uint256"
				}
			],
			"name": "Approval",
			"type": "event"
		},
		{
			"anonymous": false,
			"inputs": [
				{
					"indexed": true,
					"internalType": "address",
					"name": "src",
					"type": "address"
				},
				{
					"indexed": true,
					"internalType": "address",
					"name": "dst",
					"type": "address"
				},
				{
					"indexed": false,
					"internalType": "uint256",
					"name": "wad",
					"type": "uint256"
				}
			],
			"name": "Transfer",
			"type": "event"
		},
		{
			"inputs": [
				{
					"internalType": "address",
					"name": "",
					"type": "address"
				},
				{
					"internalType": "address",
					"name": "",
					"type": "address"
				}
			],
			"name": "allowance",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "address",
					"name": "",
					"type": "address"
				}
			],
			"name": "balanceOf",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "decimals",
			"outputs": [
				{
					"internalType": "uint8",
					"name": "",
					"type": "uint8"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "bytes32",
					"name": "",
					"type": "bytes32"
				}
			],
			"name": "hashed",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "name",
			"outputs": [
				{
					"internalType": "string",
					"name": "",
					"type": "string"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "bytes32",
					"name": "",
					"type": "bytes32"
				}
			],
			"name": "nonces",
			"outputs": [
				{
					"internalType": "bool",
					"name": "",
					"type": "bool"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "owner",
			"outputs": [
				{
					"internalType": "address",
					"name": "",
					"type": "address"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "symbol",
			"outputs": [
				{
					"internalType": "string",
					"name": "",
					"type": "string"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "verifier",
			"outputs": [
				{
					"internalType": "address",
					"name": "",
					"type": "address"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"stateMutability": "payable",
			"type": "receive"
		},
		{
			"inputs": [],
			"name": "deposit",
			"outputs": [],
			"stateMutability": "payable",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "uint256",
					"name": "value",
					"type": "uint256"
				}
			],
			"name": "withdraw",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "totalSupply",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "address",
					"name": "to",
					"type": "address"
				},
				{
					"internalType": "uint256",
					"name": "value",
					"type": "uint256"
				}
			],
			"name": "approve",
			"outputs": [
				{
					"internalType": "bool",
					"name": "",
					"type": "bool"
				}
			],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "address",
					"name": "to",
					"type": "address"
				},
				{
					"internalType": "uint256",
					"name": "value",
					"type": "uint256"
				}
			],
			"name": "transfer",
			"outputs": [
				{
					"internalType": "bool",
					"name": "",
					"type": "bool"
				}
			],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "address",
					"name": "from",
					"type": "address"
				},
				{
					"internalType": "address",
					"name": "to",
					"type": "address"
				},
				{
					"internalType": "uint256",
					"name": "value",
					"type": "uint256"
				}
			],
			"name": "transferFrom",
			"outputs": [
				{
					"internalType": "bool",
					"name": "",
					"type": "bool"
				}
			],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "address",
					"name": "_address",
					"type": "address"
				}
			],
			"name": "transferOwnership",
			"outputs": [
				{
					"internalType": "bool",
					"name": "",
					"type": "bool"
				}
			],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "address",
					"name": "_address",
					"type": "address"
				}
			],
			"name": "transferVerifier",
			"outputs": [
				{
					"internalType": "bool",
					"name": "",
					"type": "bool"
				}
			],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "bytes32",
					"name": "hash",
					"type": "bytes32"
				},
				{
					"internalType": "uint256",
					"name": "index",
					"type": "uint256"
				}
			],
			"name": "log",
			"outputs": [
				{
					"components": [
						{
							"internalType": "address",
							"name": "from",
							"type": "address"
						},
						{
							"internalType": "address",
							"name": "to",
							"type": "address"
						},
						{
							"internalType": "uint256",
							"name": "value",
							"type": "uint256"
						},
						{
							"internalType": "bytes32",
							"name": "nonce",
							"type": "bytes32"
						},
						{
							"internalType": "bytes",
							"name": "data",
							"type": "bytes"
						}
					],
					"internalType": "struct AccountAbstraction.UserOperation",
					"name": "",
					"type": "tuple"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"components": [
						{
							"internalType": "bytes32",
							"name": "m",
							"type": "bytes32"
						},
						{
							"internalType": "bytes32",
							"name": "h",
							"type": "bytes32"
						},
						{
							"internalType": "bytes32",
							"name": "r",
							"type": "bytes32"
						},
						{
							"internalType": "bytes32",
							"name": "s",
							"type": "bytes32"
						},
						{
							"internalType": "uint8",
							"name": "v",
							"type": "uint8"
						}
					],
					"internalType": "struct AccountAbstraction.Sign",
					"name": "sign",
					"type": "tuple"
				},
				{
					"components": [
						{
							"internalType": "address",
							"name": "from",
							"type": "address"
						},
						{
							"internalType": "address",
							"name": "to",
							"type": "address"
						},
						{
							"internalType": "uint256",
							"name": "value",
							"type": "uint256"
						},
						{
							"internalType": "bytes32",
							"name": "nonce",
							"type": "bytes32"
						},
						{
							"internalType": "bytes",
							"name": "data",
							"type": "bytes"
						}
					],
					"internalType": "struct AccountAbstraction.UserOperation[]",
					"name": "ops",
					"type": "tuple[]"
				}
			],
			"name": "commit",
			"outputs": [
				{
					"internalType": "bool",
					"name": "",
					"type": "bool"
				}
			],
			"stateMutability": "nonpayable",
			"type": "function"
		}
	],
	nft : [
		{
			"anonymous": false,
			"inputs": [{"indexed": true, "internalType": "address", "name": "owner", "type": "address"}, {
				"indexed": true,
				"internalType": "address",
				"name": "approved",
				"type": "address"
			}, {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"}],
			"name": "Approval",
			"type": "event"
		},
		{
			"anonymous": false,
			"inputs": [{"indexed": true, "internalType": "address", "name": "owner", "type": "address"}, {
				"indexed": true,
				"internalType": "address",
				"name": "operator",
				"type": "address"
			}, {"indexed": false, "internalType": "bool", "name": "approved", "type": "bool"}],
			"name": "ApprovalForAll",
			"type": "event"
		},
		{
			"anonymous": false,
			"inputs": [{"indexed": true, "internalType": "address", "name": "from", "type": "address"}, {
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			}, {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"}],
			"name": "Transfer",
			"type": "event"
		},
		{
			"inputs": [{"internalType": "address", "name": "to", "type": "address"}, {
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}], "name": "approve", "outputs": [], "stateMutability": "nonpayable", "type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "totalSupply",
			"outputs": [
				{
					"name": "",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "address",
					"name": "account",
					"type": "address"
				},
				{
					"internalType": "uint256",
					"name": "id",
					"type": "uint256"
				}
			],
			"name": "balanceOf",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
			"name": "getApproved",
			"outputs": [{"internalType": "address", "name": "operator", "type": "address"}],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [{"internalType": "address", "name": "owner", "type": "address"}, {
				"internalType": "address",
				"name": "operator",
				"type": "address"
			}],
			"name": "isApprovedForAll",
			"outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "name",
			"outputs": [{"internalType": "string", "name": "", "type": "string"}],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
			"name": "ownerOf",
			"outputs": [{"internalType": "address", "name": "owner", "type": "address"}],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [{"internalType": "address", "name": "from", "type": "address"}, {
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
				{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
			"name": "safeTransferFrom",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [{"internalType": "address", "name": "from", "type": "address"}, {
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
				{"internalType": "uint256", "name": "tokenId", "type": "uint256"}, {
					"internalType": "bytes",
					"name": "data",
					"type": "bytes"
				}], "name": "safeTransferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function"
		},
		{
			"inputs": [{"internalType": "address", "name": "operator", "type": "address"}, {
				"internalType": "bool",
				"name": "_approved",
				"type": "bool"
			}], "name": "setApprovalForAll", "outputs": [], "stateMutability": "nonpayable", "type": "function"
		},
		{
			"inputs": [{"internalType": "bytes4", "name": "interfaceId", "type": "bytes4"}],
			"name": "supportsInterface",
			"outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "symbol",
			"outputs": [{"internalType": "string", "name": "", "type": "string"}],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
			"name": "tokenURI",
			"outputs": [{"internalType": "string", "name": "", "type": "string"}],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [{"internalType": "address", "name": "from", "type": "address"}, {
				"internalType": "address",
				"name": "to",
				"type": "address"
			}, {"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
			"name": "transferFrom",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		}
	]
}

window.OAuth3.bytecode = "0x60c0604052600760808190526615dc985c1c195960ca1b60a09081526200002a916000919062000127565b50604080518082019091526001808252605760f81b602090920191825262000053918162000127565b506002805460ff1916601217905560405162001897388190039081908339810160408190526200008391620001cd565b6001816020015182608001518360400151846060015160405160008152602001604052604051620000b8949392919062000255565b6020604051602081039080840390855afa158015620000db573d6000803e3d6000fd5b5050604051601f190151600380546001600160a01b0319166001600160a01b03909216918217905560028054610100600160a81b03191661010090920291909117905550620002b09050565b828054620001359062000273565b90600052602060002090601f016020900481019282620001595760008555620001a4565b82601f106200017457805160ff1916838001178555620001a4565b82800160010185558215620001a4579182015b82811115620001a457825182559160200191906001019062000187565b50620001b2929150620001b6565b5090565b5b80821115620001b25760008155600101620001b7565b600060a08284031215620001df578081fd5b60405160a081016001600160401b03811182821017156200020e57634e487b7160e01b83526041600452602483fd5b806040525082518152602083015160208201526040830151604082015260608301516060820152608083015160ff8116811462000249578283fd5b60808201529392505050565b93845260ff9290921660208401526040830152606082015260800190565b6002810460018216806200028857607f821691505b60208210811415620002aa57634e487b7160e01b600052602260045260246000fd5b50919050565b6115d780620002c06000396000f3fe6080604052600436106101185760003560e01c806353548254116100a05780639e317f12116100645780639e317f121461035b578063a9059cbb1461037b578063d0e30db01461039b578063dd62ed3e146103a3578063f2fde38b146103c35761017f565b806353548254146102c457806370a08231146102f15780638b90f06c146103115780638da5cb5b1461033157806395d89b41146103465761017f565b80632b7ac3f3116100e75780632b7ac3f31461021e5780632e1a7d4d14610240578063313ce567146102625780633523a618146102845780634cc49894146102a45761017f565b806306fdde0314610184578063095ea7b3146101af57806318160ddd146101dc57806323b872dd146101fe5761017f565b3661017f57336000908152600460205260408120805434929061013c9084906112e9565b9091555050604051309033907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef906101759034906112b1565b60405180910390a3005b600080fd5b34801561019057600080fd5b506101996103e3565b6040516101a691906111ca565b60405180910390f35b3480156101bb57600080fd5b506101cf6101ca366004611005565b610471565b6040516101a691906111a1565b3480156101e857600080fd5b506101f16104db565b6040516101a691906112b1565b34801561020a57600080fd5b506101cf610219366004610fc5565b6104df565b34801561022a57600080fd5b50610233610618565b6040516101a6919061118d565b34801561024c57600080fd5b5061026061025b366004611030565b610627565b005b34801561026e57600080fd5b50610277610726565b6040516101a691906112ba565b34801561029057600080fd5b506101f161029f366004611030565b61072f565b3480156102b057600080fd5b506101cf6102bf366004611069565b610741565b3480156102d057600080fd5b506102e46102df366004611048565b610900565b6040516101a69190611259565b3480156102fd57600080fd5b506101f161030c366004610f6a565b610a24565b34801561031d57600080fd5b506101cf61032c366004610f6a565b610a36565b34801561033d57600080fd5b50610233610a91565b34801561035257600080fd5b50610199610aa5565b34801561036757600080fd5b506101cf610376366004611030565b610ab2565b34801561038757600080fd5b506101cf610396366004611005565b610ac7565b610260610b85565b3480156103af57600080fd5b506101f16103be366004610f8d565b610be7565b3480156103cf57600080fd5b506101cf6103de366004610f6a565b610c04565b600080546103f090611459565b80601f016020809104026020016040519081016040528092919081815260200182805461041c90611459565b80156104695780601f1061043e57610100808354040283529160200191610469565b820191906000526020600020905b81548152906001019060200180831161044c57829003601f168201915b505050505081565b3360008181526005602090815260408083206001600160a01b038716808552925280832085905551919290917f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925906104ca9086906112b1565b60405180910390a350600192915050565b4790565b60006001600160a01b03841633148015906104fa5750333014155b15610567576001600160a01b03841660009081526005602090815260408083203384529091529020546000198114610565576001600160a01b03851660009081526005602090815260408083203384529091528120805485929061055f908490611301565b90915550505b505b6001600160a01b0384166000908152600460205260408120805484929061058f908490611301565b90915550506001600160a01b038316600090815260046020526040812080548492906105bc9084906112e9565b92505081905550826001600160a01b0316846001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8460405161060691906112b1565b60405180910390a35060019392505050565b6003546001600160a01b031681565b3360009081526004602052604090205481111561064357600080fd5b3360009081526004602052604081208054839290610662908490611301565b90915550506040516000903390839061067a9061118a565b60006040518083038185875af1925050503d80600081146106b7576040519150601f19603f3d011682016040523d82523d6000602084013e6106bc565b606091505b50509050806106e65760405162461bcd60e51b81526004016106dd90611222565b60405180910390fd5b604051339030907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9061071a9086906112b1565b60405180910390a35050565b60025460ff1681565b60076020526000908152604090205481565b6020808401356000908152600790915260408120541561076057600080fd5b6001602085013561077760a08701608088016110f0565b604080516000815260200180825261079a9392918901359060608a0135906111ac565b6020604051602081039080840390855afa1580156107bc573d6000803e3d6000fd5b5050604051601f1901516003546001600160a01b0390811691161490506107e257600080fd5b833560009081526008602052604090205460ff166108545760405161082b9061081090863590602001611159565b60405160208183030381529060405280519060200120610c64565b83356000908152600860209081526040808320805460ff19166001179055600790915290204390555b8180156108e05760005b818160ff1610156108de576020808701356000908152600690915260409020858560ff84168181106108a057634e487b7160e01b600052603260045260246000fd5b90506020028101906108b291906112c8565b8154600181018355600092835260209092209091600502016108d482826114f0565b505060010161085e565b505b505050506020908101356000908152600790915260409020439055600190565b610908610f26565b600083815260066020526040902080548390811061093657634e487b7160e01b600052603260045260246000fd5b60009182526020918290206040805160a081018252600590930290910180546001600160a01b039081168452600182015416938301939093526002830154908201526003820154606082015260048201805491929160808401919061099a90611459565b80601f01602080910402602001604051908101604052809291908181526020018280546109c690611459565b8015610a135780601f106109e857610100808354040283529160200191610a13565b820191906000526020600020905b8154815290600101906020018083116109f657829003601f168201915b505050505081525050905092915050565b60046020526000908152604090205481565b60025460009061010090046001600160a01b0316331480610a5657503330145b610a5f57600080fd5b50600380546001600160a01b03831673ffffffffffffffffffffffffffffffffffffffff199091161790556001919050565b60025461010090046001600160a01b031681565b600180546103f090611459565b60086020526000908152604090205460ff1681565b3360009081526004602052604081205482811015610af75760405162461bcd60e51b81526004016106dd906111dd565b3360009081526004602052604081208054859290610b16908490611301565b90915550506001600160a01b03841660009081526004602052604081208054859290610b439084906112e9565b90915550506040516001600160a01b0385169033907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef906106069087906112b1565b3360009081526004602052604081208054349290610ba49084906112e9565b9091555050604051309033907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef90610bdd9034906112b1565b60405180910390a3565b600560209081526000928352604080842090915290825290205481565b60025460009061010090046001600160a01b0316331480610c2457503330145b610c2d57600080fd5b50600280546001600160a01b0383166101000274ffffffffffffffffffffffffffffffffffffffff00199091161790556001919050565b600081815260066020526040812054905b818160ff161015610f21576000838152600660205260408120805460ff8416908110610cb157634e487b7160e01b600052603260045260246000fd5b60009182526020918290206040805160a081018252600590930290910180546001600160a01b0390811684526001820154169383019390935260028301549082015260038201546060820152600482018054919291608084019190610d1590611459565b80601f0160208091040260200160405190810160405280929190818152602001828054610d4190611459565b8015610d8e5780601f10610d6357610100808354040283529160200191610d8e565b820191906000526020600020905b815481529060010190602001808311610d7157829003601f168201915b50505091909252505050606081015160009081526008602052604090205490915060ff16610f185780516020808301516040808501516080860151606087015160009081526008909552918420805460ff19166001179055929392906001600160a01b038085169084161415610e3057600080825160208401865af43d604051816000823e828015610e235760019850610e27565b8282fd5b50505050610f08565b600082118015610e4857506001600160a01b03841615155b15610ea7576001600160a01b03841660009081526004602052604090205482811015610e865760405162461bcd60e51b81526004016106dd906111dd565b506001600160a01b0384166000908152600460205260409020805483900390555b826001600160a01b03168282604051610ec0919061113d565b60006040518083038185875af1925050503d8060008114610efd576040519150601f19603f3d011682016040523d82523d6000602084013e610f02565b606091505b50909550505b84610f1257600080fd5b50505050505b50600101610c75565b505050565b6040518060a0016040528060006001600160a01b0316815260200160006001600160a01b031681526020016000815260200160008019168152602001606081525090565b600060208284031215610f7b578081fd5b8135610f8681611589565b9392505050565b60008060408385031215610f9f578081fd5b8235610faa81611589565b91506020830135610fba81611589565b809150509250929050565b600080600060608486031215610fd9578081fd5b8335610fe481611589565b92506020840135610ff481611589565b929592945050506040919091013590565b60008060408385031215611017578182fd5b823561102281611589565b946020939093013593505050565b600060208284031215611041578081fd5b5035919050565b6000806040838503121561105a578182fd5b50508035926020909101359150565b600080600083850360c081121561107e578384fd5b60a081121561108b578384fd5b5083925060a084013567ffffffffffffffff808211156110a9578384fd5b818601915086601f8301126110bc578384fd5b8135818111156110ca578485fd5b87602080830285010111156110dd578485fd5b6020830194508093505050509250925092565b600060208284031215611101578081fd5b813560ff81168114610f86578182fd5b60008151808452611129816020860160208601611429565b601f01601f19169290920160200192915050565b6000825161114f818460208701611429565b9190910192915050565b7f19457468657265756d205369676e6564204d6573736167653a0a3332000000008152601c810191909152603c0190565b90565b6001600160a01b0391909116815260200190565b901515815260200190565b93845260ff9290921660208401526040830152606082015260800190565b600060208252610f866020830184611111565b60208082526025908201527f574554483a207472616e7366657220616d6f756e7420657863656564732062616040820152646c616e636560d81b606082015260800190565b60208082526019908201527f574554483a20455448207472616e73666572206661696c656400000000000000604082015260600190565b6000602082526001600160a01b03808451166020840152806020850151166040840152506040830151606083015260608301516080830152608083015160a0808401526112a960c0840182611111565b949350505050565b90815260200190565b60ff91909116815260200190565b60008235609e1983360301811261114f578182fd5b60009081526020902090565b600082198211156112fc576112fc6114a7565b500190565b600082821015611313576113136114a7565b500390565b5b8181101561132d5760008155600101611319565b5050565b67ffffffffffffffff831115611349576113496114bd565b6113538154611459565b600080601f8611601f8411818117156113725761136f866112dd565b92505b80156113a1576020601f8901048301602089101561138d5750825b61139f6020601f880104850182611318565b505b5080600181146113cd576000945087156113bc578387013594505b6113c68886611494565b865561141f565b601f198816945082845b868110156113f757888601358255602095860195600190920191016113d7565b508886101561141457878501356000196008601f8c16021c191681555b506001600289020186555b5050505050505050565b60005b8381101561144457818101518382015260200161142c565b83811115611453576000848401525b50505050565b60028104600182168061146d57607f821691505b6020821081141561148e57634e487b7160e01b600052602260045260246000fd5b50919050565b600019600883021c191660029091021790565b634e487b7160e01b600052601160045260246000fd5b634e487b7160e01b600052604160045260246000fd5b6001600160a01b0382166001600160a01b03198254161781555050565b81356114fb81611589565b61150581836114d3565b50602082013561151481611589565b61152181600184016114d3565b5060408201356002820155606082013560038201556080820135601e1983360301811261154d57600080fd5b8201803567ffffffffffffffff81111561156657600080fd5b60208201915080360382131561157b57600080fd5b611453818360048601611331565b6001600160a01b038116811461159e57600080fd5b5056fea264697066735822122030026f191a14d99a245d7f0de25ada3da13d3be8db475fff0b70ebdc1daea4dc64736f6c63430008000033";