var documentWriter = artifacts.require("./DocumentWriter.sol");

module.exports = function(deployer) {
  deployer.deploy(documentWriter);
};
