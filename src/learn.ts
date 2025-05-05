// importing wiki docs
const wikiPages: Record<string, string> = {}
const rawFiles = require.context('./wiki', false, /\.md$/);

for (const fileName of rawFiles.keys()) {
  let pureFileName = fileName.slice(2, fileName.length - 3);
  wikiPages[pureFileName] = rawFiles(fileName);
}


// regular imports
import { marked } from "marked";
import mermaid from "mermaid"
import markedAlert, {Options as MarkedAlertOptions} from "marked-alert";

const START_PAGE: string = "beginning";

async function setPageFromQuery() {
  const urlParams = new URLSearchParams(window.location.search);
    const pageName = urlParams.get('load');
    if (pageName && pageName in wikiPages) {
        await loadPage(pageName);
    } else {
        await loadPage(START_PAGE);
        urlParams.delete('load');
        history.replaceState(null, "", document.location.pathname + "?" + urlParams.toString());
    }
}

async function loadPage(pageName: string) {
  const urlParams = new URLSearchParams(window.location.search);

  if (pageName in wikiPages) {
    await showPage(wikiPages[pageName]);
    urlParams.set('load', pageName);
  }
  else {
    await showPage(wikiPages["404"]);
    urlParams.set('load', "404");
  }

  history.pushState(null, "", document.location.pathname + "?" + urlParams.toString());
}

// nodes
function declareMapNode(name: string, content: string, triggerLoad: boolean, connectTo: string[] = [], lb = "(", rb = ")", cls?: string) {
  let emoji = triggerLoad ? !(name in wikiPages) ? "#nbsp;fa:fa-triangle-exclamation" : "#nbsp;fa:fa-arrow-pointer" : "";

  let str = `${name}${lb}` + '"`#nbsp;' + `${content} ${emoji}` + '#nbsp;`"' + `${rb}`;
  if (cls) str += ":::" + cls;
  for (let conn of connectTo) {
    str += `\n${name} --> ${conn}`;
  }
  if (triggerLoad) {
    str += `\nclick ${name} call loadPage("${name}")`
  }
  str += "\n";
  return str;
}

const declMapTerm = (name: string, content: string, triggerLoad: boolean, connectTo: string[] = []) => 
  declareMapNode(name, content, triggerLoad, connectTo, "([", "])", "flow-term");
const declMapIO = (name: string, content: string, triggerLoad: boolean, connectTo: string[] = []) => 
  declareMapNode(name, content, triggerLoad, connectTo, "[/", "/]", "flow-io");
const declMapCall = (name: string, content: string, triggerLoad: boolean, connectTo: string[] = []) => 
  declareMapNode(name, content, triggerLoad, connectTo, "[[", "]]", "flow-call");
const declMapCon = (name: string, content: string, triggerLoad: boolean, connectTo: string[] = []) => 
  declareMapNode(name, content, triggerLoad, connectTo, "((", "))", "flow-con");
const declMapProc = (name: string, content: string, triggerLoad: boolean, connectTo: string[] = []) => 
  declareMapNode(name, content, triggerLoad, connectTo, "(", ")", "flow-proc");
const declMapDec = (name: string, content: string, triggerLoad: boolean, connectTo: string[] = []) => 
  declareMapNode(name, content, triggerLoad, connectTo, "{{", "}}", "flow-dec");
const declMapCtrl = (name: string, content: string, triggerLoad: boolean, connectTo: string[] = []) => 
  declareMapNode(name, content, triggerLoad, connectTo, "(", ")", "flow-ctrl");

// functionality
mermaid.initialize({ startOnLoad: true, securityLevel: 'loose' });

export function showMap() {
  const flowchartView = document.getElementById("map-flowchart")!;
  flowchartView.innerHTML = `flowchart TD
  ${declMapTerm("beginning", "Auf gehts!", true, ["robots"])}

  ${declMapDec("robots", "Der Roboter", false, ["methods"])}
  ${declMapCall("methods", "Fähigkeiten", true, ["attributes"])}
  ${declMapCall("attributes", "Eigenschaften", true, ["conditions"])}
  ${declMapCall("conditions", "Sinne", true, ["world", "control"])}

  ${declMapDec("control", "Kontrollstrukturen", false, ["for", "ifelse"])}
  ${declMapCall("for", "Wiederholung mit fester Anzahl", true, ["while"])}
  ${declMapCall("while", "Bedingte Wiederholungen", true, ["repeats"])}
  ${declMapCall("repeats", "Mehr Wiederholungen", true, [])}

  ${declMapCall("ifelse", "Wenn, dann, sonst", true, ["switch"])}
  ${declMapCall("switch", "Fallunterschiedung", true, [])}

  ${declMapTerm("world", "Die Welt", true, [])}
  `;
  flowchartView.removeAttribute("data-processed")
  mermaid.contentLoaded();
}

(window as any).loadPage = loadPage;

const markedAlertOptions: MarkedAlertOptions  = {
  variants: [
    {
      type: 'important',
      icon: '⁉️&nbsp;',
      title: '',
    },
    {
      type: 'warning',
      icon: '⚠️&nbsp;',
      title: 'Achtung!',
    }
  ]
}

export async function showPage(page: string) {
  const pageView = document.getElementById("doc-page")!;
  pageView.innerHTML = await marked.use(markedAlert(markedAlertOptions)).parse(page);
}

// start app
showMap();
setPageFromQuery();

// remove loading screen
document.getElementById("loading-overlay")?.classList.remove("loading");
