pragma solidity ^0.4.17;

contract DocumentWriter {
    address owner;
    mapping(string => Document) documents;

    struct Document {
        string fileHash;
        string title;
        string author;
        string email;
        uint256 createdOn;
        bool isValue;
    }

    modifier documentMustNotExist(string fileHash){
        require(!documents[fileHash].isValue);
        _;
    }

    function DocumentWriter() public {
        owner = msg.sender;
    }

    function uploadDocument(string fileHash,string title, string author,string email, uint256 createdOn) public documentMustNotExist(fileHash) {  
       Document memory newDocument;
       newDocument.fileHash = fileHash;
       newDocument.title = title;
       newDocument.author = author;
       newDocument.email = email;
       newDocument.createdOn = createdOn;
       newDocument.isValue = true;

       documents[fileHash] = newDocument;
    }

    function getDocument(string fileHash) view public returns (bool,string,string,string) {
        Document memory doc = documents[fileHash];

        return (doc.isValue,doc.title,doc.author,doc.email);
    }

    function documentExists(string fileHash) view public returns(bool) {
        return documents[fileHash].isValue;
    } 


}