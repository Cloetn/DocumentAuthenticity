var CMC = artifacts.require("CMC");
var CMCEnabled = artifacts.require("CMCEnabled");
var ContractProvider = artifacts.require("ContractProvider");
var CRManagerEnabled = artifacts.require("CRManagerEnabled");
var CRManager = artifacts.require("CRManager");
var CRDB = artifacts.require("CRDB");





contract('CMC', function(accounts) {
    var cmcInstance;
    var crManagerInstance;
    var crdbInstance;
    var hash="123456778993";
    

    it("Should up upload document and check if it exists",function(){
        return CMC.deployed().then(function(instance){
            cmcInstance = instance;
        }).then(function(){
            return CRManager.deployed().then(function(instance){
                crManagerInstance = instance;
            });
        }).then(function(){
            return CRDB.deployed().then(function(instance){
                crdbInstance = instance;
            });
        }).then(function(){
            return cmcInstance.addContract(web3.fromAscii("CRManager"),CRManager.address);
        }).then(function(){
            return cmcInstance.addContract(web3.fromAscii("CRDB"),crdbInstance.address);
        }).then(function(){
            return crManagerInstance.uploadDocument(web3.fromAscii(hash),web3.fromAscii("My Document"),
            web3.fromAscii("Kevin"),web3.fromAscii("test@test.be"));
        }).then(function(){            
            return crManagerInstance.documentExists(web3.fromAscii(hash));
        }).then(function(result){
            assert.isTrue(result);
        });
    });
});