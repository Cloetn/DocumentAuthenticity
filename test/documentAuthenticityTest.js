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
    
    it ("Should set up the whole CMC system",function(){
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
            return cmcInstance.addContract(web3.fromAscii("CRManager"),crManagerInstance.address);
        }).then(function(){
            return cmcInstance.addContract(web3.fromAscii("CRDB"),crdbInstance.address);
        }).then(function(){
            return cmcInstance.contracts.call(web3.fromAscii("CRDB")).then(function(result){
                assert.equal(result,crdbInstance.address);
            });
        }).then(function(){
            return cmcInstance.contracts.call(web3.fromAscii("CRManager")).then(function(result){
                assert.equal(result,crManagerInstance.address);
            });
        })
    });

    it("Should up upload document and check if it exists",function(){
        return crManagerInstance.uploadDocument(web3.fromAscii(hash),web3.fromAscii("My Document"),
            web3.fromAscii("Kevin"),web3.fromAscii("test@test.be")).
        then(function(){            
            return crManagerInstance.documentExists(web3.fromAscii(hash));
        }).then(function(result){
            assert.isTrue(result,"Document was not uploaded.");
        });
    });

    it("Should get the details of a document",function(){
        return crManagerInstance.getDocument(web3.fromAscii(hash)).
        then(function(result){
            var exists = result[0];
            assert.isTrue(exists,"Document does not exist");

            var title = web3.toAscii(result[1]).replace(/\u0000/g,'');
            assert.equal(title,"My Document","Title is not the same.");

            var author = web3.toAscii(result[2]).replace(/\u0000/g,'');
            assert.equal(author,"Kevin","Author is not the same.");

            var email = web3.toAscii(result[3]).replace(/\u0000/g,'');
            assert.equal(email,"test@test.be","Email is not the same");
        });
    });

});