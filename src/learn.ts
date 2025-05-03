// importing wiki docs
import roadmap from "./wiki/roadmap.md";
import todo from "./wiki/todo.md";
import beginning from "./wiki/beginning.md";
import methods from "./wiki/methods.md";

// regular imports
import { marked } from "marked";
import mermaid from "mermaid"
import markedAlert, {Options as MarkedAlertOptions} from "marked-alert";

const wikiPages: Record<string, string> = {
  roadmap,
  todo,
  beginning,
  methods,
}

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
  await showPage(wikiPages[pageName]);
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set('load', pageName);
  history.pushState(null, "", document.location.pathname + "?" + urlParams.toString());
}

// window manipulation
(window as any).loadPage = loadPage;

// functionality
mermaid.initialize({ startOnLoad: true, securityLevel: 'loose' });

export function showMap() {
  const flowchartView = document.getElementById("map-flowchart")!;
  flowchartView.innerHTML = `flowchart TD
  beginning([Auf gehts!]):::flow-term
  click beginning call loadPage("beginning")
  beginning --> _robots{{Die Roboter}}:::flow-dec
  _robots --> methods(Methoden )
  click methods call loadPage("methods")
  _under_construction[Das Wiki ist noch im Aufbau!]
  _under_construction ~~~ beginning
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
