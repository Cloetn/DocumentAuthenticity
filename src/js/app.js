App = {
    web3Provider: null,
    contracts:{},
    contractToAddToTheManager: [],
    init: function(){
        $("#frmDocument").on("submit",App.uploadDocumentSubmitted);
        $("#frmCheckDocument").on("submit",App.checkDocumentSubmitted);
        $("#frmSearchByAuthor").on("submit",App.searchByAuthor);
        $("#btnAddContracts").on("click",App.addContractsToCMC);
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
        $.getJSON('CRManager.json', function(data) {
          // Get the necessary contract artifact file and instantiate it with truffle-contract
          var CRManagerArtifact = data;
          App.contracts.CRManager = TruffleContract(CRManagerArtifact);
        
          // Set the provider for our contract
          App.contracts.CRManager.setProvider(App.web3Provider);

          App.contracts.CRManager.deployed().then(function(instance){
                App.contractToAddToTheManager.push({
                    name: "CRManager",
                    address: instance.address
                });
            });
		});
		  
		$.getJSON('CMC.json', function(data) {
          // Get the necessary contract artifact file and instantiate it with truffle-contract
          var CMCArtifact = data;
          App.contracts.CMC = TruffleContract(CMCArtifact);
        
          // Set the provider for our contract
          App.contracts.CMC.setProvider(App.web3Provider);
        
        });    

        $.getJSON('CRDB.json', function(data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            var CRDBArtifact = data;
            App.contracts.CRDB = TruffleContract(CRDBArtifact);
            App.contracts.CRDB.setProvider(App.web3Provider);

            App.contracts.CRDB.deployed().then(function(instance){
                App.contractToAddToTheManager.push({
                    name: "CRDB",
                    address: instance.address
                });
            });
          });    
      },
      uploadDocumentSubmitted: function(e){
        e.preventDefault();

        var title = web3.fromAscii($("#txtTitle").val());
        var author = web3.fromAscii($("#txtAuthor").val());
        var email = web3.fromAscii($("#txtEmail").val());

        //Grab the file
        var documentInput = document.getElementById("documentInput");
        if (documentInput.files.length > 0){
            
            var file = documentInput.files[0];
            App.generateHashFromFile(file,function(fileHash){
                console.log(fileHash);
                App.checkIfDocumentExists(fileHash, function(result){
                    if (result){
                        toastr.warning('This document already exists on the blockchain.');                
                    }else{
                        
                        var fileHashBytes = web3.fromAscii(fileHash);

                        console.log(fileHashBytes);
                        console.log(title);
                        console.log(author);
                        console.log(email);

                        App.insertDocument(fileHashBytes,title,author,email);
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
                App.getDocument(web3.fromAscii(fileHash),function(result){

                    if (result[0]){
                        toastr.success("Document was found.");
                        $("#document-overview").show();
                        $("#document-title").text(web3.toAscii(result[1]).replace(/\u0000/g,''));
                        $("#document-author").text(web3.toAscii(result[2]).replace(/\u0000/g,''));
                        $("#document-email").text(web3.toAscii(result[3]).replace(/\u0000/g,''));

                       var timeStamp = parseInt(result[4]);
                       var rootDatetime = moment.unix(timeStamp).format("DD/MM/YYYY HH:mm:ss");

                       $("#document-createdon").text(rootDatetime);
                    }else{
                        toastr.warning("Document does not exist on the blockchain yet.");
                    }
                });
            });
        }else{                
            toastr.warning('Please upload a document.');       
        }    
      },
      searchByAuthor: function(e){
        e.preventDefault();

        var author = web3.fromAscii($("#txtSearchByAuthor").val());
        $("#listOfDocuments").empty();
		

        App.getDocumentByAuthor(author,0,function(result){
            var total = parseInt(result[0]);

            if (total > 0){              
                App.makeListElement(author,result);
                for (i = 1; i < total;i++){
                    App.getDocumentByAuthor(author,i,function(result){
                        App.makeListElement(author,result);
                    });
                }
            }else{
                toastr.warning("No documents for author " + author + " found.");
            }
            
        });
      },
	  
      makeListElement: function(author,blockchainItem){
        //Not gonna add some fancy JS framework for some list rendering, gonna do it old skool.        
        var timeStamp = parseInt(blockchainItem[3]);
        var rootDatetime = moment.unix(timeStamp).format("DD/MM/YYYY HH:mm:ss");

        var documentElement = $("<li class='list-group-item'></li>");
        $(documentElement).html(web3.toAscii(blockchainItem[1]) + ' by ' + web3.toAscii(author) + 
        ' - <a href="mailto:"' + web3.toAscii(blockchainItem[2]) + '">' + web3.toAscii(blockchainItem[2]) + '</a>');
        $(documentElement).append('<br /><i>Published on ' + rootDatetime + ' </i>');

        $("#listOfDocuments").append(documentElement);
      },
      generateHashFromFile: function(file,callback){
        var reader = new FileReader();
        reader.onload = function(e) {
            var arrayBuffer = reader.result;
            // var hash = CryptoJS.MD5(CryptoJS.enc.Latin1.parse(e.result));
            // var md5 = hash.toString(CryptoJS.enc.Hex);

            // callback(md5);

            crypto.subtle.digest("SHA-256", arrayBuffer).then(function(result){  
                const hashArray = Array.from(new Uint8Array(result));
            
                //https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
                fileHash = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');
                
                callback(fileHash.substring(0,fileHash.length/2));
            });
        }

        reader.readAsArrayBuffer(file);
      },
      checkIfDocumentExists: function(fileHash,callback){
        var CRManagerInstance;
        
        App.contracts.CRManager.deployed().then(function(instance) {
          CRManagerInstance = instance;
            //If call doesn't work or you dun goofed with the contracts ==> delete build folder & run rthe following command:  truffle migrate --reset --compile-all
          return CRManagerInstance.documentExists(web3.fromAscii(fileHash));
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
                App.contracts.CRManager.deployed().then(function(instance){
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
      getDocumentByAuthor: function(author,index,callback){
        web3.eth.getAccounts(function(error,accounts){
            if (accounts.length > 0){
                App.contracts.CRManager.deployed().then(function(instance){
                   return instance.getAuthorDocuments(author,index); 
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
      insertDocument: function(fileHash,title,author,email){
         web3.eth.getAccounts(function(error,accounts){
            if (accounts.length > 0){
                var CRManagerInstance;
                
                App.contracts.CRManager.deployed().then(function(instance) {
                  CRManagerInstance = instance;
                    //If call doesn't work or you dun goofed with the contracts ==> delete build folder &
                    // run rthe following command:  truffle migrate --reset --compile-all

                  return CRManagerInstance.uploadDocument(fileHash,title,author,email);
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
        
      },
        addContractsToCMC: function(e){
            for(i = 0; i < App.contractToAddToTheManager.length; i++){
                var contract = App.contractToAddToTheManager[i];
                var byteContractName = web3.fromAscii(contract.name);
                App.addContractToCMC(byteContractName,contract.address,function(result){
                    console.log(result);
                });
            }
        },

        addContractToCMC: function(contract, address,callback){
            web3.eth.getAccounts(function(error,accounts){
                if (accounts.length > 0){
                    App.contracts.CMC.deployed().then(function(instance){
                        return instance.addContract(contract,address, {from:accounts[0]}); 
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
}


$(function() {

    $(document).ready(function(){
        App.init();
    })
});
  