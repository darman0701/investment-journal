// External link utilities for Japanese stocks
export interface ExternalLink {
  label: string;
  url: string;
  description: string;
}

export function getExternalLinks(ticker: string): ExternalLink[] {
  // Only for Japanese stock codes (typically 4 chars, may include letters like 513A)
  const isJP = /^\d{4}[A-Z]?$/.test(ticker);
  if (!isJP) return [];

  return [
    {
      label: "EDINET",
      url: `https://disclosure.edinet-fsa.go.jp/E01EW/BLMainController.jsp?uji.verb=W1E63011CXW1E6A011DSPSch&uji.bean=ee.bean.W1E63011.EEW1E63011Bean&TID=W1E63011&PID=currentPage&SESSIONKEY=&lgKbn=2&dflg=0&iflg=0&preId=1&mul=${ticker}`,
      description: "有価証券報告書・決算短信",
    },
    {
      label: "kabutan",
      url: `https://kabutan.jp/stock/?code=${ticker}`,
      description: "株価・業績・ニュース",
    },
    {
      label: "IR Bank",
      url: `https://irbank.net/${ticker}`,
      description: "財務データ推移",
    },
    {
      label: "みんかぶ",
      url: `https://minkabu.jp/stock/${ticker}`,
      description: "株価予想・目標株価",
    },
    {
      label: "TDnet",
      url: `https://www.release.tdnet.info/inbs/I_list_001_${ticker}.html`,
      description: "適時開示情報",
    },
  ];
}
