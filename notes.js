// Canonical content for the static notebook.
// Add one object per configuration, then commit this file to GitHub.
window.MAIDATA_CONFIG = {
  viewerUrl: "./viewer/"
};

window.MAIDATA_NOTES = [
  {
    id: "touchhold-ring",
    title: "非 C 区 TouchHold 环形定位",
    description: "把 A / B / D / E 区 TouchHold 放到同一组里，快速观察非 C 区的落点和持续时间。",
    tags: ["TouchHold", "非 C 区", "位置"],
    bpm: 120,
    addedAt: "2026-08-31",
    maidata: "(120){4}A1[4:2]h,B3[4:2]h,C[4:2]h,D5[4:2]h,E7[4:2]h,1,3,5,7,",
    source: { platform: "majnet", label: "Majnet", url: "https://majdata.net/" }
  },
  {
    id: "center-hold",
    title: "中心 C 区 TouchHold",
    description: "最小的中心区持续触碰，用作载入、时钟和结束标记的 smoke test。",
    tags: ["TouchHold", "C 区", "smoke test"],
    bpm: 120,
    addedAt: "2026-08-30",
    maidata: "(120){4}C[4:4]h,1,3,5,7,",
    source: { platform: "bilibili", label: "Bilibili", url: "https://www.bilibili.com/" }
  },
  {
    id: "ring-alternation",
    title: "外环交替落点",
    description: "一个很短的 1 / 5、3 / 7 交替，用来检查视觉节奏和单小节分割。",
    tags: ["交替", "外环", "节奏"],
    bpm: 150,
    addedAt: "2026-08-28",
    maidata: "(150){8}1,5,3,7,1,5,3,7,",
    source: { platform: "majnet", label: "Majnet", url: "https://majdata.net/" }
  },
  {
    id: "touch-fan",
    title: "Touch 扇形展开",
    description: "同一时间点放入不同触碰区，检查多触碰的扇形连接和非 C 区编号。",
    tags: ["Touch", "非 C 区", "Each"],
    bpm: 180,
    addedAt: "2026-08-27",
    maidata: "(180){8}A1/B3/C/D5/E7,1/3/5/7,",
    source: { platform: "bilibili", label: "Bilibili", url: "https://www.bilibili.com/" }
  }
];
