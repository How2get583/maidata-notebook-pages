/*
 * No framework and no build step. The page is a static index; the Unity
 * Viewer remains an independent iframe and receives only explicit commands.
 */
const entries = (window.MAIDATA_NOTES || []).map(normalizeEntry);
const viewerUrl = window.MAIDATA_CONFIG?.viewerUrl || "./viewer/";

const state = {
  selectedTags: new Set(),
  bpmMin: null,
  bpmMax: null,
  sort: "latest",
  viewerReady: false,
  pendingViewerMessage: null,
  currentEntry: null,
  judgeSoundOn: true
};

const $ = (selector) => document.querySelector(selector);
const viewerFrame = $("#viewerFrame");

function normalizeEntry(entry) {
  return {
    id: String(entry.id || "entry"),
    title: String(entry.title || "未命名配置"),
    tags: Array.isArray(entry.tags) ? entry.tags.map(String).filter(Boolean) : [],
    bpm: Number(entry.bpm) || 0,
    addedAt: String(entry.addedAt || "1970-01-01"),
    maidata: String(entry.maidata || ""),
    source: entry.source && entry.source.url
      ? {
        platform: String(entry.source.platform || "link"),
        label: String(entry.source.label || "来源"),
        url: String(entry.source.url),
        icon: String(entry.source.icon || "")
      }
      : null
  };
}

function allTags() {
  return [...new Set(entries.flatMap((entry) => entry.tags))].sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function filteredEntries() {
  const min = state.bpmMin;
  const max = state.bpmMax;
  return entries.filter((entry) => {
    const tagMatch = [...state.selectedTags].every((tag) => entry.tags.includes(tag));
    const minMatch = min === null || entry.bpm >= min;
    const maxMatch = max === null || entry.bpm <= max;
    return tagMatch && minMatch && maxMatch;
  }).sort(sortEntries);
}

function sortEntries(a, b) {
  if (state.sort === "earliest") return a.addedAt.localeCompare(b.addedAt) || a.title.localeCompare(b.title, "zh-CN");
  if (state.sort === "bpm-asc") return a.bpm - b.bpm || b.addedAt.localeCompare(a.addedAt);
  if (state.sort === "bpm-desc") return b.bpm - a.bpm || b.addedAt.localeCompare(a.addedAt);
  if (state.sort === "title") return a.title.localeCompare(b.title, "zh-CN");
  return b.addedAt.localeCompare(a.addedAt) || a.title.localeCompare(b.title, "zh-CN");
}

function renderTagPicker() {
  const picker = $("#tagPicker");
  const tagFilter = $("#tagFilter");
  const tags = allTags();
  picker.replaceChildren();
  tagFilter.hidden = tags.length === 0;
  tags.forEach((tag) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tag-chip";
    button.textContent = tag;
    button.dataset.tag = tag;
    button.setAttribute("aria-pressed", String(state.selectedTags.has(tag)));
    picker.append(button);
  });
  $("#activeTagMeta").textContent = state.selectedTags.size ? `${state.selectedTags.size} 个条件` : "未选择";
}

function renderPosts() {
  const list = $("#postList");
  const visible = filteredEntries();
  list.replaceChildren();
  $("#listCount").textContent = visible.length === entries.length
    ? `${entries.length} 条`
    : `${visible.length} / ${entries.length}`;
  $("#resultMeta").textContent = `${visible.length} 条记录`;

  if (visible.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = entries.length === 0 ? "暂无配置" : "没有匹配的配置";
    list.append(empty);
    return;
  }
  visible.forEach((entry) => list.append(createPost(entry)));
}

function createPost(entry) {
  const article = document.createElement("article");
  article.className = "post";
  article.id = `post-${entry.id}`;

  const titleRow = document.createElement("div");
  titleRow.className = "post-title-row";
  const title = document.createElement("h3");
  title.textContent = entry.title;
  const bpm = document.createElement("span");
  bpm.className = "bpm-badge";
  bpm.textContent = `${entry.bpm} BPM`;
  titleRow.append(title, bpm);

  const code = document.createElement("pre");
  code.className = "post-code";
  code.textContent = entry.maidata;

  const footer = document.createElement("div");
  footer.className = "post-footer";
  const tagList = document.createElement("div");
  tagList.className = "post-tags";
  entry.tags.forEach((tag) => {
    const tagNode = document.createElement("span");
    tagNode.textContent = `#${tag}`;
    tagList.append(tagNode);
  });
  const actions = document.createElement("div");
  actions.className = "post-actions";
  if (entry.source) actions.append(createSourceLink(entry.source));
  const copy = document.createElement("button");
  copy.className = "small-button small-button--quiet";
  copy.type = "button";
  copy.textContent = "复制";
  copy.addEventListener("click", () => copyText(entry.maidata, copy));
  const load = document.createElement("button");
  load.className = "small-button small-button--load";
  load.type = "button";
  load.textContent = "载入 →";
  load.addEventListener("click", () => loadEntry(entry));
  actions.append(copy, load);
  footer.append(tagList, actions);

  article.append(titleRow);
  article.append(code, footer);
  return article;
}

function createSourceLink(source) {
  const link = document.createElement("a");
  link.className = `source-link source-link--${source.platform}`;
  link.href = source.url;
  link.target = "_blank";
  link.rel = "noreferrer";
  const icon = document.createElement("img");
  icon.className = "source-icon";
  icon.src = source.icon || sourceIconUrl(source);
  icon.alt = "";
  icon.loading = "lazy";
  icon.decoding = "async";
  icon.referrerPolicy = "no-referrer";
  icon.addEventListener("error", () => { icon.hidden = true; }, { once: true });
  link.append(icon);
  const label = document.createElement("span");
  label.textContent = source.label;
  link.append(label);
  return link;
}

function sourceIconUrl(source) {
  try {
    return `${new URL(source.url).origin}/favicon.ico`;
  } catch {
    return "";
  }
}

function toMaidata(entry) {
  if (entry.maidata.includes("&inote_")) return entry.maidata;

  // Simai's fumen parser expects the chart BPM as an inline event. The
  // notebook stores it separately so that it can be searched and sorted.
  const chart = ensureEndMarker(entry.maidata);
  const bpmEvent = /^\(\s*[\d.]+\s*\)/.test(chart) ? "" : `(${entry.bpm})`;
  const leadIn = bpmEvent ? `${bpmEvent}{2},` : "";
  return [
    `&title=${entry.title}`,
    "&artist=Maidata Notebook",
    "&des=snippet",
    "&first=0",
    "&lv_1=1",
    `&inote_1=${leadIn}${chart}`
  ].join("\n");
}

function ensureEndMarker(text) {
  // Keep the short chart on one line. This makes the placement of E
  // unambiguous after it is attached to &inote_1=.
  const value = text.replace(/\r\n?/g, "\n").split("\n").map((line) => line.trim()).join("").trim();
  if (/(^|,)E(,|$)/.test(value)) return value;
  return `${value.endsWith(",") ? value : `${value},`}E`;
}

function sendViewerMessage(message) {
  if (!state.viewerReady || !viewerFrame.contentWindow) {
    state.pendingViewerMessage = message;
    return;
  }
  viewerFrame.contentWindow.postMessage(message, "*");
}

function loadEntry(entry) {
  state.currentEntry = entry;
  $("#speedSelect").value = "1";
  $("#viewerEmpty").hidden = true;
  $("#viewerState").textContent = "LOADING";
  $("#currentTitle").textContent = entry.title;
  $("#currentMeta").textContent = `${entry.bpm} BPM · ${entry.tags.join(" / ")}`;
  sendViewerMessage({ type: "majdata-load", maidata: toMaidata(entry) });
  document.querySelectorAll(".post.is-current").forEach((node) => node.classList.remove("is-current"));
  $(`#post-${CSS.escape(entry.id)}`)?.classList.add("is-current");
}

function sendCommand(command, value) {
  sendViewerMessage({ type: "majdata-command", command, value });
  if (command === "judge-sound") {
    state.judgeSoundOn = String(value) !== "0";
    const button = $("#soundButton");
    button.classList.toggle("is-on", state.judgeSoundOn);
    button.dataset.value = state.judgeSoundOn ? "0" : "1";
    button.setAttribute("aria-pressed", String(state.judgeSoundOn));
    button.title = `正解音：${state.judgeSoundOn ? "开" : "关"}`;
    button.setAttribute("aria-label", state.judgeSoundOn ? "关闭正解音" : "开启正解音");
  }
}

async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.append(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }
  const original = button.textContent;
  button.textContent = "已复制";
  window.setTimeout(() => { button.textContent = original; }, 1000);
}

function setBpmFilter(input, key) {
  const value = input.value.trim();
  state[key] = value === "" ? null : Number(value);
  renderPosts();
}

$("#tagPicker").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-tag]");
  if (!button) return;
  const tag = button.dataset.tag;
  if (state.selectedTags.has(tag)) state.selectedTags.delete(tag);
  else state.selectedTags.add(tag);
  renderTagPicker();
  renderPosts();
});
$("#bpmMin").addEventListener("input", (event) => setBpmFilter(event.target, "bpmMin"));
$("#bpmMax").addEventListener("input", (event) => setBpmFilter(event.target, "bpmMax"));
$("#sortSelect").addEventListener("change", (event) => {
  state.sort = event.target.value;
  renderPosts();
});
$("#clearFilters").addEventListener("click", () => {
  state.selectedTags.clear();
  state.bpmMin = null;
  state.bpmMax = null;
  $("#bpmMin").value = "";
  $("#bpmMax").value = "";
  renderTagPicker();
  renderPosts();
});
document.querySelectorAll("[data-command]").forEach((button) => {
  button.addEventListener("click", () => sendCommand(button.dataset.command, button.dataset.value));
});
$("#speedSelect").addEventListener("change", (event) => sendCommand("speed", event.target.value));
window.addEventListener("message", (event) => {
  if (event.source !== viewerFrame.contentWindow || event.data?.type !== "majdata-viewer-ready") return;
  state.viewerReady = true;
  $("#viewerState").textContent = "READY";
  if (state.pendingViewerMessage) {
    viewerFrame.contentWindow.postMessage(state.pendingViewerMessage, "*");
    state.pendingViewerMessage = null;
  }
});

renderTagPicker();
renderPosts();
