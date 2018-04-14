pragma solidity ^0.4.0;


// ********************** CMCEnabled Contract  ******************************
contract CMCEnabled {
    address public Cmc;

    function setCMCAddress(address cmcAddr) returns (bool result) {
        if(Cmc != 0x0 && msg.sender != Cmc) {
            return false;
        }
        Cmc = cmcAddr;
        return true;
    }

    function remove() {
        if(msg.sender == Cmc) {
            selfdestruct(Cmc);
        }
    }

    //Rejector
    function() { throw; }
    
}


// ********************** CMC Contract  ******************************
//Contract-managing-contract 
contract CMC {

    address owner;

    mapping (bytes32 => address) public contracts;


    modifier onlyOwner { 
        if (msg.sender == owner) 
            _;
    }

    function CMC() {
        owner = msg.sender;
    }
    
    //Rejector
    function() { throw; }
    
    //testing function 
    //function GetContract(bytes32 name) constant returns (address loc) {
        
        //return contracts[name];
    //}

    function addContract(bytes32 name, address addr) onlyOwner returns (bool result) {
        CMCEnabled de = CMCEnabled(addr);

        if(!de.setCMCAddress(address(this))) {
            return false;
        }
        contracts[name] = addr;
        return true;
    }

    function removeContract(bytes32 name) onlyOwner returns (bool result) {
        if (contracts[name] == 0x0){
            return false;
        }
        contracts[name] = 0x0;
        return true;
    }

    function remove() onlyOwner {
        address crmanager = contracts["CRManager"];
        address crdb = contracts["CRDB"];

        // Remove everything.
        if(crmanager != 0x0){ CMCEnabled(crmanager).remove(); }
        if(crdb != 0x0){ CMCEnabled(crdb).remove(); }

        selfdestruct(owner);
    }
}


// ********************** ContractProvider contract  ******************************
contract ContractProvider is CMCEnabled {
    //Rejector
    function() { throw; }

    function contracts(bytes32 name) returns (address addr) {}
}


// ********************** CRManagerEnabled contract  ******************************
contract CRManagerEnabled is CMCEnabled {

    // Makes it easier to check that fundmanager is the caller.
    function isCRManager() constant returns (bool) {
        if(Cmc != 0x0){
            address crmanager = ContractProvider(Cmc).contracts("CRManager");
            return msg.sender == crmanager;
            //return true;
        }
        return true;
    }
    
    //Rejector
    function() { throw; }

}


// ********************** CRManager contract  ******************************
// Contract dat dient als interface naar de gebruiker
contract CRManager is CMCEnabled {

    address owner;

    event LogEvent(uint);

    //Modifiers
    modifier Only(address _address) {
        if (msg.sender != _address) throw;
        _;
    }
          
    function CRManager() /*payable*/ {
        owner = msg.sender;
    }

    function testFunction() view public returns(bool) {



        return true;
    }

    function documentExists(bytes32 fileHash) view public returns(bool) {

        address crdb = ContractProvider(Cmc).contracts("CRDB");
        
        if (crdb == 0x0 ) {
            return (false);
        } 
        return CRDB(crdb).documentExists(fileHash);
    }

    function getDocument(bytes32 fileHash) view public returns (bool,bytes32,bytes32,bytes32,uint) {
        
        address crdb = ContractProvider(Cmc).contracts("CRDB");
        
        if (crdb == 0x0 ) {
            return (false,"","","",0);
        } 

        //return (true,"0x4d7920446f63756d656e74","0x4b6576696e","0x7465737440746573742e6265",1);
        return CRDB(crdb).getDocument(fileHash);

    }

    function uploadDocument(bytes32 fileHash,bytes32 title, bytes32 author,bytes32 email) public returns (bool res) { 

        address crdb = ContractProvider(Cmc).contracts("CRDB");
        
        if (crdb == 0x0 ) {
            return false;
        } 

        return CRDB(crdb).uploadDocument(fileHash, title, author, email);
    }

    function getAuthorDocuments(bytes32 author,uint256 index) view public returns(uint256,bytes32,bytes32,uint) {

        address crdb = ContractProvider(Cmc).contracts("CRDB");
        
        if (crdb == 0x0 ) {
            return (0,"","",0);
        } 

        uint256 length;
        bytes32 title;
        bytes32 email;
        uint createdOn;

        (length, title, email, createdOn) =  CRDB(crdb).getAuthorDocuments(author, index);
        return (length, title, email, createdOn);
    }
    
}

// ********************** CRDB contract  ******************************

contract CRDB is CRManagerEnabled {
    address owner;
    mapping(bytes32 => Document) documents;
    mapping(bytes32 => bytes32[]) authorDocuments;

    struct Document {
        bytes32 fileHash;
        bytes32 title;
        bytes32 author;
        bytes32 email;
        uint createdOn;
        bool isValue;
    }

    modifier documentMustNotExist(bytes32 fileHash){
        require(!documents[fileHash].isValue);
        _;
    }

    function CRDB() public {
        owner = msg.sender;
    }

    function uploadDocument(bytes32 fileHash,bytes32 title, bytes32 author,bytes32 email) public documentMustNotExist(fileHash) returns (bool) {  

        if (!isCRManager()) {
            return false;
        }

       Document memory newDocument;
       newDocument.fileHash = fileHash;
       newDocument.title = title;
       newDocument.author = author;
       newDocument.email = email;
       newDocument.createdOn = block.timestamp;
       newDocument.isValue = true;

       documents[fileHash] = newDocument;

       authorDocuments[author].push(fileHash);
       
       return true;
    }

    function getDocument(bytes32 fileHash) view public returns (bool,bytes32,bytes32,bytes32,uint) {

        if (!isCRManager()){
            return (false,"","","",0);
        }
    
        Document memory doc = documents[fileHash];

        return (doc.isValue,doc.title,doc.author,doc.email,doc.createdOn);
    }

    function documentExists(bytes32 fileHash) view public returns(bool) {
        return documents[fileHash].isValue;
    }

    //returns amount of documents / title / email
    function getAuthorDocuments(bytes32 author,uint256 index) view public returns(uint256,bytes32,bytes32,uint) {
        bytes32[] documentsForAuthor = authorDocuments[author];
        if (documentsForAuthor.length == 0) {
            return (0,"","",0);
        } else {
            Document memory doc = documents[documentsForAuthor[index]];
            return (documentsForAuthor.length,doc.title,doc.email,doc.createdOn);
        }
    }
}

