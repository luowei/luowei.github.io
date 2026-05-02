(function () {
  function decodeUtf8(bytes) {
    return new TextDecoder().decode(bytes);
  }

  function createReader(bytes) {
    var offset = 0;

    function readByte() {
      if (offset >= bytes.length) throw new Error("Unexpected end of MessagePack payload");
      return bytes[offset++];
    }

    function readBytes(length) {
      if (offset + length > bytes.length) throw new Error("Unexpected end of MessagePack payload");
      var value = bytes.slice(offset, offset + length);
      offset += length;
      return value;
    }

    function readUint16() {
      return (readByte() << 8) | readByte();
    }

    function readUint32() {
      return (readByte() * 0x1000000) + ((readByte() << 16) | (readByte() << 8) | readByte());
    }

    function readValue() {
      var prefix = readByte();

      if (prefix <= 0x7f) return prefix;
      if (prefix >= 0xe0) return prefix - 0x100;
      if ((prefix & 0xe0) === 0xa0) return decodeUtf8(readBytes(prefix & 0x1f));
      if ((prefix & 0xf0) === 0x90) {
        return readArray(prefix & 0x0f);
      }

      switch (prefix) {
        case 0xc0:
          return null;
        case 0xc2:
          return false;
        case 0xc3:
          return true;
        case 0xcc:
          return readByte();
        case 0xcd:
          return readUint16();
        case 0xce:
          return readUint32();
        case 0xd0:
          return (readByte() << 24) >> 24;
        case 0xd1: {
          var value16 = readUint16();
          return value16 & 0x8000 ? value16 - 0x10000 : value16;
        }
        case 0xd2: {
          var value32 = readUint32();
          return value32 > 0x7fffffff ? value32 - 0x100000000 : value32;
        }
        case 0xd9:
          return decodeUtf8(readBytes(readByte()));
        case 0xda:
          return decodeUtf8(readBytes(readUint16()));
        case 0xdb:
          return decodeUtf8(readBytes(readUint32()));
        case 0xdc:
          return readArray(readUint16());
        case 0xdd:
          return readArray(readUint32());
        default:
          throw new Error("Unsupported MessagePack prefix: 0x" + prefix.toString(16));
      }
    }

    function readArray(length) {
      var items = [];
      for (var index = 0; index < length; index += 1) {
        items.push(readValue());
      }
      return items;
    }

    return {
      read: function () {
        var value = readValue();
        if (offset !== bytes.length) throw new Error("MessagePack payload has trailing bytes");
        return value;
      }
    };
  }

  async function gunzip(bytes) {
    if (typeof DecompressionStream !== "function") {
      throw new Error("当前浏览器不支持 gzip 静态索引解压");
    }

    var stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    var buffer = await new Response(stream).arrayBuffer();
    return new Uint8Array(buffer);
  }

  async function fetchMessagePackGzip(url) {
    var response = await fetch(url, { credentials: "same-origin" });
    if (!response.ok) {
      throw new Error("Failed to load compressed data: HTTP " + response.status);
    }

    var compressed = new Uint8Array(await response.arrayBuffer());
    var payload = await gunzip(compressed);
    return createReader(payload).read();
  }

  window.__publicDataCodec = {
    fetchMessagePackGzip: fetchMessagePackGzip
  };
})();
