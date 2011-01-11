SHARED.songs = {
  // ID3 v2.2 tag with UTF data
  v22: {
    data: "ID3%02%00%00%00%01I6TT2%00%00%11%01%EF%9F%BF%EF%9F%BEL%00j%00%EF%9F%B3%00s%00i%00%EF%9F%B0%00%00%00TP1%00%00!%01%EF%9F%BF%EF%9F%BE%EF%9F%93%00l%00a%00f%00u%00r%00%20%00A%00r%00n%00a%00l%00d%00s%00%00%00TP2%00%00!%01%EF%9F%BF%EF%9F%BE%EF%9F%93%00l%00a%00f%00u%00r%00%20%00A%00r%00n%00a%00l%00d%00s%00%00%00TCM%00%00!%01%EF%9F%BF%EF%9F%BE%EF%9F%93%00l%00a%00f%00u%00r%00%20%00A%00r%00n%00a%00l%00d%00s%00%00%00TAL%00%00%0D%00Found%20Songs%00TRK%00%00%05%007%2F7%00TYE%00%00%06%002009%00COM%00%00%10%00engiTunPGAP%000%00%00TEN%00%00%0E%00iTunes%208.0.2%00COM%00%00h%00engiTunNORM%00%20000007AA%2000000B2E%2000006443%200000967A%200000BF53%2000016300%200000821A%200000816B%2000010C29%20000166FA%00COM%00%00%EF%9E%82%00engiTunSMPB%00%2000000000%2000000210%200000079B%2000000000008BDDD5%2000000000%20004C0FD7%2000000000%2000000000%2000000000%2000000000%2000000000%2000000000%00TPA%00%00%05%001%2F1%00TCO%00%00%0F%00Neo-Classical%00COM%00%00%22%00eng%00available%20on%20ErasedTapes.com>>>PADDING<<<%EF%9F%BF",
    simplified: {
      title: "Lj\u00f3si\u00f0",
      artist: "\u00d3lafur Arnalds",
      album: "Found Songs",
      track: 7,
      year:  2009,
      genre: -1,
      links: {
        official: ""
      }
    },
    frames: {
      TT2: "Lj\u00f3si\u00f0",
      TP1: "\u00d3lafur Arnalds",
      TP2: "\u00d3lafur Arnalds",
      TAL: "Found Songs",
      TRK: 7,
      TYE: 2009
    }
  },
  
  // ID3 v2.3 tag
  v23: {
    data: "ID3%03%00%00%00%00Q%01TPOS%00%00%00%04%00%00%001%2F1TENC%00%00%00%0E%40%00%00iTunes%20v7.6.2TIT2%00%00%005%00%00%01%EF%9F%BF%EF%9F%BED%00e%00a%00t%00h%00%20%00W%00i%00l%00l%00%20%00N%00e%00v%00e%00r%00%20%00C%00o%00n%00q%00u%00e%00r%00%00%00TPE1%00%00%00%15%00%00%01%EF%9F%BF%EF%9F%BEC%00o%00l%00d%00p%00l%00a%00y%00%00%00TCON%00%00%00%0D%00%00%01%EF%9F%BF%EF%9F%BER%00o%00c%00k%00%00%00COMM%00%00%00h%00%00%00engiTunNORM%00%20000002F6%200000036E%2000001471%200000163D%2000000017%2000000017%20000069F3%2000006AA9%2000000017%2000000017%00RVAD%00%00%00%0A%00%00%03%105555>>>PADDING<<<%EF%9F%BF",
    simplified: {
      title: "Death Will Never Conquer",
      artist: "Coldplay",
      album: "Unknown",
      track: 0,
      year:  0,
      genre: "Rock",
      links: {
        official: ""
      }
    },
    frames: {
      TIT2: "Death Will Never Conquer",
      TPE1: "Coldplay",
      TCON: "Rock"
    }
  },
  
  // ID3 v2.4 tag
  v24: {
    data: "ID3%04%00%00%00%00%02%00TRCK%00%00%00%05%00%00%006%2F10TIT2%00%00%00%08%00%00%00HalcyonTPE1%00%00%00%08%00%00%00DelphicTALB%00%00%00%08%00%00%00AcolyteTYER%00%00%00%05%00%00%002010TCON%00%00%00%0F%00%00%00(52)ElectronicWXXX%00%00%00%13%00%00%00%00http%3A%2F%2Fdelphic.ccTPUB%00%00%00%13%00%00%00Chimeric%20%2F%20PolydorTPOS%00%00%00%04%00%00%001%2F1%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%EF%9F%BF",
    simplified: {
      title: "Halcyon",
      artist: "Delphic",
      album: "Acolyte",
      track: 6,
      year: 2010,
      genre: 52, // Electornic,
      links: {
        official: "http://delphic.cc"
      }
    },
    frames: {
      TIT2: "Halcyon",
      TPE1: "Delphic",
      TALB: "Acolyte",
      TYER: 2010,
      TCON: 52,
      TRCK: 6,
      WXXX: "http://delphic.cc"
    }
  },
  
  // ID3 v1 tag
  v1: {
    data: "TAGYeah%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00Queen%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00Made%20In%20Heaven%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%001995%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%0C%0C",
    simplified: {
      title:  "Yeah",
      artist: "Queen",
      album:  "Made In Heaven",
      track:  12,
      year:   1995,
      genre:  12
    }
  },
  
  // 1x1 transparent PNG file
  image: {
    data: "%EF%9E%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%01%00%00%00%01%01%03%00%00%00%25%EF%9F%9BV%EF%9F%8A%00%00%00%03PLTE%00%00%00%EF%9E%A7z%3D%EF%9F%9A%00%00%00%01tRNS%00%40%EF%9F%A6%EF%9F%98f%00%00%00%0AIDAT%08%EF%9F%97c%60%00%00%00%02%00%01%EF%9F%A2!%EF%9E%BC3%00%00%00%00IEND%EF%9E%AEB%60%EF%9E%82"
  }
};

(function (args) {
  // SONGS.v22 and SONGS.v23 have vast amount of padding bits,
  // so we're adding them programatically
  
  function addPaddingTo(key, n) {
    var p = [];
    while(n--)
      p.push("%00");
    
    SHARED.songs[key].data = SHARED.songs[key].data.replace(">>>PADDING<<<", p.join(""));
  }
  
  addPaddingTo("v22", 25241);
  addPaddingTo("v23", 10084);
})();

