App = {
    web3Provider: null,
    contracts:{},
    init: function(){
        $("#frmDocument").on("submit",App.uploadDocumentSubmitted);
        $("#frmCheckDocument").on("submit",App.checkDocumentSubmitted);
        $("#document-overview").hide();

        App.initWeb3();
    },
    initWeb3: function() {
        
        if (typeof(web3 !== undefined)){
          App.web3Provider = web3.currentProvider;
        }else{
            toastr.warning('Please enable MetaMask');            
        }
        
        web3Provider = new Web3(App.web3Provider);
    
        return App.initContract();
      },
      initContract: function() {
        $.getJSON('DocumentWriter.json', function(data) {
          // Get the necessary contract artifact file and instantiate it with truffle-contract
          var DocumentWriterArtifact = data;
          App.contracts.DocumentWriter = TruffleContract(DocumentWriterArtifact);
        
          // Set the provider for our contract
          App.contracts.DocumentWriter.setProvider(App.web3Provider);
        
        });    
      },
      uploadDocumentSubmitted: function(e){
        e.preventDefault();

        var title = $("#txtTitle").val();
        var author = $("#txtAuthor").val();
        var email = $("#txtEmail").val();

        //Grab the file
        var documentInput = document.getElementById("documentInput");
        if (documentInput.files.length > 0){
            
            var file = documentInput.files[0];
            App.generateHashFromFile(file,function(fileHash){
                App.checkIfDocumentExists(fileHash, function(result){
                    if (result){
                        toastr.warning('This document already exists on the blockchain.');                
                    }else{
                        App.insertDocument(fileHash,title,author,email);
                    }
                    return false;
                });
            });
            
        }else{                
            toastr.warning('Please upload a document.');       
        }        
      },
      checkDocumentSubmitted: function(e){
        e.preventDefault();
        var documentInput = document.getElementById("documentToCheckInput");
        if (documentInput.files.length > 0){
            var file = documentInput.files[0];

            App.generateHashFromFile(file,function(fileHash){
                App.getDocument(fileHash,function(result){
                    console.log(result);
                    if (result[0]){
                        toastr.success("Document was found.");
                        $("#document-overview").show();
                        $("#document-title").text(result[1]);
                        $("#document-author").text(result[2]);
                        $("#document-email").text(result[3]);
                    }else{
                        toastr.warning("Document does not exist on the blockchain yet.");
                    }
                });
            });
        }else{                
            toastr.warning('Please upload a document.');       
        }    
      },
      generateHashFromFile: function(file,callback){
        var reader = new FileReader();
        reader.onload = function(e) {
            var arrayBuffer = reader.result;
            crypto.subtle.digest("SHA-256", arrayBuffer).then(function(result){  
                const hashArray = Array.from(new Uint8Array(result));
            
                //https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
                fileHash = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');
                
                callback(fileHash);
            });
        }

        reader.readAsArrayBuffer(file);
      },
      checkIfDocumentExists: function(fileHash,callback){
        var documentWriterInstance;
        
        App.contracts.DocumentWriter.deployed().then(function(instance) {
          documentWriterInstance = instance;
            //If call doesn't work or you dun goofed with the contracts ==> delete build folder & run rthe following command:  truffle migrate --reset --compile-all
          return documentWriterInstance.documentExists(fileHash);
        }).then(callback).catch(function(err) {
          console.log(err.message);
        });
      },
      clearForm: function(){
        $("#txtTitle").val("");
        $("#txtAuthor").val("");
        $("#txtEmail").val("");
      },
      getDocument: function(fileHash,callback){
        web3.eth.getAccounts(function(error,accounts){
            if (accounts.length > 0){
                App.contracts.DocumentWriter.deployed().then(function(instance){
                   return instance.getDocument(fileHash); 
                }).then(function(result){
                    callback(result);
                }).catch(function (error){
                    console.log(error)
                });
            }else{
                toastr.warning("Please activate an Ethereum wallet.");
            }
        });
      },
      insertDocument: function(fileHash,title, author,email){

         web3.eth.getAccounts(function(error,accounts){
            if (accounts.length > 0){
                var documentWriterInstance;
                
                App.contracts.DocumentWriter.deployed().then(function(instance) {
                  documentWriterInstance = instance;
                    //If call doesn't work or you dun goofed with the contracts ==> delete build folder & run rthe following command:  truffle migrate --reset --compile-all
                  return documentWriterInstance.uploadDocument(fileHash,title,author,email,0,{from:accounts[0]});
                }).then(function(result) {
                    if (result){
                        toastr.success('Document is saved on the blockchain.');
                        App.clearForm();
                    }
                }).catch(function(err) {
                    console.log(err.message);
                });
            }else{
                //show warning to users                
                 toastr.warning('Please activate an Ethereum wallet');     
            }
        });
        
      }
}


$(function() {

    $(document).ready(function(){
        App.init();
    })
});
  