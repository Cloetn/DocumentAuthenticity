var CMC = artifacts.require("CMC");
var CMCEnabled = artifacts.require("CMCEnabled");
var ContractProvider = artifacts.require("ContractProvider");
var CRManagerEnabled = artifacts.require("CRManagerEnabled");
var CRManager = artifacts.require("CRManager");
var CRDB = artifacts.require("CRDB");

module.exports = function(deployer) {
	deployer.deploy(CMC);
	deployer.deploy(CMCEnabled);
    deployer.deploy(ContractProvider);
    deployer.deploy(CRManagerEnabled);
    deployer.deploy(CRManager);
	deployer.deploy(CRDB);
};
