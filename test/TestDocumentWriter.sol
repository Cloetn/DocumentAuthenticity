pragma solidity ^0.4.17;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/DocumentWriter.sol";

contract ThrowProxy {
  address public target;
  bytes data;

  function ThrowProxy(address _target) {
    target = _target;
  }

  //prime the data using the fallback function.
  function() {
    data = msg.data;
  }

  function execute() returns (bool) {
    return target.call(data);
  }
}

contract TestDocumentWriter {
    DocumentWriter documentWriter = DocumentWriter(DeployedAddresses.DocumentWriter());

    function testUploadNewDocument() public {
        documentWriter.uploadDocument("CC26F9C0F06DF170900A7D416BCCDFE54141A9A9EFD35755EBC172F10FC15F318B4FFE7EACBE5C6B918CBD0639960D75D7504625D52EA4D0F15E3068B23E448B",
        "My Document","Kevin","test@test.be",1);

        bool exists = documentWriter.documentExists("CC26F9C0F06DF170900A7D416BCCDFE54141A9A9EFD35755EBC172F10FC15F318B4FFE7EACBE5C6B918CBD0639960D75D7504625D52EA4D0F15E3068B23E448B");

        Assert.isTrue(exists,"Document could not be created");
    }
    // function testShouldReturnDocument() public {
    //   documentWriter.uploadDocument("CC26F9C0F06DF170900A7D416BCCDFE54141A9A9EFD35755EBC172F10FC15F318B4FFE7EACBE5C6B918CBD0639960D75D7504625D52EA4D0F15E3068B23E448B",
    //     "My Document","Kevin","test@test.be",1);

    //     var (a,b) = documentWriter.getDocument("CC26F9C0F06DF170900A7D416BCCDFE54141A9A9EFD35755EBC172F10FC15F318B4FFE7EACBE5C6B918CBD0639960D75D7504625D52EA4D0F15E3068B23E448B");

    //     Assert.isTrue(a,"Document doesn't get returned");
    //     Assert.equal(b,"Hello","Does not compute");
    // }

    //http://truffleframework.com/tutorials/testing-for-throws-in-solidity-tests
    //Testing for requires
    // function testErrorWhenUploadingAlreadyExistingDocument() public{
    //      documentWriter.uploadDocument("CC26F9C0F06DF170900A7D416BCCDFE54141A9A9EFD35755EBC172F10FC15F318B4FFE7EACBE5C6B918CBD0639960D75D7504625D52EA4D0F15E3068B23E448B",
    //     "My Document","Kevin","test@test.be",1);

    //     ThrowProxy throwProxy = new ThrowProxy(address(documentWriter)); //set Thrower as the contract to forward requests to. The target.
    //     DocumentWriter(address(documentWriter)).uploadDocument("CC26F9C0F06DF170900A7D416BCCDFE54141A9A9EFD35755EBC172F10FC15F318B4FFE7EACBE5C6B918CBD0639960D75D7504625D52EA4D0F15E3068B23E448B",
    //     "My Document","Kevin","test@test.be",1);

    //     bool r = throwProxy.execute.gas(200000)();

    //     Assert.isFalse(r,"Require failed on uploading already existing document.");
    // }
}