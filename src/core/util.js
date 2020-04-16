function toHexString(byteArray) {
    return Array.from(byteArray, function(byte) {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('')
  }

export function generateid() {
    if (window.crypto && window.crypto.getRandomValues) {
        const buf = new Uint32Array(8);
        window.crypto.getRandomValues(buf)
        return toHexString(buf)
    }
    console.log("No crypto.getRandomValues(), falling back to Math.random()")
    return "" + Math.round(Math.random() * Math.pow(2, 52))
}
