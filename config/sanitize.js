import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

export function sanitizeHTML(dirtyHTML) {
    return DOMPurify.sanitize(dirtyHTML, {
        ALLOWED_TAGS: ["b", "i", "u", "strong", "em", "p", "br", "a", "span", "font", "div"],
        ALLOWED_ATTR: ["href", "target", "rel", "style", "face", "class"]
    });
}