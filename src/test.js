const bplist = require('bplist-parser');
const Buffer = require('buffer/').Buffer
const { Readable } = require('stream');


const fileName = "/Users/joys/Library/Application\ Support/com.apple.sharedfilelist/com.apple.LSSharedFileList.ApplicationRecentDocuments/com.apple.dt.xcode.sfl2";



function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}


(async () => {
    const obj = await bplist.parseFile(fileName);
    const data = JSON.parse(JSON.stringify(obj));
    const index = data[0].$objects.findIndex((element, index) => {
        if (typeof element == 'object' && element['type'] === 'Buffer') {
            return true
        }
    })
    const buffer = data[0].$objects[index].data
    console.log(ab2str(buffer))

    // console.log(Buffer.from(buffer).toString('utf16le'))
})();