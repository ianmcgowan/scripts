function doMerge() {
  // This will run into various google limits - only x emails per day, y documents created etc.
  // Getting a couple of people to run it helps or just be patient and do 30 per day ;-)
  // Column headings expected are:
  // +------+------+------+-----+-----------+------+---------+-------+-------+--------+-------+
  // |  A   |  B   |  C   |  D  |     E     |  F   |    G    |   H   |  I    |   J    |   K   |
  // +------+------+------+-----+-----------+------+---------+-------+-------+--------+-------+
  // | Item | Date | Time | Qty | Net Sales | Name | Details | Order | Email | Status | Notes |
  // +------+------+------+-----+-----------+------+---------+-------+-------+--------+-------+
  var selectedTemplateId = "xxxxxxxxxxxxxxxxxxxxxxxxx";//Copy and paste the ID of the template document here (you can find this in the document's URL)
  var templateFile = DriveApp.getFileById(selectedTemplateId);
  var sheet = SpreadsheetApp.getActiveSheet();//current sheet
  var rows = sheet.getDataRange();
  var numRows = rows.getNumRows();
  var values = rows.getValues();
  var fieldNames = values[0];//First row of the sheet must be the the field names
  var subject = "2017 All-City Parking Pass";
  
  for (var i = 1; i < numRows; i++) {//data values start from the second row of the sheet 
    var row = values[i];
    var item=row[0];  // A=0, B=1, C=2 etc.
    var name=row[5];
    var email=row[8];
    var stat=row[9];
    if (stat != "Sent") {
      var mergedFile = templateFile.makeCopy();
      mergedFile.setName("ParkingPass_"+item+"_"+name);
      var mergedDoc = DocumentApp.openById(mergedFile.getId());
      var bodyElement = mergedDoc.getBody();
      var bodyCopy = bodyElement.copy();
      bodyElement.clear();
      var body = bodyCopy.copy();
      for (var f = 0; f < fieldNames.length; f++) {
        body.replaceText("\\[" + fieldNames[f] + "\\]", row[f]);//replace [fieldName] with the respective data value
      }
      var numChildren = body.getNumChildren();//number of the contents in the template doc
      for (var c = 0; c < numChildren; c++) {//Go over all the content of the template doc, and replicate it for each row of the data.
        var child = body.getChild(c);
        child = child.copy();
        if (child.getType() == DocumentApp.ElementType.HORIZONTALRULE) {
          mergedDoc.appendHorizontalRule(child);
        } else if (child.getType() == DocumentApp.ElementType.INLINEIMAGE) {
          mergedDoc.appendImage(child.getBlob());
        } else if (child.getType() == DocumentApp.ElementType.PARAGRAPH) {
          mergedDoc.appendParagraph(child);
        } else if (child.getType() == DocumentApp.ElementType.LISTITEM) {
          mergedDoc.appendListItem(child);
        } else if (child.getType() == DocumentApp.ElementType.TABLE) {
          mergedDoc.appendTable(child);
        } else {
          Logger.log("Unknown element type: " + child);
        }
      }
      mergedDoc.saveAndClose();
      var newFile = DriveApp.createFile(mergedDoc.getAs('application/pdf')); // Create a PDF copy
      var cell = sheet.getRange(i+1, 10); //getRange appears to start from 1 instead of 0!
      cell.setValue("Prepared");
      // Now email the PDF
      MailApp.sendEmail(email, subject,
                        "Thank you for your order!\n\nPlease find your two-day pass attached.\n\nPlease print and present to attendants on arrival at Heather Farms.",
                        {attachments: [newFile.getAs(MimeType.PDF)],name: "All-City Parking",cc: "web@walnutcreekswimclub.org"});
      cell.setValue("Sent");
      SpreadsheetApp.flush();  // try this and see if it updates the sheet status column
      newFile.setTrashed(true);
    }
  }
}

function onOpen() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var entries = [{
    name : "Create Parking Passes",
    functionName : "doMerge"
  }];
  spreadsheet.addMenu("Merge", entries);
};
