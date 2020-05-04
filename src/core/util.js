function toHexString(byteArray) {
    return Array.from(byteArray, function(byte) {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('')
  }

export function generateid() {
    if (window.crypto && window.crypto.getRandomValues) {
        const buf = new Uint32Array(8);
        window.crypto.getRandomValues(buf)
        let hexstr = toHexString(buf)
        while (hexstr[0] == '0') {
          hexstr = hexstr.substr(1)
        }
        return hexstr
    }
    console.log("No crypto.getRandomValues(), falling back to Math.random()")
    return "" + Math.round(Math.random() * Math.pow(2, 52))
}

const sink = () => undefined
const nextLogTSs = new Map()
export function thloggler(throttleid=0) {
  const ts = Date.now()
  const allowedts = nextLogTSs.get(throttleid) || 0
  if (ts > allowedts) {
    nextLogTSs.set(throttleid, ts + 500)
    return console.log
  }
  return sink
}