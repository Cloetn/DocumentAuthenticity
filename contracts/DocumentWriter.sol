pragma solidity ^0.4.17;

contract DocumentWriter {
    address owner;
    mapping(string => Document) documents;
    mapping(string => string[]) authorDocuments;

    struct Document {
        string fileHash;
        string title;
        string author;
        string email;
        uint createdOn;
        bool isValue;
    }

    modifier documentMustNotExist(string fileHash){
        require(!documents[fileHash].isValue);
        _;
    }

    function DocumentWriter() public {
        owner = msg.sender;
    }

    function uploadDocument(string fileHash,string title, string author,string email) public documentMustNotExist(fileHash) {  
       Document memory newDocument;
       newDocument.fileHash = fileHash;
       newDocument.title = title;
       newDocument.author = author;
       newDocument.email = email;
       newDocument.createdOn = block.timestamp;
       newDocument.isValue = true;

       documents[fileHash] = newDocument;

       authorDocuments[author].push(fileHash);
    }

    function getDocument(string fileHash) view public returns (bool,string,string,string,uint) {
        Document memory doc = documents[fileHash];

        return (doc.isValue,doc.title,doc.author,doc.email,doc.createdOn);
    }

    function documentExists(string fileHash) view public returns(bool) {
        return documents[fileHash].isValue;
    }
    //returns amount of documents / title / email
    function getAuthorDocuments(string author,uint256 index) view public returns(uint256,string,string,uint) {
        string[] documentsForAuthor = authorDocuments[author];
        if (documentsForAuthor.length == 0) {
            return (0,"","",0);
        } else {
            Document memory doc = documents[documentsForAuthor[index]];
            return (documentsForAuthor.length,doc.title,doc.email,doc.createdOn);
        }
    }
}